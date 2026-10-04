# Layered SEO plan: renovation & interior design in Singapore

Last reviewed: 4 Oct 2026. Re-run `node scripts/seo-check.js <base-url>` after any content or template change.

## Summary

Before this work the site had almost no search foundations: no meta descriptions, canonicals, Open Graph tags, structured
data, `robots.txt` or sitemap; private pages were indexable; project photos were CSS backgrounds with no alt text; the
directory page had no `<h1>`; there was no compression or caching; and no page targeted a Singapore renovation keyword.

The site now has a crawlable architecture built around how Singapore homeowners search (property type, cost, rules,
credentials), unique landing and guide content, structured data, and a technical layer that passes the in-repo checker.

**Not yet possible from here:** keyword volume/difficulty and backlink data (no SEO-tool connector was reachable), search
console data, real-user Core Web Vitals, and rankings. Volume labels below are *judgement from the search results*, not
measured numbers. Connect Ahrefs/Semrush/Search Console and replace them.

## Site architecture (what is indexable)

| URL | Targets | Notes |
|---|---|---|
| `/` | interior designer Singapore, renovation Singapore | Org + WebSite schema; links to every hub |
| `/designers` | browse/compare interior designers Singapore | Filter combos are `noindex,follow`; a single known filter canonicalises to its landing page |
| `/interior-designers/hdb` · `condo` · `landed` · `commercial` | HDB / condo / landed / commercial interior designer Singapore | Unique copy, cost snapshot, FAQ (FAQPage schema), live firm list (ItemList schema), pre-selected lead form |
| `/interior-designers/style/{minimalist,scandinavian,industrial,modern,contemporary,classic}` | style + interior designer Singapore | Unique copy per style |
| `/tools/renovation-cost-calculator` | renovation cost calculator singapore, hdb renovation cost calculator | Free interactive tool + all ranges as static tables, FAQ and WebApplication schema |
| `/guides` + 5 guides | cost, permit/rules, MCST, choosing a designer, CaseTrust/HDB licence | Article + FAQ + Breadcrumb schema, "last reviewed" dates |
| `/designers/{slug}` | `<firm> interior designer Singapore` | HomeAndConstructionBusiness + Breadcrumb schema, descriptive image alt text |
| `/signup` | list interior design business Singapore | Supply-side landing page, indexable |
| `/login`, `/dashboard/*`, `/logout`, `/leads` | none | `noindex` via meta and `X-Robots-Tag`; dashboard/logout/leads also disallowed in robots.txt |

## Keyword map

Intent: **C** commercial investigation, **T** transactional, **I** informational. Demand/competition are qualitative.

| Keyword | Intent | Demand | Competition | Page that targets it |
|---|---|---|---|---|
| interior designer singapore | C/T | high | hard | `/`, `/designers` |
| renovation contractor singapore | C/T | high | hard | `/`, `/designers` |
| hdb interior designer / hdb renovation | C/T | high | hard | `/interior-designers/hdb` |
| condo interior designer / condo renovation singapore | C/T | high | hard | `/interior-designers/condo` |
| landed house renovation singapore | C | medium | moderate | `/interior-designers/landed` |
| commercial / office / retail / f&b fit-out singapore | C/T | medium | moderate | `/interior-designers/commercial` |
| hdb renovation cost (4-room, 5-room, BTO, resale) | I | high | hard | `/guides/hdb-renovation-cost-singapore` |
| hdb renovation permit / rules / hacking wall | I | high | moderate | `/guides/hdb-renovation-permit-and-rules` |
| condo renovation cost / MCST rules / deposit | I | medium | moderate | `/guides/condo-renovation-cost-and-rules` |
| how to choose an interior designer singapore | I | medium | moderate | `/guides/how-to-choose-an-interior-designer-singapore` |
| casetrust renovation / casetrust gold / hdb licensed contractor | I | medium | easy-moderate | `/guides/casetrust-and-hdb-licence-explained` |
| minimalist / scandinavian / industrial interior design singapore | C | medium | moderate | style landing pages |
| list/advertise interior design business singapore | T (supply) | low | easy | `/signup` |

