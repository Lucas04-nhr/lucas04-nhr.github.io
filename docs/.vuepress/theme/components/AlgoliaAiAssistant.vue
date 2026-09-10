<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import VPIcon from "vuepress-theme-plume/components/VPIcon.vue";

type ChatRole = "assistant" | "user";
type FeedbackVote = 0 | 1;
type UnknownRecord = Record<string, unknown>;

interface SearchResult {
  objectID?: string;
  title: string;
  section?: string;
  content?: string;
  url: string;
}

interface ChatMessage {
  role: ChatRole;
  text: string;
  messageId?: string;
  results?: SearchResult[];
  suggestions?: string[];
  feedbackVote?: FeedbackVote;
  feedbackPending?: boolean;
  feedbackError?: string;
}

interface CompletionPart {
  type?: string;
  text?: string;
  data?: unknown;
  output?: unknown;
  state?: string;
  toolName?: string;
  toolCallId?: string;
}

interface CompletionResponse {
  id?: string;
  parts?: CompletionPart[];
}

interface AlgoliaErrorResponse {
  detail?: string;
  message?: string;
}

interface PageContext {
  currentPage: string;
  currentPageWithoutHash: string;
  pagePath: string;
  pageTitle: string;
  locale: string;
}

const ALGOLIA_APPLICATION_ID = "74YMW3SD6Z";
const ALGOLIA_SEARCH_API_KEY = "8452a5a75f5166abe464b8fe85d3b3cc";
const ALGOLIA_AGENT_ID = "782ad8a9-dafa-4e57-90ef-3fc5e42ac9fd";
const COMPLETIONS_URL = `https://${ALGOLIA_APPLICATION_ID.toLowerCase()}.algolia.net/agent-studio/1/agents/${ALGOLIA_AGENT_ID}/completions?stream=true&compatibilityMode=ai-sdk-5`;
const FEEDBACK_URL = `https://${ALGOLIA_APPLICATION_ID.toLowerCase()}.algolia.net/agent-studio/1/feedback`;

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
});

const defaultLinkOpen =
  markdown.renderer.rules.link_open ??
  ((tokens, index, options, _environment, renderer) =>
    renderer.renderToken(tokens, index, options));

markdown.renderer.rules.link_open = (
  tokens,
  index,
  options,
  environment,
  renderer,
) => {
  tokens[index].attrSet("target", "_blank");
  tokens[index].attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, index, options, environment, renderer);
};

const renderMarkdown = (source: string): string => markdown.render(source);

const isOpen = ref(false);
const isLoading = ref(false);
const input = ref("");
const error = ref("");
const messages = ref<ChatMessage[]>([
  {
    role: "assistant",
    text: "Hi! I can answer questions using content from Lucas's Blog.",
  },
]);
const messageList = ref<HTMLElement | null>(null);
let requestController: AbortController | null = null;
let scrollFrame: number | null = null;

const canSubmit = computed(
  () => input.value.trim().length > 0 && !isLoading.value,
);
const showLoadingIndicator = computed(() => {
  if (!isLoading.value) return false;
  const latest = messages.value.at(-1);
  return !latest || latest.role !== "assistant" || !latest.text;
});

function toggleAssistant() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) void scrollToLatest();
}

function closeAssistant() {
  isOpen.value = false;
}

function resetConversation() {
  requestController?.abort();
  requestController = null;
  isLoading.value = false;
  error.value = "";
  input.value = "";
  messages.value = [
    {
      role: "assistant",
      text: "Hi! I can answer questions using content from Lucas's Blog.",
    },
  ];
}

async function scrollToLatest() {
  await nextTick();
  messageList.value?.scrollTo({
    top: messageList.value.scrollHeight,
    behavior: "smooth",
  });
}

