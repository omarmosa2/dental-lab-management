# 08 - Project Structure (Expanded)

This file codifies the exact folder and file sets the Agent must produce.

Required files and directories (examples):
- src/main/main.ts
- src/main/core/database/index.ts
- src/main/core/database/migrations/0001_initial.sql
- src/main/core/models/*.ts
- src/main/core/repositories/*.ts
- src/main/core/services/*.ts
- src/main/ipc/*.ts
- src/preload/index.ts
- src/renderer/main.tsx
- src/renderer/App.tsx
- src/renderer/pages/Dashboard.tsx
- src/renderer/pages/Dentists.tsx
- src/renderer/pages/Orders.tsx
- src/renderer/pages/Payments.tsx
- src/renderer/pages/Materials.tsx
- src/renderer/pages/Workers.tsx
- src/renderer/pages/Reports.tsx
- src/renderer/viewmodels/*.ts
- src/shared/types/*.ts

Naming conventions:
- files: kebab-case for filenames, camelCase for exported functions
- components: PascalCase
- viewmodels: <Entity>ViewModel.ts
