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