Competitive set (from search results, not a backlink audit): Qanvast (matching + guarantee, large content library),
Renonation (editorial/inspiration), RenoTalk (forum), Hometrust, plus individual firm sites. The wedge for Layered is
**credential-aware** discovery (HDB licence + CaseTrust tier, clearly labelled self-declared) and plain-English cost/rule
guides, which most comparison sites bury.

## On-page checklist (all pass `scripts/seo-check.js`)

- Unique `<title>` (≤ ~60 chars, keyword first) and meta description (120-160 chars) on every indexable page
- Exactly one `<h1>`; logical `h2/h3` (project cards moved from `h4` to `h3`)
- Canonical on every page, absolute, from `SITE_URL`
- `lang="en-SG"`, `og:locale en_SG`, Open Graph + Twitter cards, 1200×630 share image
- Image `alt` on every `<img>` (descriptive for portfolio photos, empty for decorative), `width/height` set, `loading="lazy"` below the fold, `fetchpriority="high"` on the hero
- Form labels are associated with inputs (`for`/`id`)
- Internal linking: header + footer sitewide, breadcrumbs, related-guide blocks, cross-links between property/style/guide pages

## Technical checklist

| Check | Status | Detail |
|---|---|---|
| robots.txt | Pass | Allows crawl, blocks dashboard/logout/leads, lists sitemap |
| XML sitemap | Pass | Dynamic: home, hubs, landing pages, guides, every firm profile |
| Canonicals / duplicates | Pass | Trailing-slash 301s; filtered directory URLs canonicalised or `noindex,follow` |
| Private pages | Pass | `noindex` meta + `X-Robots-Tag`, `Cache-Control: private, no-store` |
| 404 / 500 | Pass | Real status codes, `noindex`, no error-message leakage |
| Structured data | Pass | Organization, WebSite, Breadcrumb, Article, FAQPage, ItemList, HomeAndConstructionBusiness; all JSON-LD parses |
| Compression | Pass | gzip for HTML/XML/CSS/SVG (home page 13 KB → 3.3 KB) |
| Caching | Pass | ETag + 304; images 7 days, CSS 1 hour |
| HEAD requests | Pass | Answered like GET without a body |
| Mobile | Pass | No horizontal scroll at 390 px on any checked page |
| Core Web Vitals | Warning | Not measured (needs real-user/Lighthouse data). Known risks below |
| HTTPS | Not testable | Set `SITE_URL=https://…` and serve over TLS in production |

Known performance risks: portfolio images up to ~370 KB (`ironline1.jpg`) with no responsive `srcset`/WebP; no CDN. Convert
to WebP/AVIF with 2-3 widths and serve through a CDN once real photography is in.

## Decisions worth knowing about

- **Credentials are not put in structured data.** HDB licence and CaseTrust are self-declared and unverified; asserting
  them to search engines would amplify unverified claims. They are shown on the page, labelled, with links to the official lookups.
- **No fabricated reviews or ratings.** No `aggregateRating`/`Review` schema until real, verifiable reviews exist.
- **Cost figures** are the ranges quoted by Singapore renovation guides in 2026, labelled indicative, with a "last reviewed"
  date. HDB/condo rules are summarised conservatively and point to HDB for current detail. Re-verify every few months.
- FAQ rich results are now shown by Google mainly for government/health sites; the markup is kept because it is valid, harmless
  and used by other engines and AI answer systems.

## Action plan

**Do now (under 2 hours)**
1. Set `SITE_URL` (e.g. `https://www.yourdomain.sg`) in production. Canonicals, sitemap and schema depend on it.
2. Verify the site in Google Search Console and Bing Webmaster Tools; submit `/sitemap.xml`.
3. **Do not launch with the seeded sample firms.** They are fictional; real, complete firm profiles are what make the
   landing pages rank and keep them honest. Remove or replace `scripts/seed.js` data before going live.
