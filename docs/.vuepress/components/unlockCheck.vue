<template>
  <NetworkToolShell
    eyebrow="Unlock Check"
    :title="title"
    :summary="summary"
    :kind="kind"
    :progress="done / SERVICES.length"
    :button-text="finished ? 'Check again' : 'Start'"
    @run="start"
  >
    <div class="network-tool-stats" aria-label="Unlock summary">
      <div v-for="stat in tallyStats" :key="stat.label" class="network-tool-stat">
        <span>{{ stat.label }}</span>
        <strong :class="`tool-tone-${stat.tone}`">{{ stat.value }}</strong>
      </div>
    </div>

    <div v-if="finished" class="network-tool-toolbar">
      <ul class="network-tool-notes">
        <li v-for="note in notes" :key="note.text" :class="note.tone && `tool-tone-${note.tone}`">
          {{ note.text }}
        </li>
      </ul>
      <button type="button" class="network-tool-secondary-button" @click="masked = !masked">
        {{ masked ? "Show IPs" : "Hide IPs" }}
      </button>
    </div>

    <details
      v-for="group in groups"
      :key="group.id"
      class="network-tool-disclosure"
      open
    >
      <summary>
        <span>{{ group.title }}</span>
        <span class="network-tool-count">{{ group.count }}</span>
      </summary>
      <div class="network-tool-disclosure-body network-tool-table-wrap">
        <table class="network-tool-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Result</th>
              <th>Country</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in group.rows" :key="row.id">
              <td>
                <a :href="row.site" class="no-icon" target="_blank" rel="noopener noreferrer">
                  {{ row.name }}
                </a>
              </td>
              <td :class="`tool-tone-${row.tone}`">{{ row.result }}</td>
              <td>{{ row.country }}</td>
              <td>
                <strong v-if="row.how">{{ row.how }}</strong>
                <div class="network-tool-detail">{{ row.why }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <ul class="network-tool-notes">
      <li>Your browser contacts each service over the route you normally use for it. Reliability runs from Official API to Its location to Redirect test to Guess.</li>
      <li>Netflix limits many proxy and data-center IPs to its own shows, and a browser cannot see that.</li>
      <li>Google locates IPs with its own database, which can disagree with other services, so Gemini may not work even when the result says it does.</li>
    </ul>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import NetworkToolShell from "./networkToolShell.vue";
import { IP_API_URL } from "../theme/utils/chinaMainlandUserDetection";
import {
  type ConnectionSummary,
  type Tone,
  browserTimeZoneCountry,
  countryName,
  fetchMe,
  fillTemplate,
} from "../theme/utils/networkTools/shared";
import {
  READERS,
  exitsByCountry,
  guessCountry,
  judge,
  maskIp,
  tally,
} from "../theme/utils/networkTools/vendor/unlock-check/lib.mjs";
import {
  CATS,
  NETFLIX_TRY,
  SERVICES,
} from "../theme/utils/networkTools/vendor/unlock-check/services.mjs";

interface Service {
  id: string;
  cat: string;
  name: string;
  site: string;
  allow?: string;
  deny?: string;
  only?: string;
  probe: {
    api?: string;
    init?: RequestInit;
    read?: string;
    edge?: string;
    trace?: string;
    hops?: string;
    zero?: boolean;
    netflix?: boolean;
    reach?: string;
  };
}

interface ProbeState {
  err: string | null;
  reach: boolean | null;
  n?: number;
  cc?: string | null;
  ip?: string;
  ok?: boolean;
  hops?: number | null;
  edge?: { cc: string; ip: string };
}

interface Verdict {
  v: "ok" | "no" | "reach" | "fail";
  cc: string | null;
  ip: string;
  how: "api" | "edge" | "hops" | "guess" | null;
  why: string | null;
  n?: number;
}

const TIMEOUT = 8000;
const services = SERVICES as Service[];
const byId = Object.fromEntries(services.map((service) => [service.id, service]));

const CATEGORY_TITLES: Record<string, string> = {
  ai: "AI",
  video: "Streaming",
  social: "Social",
  local: "Regional TV",
};

const RESULT_TEXT: Record<Verdict["v"], [string, Tone]> = {
  ok: ["Works", "ok"],
  no: ["Blocked", "bad"],
  reach: ["Not sure", "warn"],
  fail: ["Won't open", "bad"],
};

const HOW_TEXT: Record<string, string> = {
  api: "Official API",
  edge: "Its location",
  hops: "Redirect test",
  guess: "Guess",
};

const WHY_TEXT: Record<string, string> = {
  api_ok: "{name}'s own region API says: you can use it.",
  api_no: "{name}'s own region API says: not available where you are.",
  edge_list_ok: "{name}'s servers place you in {c}, which is on its list of supported countries.",
  edge_list_no: "{name}'s servers place you in {c}, which is not on its list of supported countries.",
  edge_block_ok: "{name}'s servers place you in {c}, where it isn't restricted.",
  edge_block_no: "{name}'s servers place you in {c}, where {name} isn't available.",
  guess_list_ok: "{name} doesn't let other sites read its answers, so the page only knows it opens. Most other services place you in {c}, which is on {name}'s list of supported countries.",
  guess_list_no: "{name} doesn't let other sites read its answers, so the page only knows it opens. Most other services place you in {c}, which is not on {name}'s list of supported countries.",
  guess_block_ok: "{name} doesn't let other sites read its answers, so the page only knows it opens. Most other services place you in {c}, where it isn't restricted.",
  guess_block_no: "{name} opens, but most other services place you in {c}, where {name} is blocked or not offered.",
  hops_ok: "{name} opened normally, without sending you to its \"not available in your region\" page.",
  hops_no: "{name} sent you to its \"not available in your region\" page.",
  nf_ok: "Netflix gives you its {c} catalog.",
  nf_no: "Most other services place you in {c}, where Netflix isn't offered.",
  nf_none: "Netflix opens, but the page couldn't find which country's catalog it gives you.",
  reach_nolist: "{name}'s servers place you in {c}. It doesn't publish where it is available, so only the location is shown.",
  reach_nocc: "{name} opens, but your country is unknown, so the page can't tell whether you can use it.",
  fail_net: "{name} won't open: the network, a proxy rule, or an ad blocker is blocking it.",
  fail_timeout: "{name} didn't answer within 8 seconds.",
  fail_http: "{name} returned an error (HTTP {n}), so the page can't tell.",
};

const verdicts = shallowRef<Record<string, Verdict>>({});
const done = ref(0);
const running = ref(false);
const finished = ref(false);
const masked = ref(false);
const visitor = ref<ConnectionSummary | null>(null);
let generation = 0;

const hop = (count: number, url: string) => {
  const target = new URL(url);
  return `${IP_API_URL}/v1/hop/${count}/${target.host}${target.pathname}${target.search}`;
};

const bust = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}_u=${Math.random().toString(36).slice(2, 10)}`;

const read = async (url: string, init?: RequestInit) => {
  let response: Response;

  try {
    response = await fetch(init?.method === "POST" ? url : bust(url), {
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(TIMEOUT),
      ...init,
    });
  } catch (err) {
    const why = err instanceof Error && err.name === "TimeoutError" ? "timeout" : "net";
    return { why };
  }

  return {
    st: response.status,
    text: await response.text().catch(() => ""),
  };
};

const loads = async (url: string) => {
  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), TIMEOUT);

  try {
    await fetch(url, {
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: abort.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
    abort.abort();
  }
};

let redirectLimit: Promise<number> | null = null;

const maxHops = () => {
  redirectLimit ??= (async () => {
    const at = (count: number) => loads(hop(count, `${IP_API_URL}/v1/hop.txt`));
    const [twenty, twentyOne] = await Promise.all([at(20), at(21)]);
    if (twenty && !twentyOne) return 20;

    let low = 0;
    let high = 24;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (await at(middle)) low = middle;
      else high = middle - 1;
    }
    return low >= 4 ? low : 0;
  })();
  return redirectLimit;
};

const addedHops = async (url: string, upTo: number) => {
  const max = await maxHops();
  if (!max) return null;

  for (let extra = 0; extra <= upTo; extra += 1) {
    if (await loads(hop(max - extra, url))) return extra;
  }
  return null;
};

const netflixCountry = async (prefer: string[]) => {
  const max = await maxHops();
  if (!max) return { hops: null };
  if (await loads(hop(max, "https://www.netflix.com/"))) return { cc: "US", hops: 0 };

  const denied = (byId.netflix.deny ?? "").split(" ");
  const candidates = [...new Set([...prefer, ...(NETFLIX_TRY as string[])])].filter(
    (code) => code !== "US" && !denied.includes(code),
  );

  for (let index = 0; index < candidates.length; index += 6) {
    const batch = candidates.slice(index, index + 6);
    const answers = await Promise.all(
      batch.map((code) =>
        loads(hop(max - 1, `https://www.netflix.com/${code.toLowerCase()}/`)),
      ),
    );
    const found = answers.indexOf(true);
    if (found >= 0) return { cc: batch[found], hops: 0 };
  }
  return { hops: 1 };
};

