# Contrabass + WSL setup

Status as of 2026-09-29. Explains where the pipeline runs, how to set it up
from scratch, the fixes that were needed, and how to inspect a running instance.
Verified on a fresh WSL distro with the AUTO-1 smoke test (ticket to merged PR);
see `docs/STATE.md` for what exists today.

## Quick start on a fresh WSL (5 steps)

1. Create WSL: `wsl --install -d Ubuntu-24.04 --name auto-bob` (PowerShell), then
   open it with `wsl -d auto-bob --cd ~` (a plain `wsl -d ...` starts in the
   Windows folder you are in, under `/mnt/c`). Running a second project next to
   another one: see "Two projects on one PC".
2. Clone the repo and run the bootstrap (installs tmux, node 22, gh, claude, omc,
   contrabass, git identity):
   ```bash
   git clone https://github.com/starlinkee/auto-bob ~/auto-bob
   bash ~/auto-bob/docs/wsl-bootstrap.sh
   ```
   Tested on a fresh Ubuntu 24.04 distro (exit 0; the Contrabass build downloads
   Go 1.26, so it takes a few minutes). It uses `sudo` throughout, so it needs your password,
   or a temporary `NOPASSWD` rule that you remove afterwards. It installs Contrabass v0.5.1
   with this repo's patches via `scripts/contrabass/install.sh` (see
   `scripts/contrabass/README.md`); rerun that script after any Contrabass upgrade.
3. Interactive logins and secrets (cannot be scripted):
   ```bash
   gh auth login
   claude                      # complete the login, then exit
   claude setup-token          # prints a token for the GitHub Actions gates
   gh secret set CLAUDE_CODE_OAUTH_TOKEN -R <owner>/<repo>   # paste it at the prompt
   gh secret set LINEAR_API_KEY -R <owner>/<repo>            # the jury and doctor read the ticket
   echo 'export LINEAR_API_KEY="lin_api_..."' >> ~/.bashrc
   echo 'export PATH="$PATH:$HOME/.local/bin:$HOME/go/bin"' >> ~/.bashrc
   source ~/.bashrc
   ```
4. **Pre-answer Claude Code's one-time prompts. Mandatory before the first ticket.**
   Worker panes run headless, so a prompt nobody answers stalls the run: the
   first AUTO-1 attempt sat 10 minutes with no events, was stopped by
   `stall_timeout_ms`, and the retry ended in 8 seconds as
   `success_unverified_branch_unchanged`. Trust the folders and answer the
   remaining prompts once (details in "Claude Code asks interactive questions"):
   ```bash
   python3 - <<'EOF'
   import json, os
   p = os.path.expanduser('~/.claude.json'); d = json.load(open(p))
   for k in ['~/auto-bob', '~/auto-bob/workspaces']:
       d.setdefault('projects', {}).setdefault(os.path.expanduser(k), {})['hasTrustDialogAccepted'] = True
   json.dump(d, open(p, 'w'), indent=2)
   EOF
   mkdir -p ~/auto-bob/workspaces/_prompts
   tmux new-session -d -s prompts -x 200 -y 50 -c ~/auto-bob/workspaces/_prompts \n     "env -u TMUX -u TMUX_PANE claude --dangerously-skip-permissions --model sonnet; sleep 300"
   sleep 15; tmux capture-pane -p -t prompts        # shows the question, e.g. "Try the new fullscreen renderer?"
   tmux send-keys -t prompts 2 Enter                # answer it (2 = Not now); repeat until you see the input box
   tmux send-keys -t prompts "/exit" Enter; rm -rf ~/auto-bob/workspaces/_prompts
   ```
5. Start it with `cb start` (see "Shortcut: the `cb` command"), or manually (see
   "Start / restart"):
   ```bash
   cd ~/auto-bob
   tmux new -s cb "env -u TMUX -u TMUX_PANE contrabass --config .contrabass/WORKFLOW.md --port 8081"
   ```

Then put a ticket in Todo in the Linear project "auto-bob" (team `AUTO`), for
example with `/plan-feature`.

## Architecture

- Contrabass runs inside **WSL Ubuntu**, not on Windows, from `~/auto-bob`
  (WSL home). This is a separate clone from
  `C:\Users\shiva\Desktop\auto-bob`, and each has its own
  `.contrabass/state/` and `workspaces/`.
- tmux session `cb` holds the TUI. In `goroutine` worker mode the agents run
  as `omc` teams, which create their own tmux sessions (`omc-team-...`).