4. Replace stock photography with real project photos (the most valuable content on the site).
5. Run `node scripts/seo-check.js https://your-domain` before every release.

**This quarter**
1. Onboard firms and require complete profiles (bio ≥ 60 words, ≥ 3 projects with titles, service areas). Thin profiles
   should stay `noindex` until complete; add that rule once there are enough firms.
2. Add review collection with verification, then `Review`/`AggregateRating` schema.
3. Publish more guides on the next-tier queries: BTO renovation timeline, 3-room/executive flat costs, kitchen and
   bathroom renovation cost, renovation loans, renovation package vs custom, Japandi/other style guides, landed A&A.
   Source and date every figure.
4. Estate/neighbourhood pages (e.g. "interior designer in Punggol/Tampines") once enough firms and projects exist; only
   publish where there is real, unique inventory.
5. Backlinks: partner content with CaseTrust-accredited firms, property-agent/mortgage blogs, Singapore press, local business
   directories; publish an annual cost survey as linkable data.
6. Measure: Search Console (queries, indexing), Lighthouse/PageSpeed field data, lead conversion by landing page.


---

## Competitive strategy: Qanvast and Hometrust

*Assumption: "Canvas" means Qanvast. Everything about the competitors below is what they say about themselves on their own sites in October 2026; no competitor SEO or backlink data was available.*

| | Qanvast | Hometrust | Layered today |
|---|---|---|---|
| Model | Free matched shortlist of 3-5 vetted firms | Review platform plus personalised shortlist | Directory + guides + matching |
| Trust signals | Vetting, verified reviews, SuperTrust badge, deposit guarantee up to S$50,000 | Thousands of homeowner reviews | Self-declared HDB licence + CaseTrust tier, links to official lookups |
| Scale | ~95,000 homeowners served (their figure) | ~2,500 firms, ~8,600 reviews (their figure) | Demo data only |
| Content | Large editorial library | Forum + reviews | 6 guides, checklist, 6 articles |

**Be honest about the gap.** Layered has no reviews, no vetting and no guarantee yet, and the site says so (the comparison
article states it plainly). Claiming otherwise would be both untrue and a trust-killer. We win by being *clearer and more
useful*, then close the trust gap with product, not copy.

### Where we can win now
1. **Credential transparency.** The only directory that lets homeowners filter by HDB licence and CaseTrust tier (CaseTrust,
   RCMA, Gold) and links straight to the official checkers.
2. **Free tools and guides that rank.** The interactive renovation checklist, cost guides and the comparison article target
   high-intent queries competitors cover only in blog form.
3. **Alternative / comparison queries.** `qanvast vs hometrust`, `qanvast alternative`, `hometrust alternative`,
   `best renovation platform singapore` (article: `/blog/qanvast-vs-hometrust-vs-layered`). Keep the tone factual; update
   the figures from their sites each quarter.
4. **Content velocity.** The admin editor's SEO scorecard makes it cheap to publish consistently (target 1-2 articles a week).
5. **Speed and cleanliness.** Server-rendered pages, gzip, system fonts, no third-party scripts.

### Product roadmap to close the trust gap (in priority order)
1. ~~Verified credentials~~ **Built.** Admins check HDB/CaseTrust lookups at `/dashboard/verification`; a tick and date appear on the profile and a "Checked by Layered" directory filter. Editing the number voids the mark; marks expire after 365 days.
2. **Verified reviews:** invite homeowners from the lead record after completion; only reviews tied to a real lead are shown; add `Review` schema only then.
3. **Deposit protection:** partner for a guarantee, or badge firms with CaseTrust deposit protection as "Protected deposit".
4. ~~**Cost estimator**~~ **Built:** `/tools/renovation-cost-calculator` (HDB, condo, kitchen and bathrooms, office). Pre-fills the lead form with property type and budget band. Ranges live in `content/estimator.js`, tests in `test/`. Next: measure how many calculator visits become leads, and consider an emailed estimate.
5. **Shortlist and compare view:** side-by-side firms with credentials, styles, projects.
6. **Firm-submitted articles** (review queue) for fresh content and backlinks.