function scheduleScrollToLatest() {
  if (typeof window === "undefined" || scrollFrame !== null) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = null;
    void scrollToLatest();
  });
}

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function firstString(record: UnknownRecord | null, keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function completionText(response: CompletionResponse): string {
  return (response.parts ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function extractSuggestions(response: CompletionResponse): string[] {
  const suggestions = new Set<string>();

  for (const part of response.parts ?? []) {
    if (part.type !== "data-suggestions") continue;
    const data = asRecord(parseMaybeJson(part.data));
    const rawSuggestions = data?.suggestions;
    if (!Array.isArray(rawSuggestions)) continue;

    for (const suggestion of rawSuggestions) {
      if (typeof suggestion === "string" && suggestion.trim()) {
        suggestions.add(suggestion.trim());
      }
    }
  }

  return [...suggestions].slice(0, 4);
}

function hitToSearchResult(hitValue: unknown): SearchResult | null {
  const hit = asRecord(hitValue);
  if (!hit) return null;

  const url = firstString(hit, [
    "url",
    "url_without_variables",
    "url_without_anchor",
  ]);
  if (!url) return null;

  const hierarchy = asRecord(hit.hierarchy);
  const title =
    firstString(hit, ["title", "name"]) ??
    firstString(hierarchy, [
      "lvl0",
      "lvl1",
      "lvl2",
      "lvl3",
      "lvl4",
      "lvl5",
      "lvl6",
    ]) ??
    url;

  const hierarchyLevels = hierarchy
    ? ["lvl1", "lvl2", "lvl3", "lvl4", "lvl5", "lvl6"]
        .map((key) => hierarchy[key])
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
    : [];

  const section = hierarchyLevels.at(-1)?.trim();
  const content = firstString(hit, ["content", "description", "snippet"]);
  const objectID = firstString(hit, ["objectID"]);

  return {
    objectID,
    title,
    section: section && section !== title ? section : undefined,
    content,
    url,
  };
}

function extractHitsFromOutput(outputValue: unknown): unknown[] {
  const output = asRecord(parseMaybeJson(outputValue));
  if (!output) return [];
  if (Array.isArray(output.hits)) return output.hits;

  const result = asRecord(output.result);
  if (result && Array.isArray(result.hits)) return result.hits;

  const data = asRecord(output.data);
  if (data && Array.isArray(data.hits)) return data.hits;

  return [];
}

function extractSearchResults(response: CompletionResponse): SearchResult[] {
  const byPage = new Map<string, SearchResult>();

  for (const part of response.parts ?? []) {
    const isSearchTool =
      part.type === "tool-algolia_search_index" ||
      part.toolName === "algolia_search_index" ||
      part.type?.includes("algolia_search_index") ||
      part.toolName?.includes("algolia_search_index");

    if (!isSearchTool) continue;

    for (const hit of extractHitsFromOutput(part.output)) {
      const result = hitToSearchResult(hit);
      if (!result) continue;

      let pageKey = result.url;
      try {
        const parsed = new URL(result.url);
        parsed.hash = "";
        pageKey = parsed.toString();
      } catch {
        pageKey = result.url.split("#", 1)[0];
      }

      if (!byPage.has(pageKey)) byPage.set(pageKey, result);
      if (byPage.size >= 5) break;
    }

    if (byPage.size >= 5) break;
  }

  return [...byPage.values()];
}

function getPageContext(): PageContext | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return {
    currentPage: window.location.href,
    currentPageWithoutHash: `${window.location.origin}${window.location.pathname}`,
    pagePath: window.location.pathname,
    pageTitle: document.title,
    locale: document.documentElement.lang || navigator.language || "en-US",
  };
}

function formatPageContext(context: PageContext): string {
  return `[Page context]\n${JSON.stringify(context)}\n\nUse this context only to identify what page the user is currently viewing. When the user refers to \"this page\", \"this article\", \"this post\", \"here\", \"it\", or similar expressions, use currentPageWithoutHash or pagePath as the strongest retrieval hint for the corresponding content in the configured Algolia index. Treat pageTitle as a secondary retrieval hint. Do not treat this metadata itself as authoritative page content.`;
}

function truncate(text: string, maxLength = 150): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildRequestMessages(conversationMessages: ChatMessage[]) {
  const pageContext = getPageContext();

  return conversationMessages.map((message, index) => {
    const isLatestUserMessage =
      index === conversationMessages.length - 1 && message.role === "user";

    return {
      role: message.role,
      parts: [
        { type: "text", text: message.text },
        ...(isLatestUserMessage && pageContext
          ? [{ type: "text", text: formatPageContext(pageContext) }]
          : []),
      ],
    };
  });
}

function upsertStreamPart(
  parts: CompletionPart[],
  nextPart: CompletionPart,
  key?: string,
) {
  if (!key) {
    parts.push(nextPart);
    return;
  }

  const index = parts.findIndex(
    (part) =>
      part.toolCallId === key ||
      (part.type === nextPart.type && nextPart.type === "data-suggestions"),
  );

  if (index >= 0) parts[index] = { ...parts[index], ...nextPart };
  else parts.push(nextPart);
}

async function consumeCompletionStream(
  response: Response,
  assistantMessage: ChatMessage,
) {
  if (!response.body) {
    throw new Error("Algolia returned an empty streaming response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parts: CompletionPart[] = [];
  const toolNames = new Map<string, string>();
  let buffer = "";
  let answerText = "";
  let messageId = response.headers.get("x-message-id") ?? undefined;

  const syncStructuredContent = () => {
    const assembled: CompletionResponse = { id: messageId, parts };
    assistantMessage.messageId = messageId;
    assistantMessage.results = extractSearchResults(assembled);
    assistantMessage.suggestions = extractSuggestions(assembled);
  };

  const applyEvent = (eventValue: unknown) => {
    const event = asRecord(eventValue);
    if (!event) return;

    const type = firstString(event, ["type"]);
    if (!type) return;

    if (type === "start" || type === "start-step") {
      messageId = firstString(event, ["messageId", "id"]) ?? messageId;
      assistantMessage.messageId = messageId;
      return;
    }

    if (type === "text-delta") {
      const delta = firstString(event, ["delta", "textDelta", "text"]);
      if (delta) {
        answerText += delta;
        assistantMessage.text = answerText;
        scheduleScrollToLatest();
      }
      return;
    }

    if (type === "text") {
      const text = firstString(event, ["text"]);
      if (text) {
        answerText += text;
        assistantMessage.text = answerText;
        scheduleScrollToLatest();
      }
      return;
    }

    if (type === "data-suggestions") {
      upsertStreamPart(
        parts,
        {
          type,
          data: event.data,
        },
        "data-suggestions",
      );
      syncStructuredContent();
      return;
    }

    if (
      type === "tool-input-start" ||
      type === "tool-input-available" ||
      type === "tool-call"
    ) {
      const toolCallId = firstString(event, ["toolCallId", "id"]);
      const toolName = firstString(event, ["toolName"]);
      if (toolCallId && toolName) toolNames.set(toolCallId, toolName);
      return;
    }

    if (type === "tool-output-available" || type === "tool-result") {
      const toolCallId = firstString(event, ["toolCallId", "id"]);
      const toolName =
        firstString(event, ["toolName"]) ??
        (toolCallId ? toolNames.get(toolCallId) : undefined);
      const output = event.output ?? event.result;

      upsertStreamPart(
        parts,
        {
          type: toolName ? `tool-${toolName}` : type,
          toolName,
          toolCallId,
          output,
          state: "output-available",
        },
        toolCallId,
      );
      syncStructuredContent();
      return;
    }

    if (type.startsWith("tool-") && ("output" in event || "result" in event)) {
      const toolCallId = firstString(event, ["toolCallId", "id"]);
      const toolName =
        firstString(event, ["toolName"]) ?? type.replace(/^tool-/, "");

      upsertStreamPart(
        parts,
        {
          type,
          toolName,
          toolCallId,
          output: event.output ?? event.result,
          state: firstString(event, ["state"]) ?? "output-available",
        },
        toolCallId,
      );
      syncStructuredContent();
      return;
    }

    if (type === "error") {
      const message = firstString(event, ["errorText", "message", "error"]);
      if (message) throw new Error(message);
    }
  };

  const applyLegacyLine = (line: string): boolean => {
    const match = line.match(/^([0-9a-z]):(.*)$/i);
    if (!match) return false;

    const [, code, payloadText] = match;
    const payload = parseMaybeJson(payloadText);

    if (code === "0" && typeof payload === "string") {
      answerText += payload;
      assistantMessage.text = answerText;
      scheduleScrollToLatest();
      return true;
    }

    if (code === "f") {
      const record = asRecord(payload);
      messageId = firstString(record, ["messageId", "id"]) ?? messageId;
      assistantMessage.messageId = messageId;
      return true;
    }

    if (code === "9") {
      const record = asRecord(payload);
      const toolCallId = firstString(record, ["toolCallId"]);
      const toolName = firstString(record, ["toolName"]);
      if (toolCallId && toolName) toolNames.set(toolCallId, toolName);
      return true;
    }

    if (code === "a") {
      const record = asRecord(payload);
      if (!record) return true;
      applyEvent({
        type: "tool-result",
        toolCallId: record.toolCallId,
        result: record.result,
      });
      return true;
    }

    return true;
  };

  const processLine = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line || line.startsWith(":")) return;
    if (line.startsWith("event:") || line.startsWith("id:")) return;

    let payloadText = line;
    if (line.startsWith("data:")) payloadText = line.slice(5).trimStart();
    if (!payloadText || payloadText === "[DONE]") return;

    const parsed = parseMaybeJson(payloadText);
    if (typeof parsed === "string" && parsed === payloadText) {
      applyLegacyLine(payloadText);
      return;
    }

    applyEvent(parsed);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) processLine(line);
  }

  buffer += decoder.decode();
  if (buffer.trim()) processLine(buffer);

  assistantMessage.text = answerText.trim();
  syncStructuredContent();

  if (!assistantMessage.text && !(assistantMessage.results?.length)) {
    throw new Error("The assistant returned an empty response.");
  }
}

async function submitFeedback(message: ChatMessage, vote: FeedbackVote) {
  if (
    !message.messageId ||
    message.feedbackPending ||
    message.feedbackVote !== undefined
  ) {
    return;
  }

  message.feedbackPending = true;
  message.feedbackError = undefined;

  try {
    const response = await fetch(FEEDBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-algolia-application-id": ALGOLIA_APPLICATION_ID,
        "x-algolia-api-key": ALGOLIA_SEARCH_API_KEY,
      },
      body: JSON.stringify({
        messageId: message.messageId,
        agentId: ALGOLIA_AGENT_ID,
        vote,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      let reason = responseBody;
      try {
        const parsed = JSON.parse(responseBody) as AlgoliaErrorResponse;
        reason = parsed.detail ?? parsed.message ?? responseBody;
      } catch {
        // Keep a non-JSON response as-is.
      }
      throw new Error(
        reason
          ? `Feedback returned ${response.status}: ${reason}`
          : `Feedback returned ${response.status}.`,
      );
    }

    message.feedbackVote = vote;
  } catch (cause) {
    message.feedbackError =
      cause instanceof Error ? cause.message : "Unable to submit feedback.";
  } finally {
    message.feedbackPending = false;
  }
}

async function submitSuggestedQuestion(suggestion: string) {
  if (isLoading.value) return;
  input.value = suggestion;
  await submitQuestion();
}

async function submitQuestion() {
  const question = input.value.trim();
  if (!question || isLoading.value) return;

  messages.value.push({ role: "user", text: question });
  const conversationMessages = messages.value.slice(1);
  const requestMessages = buildRequestMessages(conversationMessages);

  input.value = "";
  error.value = "";
  isLoading.value = true;

  const assistantMessage: ChatMessage = {
    role: "assistant",
    text: "",
    results: [],
    suggestions: [],
  };
  messages.value.push(assistantMessage);
  await scrollToLatest();

  requestController = new AbortController();

  try {
    const response = await fetch(COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "x-algolia-application-id": ALGOLIA_APPLICATION_ID,
        "x-algolia-api-key": ALGOLIA_SEARCH_API_KEY,
      },
      body: JSON.stringify({ messages: requestMessages }),
      signal: requestController.signal,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      let reason = responseBody;
      try {
        const parsed = JSON.parse(responseBody) as AlgoliaErrorResponse;
        reason = parsed.detail ?? parsed.message ?? responseBody;
      } catch {
        // Keep a non-JSON response as-is.
      }
      throw new Error(
        reason
          ? `Algolia Agent Studio returned ${response.status}: ${reason}`
          : `Algolia Agent Studio returned ${response.status}.`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const result = (await response.json()) as CompletionResponse;
      assistantMessage.text = completionText(result);
      assistantMessage.messageId = result.id;
      assistantMessage.results = extractSearchResults(result);
      assistantMessage.suggestions = extractSuggestions(result);

      if (!assistantMessage.text && !(assistantMessage.results?.length)) {
        throw new Error("The assistant returned an empty response.");
      }
    } else {
      await consumeCompletionStream(response, assistantMessage);
    }
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      if (!assistantMessage.text && !(assistantMessage.results?.length)) {
        messages.value = messages.value.filter(
          (message) => message !== assistantMessage,
        );
      }
      return;
    }

    if (!assistantMessage.text && !(assistantMessage.results?.length)) {
      messages.value = messages.value.filter(
        (message) => message !== assistantMessage,
      );
    }

    error.value =
      cause instanceof Error
        ? cause.message
        : "The assistant is temporarily unavailable.";
  } finally {
    requestController = null;
    isLoading.value = false;
    await scrollToLatest();
  }
}

onBeforeUnmount(() => {
  requestController?.abort();
  if (scrollFrame !== null && typeof window !== "undefined") {
    window.cancelAnimationFrame(scrollFrame);
  }
});
</script>

<template>
  <aside class="algolia-ai-assistant" :class="{ open: isOpen }">
    <Transition name="assistant-panel">
      <section
        v-if="isOpen"
        id="algolia-ai-panel"
        class="assistant-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="algolia-ai-title"
      >
        <header class="assistant-header">
          <div>
            <div class="assistant-title">
              <VPIcon name="thesvg:xiaomi-mimo" size="20" color="currentColor" />
              <strong id="algolia-ai-title">Ask Xiaomi MiMo</strong>
            </div>
            <span>Powered by Algolia</span>
          </div>
          <div class="assistant-actions">
            <button type="button" title="Clear conversation" aria-label="Clear conversation" @click="resetConversation">↻</button>
            <button type="button" title="Close assistant" aria-label="Close assistant" @click="closeAssistant">×</button>
          </div>
        </header>

        <div ref="messageList" class="assistant-messages" aria-live="polite">
          <div
            v-for="(message, index) in messages"
            :key="message.messageId ?? `${message.role}-${index}`"
            class="assistant-turn"
            :class="message.role"
          >
            <div v-if="message.text" class="assistant-message" :class="message.role">
              <div class="assistant-message-content vp-doc" v-html="renderMarkdown(message.text)" />

              <div
                v-if="message.role === 'assistant' && message.messageId && !isLoading"
                class="assistant-feedback"
                aria-label="Rate this response"
              >
                <button
                  type="button"
                  title="Helpful"
                  aria-label="Helpful"
                  :aria-pressed="message.feedbackVote === 1"
                  :class="{ active: message.feedbackVote === 1 }"
                  :disabled="message.feedbackPending || message.feedbackVote !== undefined"
                  @click="submitFeedback(message, 1)"
                >
                  <VPIcon name="ic:twotone-thumb-up" size="16" color="currentColor" />
                </button>
                <button
                  type="button"
                  title="Not helpful"
                  aria-label="Not helpful"
                  :aria-pressed="message.feedbackVote === 0"
                  :class="{ active: message.feedbackVote === 0 }"
                  :disabled="message.feedbackPending || message.feedbackVote !== undefined"
                  @click="submitFeedback(message, 0)"
                >
                  <VPIcon name="ic:twotone-thumb-down" size="16" color="currentColor" />
                </button>
              </div>

              <p v-if="message.feedbackError" class="assistant-feedback-error" role="alert">
                {{ message.feedbackError }}
              </p>
            </div>

            <div
              v-if="message.role === 'assistant' && message.results?.length"
              class="assistant-results"
              aria-label="Related pages"
            >
              <div class="assistant-results-label">Related pages</div>
              <a
                v-for="result in message.results"
                :key="result.objectID ?? result.url"
                class="assistant-result-card"
                :href="result.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div class="assistant-result-icon" aria-hidden="true">
                  <VPIcon name="ic:outline-description" size="18" color="currentColor" />
                </div>
                <div class="assistant-result-body">
                  <strong>{{ result.title }}</strong>
                  <span v-if="result.section" class="assistant-result-section">{{ result.section }}</span>
                  <span v-if="result.content" class="assistant-result-snippet">{{ truncate(result.content) }}</span>
                </div>
                <VPIcon class="assistant-result-arrow" name="ic:round-open-in-new" size="15" color="currentColor" />
              </a>
            </div>

            <div
              v-if="message.role === 'assistant' && index === messages.length - 1 && message.suggestions?.length && !isLoading"
              class="assistant-suggestions"
              aria-label="Suggested follow-up questions"
            >
              <button
                v-for="suggestion in message.suggestions"
                :key="suggestion"
                type="button"
                :disabled="isLoading"
                @click="submitSuggestedQuestion(suggestion)"
              >
                <span>{{ suggestion }}</span>
                <VPIcon name="ic:round-arrow-forward" size="15" color="currentColor" />
              </button>
            </div>
          </div>

          <div v-if="showLoadingIndicator" class="assistant-message assistant-loading" aria-label="AI is thinking">
            <i /><i /><i />
          </div>
          <p v-if="error" class="assistant-error" role="alert">{{ error }}</p>
        </div>

        <form class="assistant-form" @submit.prevent="submitQuestion">
          <textarea
            v-model="input"
            rows="1"
            maxlength="2000"
            aria-label="Ask a question"
            placeholder="Ask about this website…"
            @keydown.enter.exact.prevent="submitQuestion"
          />
          <button type="submit" :disabled="!canSubmit" aria-label="Send question">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m3 20 18-8L3 4v6l13 2-13 2v6Z" />
            </svg>
          </button>
        </form>
        <p class="assistant-disclaimer">AI response is for reference only and may contain mistakes.</p>
      </section>
    </Transition>

    <button
      type="button"
      class="assistant-fab"
      :aria-expanded="isOpen"
      aria-controls="algolia-ai-panel"
      :aria-label="isOpen ? 'Close AI assistant' : 'Open AI assistant'"
      @click="toggleAssistant"
    >
      <VPIcon v-if="!isOpen" name="ic:outline-chat-bubble-outline" size="18" color="currentColor" />
      <span v-else aria-hidden="true">×</span>
    </button>
  </aside>
</template>

<style scoped>
.algolia-ai-assistant {
  position: fixed;
  right: 24px;
  bottom: calc(var(--vp-footer-height, 82px) + 34px);
  z-index: calc(var(--vp-z-index-back-to-top) + 1);
}

.assistant-fab {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--vp-c-white);
  cursor: pointer;
  opacity: 0.55;
  background-color: var(--vp-c-brand-1);
  border: 0;
  border-radius: 50%;
  box-shadow: var(--vp-shadow-2);
  place-items: center;
  transition: color var(--vp-t-color), opacity 0.2s ease, background-color var(--vp-t-color), box-shadow var(--vp-t-color);
}

