// Run with: node --test .github/scripts/gacha-manager.test.mjs
// Use the installed TypeScript compiler so this also works on CI's Node 22.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(path, replacements = []) {
  let code = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    },
  ).outputText;
  for (const [from, to] of replacements) code = code.replace(from, to);
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}
const recordsUrl = moduleUrl(
  "../../docs/.vuepress/theme/utils/gachaRecords.ts",
);
const {
  exportUigf,
  groupAccounts,
  localizeAccount,
  mergeAccounts,
  parseUigf,
  poolKey,
  recordRank,
  statistics,
} = await import(recordsUrl);
const transportUrl = moduleUrl(
  "../../docs/.vuepress/theme/utils/gachaTransport.ts",
);
const { detectGachaHelper, fetchWithGachaHelper } = await import(transportUrl);
const { applyGachaFetchPreference, gachaFetchAllowed } = await import(
  moduleUrl("../../docs/.vuepress/theme/utils/gachaFetchPreference.ts", [
    ['"vue"', JSON.stringify(import.meta.resolve("vue"))],
  ])
);
const {
  fetchGameRecords,
  fetchMetadata,
  fetchRecords,
  parseRecordUrl,
  prepareExportAccounts,
} = await import(
  moduleUrl("../../docs/.vuepress/theme/utils/gachaFetch.ts", [
    ['"./gachaRecords"', JSON.stringify(recordsUrl)],
    ['"./gachaTransport"', JSON.stringify(transportUrl)],
  ])
);
const row = (id, rank = "3", overrides = {}) => ({
  id: String(id),
  item_id: "10000003",
  time: "2026-10-02 12:00:00",
  gacha_type: "301",
  uigf_gacha_type: "301",
  rank_type: rank,
  ...overrides,
});
const account = (list, overrides = {}) => ({
  game: "hk4e",
  uid: "123456789",
  timezone: 8,
  lang: "en-us",
  list,
  ...overrides,
});
const archive = (list) => exportUigf([account(list)]);

test("round trips all four games without changing IDs or server time", () => {
  const input = [
    account([row("9007199254740993001")]),
    account(
      [
        row("2", "5", {
          gacha_type: "21",
          gacha_id: "4001",
          uigf_gacha_type: undefined,
        }),
      ],
      { game: "hkrpg" },
    ),
    account([row("3", "4", { gacha_type: "2", uigf_gacha_type: undefined })], {
      game: "nap",
    }),
    account(
      [
        {
          id: "4",
          item_id: "123",
          time: "2026-10-02 12:00:00",
          schedule_id: "1",
          item_type: "Outfit",
          item_name: "Example",
          rank_type: "5",
          op_gacha_type: "20011",
        },
      ],
      { game: "hk4e_ugc" },
    ),
  ];
  assert.deepEqual(
    parseUigf(JSON.parse(JSON.stringify(exportUigf(input)))),
    input.map((a) => ({
      ...a,
      list: a.list.map((r) =>
        Object.fromEntries(
          Object.entries(r).filter(([, v]) => v !== undefined),
        ),
      ),
    })),
  );
  assert.equal(
    parseUigf(archive([row("9007199254740993001")]))[0].list[0].id,
    "9007199254740993001",
  );
});

test("merges records by game and UID, deduplicates IDs, and sorts beyond safe integers", () => {
  const existing = [account([row("9007199254740993002")])];
  const merged = mergeAccounts(existing, [
    account([row("9007199254740993001"), row("9007199254740993002")]),
    account([row("1")], { uid: "987654321" }),
  ]);
  assert.equal(merged.added, 2);
  assert.equal(merged.duplicates, 1);
  assert.deepEqual(
    merged.accounts[0].list.map((r) => r.id),
    ["9007199254740993001", "9007199254740993002"],
  );
  assert.equal(existing[0].list.length, 1);
});

