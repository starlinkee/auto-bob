# Current state

Status as of 2026-09-29. Update this file when the app or the pipeline changes.

## The app

A minimal Node 22 web app with no runtime dependencies. `npm start` runs
`node src/server.js` on `$PORT` (default 3000).

| Route | What it serves |
|-------|----------------|
| `/` | Home: `<h1 id="greeting">Hello, world!</h1>` |
| `/about` | About page (`#about-title`, `#about-text`), added by AUTO-1 (PR #1) |
| `/health` | GET only, JSON `{status, uptimeSeconds, version}`; other methods return 405 |
| `/static/*` | `.css` and `.js` files from `src/static/`, path traversal is rejected with 404 |
| anything else | styled 404 page (`#not-found`) |

Source: `src/server.js` (routing), `src/site.js` (pages map and static files),
`src/layout.js` (page shell and nav: Home, About), `src/health.js`,
`src/about-page.js`, `src/static/styles.css`.

Tests: Playwright, `npm run test:ai`, 13 tests (`health` 6, `hello` 1, `layout` 3,
`about` 3). Each run starts its own server on a port derived from the working
directory.

## The pipeline

Copied from the `new-agent` project on 2026-09-29 (no shared git history) and
retargeted to this repo. See `docs/agents.md` for how tickets are written and
`docs/WSL_SETUP.md` for how to run it.

- **Repo:** `starlinkee/auto-bob` (public). `master` requires the `jury-review`
  status. Labels `needs-expert-review` and `needs-human` exist. Secrets:
  `CLAUDE_CODE_OAUTH_TOKEN`, `LINEAR_API_KEY`.
- **Linear:** team `AUTO`, project "auto-bob" (the URL is in `.contrabass/WORKFLOW.md`).
  Branches are `symphony/auto-<N>`.
- **Workers:** Contrabass 0.5.1 with local patches, Sonnet 5.5, up to 5 in
  parallel (`max_concurrency`), stall timeout 10 minutes, agent timeout 30 minutes.
- **Gates (GitHub Actions, Opus):** AI jury on every PR (tests on the PR merged with
  master, then a review against the ticket), Merge Doctor for rejections and
  conflicts, master tests after every merge.
- **Reconciler** (`scripts/linear_sync.py`): keeps Linear in step with GitHub,
  merges approved PRs, promotes unblocked tickets, parks stuck ones as `needs-human`.
- **Where it runs:** WSL distro `auto-bob` on the same Windows PC as the older project
  (distro `Ubuntu`). tmux sessions `cb` (Contrabass), `linearsync`, `app`.
  Contrabass listens on 8081, the app runner on 3001.

## Tickets so far

| Ticket | State | What |
|--------|-------|------|
| AUTO-1 | Done | About page, PR #1, the pipeline smoke test |
| AUTO-2 | Backlog | Follow-up: the jury's non-blocking remark on PR #1 (`tests/about.spec.js` finds the Home link with a substring match; use an exact role match). Starts only if moved to Todo |

## Smoke test result (AUTO-1)

The whole path worked: ticket, worker, PR, jury tests, Opus review (APPROVED), auto-merge,
Linear Done, follow-up ticket. Two things went wrong on the way:

1. The worker's `claude` waited on a one-time prompt ("Try the new fullscreen
   renderer?") and stalled for 10 minutes. Fixed by answering it once; now a mandatory
   step in the quick start.
2. The reconciler started a second jury run about a minute after the first (see
   "Known behavior" in `docs/WSL_SETUP.md`). Harmless; one extra Opus review.

## Not done yet

- No product features beyond the smoke test. The first real feature is still to be planned.
- Fix for the duplicate jury run (measure the head's age from the PR's creation time,
  re-read the comments before dispatching). Also present in `new-agent`.
- Planned, not built: more roles around the workers (QA writing acceptance tests
  before the code, an architect with contracts, a DevOps bootstrap), and a shared
  kit repo so pipeline fixes reach both projects.
