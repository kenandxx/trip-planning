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
- The central AI Handoff Protocol v1.0 is proposed in LifeOS PR #5; this project adopts it as the first pilot in PR #11.

## Verification evidence
- No new application/runtime behavior is introduced by this handoff pilot.
- For future code changes, record exact local test commands, GitHub Actions CI results, browser/Playwright viewport and flows, physical-device checks (if performed), and Pages deployment status separately.
- Do not describe a local browser emulation as physical iPhone QA.

## Open risks / decisions
- Keep the two Trip Planner Skill copies synchronized until a single-source distribution mechanism is deliberately adopted.
- Confirm the public-context generator no longer instructs public-project agents to bulk-read private `MASTER_CONTEXT.md`.
- Preserve the privacy boundary: never write private LifeOS notes or personal identifiers into this public repository.

## Next steps
- [ ] Owner review/approval and merge of LifeOS PR #5.
- [ ] Owner review/approval and merge of Trip Planning PR #11.
- [ ] Use the protocol on the next real Trip Planning change and record actual verification evidence here.

## Work log
| Date (JST) | Contributor | Change | Reference |
|---|---|---|---|
| 2026-11-28 | ChatGPT | Initial project handoff log and AI Handoff pilot integration | PR #11 |