test("timezone and record conflicts leave existing records intact", () => {
  const existing = [account([row("1")])];
  const before = structuredClone(existing);
  assert.throws(
    () => mergeAccounts(existing, [account([row("2")], { timezone: -5 })]),
    /Timezone conflict/,
  );
  assert.throws(
    () =>
      mergeAccounts(existing, [
        account([row("2"), row("1", "3", { item_id: "999" })]),
      ]),
    /Conflicting record/,
  );
  assert.deepEqual(existing, before);
});

test("rejects numeric record IDs, malformed fields and unsupported versions", () => {
  assert.throws(
    () =>
      parseUigf({
        ...archive([]),
        info: { ...archive([]).info, version: "v5.0" },
      }),
    /Supported formats/,
  );
  const bad = archive([row("1")]);
  bad.hk4e[0].list[0].id = 9007199254740993001;
  assert.throws(() => parseUigf(bad), /must be a string/);
  const wrongType = archive([row("1")]);
  wrongType.hk4e[0].list[0].gacha_type = "999";
  assert.throws(() => parseUigf(wrongType), /Unsupported pool/);
});

test("shared Genshin character pools map to 301", () => {
  assert.equal(poolKey(row("1", "5", { gacha_type: "400" }), "hk4e"), "301");
  assert.throws(
    () =>
      parseUigf(
        archive([row("1", "5", { gacha_type: "400", uigf_gacha_type: "400" })]),
      ),
    /does not match/,
  );
});

test("statistics count pulls rather than item counts, exclude the incomplete first interval", () => {
  const data = [
    row("1", "3", { count: "10" }),
    row("2", "5"),
    row("3", "4"),
    row("4", "3"),
    row("5", "5"),
    row("6", "3"),
  ];
  const stats = statistics(data, "hk4e");
  assert.equal(stats.total, 6);
  assert.equal(stats.gold, 2);
  assert.equal(stats.purple, 1);
  assert.equal(stats.average, 3);
  assert.equal(stats.sinceGold, 1);
  assert.equal(stats.goldHistory[1].partial, true);
  assert.equal(stats.goldRate, (2 / 6) * 100);
});

test("maps ZZZ S/A/B ranks and uses metadata only for missing rarity", () => {
  assert.equal(recordRank(row("1", "4"), "nap"), 5);
  assert.equal(recordRank(row("1", "3"), "nap"), 4);
  assert.equal(recordRank(row("1", "2"), "nap"), 3);
  assert.equal(
    recordRank(row("1", undefined, { rank_type: undefined }), "nap", {
      10000003: { rank: 5 },
    }),
    5,
  );
  assert.equal(
    statistics([row("1", undefined, { rank_type: undefined })], "hk4e").unknown,
    1,
  );
});

test("localizes exports in four languages without rewriting saved records", () => {
  const original = account([
    row("1", "5", { name: "Jean", item_type: "Character" }),
  ]);
  const names = {
    "en-us": "Jean",
    "zh-cn": "琴",
    "zh-tw": "琴",
    "ja-jp": "ジン",
  };
  for (const [lang, name] of Object.entries(names)) {
    const output = localizeAccount(original, lang, {
      10000003: { name, rank: 5, type: "character", icon: null },
    });
    assert.equal(output.lang, lang);
    assert.equal(output.list[0].name, name);
    assert.equal(output.list[0].id, original.list[0].id);
    assert.equal(output.list[0].time, original.list[0].time);
    assert.equal(parseUigf(exportUigf([output]))[0].lang, lang);
  }
  assert.equal(original.list[0].name, "Jean");
  assert.throws(
    () => localizeAccount(original, "ja-jp", {}),
    /Missing ja-jp metadata/,
  );
});

