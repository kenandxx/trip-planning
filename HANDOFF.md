# HANDOFF.md — Trip Planning

> This file is a project status log, not a rulebook. Follow `AGENTS.md`, the Japan Self-Drive Trip Planner Skill, and the central LifeOS AI Handoff Protocol.

## Current state
- Repository: `kenandxx/trip-planning`
- Architecture: multi-trip static site; each trip is isolated under `trips/YYYY-MM-<slug>/`.
- Shared runtime: `copilot/trip-copilot.js`, `copilot/trip-copilot.css`, and root `sw.js`.
- Public context: `.context/PERSONAL_CONTEXT.md` contains approved PUBLIC-SAFE domain guidance only.
- Default branch: `main`; changes should be developed on task-specific branches and proposed through PRs.

## Completed baseline
- LifeOS v2.0 documentation alignment merged through PR #4 in `kenandxx/ob-life-hub`.
- Trip Planning public-context documentation alignment merged through PR #10.
- The central AI Handoff Protocol v1.0 is merged in LifeOS PR #5.
- Trip Planning adopted the protocol through PR #11; the central link and project-level references are now live.

## Verification evidence
- No application/runtime behavior was changed by the handoff pilot.
- LifeOS GitHub Actions validation passed on PR #5 head `c310793`: Python unit tests, shell syntax, and registry TOML validation.
- Trip Planning changes were documentation-only; no browser or physical iPhone QA was required or performed.
- For future code changes, record exact local test commands, GitHub Actions CI results, browser/Playwright viewport and flows, physical-device checks (if performed), and Pages deployment status separately.
- Do not describe a local browser emulation as physical iPhone QA.

## Open risks / decisions
- Keep the two Trip Planner Skill copies synchronized until a single-source distribution mechanism is deliberately adopted.
- No generic PR CI workflow exists for documentation-only Trip Planning changes; the existing QA workflows are path-specific.
- Preserve the privacy boundary: never write private LifeOS notes or personal identifiers into this public repository.

## Next steps
- [x] LifeOS AI Handoff Protocol merged (PR #5).
- [x] Trip Planning pilot merged (PR #11).
- [ ] Apply the protocol on the next real Trip Planning code change and record actual browser/device/deployment evidence.

## Work log
| Date (JST) | Contributor | Change | Reference |
|---|---|---|---|
| 2026-11-28 | ChatGPT | Initial project handoff log and AI Handoff pilot integration | PR #11 |
| 2026-11-28 | ChatGPT | Recorded merge status and LifeOS validation evidence | PR #12 |