- Agent runner is `omc` (`agent.type: omc`, `omc.team_spec: "1:claude"`).
  Each ticket runs `omc team 1:claude "<task>"` in an isolated workspace.
- Tracker: Linear, project "auto-bob" (team `AUTO`, tickets `AUTO-<N>`). Model: `claude-sonnet-5-5` (workers);
  the GitHub Actions gates (jury, Merge Doctor) use Opus.
- Repo: `https://github.com/starlinkee/auto-bob`.

## Required config in `.contrabass/WORKFLOW.md`

```yaml
omc:
  binary_path: omc
  team_spec: "1:claude"
  startup_timeout_ms: 180000   # REQUIRED, default 15 s kills the start
team:
  worker_mode: goroutine       # REQUIRED, see below
```

**Why `worker_mode: goroutine`:** Contrabass 0.5.1 defaults to
`worker_mode: tmux`. In that mode it starts a pane running a bare `omc team`
with no spec and no task, so `omc` only prints its usage and the run ends in
about 3 seconds with `success_unverified_branch_unchanged`. With `goroutine`
it uses the OMC runner, which calls `omc team 1:claude "<task>"`.

**Why `startup_timeout_ms: 180000`:** Contrabass kills `omc team` after 15 s
by default, but starting a Claude worker takes longer. The run then fails
with `signal: killed` and is retried in a loop, opening and closing
`omc-team-*` sessions.

**Role keys in `.claude/omc.jsonc`** must be valid omc roles (orchestrator,
planner, analyst, architect, executor, debugger, critic, code-reviewer,
security-reviewer, test-engineer, designer, writer, code-simplifier, explore,
document-specialist). `lead`/`qa` are rejected with
`team.roleRouting: unknown role`. The file must be **committed**, because
agent workspaces are git worktrees and do not see uncommitted changes.

## Requirements in WSL

| Item | Notes |
|------|-------|
| tmux, git, node 22, npm | plain apt / NodeSource |
| `omc` | npm package `oh-my-claude-sisyphus` (5.5.0 verified) |
| `claude` | Claude Code CLI, installed to `~/.local/bin`. Log in once |
| `gh` | `gh auth login`, needed for the merge phase and PRs |
| `contrabass` | in `~/go/bin` (v0.5.1) |
| `LINEAR_API_KEY` | see the gotcha below |

`omc` launches every `claude` worker with `--dangerously-skip-permissions`,
so no permission prompts appear. If `ANTHROPIC_API_KEY` is set it also adds
`--bare`, which skips the interactive login.

## Linear state reconciler (`scripts/linear_sync.py`)

Contrabass hardcodes "finished run" to Linear `Done`, and also marks every running
ticket `Done` when it shuts down, so tickets became Done with an unmerged or
missing PR. `cb start` therefore also starts `scripts/linear_sync.py` (tmux
session `linearsync`, every 60 s). GitHub is the source of truth:

| GitHub | Linear / action |
|--------|--------|
| PR merged | Done |
| PR open | In Review (state created on demand, type `completed`) |
| jury APPROVED this exact head, mergeable, no doctor pending | squash-merge that commit, Done |
| jury REJECTED or conflicts | label `needs-expert-review` -> Merge Doctor, max 3, then Backlog |
| no verdict for the head | start the jury again (`workflow_dispatch`), max 3 per head, then Backlog |
| PR labeled `needs-human` | Backlog (parked for a person) |
| no PR 10 min after Done | Todo (redo), max 2 times, then Backlog |
| a blocker's PR not merged | Backlog; Todo once all blockers are merged |
| `master-tests.yml` red | auto-merge + doctor paused, one "Fix failing tests on master" ticket |

The full rule set is in the docstring of `scripts/linear_sync.py`; the ticket-side
view is in `docs/agents.md`. Only the reconciler's own tickets (the project in
`.contrabass/WORKFLOW.md`) are touched. After changing the script, restart only it
with `cb sync-restart` (safe while agents run).

The state type must be `completed`: Contrabass maps Linear types to its own
states, and `started` would be re-run as an orphan. `cb sync-log` shows what it did.

## Gotchas

- **One worker per ticket** (`omc.team_spec: "1:claude"`). With `2:claude` both
  workers were given the same task in the same workspace, overwrote each other's
  files and fought over the test-server port.
- **Playwright libraries without sudo:** download the debs and extract them:
  `apt-get download libnss3 libnspr4 libasound2t64` (or `libasound2`), then
  `dpkg -x <deb> ~/.local/playwright-libs`. `playwright.config.js` passes that path
  to the browser explicitly, because `LD_LIBRARY_PATH` did not reliably reach it.