const ask = async (service: Service): Promise<ProbeState> => {
  const probe = service.probe;
  const state: ProbeState = { err: null, reach: null };

  if (probe.api) {
    const [answer, edge] = await Promise.all([
      read(probe.api, probe.init),
      probe.edge ? read(probe.edge) : null,
    ]);

    if ("why" in answer) {
      state.err = answer.why ?? "net";
    } else {
      const parsed = READERS[probe.read as string](answer.st, answer.text);
      if (parsed) Object.assign(state, parsed);
      else {
        state.err = "http";
        state.n = answer.st;
      }
    }

    if (edge && !("why" in edge)) {
      const parsed = READERS.trace(edge.st, edge.text);
      if (parsed) state.edge = parsed;
    }
    return state;
  }

  if (probe.trace) {
    const answer = await read(probe.trace);
    if ("why" in answer) {
      state.err = answer.why ?? "net";
    } else {
      const parsed = READERS.trace(answer.st, answer.text);
      if (parsed) Object.assign(state, parsed);
      else {
        state.err = "http";
        state.n = answer.st;
      }
    }
    return state;
  }

  const target = probe.reach ?? (probe.hops as string);
  state.reach = (await loads(target)) || (await loads(target));
  return state;
};

const isLate = (service: Service) =>
  Boolean(
    service.probe.netflix ||
      service.probe.hops ||
      (!service.probe.api && !service.probe.trace),
  );

