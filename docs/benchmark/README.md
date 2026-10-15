# Competitor benchmark

`scripts/benchmark.mjs` compares Layered with HomeTrust and Qanvast using only public signals: sitemaps, on-page SEO tags, structured data, page weight and response time. Run it with `node scripts/benchmark.mjs`; it writes `latest.md`, a dated JSON file and `history.csv` here.

What it does not measure: traffic, search rankings, backlinks or domain authority. Those need a paid SEO tool (Ahrefs, Similarweb or Semrush).

Be careful reading the scores: the on-page checks are Layered's own checklist, and competitor pages that build their tags with JavaScript can fail a check they would pass in a browser. Use the trend over weeks, not one day's number. The crawl is polite (identified user agent, robots.txt respected, one request per second, about 14 pages per site).