test("maps official webpage URLs to matching endpoints and never accepts arbitrary hosts", () => {
  const result = parseRecordUrl(
    "https://gs.hoyoverse.com/genshin/event/test?authkey=test&lang=en-us#/log",
    "hk4e",
  );
  assert.equal(result.hostname, "public-operation-hk4e-sg.hoyoverse.com");
  assert.equal(result.pathname, "/gacha_info/api/getGachaLog");
  assert.equal(result.hash, "");
  assert.throws(
    () => parseRecordUrl("https://example.com/?authkey=test", "hk4e"),
    /host does not match/,
  );
  assert.throws(
    () =>
      parseRecordUrl(
        "https://public-operation-hkrpg.mihoyo.com/?authkey=test",
        "hk4e",
      ),
    /host does not match/,
  );
});

test("metadata queries batch at 90 IDs, use the chosen export language, and omit credentials", async (t) => {
  const queries = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    queries.push(new URL(url));
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers, undefined);
    return Response.json({ items: [] });
  });
  await fetchMetadata(
    "hk4e",
    Array.from({ length: 181 }, (_, i) => String(i + 1)),
    new AbortController().signal,
    "ja-jp",
  );
  assert.deepEqual(
    queries.map((url) => url.searchParams.get("ids").split(",").length),
    [90, 90, 1],
  );
  assert.ok(
    queries.every(
      (url) =>
        url.searchParams.get("lang") === "ja-jp" &&
        !url.searchParams.has("uid") &&
        !url.searchParams.has("authkey"),
    ),
  );
});

test("direct fetch paginates with string end_id and incremental fetching stops at existing history", async (t) => {
  const queries = [],
    pages = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.headers, undefined);
    assert.equal(options.credentials, "omit");
    queries.push(new URL(url));
    const type = url.searchParams.get("gacha_type");
    const page = url.searchParams.get("page");
    const list =
      type === "301"
        ? page === "1"
          ? Array.from({ length: 20 }, (_, i) => ({
              ...row(String(9007199254740993020n - BigInt(i))),
              uid: "123456789",
            }))
          : [{ ...row("9007199254740993000"), uid: "123456789" }]
        : [];
    return Response.json({ retcode: 0, data: { list } });
  });
  const base = {
    game: "hk4e",
    link: "https://public-operation-hk4e.mihoyo.com/?authkey=test",
    timezone: 8,
    signal: new AbortController().signal,
    progress() {},
    onPage(a) {
      pages.push(a);
    },
  };
  await fetchRecords({ ...base, existing: [], incremental: false });
  assert.equal(pages.flatMap((a) => a.list).length, 21);
  assert.equal(
    queries
      .find((url) => url.searchParams.get("page") === "2")
      .searchParams.get("end_id"),
    "9007199254740993001",
  );
  queries.length = 0;
  await fetchRecords({
    ...base,
    existing: [account([row("9007199254740993010")])],
    incremental: true,
  });
  assert.ok(!queries.some((url) => url.searchParams.get("page") === "2"));
});

test("Star Rail collaboration pools use getLdGachaLog and ZZZ queries use real_gacha_type", async (t) => {
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(new URL(url));
    return Response.json({ retcode: 0, data: { list: [] } });
  });
  const base = {
    timezone: 8,
    existing: [],
    incremental: true,
    signal: new AbortController().signal,
    progress() {},
    onPage() {},
  };
  await fetchRecords({
    ...base,
    game: "hkrpg",
    link: "https://public-operation-hkrpg.mihoyo.com/?authkey=test",
  });
  assert.equal(
    urls.filter((url) => url.pathname.endsWith("getLdGachaLog")).length,
    2,
  );
  urls.length = 0;
  await fetchRecords({
    ...base,
    game: "nap",
    link: "https://public-operation-nap.mihoyo.com/?authkey=test",
  });
  assert.deepEqual(
    urls.map((url) => url.searchParams.get("real_gacha_type")),
    ["1", "2", "3", "5", "102", "103"],
  );
  assert.ok(urls.every((url) => !url.searchParams.has("gacha_type")));
});