const whyOf = (service: Service, verdict: Verdict) => {
  const values = {
    name: service.name,
    c: verdict.cc ? countryName(verdict.cc) : "",
    n: verdict.n ?? "",
  };

  if (verdict.v === "fail") {
    const reason =
      verdict.why === "timeout" || verdict.why === "http" ? verdict.why : "net";
    return fillTemplate(WHY_TEXT[`fail_${reason}`], values);
  }

  let key: string;
  if (service.id === "netflix") key = verdict.cc ? `nf_${verdict.v}` : "nf_none";
  else if (verdict.v === "reach") key = verdict.cc ? "reach_nolist" : "reach_nocc";
  else if (verdict.how === "api" || verdict.how === "hops") {
    key = `${verdict.how}_${verdict.v}`;
  } else key = `${verdict.how}_${service.allow ? "list" : "block"}_${verdict.v}`;

  return fillTemplate(WHY_TEXT[key] ?? "", values);
};

const groups = computed(() =>
  (CATS as string[]).map((id) => {
    const members = services.filter((service) => service.cat === id);
    const resolved = members.filter((service) => verdicts.value[service.id]);
    const working = resolved.filter((service) => verdicts.value[service.id].v === "ok");

    return {
      id,
      title: CATEGORY_TITLES[id],
      count: resolved.length
        ? `${working.length} of ${members.length} work`
        : `${members.length} services`,
      rows: members.map((service) => {
        const verdict = verdicts.value[service.id];
        if (!verdict) {
          return {
            id: service.id,
            name: service.name,
            site: service.site,
            result: running.value ? "Checking..." : "Not run",
            tone: "muted" as Tone,
            country: "N/A",
            how: "",
            why: "",
          };
        }

        const [result, tone] = RESULT_TEXT[verdict.v];
        const address = verdict.ip
          ? ` IP ${masked.value ? maskIp(verdict.ip) : verdict.ip}.`
          : "";

        return {
          id: service.id,
          name: service.name,
          site: service.site,
          result,
          tone,
          country: verdict.cc ? countryName(verdict.cc) : "N/A",
          how: verdict.how ? HOW_TEXT[verdict.how] : "",
          why: `${whyOf(service, verdict)}${address}`,
        };
      }),
    };
  }),
);

const tallyStats = computed(() => {
  const counts = tally(Object.values(verdicts.value));
  const active = running.value || finished.value;
  const value = (count: number) => (active ? String(count) : "N/A");

  return [
    { label: "Works", value: value(counts.ok), tone: "ok" },
    { label: "Blocked", value: value(counts.no), tone: "bad" },
    { label: "Not Sure", value: value(counts.reach), tone: "warn" },
    { label: "Won't Open", value: value(counts.fail), tone: "bad" },
  ];
});

const KEY_SERVICES = ["chatgpt", "claude", "gemini", "netflix", "disney"];
const AI_SERVICES = ["chatgpt", "claude", "gemini"];

const worksCount = (ids: string[]) =>
  ids.filter((id) => verdicts.value[id]?.v === "ok").length;

