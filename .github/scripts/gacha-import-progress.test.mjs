import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function moduleUrl(path, replacements = []) {
  let code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  for (const [from, to] of replacements) code = code.replace(from, to);
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}
const versionUrl = moduleUrl("../../docs/.vuepress/theme/utils/gachaVersion.ts");
const { parseUigf, parseUigfAsync, exportUigf } = await import(moduleUrl(
  "../../docs/.vuepress/theme/utils/gachaRecords.ts",
  [['"./gachaVersion"', JSON.stringify(versionUrl)]],
));
const row = (id) => ({ id: String(id), item_id: "10000003", time: "2026-10-02 12:00:00", gacha_type: "301", uigf_gacha_type: "301" });
const account = (list) => ({ game: "hk4e", uid: "123456789", timezone: 8, list });

test("async import reports validated input records and preserves synchronous parsing", async () => {
  const rows = Array.from({ length: 1001 }, (_, index) => row(index + 1));
  rows.push({ ...rows[0] });
  const archive = exportUigf([account(rows)]);
  const counts = [];
  const parsed = await parseUigfAsync(archive, async (count) => { counts.push(count); });
  assert.deepEqual(parsed, parseUigf(archive));
  assert.deepEqual(counts, [500, 1000, 1002]);
  assert.equal(parsed[0].list.length, 1001);
});

test("async import rejects later invalid records and can stop between validation batches", async () => {
  const rows = Array.from({ length: 1001 }, (_, index) => row(index + 1));
  const archive = exportUigf([account(rows)]);
  archive.hk4e[0].list[500].item_id = "invalid";
  const counts = [];
  await assert.rejects(parseUigfAsync(archive, async (count) => { counts.push(count); }), /Invalid record or item ID/);
  assert.deepEqual(counts, [500]);
  await assert.rejects(parseUigfAsync(archive, async () => { throw new Error("Import cancelled."); }), /Import cancelled/);
});