test("abort stops fetching before any network request", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Must not fetch");
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchRecords({
      game: "hk4e",
      link: "https://public-operation-hk4e.mihoyo.com/?authkey=test",
      timezone: 8,
      existing: [],
      incremental: true,
      signal: controller.signal,
      progress() {},
      onPage() {},
    }),
    { name: "AbortError" },
  );
  assert.equal(fetch.mock.callCount(), 0);
});

test("Genshin and Miliastra are one visible account but retain distinct UIGF fields", () => {
  const input = [
    account([row("1")]),
    account([], { game: "hk4e_ugc" }),
    account([], { game: "hkrpg" }),
  ];
  const groups = groupAccounts(input);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].game, "hk4e");
  assert.equal(groups[0].accounts.length, 2);
  const output = exportUigf(groups[0].accounts);
  assert.equal(output.hk4e.length, 1);
  assert.equal(output.hk4e_ugc.length, 1);
  assert.equal(output.hkrpg, undefined);
});

test("selecting Genshin also fetches Miliastra and server selection assigns timezone", async (t) => {
  const urls = [],
    incoming = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(new URL(url));
    const beyond = url.pathname.endsWith("getBeyondGachaLog");
    const list =
      beyond && url.searchParams.get("gacha_type") === "1000"
        ? [
            {
              uid: "123456789",
              id: "1",
              item_id: "123",
              item_type: "Outfit",
              item_name: "Example",
              schedule_id: "1",
              rank_type: "5",
              op_gacha_type: "1000",
              time: "2026-10-02 12:00:00",
            },
          ]
        : [];
    return Response.json({ retcode: 0, data: { list } });
  });
  await fetchGameRecords({
    game: "hk4e",
    server: "europe",
    link: "https://gs.hoyoverse.com/genshin/event/test?authkey=test",
    existing: [],
    incremental: true,
    signal: new AbortController().signal,
    progress() {},
    onPage(a) {
      incoming.push(a);
    },
  });
  assert.equal(urls.length, 7);
  assert.equal(
    urls.filter((url) => url.pathname.endsWith("getBeyondGachaLog")).length,
    2,
  );
  assert.equal(incoming[0].game, "hk4e_ugc");
  assert.equal(incoming[0].timezone, 1);
  await assert.rejects(
    fetchGameRecords({
      game: "hk4e",
      server: "cn",
      link: "https://gs.hoyoverse.com/genshin/event/test?authkey=test",
      existing: [],
      incremental: true,
      signal: new AbortController().signal,
      progress() {},
      onPage() {},
    }),
    /server region does not match/,
  );
});

test("merging different record languages does not claim a single archive language", () => {
  const merged = mergeAccounts(
    [account([row("1")])],
    [account([row("2")], { lang: "zh-cn" })],
  );
  assert.equal(merged.accounts[0].lang, undefined);
});

function transportWindow(t, respond) {
  const listeners = new Set(),
    requests = [];
  const window = {
    location: { origin: "https://blog.lucas04.top" },
    addEventListener(_type, callback) {
      listeners.add(callback);
    },
    removeEventListener(_type, callback) {
      listeners.delete(callback);
    },
    postMessage(message, origin) {
      requests.push(message);
      assert.equal(origin, window.location.origin);
      if (message.action !== "cancel" && respond)
        queueMicrotask(() => {
          const response = {
            type: "helios-assistant-helper-response",
            protocol: 1,
            id: message.id,
            result:
              message.action === "probe"
                ? { version: "1.0.0" }
                : { retcode: 0, data: { list: [] } },
          };
          for (const listener of listeners)
            listener({
              source: window,
              origin: window.location.origin,
              data: response,
            });
        });
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: window,
    configurable: true,
  });
  t.after(() => {
    delete globalThis.window;
  });
  return { requests, listeners };
}

test("page detects the helper, reads JSON, and cleans up message listeners", async (t) => {
  const helper = transportWindow(t, true);
  assert.equal(await detectGachaHelper(new AbortController().signal), true);
  assert.equal(helper.listeners.size, 0);
  const result = await fetchWithGachaHelper(
    new URL(
      "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog?authkey=test",
    ),
    new AbortController().signal,
  );
  assert.equal(result.retcode, 0);
  assert.equal(helper.listeners.size, 0);
});

