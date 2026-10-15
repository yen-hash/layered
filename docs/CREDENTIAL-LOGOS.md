# HDB and CaseTrust logos on verified badges

The site can show the official HDB and CaseTrust logos on a firm's **verified** credential badge (cards and profile page). A badge that is only self-declared stays text-only, because a logo would imply the credential has been checked.

## How to add them

Put the logo files in `public/images/credentials/` with these names (SVG preferred, PNG or WebP also work, about 16 px tall is enough):

| File name | Used for |
|---|---|
| `hdb.svg` | HDB licensed badge |
| `casetrust.svg` | CaseTrust badge (also the fallback for the variants below) |
| `casetrust-rcma.svg` | CaseTrust-RCMA (optional) |
| `casetrust-gold.svg` | CaseTrust Gold (optional) |

No code change is needed: commit the files and deploy. With no file present, the plain text badge is shown.

## Permission

These are trademarks of HDB and CASE. Before publishing them on Layered, get written permission or confirm the agency's brand-use terms for third-party directories, and use the artwork exactly as supplied (no recolouring or resizing that distorts it). Accredited firms receive their own logo files from CASE, which is not the same as permission for Layered to use them. Until permission is confirmed, leave the folder empty: the site works fine with text badges.
