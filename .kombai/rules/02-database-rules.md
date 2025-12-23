# 02 - Database Rules (Expanded)

## DB engine
- Use better-sqlite3 for synchronous, fast, and deterministic operations.
- Single DB file placed per OS conventions:
  - Windows: %APPDATA%/<app-name>/data.db
  - macOS: ~/Library/Application Support/<app-name>/data.db
  - Linux: ~/.local/share/<app-name>/data.db

## Migrations
- migrations are SQL files inside `src/main/core/database/migrations/` named `0001_initial.sql`, `0002_add_x.sql`, etc.
- Maintain a table `migrations_applied`:
```sql
CREATE TABLE migrations_applied (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT,
  applied_at INTEGER DEFAULT (strftime('%s','now'))
);
```
- Migration runner must:
  - compute checksum (sha256) for each migration file
  - only apply if not present in migrations_applied
  - run each migration inside a transaction
  - log applied migrations to `.agent/notes.md`

## Schema (verbatim from PDF)
- Implement tables exactly as specified in the PDF. Example: dentists, orders, materials, payments, expenses, workers.
- Use appropriate column types (INTEGER for timestamps, REAL for monetary values, TEXT for strings).
- All date/time fields stored as epoch seconds (INTEGER) for determinism.

## Indexing & Performance
- Create indices on:
  - `orders(status)`, `orders(dentist_id)`, `payments(order_id)`, `materials(code)`, `orders.date_received`
- Use prepared statements for frequently used queries.

## Transactions
- Any multi-step operation (create order + create pending payment + reduce material quantity) MUST be atomic via transaction.
- Guard against race conditions by using immediate transactions in better-sqlite3.

## Sample migration: 0001_initial.sql
(Include full CREATE TABLE commands matching the PDF - ensure constraints and FK declarations are present.)
