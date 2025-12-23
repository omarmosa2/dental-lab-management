# 09 - Workflow and Agent Methodology (Expanded)

## Phase gating
- Agent must operate in gated phases. After each phase, publish a short summary to `.agent/notes.md` and wait for 'تابع' to proceed.

## Phases (high-level)
0. Bootstrap & environment
1. Database & migrations
2. Repositories
3. Services & validation
4. IPC & preload
5. Reporting engine (PDF/Excel)
6. Frontend core layout & pages
7. Integrations (WhatsApp links, print window)
8. Tests & QA
9. Packaging

## Communication style for Agent
- For each action, Agent writes an entry in `.agent/notes.md` with timestamp, files created, tests passed, and outstanding risks.

## Example note entry
```
[2025-11-09T12:00Z] PHASE 1 complete. Created migrations: 0001_initial.sql. Ran migration runner on clean DB. Next: implement repositories.
```
