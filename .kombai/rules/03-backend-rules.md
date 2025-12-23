# 03 - Backend Rules (Expanded)

## Main responsibilities of main process
- Initialize DB and run migration runner on app start (before creating BrowserWindow).
- Initialize logging via electron-log and write logs into AppData logs folder.
- Register IPC handlers (`ipcMain.handle`) for each domain operation.
- Manage additional BrowserWindows (printWindow) and background tasks.

## Services (must implement)
- DentistService:
  - createDentist(dto), updateDentist(id,dto), listDentists(filters), getDentist(id), deleteDentist(id)
- OrderService:
  - createOrder(dto), updateOrder(id,dto), listOrders(filters,pagination), getOrder(id), changeStatus(id,status), generateOrderNumber()
- PaymentService:
  - addPayment(orderId,dto), listPayments(filters), computeRemaining(orderId)
- MaterialService:
  - createMaterial, updateMaterial, listMaterials, checkAndAlertLowStock()
- ExpenseService, WorkerService similarly.

## Validation
- Use Zod schemas located at `src/main/core/services/schemas/` for each Service.
- Validation errors map to `{ ok: false, error: { code: 'VALIDATION', message, details } }`.

## IPC design
- All channels are namespaced: `orders:*`, `dentists:*`, `materials:*`, `payments:*`, `expenses:*`, `workers:*`, `reports:generate`, `app:settings:*`.
- Handlers must perform permission checks if user roles implemented.

## Logging & Monitoring
- All service method entries and exits logged with transaction IDs.
- Error stack traces saved in logs but only user-friendly messages returned to renderer.
