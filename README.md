# DepHealth

DepHealth scans a `package.json` or a public GitHub repository and reports dependency freshness, known OSV advisories, deprecation, publish age, license, and an explainable project score.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Run the parser tests with `npm test`.

Open the local URL printed by Vite. Paste or upload only a `package.json` or npm `package-lock.json`, or enter a public GitHub repository URL. Pasted input must be raw JSON; JavaScript, markdown fences, prose, and unrelated JSON are rejected with an explanation. Lockfiles supply exact resolved versions when available; package.json version ranges are estimates. A scan queries the public npm registry and OSV.dev directly from the browser. GitHub repository scans read the root `package.json` on the default branch.

## Source structure

```text
src/
	components/          # page sections and reusable report controls
	constants/           # starter manifest and dependency filters
	hooks/               # scan session and report actions
	services/            # input parser plus npm, OSV, and GitHub scanning
	utils/                # report encoding, formatting, filtering, sorting
	App.jsx               # top-level page composition
	App.css               # application layout and component styles
	index.css             # global tokens and browser defaults
```

The scanner service currently calls public data sources directly from the browser; an API client layer can be added when the application server is introduced.

## What the report means

- Version ranges are resolved to their minimum satisfying version as an estimate. Without a lockfile, DepHealth cannot know the exact installed version.
- OSV's batch endpoint supplies matching advisory IDs. DepHealth enriches up to 40 unique advisory records per batch for severity, summary, and fixed-version details. Remaining or unavailable detail is marked unknown and makes the score partial.
- Package publish dates, latest versions, deprecation notices, and licenses come from npm package metadata.
- Stale means no package release for 12 months; abandoned means 24 months. Repository archival and commit activity are not checked in this MVP.
- Share links contain the report data in the URL fragment. They are suitable for small reports; larger reports can be exported as JSON.
- Reports are not stored by a service. Scans and report data remain in the current browser unless a share link or JSON export is used.

## Score formula

Every scan starts at 100 and the result is floored at zero. Deductions are additive:

| Signal | Deduction |
| --- | ---: |
| Critical vulnerability | 15 each, capped at 40 |
| High vulnerability | 8 each, capped at 25 |
| Moderate vulnerability | 3 each |
| Low vulnerability | 1 each |
| Deprecated package | 5 each |
| Abandoned package | 4 each |
| Major update available | 2 each |
| GPL or AGPL license | 3 each |

Unknown advisory severity and failed package lookups do not count as clean or as a deduction. The report calls out those checks and labels the score partial.

## Current scope

This repository is the client-side MVP. It includes manifest and public GitHub input, npm and OSV checks, scoring, filtering and sorting, JSON export, and compact share links. It does not yet include the Express API, MongoDB persistence, Redis/BullMQ workers, lockfile parsing, user accounts, scheduled rescans, notifications, score history, a CLI, or a hosted SVG badge.

Those server-side features need credentials, storage, and deployment configuration; they should be added as separate services before treating this browser-only implementation as a scheduled or multi-user product.