.algolia-ai-assistant.open .assistant-fab,
.assistant-fab:hover,
.assistant-fab:focus-visible {
  color: var(--vp-c-white);
  opacity: 1;
}

.assistant-fab:focus-visible,
.assistant-actions button:focus-visible,
.assistant-form textarea:focus-visible,
.assistant-form button:focus-visible,
.assistant-suggestions button:focus-visible,
.assistant-result-card:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.assistant-fab span { font-size: 28px; line-height: 1; }

.assistant-panel {
  position: absolute;
  right: 0;
  bottom: 56px;
  display: flex;
  width: min(410px, calc(100vw - 32px));
  height: min(620px, calc(100vh - 150px));
  overflow: hidden;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  box-shadow: var(--vp-shadow-4);
  flex-direction: column;
}

.assistant-header {
  display: flex;
  min-height: 62px;
  padding: 12px 14px 10px 18px;
  border-bottom: 1px solid var(--vp-c-divider);
  align-items: center;
  justify-content: space-between;
}

.assistant-header strong,
.assistant-header span { display: block; }
.assistant-title { display: flex; align-items: center; gap: 7px; }
.assistant-header strong { font-size: 16px; }
.assistant-header span { margin-top: 1px; color: var(--vp-c-text-3); font-size: 11px; }
.assistant-actions { display: flex; gap: 4px; }