- **Network:** Linear (503, timeouts) and GitHub (`dial tcp ... i/o timeout`)
  calls fail intermittently from WSL. Not confirmed, but the Windows host runs a
  VPN/WARP client, which commonly breaks WSL NAT. `linear_sync.py` and Contrabass
  both retry on the next round.

- **Stopping or restarting Contrabass while agents run destroys their work.**
  Shutdown deletes the agents' workspaces, so unpushed code is lost, and Linear
  may still show the ticket as Done. This happened repeatedly in the project this pipeline was copied from. `cb` now
  refuses unless you pass `--force`. Check `cb status` first.
- **Playwright needs system libraries in WSL** (`libnss3`, `libnspr4`,
  `libasound2`, ...). Without them Chromium exits with code 127 and every
  browser test fails, so agent QA cannot pass. One-time fix:
  `sudo npx playwright install-deps chromium`.
- **Linear timeouts** (`api.linear.app ... context deadline exceeded`) were seen
  under load, while manual calls were fast (0.1 s) and IPv6 fails instantly and
  falls back to IPv4, so IPv6 is not the cause. A run that finishes but cannot
  write its status back to Linear gets picked up again, so watch for repeated
  claims of the same ticket in the Contrabass log.
- **Do not leave a ticket In Progress while Contrabass is stopped.** On start
  it re-runs orphaned claims (`orphan_claim_recovered`).

- **Claude Code asks interactive questions once per folder/install**, and
  worker panes wait on them forever (`worker_startup_evidence_missing`,
  `panes=0`). Pre-answer them once:
  ```bash
  python3 - <<'EOF'
  import json, os
  p = os.path.expanduser('~/.claude.json'); d = json.load(open(p))
  for k in ['/home/shiva/auto-bob', '/home/shiva/auto-bob/workspaces']:
      d.setdefault('projects', {}).setdefault(k, {})['hasTrustDialogAccepted'] = True
  json.dump(d, open(p, 'w'), indent=2)
  p = os.path.expanduser('~/.claude/settings.json')
  d = json.load(open(p)) if os.path.exists(p) else {}
  d['skipDangerousModePermissionPrompt'] = True
  json.dump(d, open(p, 'w'), indent=2)
  EOF
  ```
  Then start `claude --dangerously-skip-permissions --model sonnet` once in a
  workspace folder, answer the remaining one-time prompts (for example the
  "fullscreen renderer" notice, answer 2), and exit. Later starts are clean.
- **Start Contrabass without `$TMUX`.** If it runs inside the `cb` tmux
  session, `omc` adopts that window as its leader and tries to split panes in
  the TUI, and the workers never start. Use
  `env -u TMUX -u TMUX_PANE contrabass ...`.
- **tmux default size:** `omc` sessions are created detached at 80x24.
  `set -g default-size 220x60` in `~/.tmux.conf` avoids split-pane failures.
- **Do not `rm -rf workspaces/*` alone.** Workspaces are git worktrees.
  Remove them with `git worktree remove --force <dir>`, then
  `git worktree prune` and `git branch -D symphony/<ticket>`, or every retry
  fails with `a branch named 'symphony/...' already exists`.

- **`~/.bashrc` is not read by non-interactive shells.** `LINEAR_API_KEY`
  and the PATH additions placed there are invisible to `wsl -e bash -c ...`
  and to processes started that way. Contrabass then exits with
  `linear api key required`. When starting it from a script, load them
  explicitly:
  ```bash
  export PATH="$PATH:$HOME/.local/bin:$HOME/go/bin"
  eval "$(grep -E '^export LINEAR_' ~/.bashrc)"
  ```
- **`claude` lives in `~/.local/bin`**, which is not on the default PATH.
  If the process cannot find it, runs die immediately.
- **Sessions started from a one-shot `wsl -e` call die** when the command
  exits, unless detached with `setsid nohup`.
- **Default branch** is `master`; `WORKFLOW.md` now says `origin/master`
  in the rebase step.
- **GitHub secrets:** `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`;
  the gates run on the Claude subscription) and `LINEAR_API_KEY` (the jury and
  the doctor read the ticket). `ANTHROPIC_API_KEY` is not used; the scripts
  drop it, because it would take priority over the subscription token.
- The label `needs-expert-review` must exist in the repo (it does).
  `needs-human` is created by the Merge Doctor when it first needs it.
