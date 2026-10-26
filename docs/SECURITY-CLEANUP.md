# Security cleanup (18 Oct 2026)

Done on this branch:
- Removed the Carpenters login password hash, personal email and phone number from `scripts/seed.js`.
  They are now read from `CARPENTERS_EMAIL`, `CARPENTERS_PHONE` and `CARPENTERS_PASSWORD_HASH` (set in the host's secret store, never in Git).
  In production the real listing is only created when `CARPENTERS_EMAIL` is set. An existing database is not changed.
- Removed the personal email default from `lib/admin.js`.

**Deploy note:** before merging, set `CARPENTERS_EMAIL` (the same address the live listing uses, so no duplicate is created) and `CARPENTERS_PHONE` on the host. If the host database resets on deploy, also set `CARPENTERS_PASSWORD_HASH` (use a NEW password hash, not the old one).

Still open (needs the owner's decision, not done here):
- The old hash and details remain in git history until it is rewritten or the repo is made private. The old password must stay retired.
- Project photos in `public/uploads/carpenters/` (project1 to project5) are shown on the live Carpenters listing. Removing them changes the live site.