.assistant-actions button {
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--vp-c-text-2);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  font-size: 22px;
}
.assistant-actions button:hover { background: var(--vp-c-default-soft); }

.assistant-messages {
  display: flex;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  overscroll-behavior: contain;
}

.assistant-turn { display: flex; max-width: 100%; flex-direction: column; gap: 8px; }
.assistant-turn.user { align-items: flex-end; }
.assistant-turn.assistant { align-items: flex-start; }

.assistant-message {
  max-width: 88%;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.assistant-message :deep(> :first-child) { margin-top: 0; }
.assistant-message :deep(> :last-child) { margin-bottom: 0; }
.assistant-message :deep(p),
.assistant-message :deep(blockquote),
.assistant-message :deep(ul),
.assistant-message :deep(ol),
.assistant-message :deep(table),
.assistant-message :deep(div[class*="language-"]) { margin-top: 8px; margin-bottom: 8px; }
.assistant-message :deep(p),
.assistant-message :deep(li) { font-size: inherit; line-height: inherit; }
.assistant-message :deep(h1),
.assistant-message :deep(h2),
.assistant-message :deep(h3),
.assistant-message :deep(h4),
.assistant-message :deep(h5),
.assistant-message :deep(h6) { padding-top: 0; margin: 12px 0 6px; border-top: 0; font-size: 1.05em; line-height: 1.4; }
.assistant-message :deep(pre) { max-width: 100%; padding: 10px; overflow-x: auto; background: var(--vp-code-block-bg); border-radius: 8px; }
.assistant-message :deep(pre code) { font-family: var(--vp-font-family-mono); font-size: 0.86em; white-space: pre; }

.assistant-message.assistant { align-self: flex-start; background: var(--vp-c-bg-soft); border-bottom-left-radius: 4px; }
.assistant-message.user { align-self: flex-end; color: var(--vp-c-white); background: var(--vp-c-brand-1); border-bottom-right-radius: 4px; }
.assistant-message.user :deep(*) { color: inherit; }
.assistant-message.user :deep(a) { text-decoration-color: currentcolor; }
.assistant-message.user :deep(code) { background: rgb(255 255 255 / 16%); }

.assistant-results,
.assistant-suggestions { display: flex; width: min(100%, 360px); flex-direction: column; gap: 6px; }
.assistant-results-label { padding: 0 2px; color: var(--vp-c-text-3); font-size: 11px; font-weight: 600; }

.assistant-result-card {
  display: grid;
  padding: 10px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 11px;
  grid-template-columns: 28px minmax(0, 1fr) 18px;
  align-items: start;
  gap: 8px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.assistant-result-card:hover { color: var(--vp-c-text-1); background: var(--vp-c-bg-alt); border-color: var(--vp-c-brand-1); }
.assistant-result-icon { display: grid; width: 28px; height: 28px; color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); border-radius: 7px; place-items: center; }
.assistant-result-body { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
.assistant-result-body strong { overflow: hidden; font-size: 12.5px; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.assistant-result-section { overflow: hidden; color: var(--vp-c-text-2); font-size: 11px; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.assistant-result-snippet { display: -webkit-box; margin-top: 2px; overflow: hidden; color: var(--vp-c-text-3); font-size: 11px; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.assistant-result-arrow { margin-top: 5px; color: var(--vp-c-text-3); }

.assistant-suggestions button {
  display: flex;
  width: 100%;
  padding: 8px 10px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  font: inherit;
  font-size: 12px;
  line-height: 1.35;
  text-align: left;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.assistant-suggestions button:hover:not(:disabled) { color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); border-color: var(--vp-c-brand-1); }
.assistant-suggestions button:disabled { cursor: default; opacity: 0.5; }

.assistant-feedback { display: flex; margin-top: 7px; gap: 2px; }
.assistant-feedback button { display: grid; width: 28px; height: 26px; padding: 0; color: var(--vp-c-text-3); cursor: pointer; background: transparent; border: 0; border-radius: 7px; place-items: center; }
.assistant-feedback button:hover:not(:disabled),
.assistant-feedback button:focus-visible,
.assistant-feedback button.active { color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.assistant-feedback button:disabled:not(.active) { cursor: default; opacity: 0.45; }
.assistant-feedback-error { margin: 5px 0 0; color: var(--vp-c-danger-1); font-size: 11px; line-height: 1.35; }

.assistant-loading { display: flex; width: 52px; align-items: center; gap: 4px; }
.assistant-loading i { width: 6px; height: 6px; background: var(--vp-c-text-3); border-radius: 50%; animation: assistant-pulse 1.2s infinite ease-in-out; }
.assistant-loading i:nth-child(2) { animation-delay: 0.15s; }
.assistant-loading i:nth-child(3) { animation-delay: 0.3s; }
.assistant-error { margin: 0; color: var(--vp-c-danger-1); font-family: var(--vp-font-family-mono); font-size: 12px; }

.assistant-form { display: flex; margin: 0 14px; padding: 6px 6px 6px 12px; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 14px; align-items: flex-end; gap: 8px; }
.assistant-form:focus-within { border-color: var(--vp-c-brand-1); }
.assistant-form textarea { min-height: 34px; max-height: 96px; padding: 7px 0; overflow-y: auto; color: var(--vp-c-text-1); resize: none; background: transparent; border: 0; flex: 1; font: inherit; font-size: 14px; line-height: 20px; }
.assistant-form textarea:focus { outline: 0; }
.assistant-form button { display: grid; width: 34px; height: 34px; padding: 0; color: var(--vp-c-white); cursor: pointer; background: var(--vp-c-brand-1); border: 0; border-radius: 10px; place-items: center; }
.assistant-form button:disabled { cursor: not-allowed; opacity: 0.45; }
.assistant-form button svg { width: 18px; height: 18px; fill: currentcolor; }
.assistant-disclaimer { margin: 6px 0 8px; color: var(--vp-c-text-3); font-size: 10px; text-align: center; }

.assistant-panel-enter-active,
.assistant-panel-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; transform-origin: bottom right; }
.assistant-panel-enter-from,
.assistant-panel-leave-to { opacity: 0; transform: translateY(8px) scale(0.96); }

@keyframes assistant-pulse {
  0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}

@media (min-width: 768px) {
  .algolia-ai-assistant { bottom: calc(var(--vp-footer-height, 88px) + 36px); }
  .assistant-fab { width: 48px; height: 48px; }
  .assistant-fab :deep(.vp-icon) { width: 24px !important; height: 24px !important; }
  .assistant-panel { bottom: 62px; }
}

@media (max-width: 479px) {
  .assistant-panel { position: fixed; inset: 12px 12px 124px; width: auto; height: auto; }
}

@media print { .algolia-ai-assistant { display: none; } }

@media (prefers-reduced-motion: reduce) {
  .assistant-fab,
  .assistant-result-card,
  .assistant-panel-enter-active,
  .assistant-panel-leave-active { transition: none; }
}
</style>
