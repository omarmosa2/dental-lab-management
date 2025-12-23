# 04 - Frontend UI/UX Rules (Expanded)

## Base setup
- Root html must include: `<html dir="rtl" lang="ar">`
- Load local fonts from `.agent/resources/fonts/` and define @font-face in Tailwind base CSS.
- Tailwind configured for Arabic typography; use `prose` utilities for readable text.

## Routing & Layouts
- Single-page app using client-side routing (React Router or equivalent).
- Persistent Sidebar with links per PDF.
- Top bar contains quick actions and date/time.

## Pages & Detailed Fields (mirror PDF exactly)
### Dentists Page
- Table columns: id, name, gender, residence, phone (clickable -> WhatsApp), case_types, color_options, cost, notes, actions.
- Actions: view, edit, delete, export (Excel), print.

### Orders Page
- Create/Edit form fields:
  - order_number (auto)
  - case_type (select)
  - tooth_numbers (multi-select)
  - shade (editable combobox)
  - main_material (select)
  - finish_type (select)
  - notes (text)
  - dentist_id (select)
  - quantity (number)
  - date_received (date)
  - date_due (date)
  - date_delivered (date)
  - status (select)
  - price (number)
  - payment_status (computed)
  - assigned_worker_id (select)
- On selecting dentist, auto-fill dentist phone and default cost transfer rules.

### Payments Page
- Fields: order_number (select), amount_paid, discount, date, note.
- UI calculates remaining amount live.

## Components & Patterns
- Use `react-hook-form` and custom controlled components for selects (searchable).
- Use skeleton loaders for lists.
- Use accessible components with aria labels.
- Use Framer Motion only for small entrance animations.