- **Adding the label:** use `gh issue edit <n> --add-label needs-expert-review`
  (or the REST API). `gh pr edit --add-label` fails on gh 2.46 with a
  Projects (classic) GraphQL deprecation error and adds nothing.
- **Merge doctor is autonomous.** The label `needs-expert-review` (added by the
  worker when it cannot finish, or by `linear_sync.py` when a PR conflicts or the
  jury rejected its head) starts `merge-doctor.yml`. Opus (Claude Code CLI,
  subscription token) rebases the PR branch onto master, resolves the conflicts,
  fixes the jury's blocking findings, runs `npm run test:ai` and fixes failures.
  Neither Opus nor the tests see a GitHub or Linear token. `run_merge_doctor.py`
  then re-checks (on top of master, no conflict markers, tests green), pushes with
  `--force-with-lease` and starts the jury on the new head (`gh workflow run`,
  because a `GITHUB_TOKEN` push raises no PR event). The label is removed when the
  run ends. If Opus changes nothing for a rejection, it labels the PR
  `needs-human` and the reconciler parks the ticket instead of retrying.
- **The jury runs on `pull_request_target`** as well, so a PR can never change the
  workflow or the script that reviews it. PR code only runs in its `tests` job,
  which has no secrets. The verdict comment carries a hidden
  `<!-- ai-jury verdict=... sha=... -->` marker; only a verdict for the PR's current
  head counts, and the merge uses `--match-head-commit`. The check `jury-review`
  that branch protection on `master` requires is a commit status that
  `run_jury.py` sets on the reviewed head (a `pull_request_target` job's own check
  run belongs to the base commit and cannot satisfy it).
- **Merge doctor must use `pull_request_target`.** GitHub does not run
  `pull_request` workflows for a PR with merge conflicts. Scripts are checked
  out from the base branch (`_trusted/`), the PR branch separately, and only
  same-repo branches are processed.
- **Two clones drift apart** (WSL and Windows). Work in WSL, sync via GitHub,
  and keep `WORKFLOW.md` identical in both.

## Two projects on one PC

A second project (this repo was copied from another one) runs fine in its own WSL
distro next to the first: each distro has its own files, home, tmux server, reconciler
state (`~/.cb-linear-sync.json`) and `gh` / `claude` logins. What they share:

- **The network.** WSL2 distros share one VM, so `localhost` ports collide. This repo
  defaults to Contrabass on **8081** and the app on **3001** (the other project uses
  8080 and 3000). Playwright derives its port from the working directory.
- **CPU and RAM.** Lower `max_concurrency` in `.contrabass/WORKFLOW.md` if both are busy.
- **The Claude plan and the Linear rate limit.** Workers (Sonnet) and the gates (Opus)
  draw from the same subscription.

A separate machine avoids all of that; the setup is identical.

## Known behavior