test("page cancels helper requests and removes listeners when aborted", async (t) => {
  const helper = transportWindow(t, false);
  const controller = new AbortController();
  const pending = fetchWithGachaHelper(
    new URL(
      "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog?authkey=test",
    ),
    controller.signal,
  );
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(helper.listeners.size, 0);
  assert.equal(helper.requests.at(-1).action, "cancel");
});

test("link fetching is hidden by default and the opt-in is limited to the tool route", () => {
  assert.equal(gachaFetchAllowed.value, false);
  applyGachaFetchPreference(
    true,
    new URL(
      "https://blog.lucas04.top/tool/gacha-manager/?gachaFetchAllowed=true",
    ),
  );
  assert.equal(gachaFetchAllowed.value, true);
  applyGachaFetchPreference(true, new URL("https://blog.lucas04.top/tools/"));
  assert.equal(gachaFetchAllowed.value, false);
  applyGachaFetchPreference(
    false,
    new URL("https://blog.lucas04.top/tool/gacha-manager/"),
  );
  assert.equal(gachaFetchAllowed.value, false);
});

test("Miliastra always exports Chinese while other records use the selected language", async (t) => {
  const queries = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    queries.push(new URL(url));
    return Response.json({
      items: [
        {
          item_id: "10000003",
          name:
            url.searchParams.get("game") === "hk4e_ugc" ? "中文装扮" : "Jean",
          rank: 5,
          type:
            url.searchParams.get("game") === "hk4e_ugc"
              ? "outfit"
              : "character",
          icon: null,
        },
      ],
    });
  });
  const miliastra = account(
    [
      {
        id: "1",
        item_id: "10000003",
        item_type: "Outfit",
        item_name: "English outfit",
        rank_type: "5",
        schedule_id: "1",
        op_gacha_type: "20011",
        time: "2026-10-02 12:00:00",
      },
    ],
    { game: "hk4e_ugc", lang: "en-us" },
  );
  const output = await prepareExportAccounts(
    [account([row("1")]), miliastra],
    "en-us",
    new AbortController().signal,
  );
  assert.equal(output[0].lang, "en-us");
  assert.equal(output[1].lang, "zh-cn");
  assert.equal(output[1].list[0].item_name, "中文装扮");
  assert.equal(miliastra.list[0].item_name, "English outfit");
  assert.equal(
    queries
      .find((url) => url.searchParams.get("game") === "hk4e_ugc")
      .searchParams.get("lang"),
    "zh-cn",
  );
  const original = await prepareExportAccounts(
    [miliastra],
    "original",
    new AbortController().signal,
  );
  assert.equal(original[0].lang, "zh-cn");
  assert.equal(parseUigf(exportUigf(output))[1].lang, "zh-cn");
});

test("online import remembers its cookie and explicit false disables it", (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  let stored = "";
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get cookie() {
        return stored.split(";")[0];
      },
      set cookie(value) {
        stored = value;
      },
    },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  });
  const tool = new URL("https://blog.lucas04.top/tool/gacha-manager/");
  applyGachaFetchPreference(null, tool);
  assert.equal(gachaFetchAllowed.value, false);
  applyGachaFetchPreference(true, tool);
  assert.match(stored, /max-age=31536000; SameSite=Lax; Secure/);
  applyGachaFetchPreference(null, new URL("https://blog.lucas04.top/tools/"));
  assert.equal(gachaFetchAllowed.value, false);
  applyGachaFetchPreference(null, tool);
  assert.equal(gachaFetchAllowed.value, true);
  applyGachaFetchPreference(false, tool);
  applyGachaFetchPreference(null, tool);
  assert.equal(gachaFetchAllowed.value, false);
});