### Keyword queue for the blog (verify volumes in an SEO tool before writing)
Published so far (19): the original six, batch 2 (seven) and batch 3 (six, below). Remaining queue is open.

| Status | Working title | Focus keyword | Category |
|---|---|---|---|
| Published | 4-room vs 5-room HDB renovation cost | 4 room hdb renovation cost | Costs & Budgeting |
| Published | How to check an HDB licensed contractor | hdb licensed contractor | Rules & Permits |
| Published | Renovation contract: 9 clauses to check | renovation contract singapore | Choosing a Designer |
| Published | Condo renovation approval step by step | condo renovation approval | Rules & Permits |
| Published | Resale HDB hidden costs | resale hdb renovation cost | Costs & Budgeting |
| Published | Defects liability period explained | defects liability period singapore | Rules & Permits |
| Published | Scandinavian vs Japandi vs minimalist | scandinavian interior design hdb | Design Ideas |
| Published | 3-room HDB renovation cost | 3 room hdb renovation cost | Costs & Budgeting |
| Published | Landed house renovation: approvals and A&A | landed house renovation singapore | Rules & Permits |
| Published | Office renovation cost (fit-out per sq ft) | office renovation cost singapore | Costs & Budgeting |
| Published | Renovation loan: how it works (no bank rates) | renovation loan singapore | Costs & Budgeting |
| Published | Small HDB storage ideas | small hdb storage ideas | Design Ideas |
| Published | 10 renovation mistakes and how to avoid them | renovation mistakes singapore | Choosing a Designer |
| Next | Laminate vs veneer vs solid wood for built-ins | laminate vs veneer carpentry singapore | Design Ideas |
| Next | Flooring for HDB: vinyl vs tiles vs timber | hdb flooring options | Design Ideas |
| Next | How to read a renovation quotation | renovation quotation singapore | Choosing a Designer |
| Next | HDB vs condo renovation cost | hdb vs condo renovation cost | Costs & Budgeting |
| Next | Qanvast alternative (keep factual, cite their own site) | qanvast alternative | Choosing a Designer |
| Next | Condo renovation timeline | condo renovation timeline singapore | Rules & Permits |

**Editorial QA lesson:** the SEO scorecard checks structure, not meaning. After a batch is written, read the rendered pages and
list each article's headings; one batch had two sections attached to the wrong article by a scripted edit, which only a
read-through caught. `docs/SEO.md` keeps this note so the next batch repeats the check.

**Publishing standard:** every article should score 14/14 in the editor's SEO scorecard (all 19 launch articles do), carry at least two internal links, cite its figures as indicative ranges, and have a unique cover image
with truthful alt text. Re-verify costs and rules each quarter and bump `updated_at` in the editor.

## Blog system

- Public: `/blog`, `/blog/category/*`, `/blog/<slug>`, `/blog/rss.xml`. Posts are `BlogPosting` + Breadcrumb schema, in the
  sitemap with real `lastmod`, with related posts and internal CTAs.
- Authoring: `/dashboard/blog` for admin accounts (set `ADMIN_EMAILS`). Markdown editor with a live **SEO scorecard**
  (title and description length, keyword in title/description/first 100 words/H2, keyword use, word count, H2 count, internal
  links, cover alt, FAQ section). Drafts are hidden from visitors and previewable by admins (`noindex`).
- Safety: raw HTML is escaped, link and image URLs are restricted to http(s), mailto and site-relative paths.
