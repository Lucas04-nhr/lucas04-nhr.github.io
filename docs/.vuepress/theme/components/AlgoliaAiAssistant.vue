<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import VPIcon from "vuepress-theme-plume/components/VPIcon.vue";

type ChatRole = "assistant" | "user";

interface ChatMessage {
  role: ChatRole;
  text: string;
}

interface CompletionPart {
  type?: string;
  text?: string;
  url?: string;
}

interface CompletionResponse {
  parts?: CompletionPart[];
}

interface AlgoliaErrorResponse {
  detail?: string;
  message?: string;
}

const ALGOLIA_APPLICATION_ID = "74YMW3SD6Z";
const ALGOLIA_SEARCH_API_KEY = "8452a5a75f5166abe464b8fe85d3b3cc";
const ALGOLIA_AGENT_ID = "782ad8a9-dafa-4e57-90ef-3fc5e42ac9fd";
const COMPLETIONS_URL = `https://${ALGOLIA_APPLICATION_ID.toLowerCase()}.algolia.net/agent-studio/1/agents/${ALGOLIA_AGENT_ID}/completions?stream=false&compatibilityMode=ai-sdk-5`;

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

const canSubmit = computed(
  () => input.value.trim().length > 0 && !isLoading.value,
);

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

function completionText(response: CompletionResponse): string {
  return (response.parts ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

async function submitQuestion() {
  const question = input.value.trim();
  if (!question || isLoading.value) return;

  messages.value.push({ role: "user", text: question });
  input.value = "";
  error.value = "";
  isLoading.value = true;
  await scrollToLatest();

  requestController = new AbortController();

  try {
    const response = await fetch(COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-algolia-application-id": ALGOLIA_APPLICATION_ID,
        "x-algolia-api-key": ALGOLIA_SEARCH_API_KEY,
      },
      body: JSON.stringify({
        messages: messages.value.slice(1).map((message) => ({
          role: message.role,
          parts: [{ type: "text", text: message.text }],
        })),
      }),
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

    const result = (await response.json()) as CompletionResponse;
    const answer = completionText(result);
    if (!answer) throw new Error("The assistant returned an empty response.");

    messages.value.push({ role: "assistant", text: answer });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") return;
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

onBeforeUnmount(() => requestController?.abort());
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
              <VPIcon
                name="thesvg:xiaomi-mimo"
                size="20"
                color="currentColor"
              />
              <strong id="algolia-ai-title">Ask Xiaomi MiMo</strong>
            </div>
            <span>Powered by Algolia</span>
          </div>
          <div class="assistant-actions">
            <button type="button" title="Clear conversation" aria-label="Clear conversation" @click="resetConversation">
              ↻
            </button>
            <button type="button" title="Close assistant" aria-label="Close assistant" @click="closeAssistant">
              ×
            </button>
          </div>
        </header>

        <div ref="messageList" class="assistant-messages" aria-live="polite">
          <div
            v-for="(message, index) in messages"
            :key="`${message.role}-${index}`"
            class="assistant-message"
            :class="message.role"
          >
            {{ message.text }}
          </div>
          <div v-if="isLoading" class="assistant-message assistant-loading" aria-label="AI is thinking">
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
        <p class="assistant-disclaimer">For reference only. AI responses may contain mistakes.</p>
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
      <VPIcon
        v-if="!isOpen"
        name="ic:outline-chat-bubble-outline"
        size="18"
        color="currentColor"
      />
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
  transition:
    color var(--vp-t-color),
    opacity 0.2s ease,
    background-color var(--vp-t-color),
    box-shadow var(--vp-t-color);
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
.assistant-form button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.assistant-fab span {
  font-size: 28px;
  line-height: 1;
}

.assistant-panel {
  position: absolute;
  right: 0;
  bottom: 56px;
  display: flex;
  width: min(380px, calc(100vw - 32px));
  height: min(570px, calc(100vh - 150px));
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
.assistant-header span {
  display: block;
}

.assistant-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.assistant-header strong {
  font-size: 16px;
}

.assistant-header span {
  margin-top: 1px;
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.assistant-actions {
  display: flex;
  gap: 4px;
}

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

.assistant-actions button:hover {
  background: var(--vp-c-default-soft);
}

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

.assistant-message {
  max-width: 88%;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.assistant-message.assistant {
  align-self: flex-start;
  background: var(--vp-c-bg-soft);
  border-bottom-left-radius: 4px;
}

.assistant-message.user {
  align-self: flex-end;
  color: var(--vp-c-white);
  background: var(--vp-c-brand-1);
  border-bottom-right-radius: 4px;
}

.assistant-loading {
  display: flex;
  width: 52px;
  align-items: center;
  gap: 4px;
}

.assistant-loading i {
  width: 6px;
  height: 6px;
  background: var(--vp-c-text-3);
  border-radius: 50%;
  animation: assistant-pulse 1.2s infinite ease-in-out;
}

.assistant-loading i:nth-child(2) { animation-delay: 0.15s; }
.assistant-loading i:nth-child(3) { animation-delay: 0.3s; }

.assistant-error {
  margin: 0;
  color: var(--vp-c-danger-1);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}

.assistant-form {
  display: flex;
  margin: 0 14px;
  padding: 6px 6px 6px 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  align-items: flex-end;
  gap: 8px;
}

.assistant-form:focus-within {
  border-color: var(--vp-c-brand-1);
}

.assistant-form textarea {
  min-height: 34px;
  max-height: 96px;
  padding: 7px 0;
  overflow-y: auto;
  color: var(--vp-c-text-1);
  resize: none;
  background: transparent;
  border: 0;
  flex: 1;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
}

.assistant-form textarea:focus { outline: 0; }

.assistant-form button {
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  color: var(--vp-c-white);
  cursor: pointer;
  background: var(--vp-c-brand-1);
  border: 0;
  border-radius: 10px;
  place-items: center;
}

.assistant-form button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.assistant-form button svg {
  width: 18px;
  height: 18px;
  fill: currentcolor;
}

.assistant-disclaimer {
  margin: 6px 0 8px;
  color: var(--vp-c-text-3);
  font-size: 10px;
  text-align: center;
}

.assistant-panel-enter-active,
.assistant-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: bottom right;
}

.assistant-panel-enter-from,
.assistant-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

@keyframes assistant-pulse {
  0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}

@media (min-width: 768px) {
  .algolia-ai-assistant {
    bottom: calc(var(--vp-footer-height, 88px) + 36px);
  }

  .assistant-fab {
    width: 48px;
    height: 48px;
  }

  .assistant-fab :deep(.vp-icon) {
    width: 24px !important;
    height: 24px !important;
  }

  .assistant-panel {
    bottom: 62px;
  }
}

@media (max-width: 479px) {
  .assistant-panel {
    position: fixed;
    inset: 12px 12px 124px;
    width: auto;
    height: auto;
  }
}

@media print {
  .algolia-ai-assistant { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .assistant-fab,
  .assistant-panel-enter-active,
  .assistant-panel-leave-active {
    transition: none;
  }
}
</style>