const kind = computed(() => {
  if (running.value) return "running" as const;
  if (!finished.value) return "idle" as const;
  if (worksCount(KEY_SERVICES) === KEY_SERVICES.length) return "ok" as const;
  if (worksCount(AI_SERVICES) === 0) return "bad" as const;
  return "warn" as const;
});

const title = computed(() => {
  if (running.value) return "Checking...";
  if (!finished.value) return "Which Streaming and AI Services Work on Your IP?";
  if (kind.value === "ok") return "ChatGPT, Claude, Gemini, Netflix, and Disney+ All Work";
  if (kind.value === "bad") return "AI Services Are Blocked on This IP";
  return "Some Major Services Don't Work on This IP";
});

const summary = computed(() => {
  if (running.value) return `${done.value} of ${services.length} services checked.`;
  if (finished.value) return `${services.length} services checked.`;
  return `Your browser visits ${services.length} services directly to see whether each one works and which country it places you in. Nothing runs until you press Start.`;
});

const notes = computed(() => {
  const output: { text: string; tone: Tone }[] = [];
  const exits = exitsByCountry(verdicts.value) as { cc: string; ids: string[] }[];

  if (!exits.length) {
    output.push({ text: "No service returned your location.", tone: "" });
  } else if (exits.length === 1) {
    output.push({ text: `Every service places you in ${countryName(exits[0].cc)}.`, tone: "ok" });
  } else {
    const parts = exits.map(
      (exit, index) =>
        `${countryName(exit.cc)} (${index ? exit.ids.map((id) => byId[id].name).join(", ") : `×${exit.ids.length}`})`,
    );
    output.push({ text: `Services place you in different countries: ${parts.join(" · ")}`, tone: "warn" });
  }

  const addresses = new Map<string, number>();
  Object.values(verdicts.value).forEach((verdict) => {
    if (verdict?.ip) addresses.set(verdict.ip, (addresses.get(verdict.ip) ?? 0) + 1);
  });
  if (addresses.size) {
    const parts = [...addresses]
      .sort((first, second) => second[1] - first[1])
      .map(([ip, count]) => `${masked.value ? maskIp(ip) : ip} ×${count}`);
    output.push({
      text: `IPs the services see: ${parts.join(" · ")}`,
      tone: addresses.size > 1 ? "warn" : "",
    });
  }

  const main = exits[0]?.cc ?? visitor.value?.country ?? "";
  const timeZone = browserTimeZoneCountry();
  if (main && timeZone && timeZone === main) {
    output.push({ text: `Your browser's time zone matches ${countryName(main)}.`, tone: "ok" });
  } else if (main && timeZone) {
    output.push({
      text: `Your browser's time zone is in ${countryName(timeZone)}, but services place you in ${countryName(main)}. AI services may take this as a sign of a proxy.`,
      tone: "warn",
    });
  }

  return output;
});

const start = async () => {
  const current = ++generation;

  running.value = true;
  finished.value = false;
  verdicts.value = {};
  done.value = 0;
  redirectLimit = null;

  let guess: string | null = null;
  const settle = (service: Service, state: ProbeState) => {
    if (current !== generation) return;
    verdicts.value = {
      ...verdicts.value,
      [service.id]: judge(service, state, guess),
    };
    done.value += 1;
  };

  const mePromise = fetchMe();
  void maxHops();

  const early = services.filter((service) => !isLate(service));
  const late = services.filter(isLate);
  const reachability = Object.fromEntries(
    late.map((service) => [service.id, ask(service)]),
  );

  await Promise.all(
    early.map(async (service) => settle(service, await ask(service))),
  );
  if (current !== generation) return;

  const seen = early
    .map((service) => verdicts.value[service.id])
    .filter((verdict) => verdict?.cc && verdict.how !== "guess")
    .map((verdict) => verdict.cc as string);
  const me = await mePromise;
  if (current !== generation) return;

  visitor.value = me;
  guess = guessCountry(seen) || me?.country || null;
  const prefer = [
    ...new Set([...seen, me?.country].filter(Boolean)),
  ] as string[];

  await Promise.all(
    late.map(async (service) => {
      const state = await reachability[service.id];

      if (state.reach) {
        if (service.probe.netflix) {
          Object.assign(state, await netflixCountry(prefer));
        } else if (service.probe.hops) {
          state.hops = await addedHops(service.probe.hops, service.probe.zero ? 3 : 0);
        }
      }
      settle(service, state);
    }),
  );
  if (current !== generation) return;

  running.value = false;
  finished.value = true;
};

onBeforeUnmount(() => {
  generation += 1;
});
</script>
