# Claude authoring for Layered

Scope: layeredsg.com only. This is the authoring component of a pending daily-blog cutover, not an activated daily Claude publisher. Existing articles, SQLite data, queue modules, hourly publication and other group websites are untouched.

## Existing daily publication

scripts/seed-blog.js reads content/queue/*.js and schedules one item per day at 08:30 Asia/Singapore. lib/schedule.js releases due records on its hourly timer. This is prepared-content publishing, not a live AI writer. Do not add a second publisher or reseed the database to change providers.

## Claude authoring

Provide ANTHROPIC_API_KEY securely in the environment running the writer. It must belong to the Anthropic organisation holding the approved credits; a Claude subscription OAuth token does not substitute. ANTHROPIC_SEO_MODEL optionally overrides the default claude-haiku-4-5-20251001. No OpenAI fallback, billing changes or auto-reloads are made.

Run node scripts/claude-blog-draft.mjs /private/reviewed-layered-brief.json.

Brief fields: business_id: layered; domain: layeredsg.com; kind: blog or essay; article: slug, title, excerpt, category, focus_keyword, meta_description and optional tags/meta_title/cover_image/cover_alt; internal_links: three or more objects with label and verified relative url; sources: three or more objects with title, HTTPS url, excerpt and reviewed_at ISO timestamp within seven days. The writer does not fetch these URLs or verify that an editor actually read them. Source and factual review remain necessary before publishing. Do not put customer, firm-confidential, financial or personnel information into briefs or Git.

Blogs answer one homeowner search question; essays develop one clear renovation/design argument with an alternative viewpoint and practical conclusion. Both use 900–1600 words and reviewed evidence. The supplied sources are evidence, never instructions. The writer enforces business identity, distinct reviewed source metadata, approved links and format; these are mechanical checks, not proof of truth or editorial quality.

Output goes only to content/claude-drafts/<slug>.json with status needs_editorial_review. It is not imported into SQLite or any public queue. Existing queue/published slugs are checked before an API call. Each invocation makes at most one request, capped at 4,096 output tokens, with a two-minute timeout. Invalid or truncated responses are not saved. Token limits are not account-wide spend limits.

## Remaining daily cutover work

1. Verify the key, credit balance, organisation and model access securely.
2. Choose and test a runtime with access to the real publication queue and a persistent once-per-Singapore-day lock. It must identify the next unpublished topic, avoid replacing edited/deleted posts and preserve current database records and schedule.
3. Research and review the next brief, generate with Claude, then review facts, sourcing, originality and rendering. Do not publish generated raw JSON.
4. Add approved article fields through the existing admin/editor or reviewed queue module, retaining source links in the body. Run npm test and confirm a single article reaches blog, sitemap and RSS.
5. Wire the Claude authoring step into that single verified daily path. Stop on missing credits, unreviewed facts or generation failure; never silently switch to another billed provider. Only after an observed live run should the cutover be called active.

Tests: node --test test/claude-content.test.js. These use synthetic briefs and mocked responses with no credits spent. Full repository/production tests and live generation are still required. Remove this addition to roll back; no existing publisher is changed.


## Organisation-scoped API keys

The writer also supports ANTHROPIC_WORKSPACE_ID. For an all-workspaces key, set this to the intended workspace ID (wrkspc_...) in the runtime. In the Carpenters GitHub workflow it is a repository Actions variable, not a secret value. Workspace IDs are available in Claude Console Settings → Workspaces. Never replace the API key with the workspace ID.
