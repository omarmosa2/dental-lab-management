# 07 - Testing and Quality Rules (Expanded)

## Unit Tests
- Use vitest or jest.
- Each Service must have tests: happy path + validation errors + DB error simulation.
- Mock better-sqlite3 for unit tests.

## Integration Tests (smoke)
- Create a test script that:
  - Creates a temporary DB (in temp dir)
  - Runs migrations
  - Seeds sample data
  - Executes a workflow: create dentist -> create order -> add payment -> generate pdf/xlsx
  - Verifies output files exist and are non-empty.

## Linting & Formatting
- ESLint with recommended rules + TypeScript plugin.
- Prettier integrated. Pre-commit hook (husky) runs lint & tests.

## QA checklist (manual)
- CRUD flows for all entities
- Report generation with Arabic text
- Print preview RTL alignment
- WhatsApp compose link formatting
- Packaging runnable installer
