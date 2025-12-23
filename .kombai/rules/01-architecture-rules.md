# 01 - Architecture Rules (Expanded)

## High-level architecture
- اتبع Clean Architecture مع أربعة طبقات أساسية:
  1. Domain: Entities (types), value objects, domain rules (pure TypeScript types).
  2. Data: Repositories, migrations, database connectors (better-sqlite3).
  3. Services (Use Cases): business logic, orchestration, validation (Zod).
  4. Presentation: Renderer (React) + ViewModels (MVVM).

## Folder mapping (must implement exactly)
```
src/
  main/
    core/
      database/
      models/
      repositories/
      services/
      utils/
    ipc/
    windows/
    main.ts
  preload/
    index.ts
  renderer/
    components/
    pages/
    viewmodels/
    hooks/
    layouts/
    App.tsx
  shared/
    types/
    constants/
```

## Coding contracts between layers
- Repositories expose typed methods returning plain JS objects (no DB cursors).
- Services accept DTOs validated by Zod and throw domain-specific errors (typed).
- ViewModels call `window.api` and adapt DTOs to UI state. No DB logic in ViewModels.

## Dependency rule
- Data layer should not import Presentation.
- Services may import Data and Domain.
- Presentation may import Services only via preload API (i.e., via window.api calls; do not directly import service code).

## Error handling
- Domain errors use custom error types (e.g., `ValidationError`, `NotFoundError`).
- IPC handlers must catch exceptions and return `{ ok: false, error: { code, message } }`.

## Example ViewModel structure (for Orders page)
- `src/renderer/viewmodels/OrderViewModel.ts`
  - methods: load(page, filters), create(payload), update(id, payload), changeStatus(id, status)
  - state: orders[], currentOrder, loading, error
  - uses `window.api.orders.*` only