- **A second jury run can start right after the first.** The reconciler measures a
  head commit's age from its commit date, not from when the PR was opened, and it
  reads PR data once per round. A worker whose commit is older than `JURY_WAIT_MIN`
  when the PR opens can get a `workflow_dispatch` run about a minute after the
  `pull_request_target` run, although the verdict is already on the PR (seen on AUTO-1,
  PR #1). Effect: one extra Opus review of the same commit; the first verdict still counts.
- **The jury's non-blocking remarks become a Backlog ticket** ("Follow-up to AUTO-N").
  It starts only when a person moves it to Todo.
- **`Network is unreachable` can appear once in `cb sync-log`** (seen 2026-09-29, see the
  network note above); the reconciler retries on the next round.

## Security

Workers run with all permissions bypassed, and inside WSL that includes your
`gh` token and read/write access to Windows files under `/mnt/c`.

- Keep the working clone in the WSL home, not on `/mnt/c`.
- Use a `gh` token limited to this one repository.
- Optionally disable the Windows mount in `/etc/wsl.conf`
  (`[automount] enabled=false`) if you do not need it.
- Enable branch protection on `master` so agents can only open PRs.

## Shortcut: the `cb` command

`scripts/cb` wraps everything below (loads the Linear key, unsets `$TMUX`,
runs detached in tmux). One-time install in WSL:

```bash
ln -sf ~/auto-bob/scripts/cb ~/.local/bin/cb
```

| Command | Effect |
|---------|--------|
| `cb` | start if needed, then open the TUI (detach with `Ctrl-b d`, never `q`) |
| `cb start` / `cb stop` / `cb restart` | control the pipeline. `stop`/`restart`/`clean` **refuse while agents are running**; `--force` overrides |
| `cb status` | sessions and the TUI header (agents, tokens, errors) |
| `cb agents` | list `omc-team-*` agent sessions; `cb agents <session>` attaches |
| `cb watch` | live stream of every worker (text, tool calls, results), the omc manager and Contrabass run events; `cb watch AUTO-34` for one ticket, `--full` / `--no-results` / `--recent MIN` (see `cb watch --help`) |
| `cb sync-restart` | restart only the Linear reconciler, e.g. after pulling a new `linear_sync.py` (safe while agents run) |
| `cb clean` | stop and wipe workspaces, worktrees, state and `symphony/*` branches (asks first) |

From Windows: `wsl -d auto-bob -e bash -lc "cb status"`, or `wsl -d auto-bob -e bash -lc cb`
to open the TUI, or `wsl -d auto-bob -e bash -lc "cb watch"` for the agents' output.

## Start / restart (manual, what `cb` does)

```bash
tmux kill-session -t cb 2>/dev/null
cd ~/auto-bob
# only to reset stale runs:
git worktree remove --force workspaces/* ; git worktree prune
git branch -D symphony/<ticket> 2>/dev/null   # only if it has no commits
rm -rf .contrabass/state
export PATH="$PATH:$HOME/.local/bin:$HOME/go/bin"
eval "$(grep -E '^export LINEAR_' ~/.bashrc)"
setsid nohup tmux new-session -d -s cb -x 200 -y 50 \
  "env -u TMUX -u TMUX_PANE contrabass --config .contrabass/WORKFLOW.md --port 8081; sleep 600" \
  >/dev/null 2>&1 </dev/null &
tmux attach -t cb
```

The trailing `sleep 600` keeps the pane open so an error message stays
readable if Contrabass exits.

## Verify the setup

```bash
command -v claude omc tmux gh node contrabass   # all must resolve
claude --version && gh auth status
mkdir /tmp/t && cd /tmp/t && git init -q && git commit -q --allow-empty -m init
omc team 1:claude --no-decompose "create hello.txt containing hi"
omc team shutdown <team-name> --force           # clean up afterwards
```

Then start Contrabass and confirm a Todo ticket shows `Agents: 1/5` for
more than a few seconds and commits appear on `symphony/<ticket>`.

## Watching agents

- TUI keys: `j`/`k` move, `Enter` opens the detail view, `Tab` switches
  panel, `?` help, `q` quit.
- Agent sessions: `tmux ls`, then `tmux attach -t <omc-team-...>`
  (detach with `Ctrl-b d`).
- Snapshot without attaching: `tmux capture-pane -p -t <pane> -S -200`.
- From Windows: `wsl -d auto-bob -e bash -lc "tmux capture-pane -p -t cb"`.
  Put multi-line or `$(...)` commands in a script file and run it with
  `wsl -d auto-bob -e bash /mnt/c/.../script.sh`, because PowerShell mangles `$`.
- Run history: `.contrabass/state/workflow-timeline/<issue-id>.jsonl`.
- Worker events and heartbeats: `.contrabass/state/team/orchestrator/`.

## Diagnosing a failed run

| Symptom | Cause |
|---------|-------|
| `linear api key required` on start | key not loaded, see the `.bashrc` gotcha |
| Run ends in ~3 s, `success_unverified_branch_unchanged` | `worker_mode` is `tmux`, or `claude` is missing/not logged in |
| Pane shows `omc team` usage text | same `worker_mode: tmux` problem |
| TUI shows `Agents: 0/5` and nothing happens | no ticket in a pickup state; move one to Todo in Linear |
| No events for 10 minutes, then a stop and an 8-second retry with `success_unverified_branch_unchanged` | Claude's one-time prompt was never answered (step 4 of the quick start); afterwards kill the stale `omc-team-*` session, delete the empty `symphony/<ticket>` branch and move the ticket to Todo |
| Stuck at `Init` for minutes | check the `omc-team-*` tmux session; usually a Claude prompt (see gotchas) |
| `signal: killed` in `start_failed`, sessions open/close in a loop | `omc.startup_timeout_ms` too low |
| `unknown role "lead"` | old `.claude/omc.jsonc` committed; commit the corrected one |
| `branch ... already exists` on every retry | stale worktree, see gotchas |
| Jury posts no verdict, `the tests job left no outcome` | the tests job crashed; see its log (the reconciler restarts it, max 3 per head) |

Also check `git log master..symphony/<ticket>` in the WSL clone to see
whether the agents produced commits.
