# 06 - Security Rules (Expanded)

## Renderer isolation
- No exposure of Node APIs to renderer.
- Preload exposes only whitelisted methods under `window.api` (no direct fs access).

## Input sanitization
- All inputs validated by Zod schemas in backend.
- Additionally escape values when rendering into HTML for print views.

## Safe IPC contract
- All channels validate payload structure and types before processing.
- Rate-limit heavy operations (e.g., report generation) to prevent abuse.

## Secrets & credentials
- If integrating with external WhatsApp API or others, use electron-store to keep tokens encrypted, and never commit secrets to repo.

## File writes
- Agent must request permission before writing files outside project root (when applicable).
