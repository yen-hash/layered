import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { generateSeoDraft, DEFAULT_SEO_MODEL } from "../scripts/claude-content-client.mjs";

const result = (extra = {}) => ({
  content: [{ type: "text", text: " draft " }],
  stop_reason: "end_turn",
  usage: { input_tokens: 100, output_tokens: 200 },
  ...extra,
});
const params = { apiKey: "test-only", system: "editorial rules", prompt: "article" };

test("uses Claude authentication, separate system prompt and bounded output", async () => {
  const draft = await generateSeoDraft({ ...params, fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.anthropic.com/v1/messages");
    assert.equal(options.headers["x-api-key"], "test-only");
    assert.equal(options.headers["anthropic-version"], "2023-06-01");
    const body = JSON.parse(options.body);
    assert.equal(body.model, DEFAULT_SEO_MODEL);
    assert.equal(body.system, params.system);
    assert.deepEqual(body.messages, [{ role: "user", content: "article" }]);
    assert.equal(body.max_tokens, 4096);
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(result());
  } });
  assert.deepEqual(draft, { text: "draft", truncated: false, inputTokens: 100, outputTokens: 200 });
});

test("supports explicit model and extracts only text blocks", async () => {
  const draft = await generateSeoDraft({ ...params, model: "configured-model", fetchImpl: async (_, options) => {
    assert.equal(JSON.parse(options.body).model, "configured-model");
    return Response.json(result({ content: [{ type: "thinking", thinking: "hidden" }, { type: "text", text: "a" }, { type: "text", text: "b" }] }));
  } });
  assert.equal(draft.text, "a\nb");
});

test("missing key never sends a request", async () => {
  await assert.rejects(generateSeoDraft({ ...params, apiKey: " ", fetchImpl: () => { assert.fail("network called"); } }), /not configured/);
});

test("HTTP errors and network errors do not reveal response bodies or secrets", async () => {
  for (const status of [401, 402, 429, 500]) {
    await assert.rejects(generateSeoDraft({ ...params, fetchImpl: async () => new Response("SECRET-RESPONSE", { status }) }), (error) => {
      assert.match(error.message, new RegExp(`HTTP ${status}`));
      assert.doesNotMatch(error.message, /SECRET-RESPONSE|test-only/);
      return true;
    });
  }
  await assert.rejects(generateSeoDraft({ ...params, fetchImpl: async () => { throw new Error("SECRET-NETWORK"); } }), (error) => !error.message.includes("SECRET-NETWORK"));
});

test("rejects malformed JSON and unexpected response shapes", async () => {
  for (const response of [new Response("not json"), Response.json({}), Response.json(result({ stop_reason: "refusal" }))]) {
    await assert.rejects(generateSeoDraft({ ...params, fetchImpl: async () => response }));
  }
});

test("flags incomplete output", async () => {
  const draft = await generateSeoDraft({ ...params, fetchImpl: async () => Response.json(result({ stop_reason: "max_tokens" })) });
  assert.equal(draft.truncated, true);
});


import { validateBrief, writeDraft } from "../scripts/claude-blog-draft.mjs";
const now = new Date("2026-10-15T08:00:00Z");
const profile = {"business_id":"layered","domain":"layeredsg.com","categories":["Costs & Budgeting","Rules & Permits","Choosing a Designer","Design Ideas","Landed Homes","Trades & Moving In"],"instructions":"Write for Layered, an independent Singapore homeowner interior-designer matching platform. Stay neutral when comparing firms. Do not claim verification of firms, prices, licensing or completed projects without reviewed evidence."};
function brief() {
  return {
    business_id: profile.business_id, domain: profile.domain, kind: "blog",
    article: { slug: "synthetic-article", title: "Synthetic article", excerpt: "Synthetic test", focus_keyword: "planning", category: profile.categories[0], meta_description: "Synthetic metadata only." },
    internal_links: ["/one", "/two", "/three"].map(url => ({url, label: "Internal page"})),
    sources: [1,2,3].map(n => ({url: "https://example.org/source-" + n, title: "Synthetic source", reviewed_at: now.toISOString(), excerpt: "Synthetic source excerpt, not real research."})),
  };
}
const body = Array.from({length: 5}, (_,i) => "## Planning section " + i + "\n\n" + "Useful practical planning detail with an example and a clear next step. ".repeat(18)).join("\n\n") +
  "\n[One](/one) [Two](/two) [Three](/three) [Source one](https://example.org/source-1) [Source two](https://example.org/source-2)";
async function root(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "claude-content-test-"));
  t.after(() => fs.rm(dir, {recursive: true, force: true}));
  return dir;
}
const generated = async () => ({text: body, truncated: false, inputTokens: 10, outputTokens: 20});

test("rejects cross-business briefs and stale or missing research before spending", () => {
  for (const change of [
    b => b.business_id = "another-business",
    b => b.domain = "another.example",
    b => b.sources = [],
    b => b.sources[0].reviewed_at = "2020-01-01",
    b => b.article.slug = "../escape",
    b => b.internal_links[0].url = "//another.example",
  ]) {
    const b = brief(); change(b);
    assert.throws(() => validateBrief(b, now));
  }
});

test("saves only a review draft, including essay format and provider provenance", async (t) => {
  const dir = await root(t);
  const b = brief(); b.kind = "essay";
  const file = await writeDraft(b, {root: dir, now, generate: generated});
  const saved = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(saved.domain, profile.domain);
  assert.equal(saved.kind, "essay");
  assert.equal(saved.provider, "anthropic");
  assert.equal(saved.status, "needs_editorial_review");
  assert.equal(saved.article.body, body);
  assert.deepEqual(await fs.readdir(path.join(dir, "content")), ["claude-drafts"]);
  await assert.rejects(writeDraft(b, {root: dir, now, generate: () => { assert.fail("duplicate spent credits"); }}), /already exists/);
});

test("rejects failed, truncated or unreviewed-link drafts without writing output", async (t) => {
  const dir = await root(t);
  const cases = [
    async () => { throw new Error("simulated HTTP failure"); },
    async () => ({text: body, truncated: true}),
    async () => ({text: body + "\n[Unknown](https://unknown.example)", truncated: false}),
    async () => ({text: "too short", truncated: false}),
  ];
  for (const generate of cases) {
    await assert.rejects(writeDraft(brief(), {root: dir, now, generate}));
    await assert.rejects(fs.access(path.join(dir, "content/claude-drafts")));
  }
});

test("existing published/queued Markdown is not overwritten or sent to Claude", async (t) => {
  const dir = await root(t);
  await fs.mkdir(path.join(dir, "content/blog"), {recursive:true});
  await fs.writeFile(path.join(dir, "content/blog/synthetic-article.md"), "Existing content");
  await assert.rejects(writeDraft(brief(), {root:dir, now, generate:() => { assert.fail("API called"); }}), /already exists/);
  assert.equal(await fs.readFile(path.join(dir, "content/blog/synthetic-article.md"), "utf8"), "Existing content");
});


test("sends an explicit workspace for an organisation-scoped key", async () => {
  await generateSeoDraft({ ...params, workspaceId: "wrkspc_synthetic_test", fetchImpl: async (_, options) => {
    assert.equal(options.headers["anthropic-workspace-id"], "wrkspc_synthetic_test");
    return Response.json(result());
  } });
});
