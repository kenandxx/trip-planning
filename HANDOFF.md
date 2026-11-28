# HANDOFF.md — Trip Planning

> This file is a project status log, not a rulebook. Follow `AGENTS.md`, the Japan Self-Drive Trip Planner Skill, and the central LifeOS AI Handoff Protocol.

## Current state
- Repository: `kenandxx/trip-planning`
- Architecture: multi-trip static site; each trip is isolated under `trips/YYYY-MM-<slug>/`.
- Shared runtime: `copilot/trip-copilot.js`, `copilot/trip-copilot.css`, and root `sw.js`.
- Public context: `.context/PERSONAL_CONTEXT.md` contains approved PUBLIC-SAFE domain guidance only.
- Default branch: `main`; changes should be developed on task-specific branches and proposed through PRs.
- Canonical trip-planner Skill: `skills/japan-self-drive-trip-planner/SKILL.md`; the `.agents/skills/` copy is a generated mirror maintained by `scripts/sync-skills.sh`.

## Completed baseline
- LifeOS v2.0 documentation alignment merged through PR #4 in `kenandxx/ob-life-hub`.
- Trip Planning public-context documentation alignment merged through PR #10.
- The central AI Handoff Protocol v1.0 is merged in LifeOS PR #5.
- Trip Planning adopted the protocol through PR #11; the central link and project-level references are now live.

## Verification evidence
- No application/runtime behavior was changed by the handoff pilot.
- LifeOS GitHub Actions validation passed on PR #5 head `c310793`: Python unit tests, shell syntax, and registry TOML validation.
- Trip Planning changes were documentation-only; no browser or physical iPhone QA was required or performed.
- PR #13 (`chatgpt/skill-single-source-pr-ci`) merged; GitHub Actions runs #1 and #2 passed, including run #2 on commit `57d58094d20c0fea883e178531de3f290bd71180`.
- For future code changes, record exact local test commands, GitHub Actions CI results, browser/Playwright viewport and flows, physical-device checks (if performed), and Pages deployment status separately.
- Do not describe a local browser emulation as physical iPhone QA.

## Open issues / risks
- The Skill is maintained in one canonical source and copied to the `.agents/skills/` runtime path; CI detects drift. Contributors must edit the canonical file, then run `bash scripts/sync-skills.sh`.
- Existing path-specific QA workflows remain specialized; the new generic PR CI is a baseline validator, not a replacement for trip-specific browser/device QA.
- Preserve the privacy boundary: never write private LifeOS notes or personal identifiers into this public repository.

## Next steps
- [x] LifeOS AI Handoff Protocol merged (PR #5).
- [x] Trip Planning pilot merged (PR #11).
- [x] Add a canonical Skill source and generated mirror sync/check script.
- [x] Add generic pull-request validation workflow.
- [x] Merge PR #13 for canonical Skill sync and generic CI after CI passed.
- [x] Apply the Protocol on the 2026-11-29 Kameyama itinerary update and record planning sources and assumptions.
- [ ] Verify GitHub Pages deployment and test on a physical iPhone before relying on it for navigation.

## Work log
| Date (JST) | Contributor | Change | Reference |
|---|---|---|---|
| 2026-11-28 | ChatGPT | Initial project handoff log and AI Handoff pilot integration | PR #11 |
| 2026-11-28 | ChatGPT | Recorded merge status and LifeOS validation evidence | PR #12 |
| 2026-11-28 | ChatGPT | Added Skill single-source sync and generic CI; PR CI passed | [PR #13](https://github.com/kenandxx/trip-planning/pull/13), [run #46100804571](https://github.com/kenandxx/trip-planning/actions/runs/46100804571) |

| 2026-11-28 | ChatGPT | Created 11/29 Kameyama trip page with revised Sunday timing and source-backed risk notes | PR pending |

| 2026-11-28 | ChatGPT | Enlarged the 11/29 page's sticky horizontal navigation touch targets to 48px minimum height and added a numbered five-step execution flow before the Co-Pilot | UX follow-up PR pending |
| 2026-11-28 | Claude | AGENTS.md: chat-only plans must follow the reading order; added rule-ownership table, planning checklist gate, and owner exclusions for 池袋 night plans | PR pending |
| 2026-11-28 | Claude | Created 11/28 池袋 night page (ミルキーパイ→Jewels, copilot GPS/Ahead-Behind/target times; Smart・チョコメロ excluded). Train times reuse 11/26 weekday values and are marked unverified for 土休日. Verified locally with headless Chromium at 400px (no console errors, no horizontal scroll); no physical iPhone QA or Pages check. | PR pending |
