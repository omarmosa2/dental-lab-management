"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Indicate preload is executed (debugging)
console.log('[preload] preload script executed');
electron_1.contextBridge.exposeInMainWorld('agorraPreload', { loaded: true });
// Expose electron IPC for progress listeners
electron_1.contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        on: (channel, listener) => {
            electron_1.ipcRenderer.on(channel, listener);
        },
        removeListener: (channel, listener) => {
            electron_1.ipcRenderer.removeListener(channel, listener);
        },
    },
});
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api = {
    dentists: {
        list: (page, limit) => electron_1.ipcRenderer.invoke('dentists:list', page, limit),
        count: () => electron_1.ipcRenderer.invoke('dentists:count'),
        get: (id) => electron_1.ipcRenderer.invoke('dentists:get', id),
        create: (dto) => electron_1.ipcRenderer.invoke('dentists:create', dto),
        update: (id, dto) => electron_1.ipcRenderer.invoke('dentists:update', id, dto),
        delete: (id) => electron_1.ipcRenderer.invoke('dentists:delete', id),
        search: (query) => electron_1.ipcRenderer.invoke('dentists:search', query),
    },
    orders: {
        list: (filters, pagination) => electron_1.ipcRenderer.invoke('orders:list', filters, pagination),
        get: (id) => electron_1.ipcRenderer.invoke('orders:get', id),
        create: (dto) => electron_1.ipcRenderer.invoke('orders:create', dto),
        update: (id, dto) => electron_1.ipcRenderer.invoke('orders:update', id, dto),
        delete: (id) => electron_1.ipcRenderer.invoke('orders:delete', id),
        changeStatus: (id, status) => electron_1.ipcRenderer.invoke('orders:changeStatus', id, status),
        paymentStatus: (id) => electron_1.ipcRenderer.invoke('orders:paymentStatus', id),
        count: (filters) => electron_1.ipcRenderer.invoke('orders:count', filters),
    },
    payments: {
        list: (filters) => electron_1.ipcRenderer.invoke('payments:list', filters),
        get: (id) => electron_1.ipcRenderer.invoke('payments:get', id),
        create: (dto) => electron_1.ipcRenderer.invoke('payments:create', dto),
        delete: (id) => electron_1.ipcRenderer.invoke('payments:delete', id),
        byOrder: (orderId) => electron_1.ipcRenderer.invoke('payments:byOrder', orderId),
        remaining: (orderId) => electron_1.ipcRenderer.invoke('payments:remaining', orderId),
    },
    materials: {
        list: (page, limit) => electron_1.ipcRenderer.invoke('materials:list', page, limit),
        count: () => electron_1.ipcRenderer.invoke('materials:count'),
        get: (id) => electron_1.ipcRenderer.invoke('materials:get', id),
        create: (dto) => electron_1.ipcRenderer.invoke('materials:create', dto),
        update: (id, dto) => electron_1.ipcRenderer.invoke('materials:update', id, dto),
        delete: (id) => electron_1.ipcRenderer.invoke('materials:delete', id),
        getLowStock: () => electron_1.ipcRenderer.invoke('materials:getLowStock'),
        lowStock: () => electron_1.ipcRenderer.invoke('materials:lowStock'),
        updateQuantity: (id, quantity) => electron_1.ipcRenderer.invoke('materials:updateQuantity', id, quantity),
    },
    expenses: {
        list: (filters, page, limit) => electron_1.ipcRenderer.invoke('expenses:list', filters, page, limit),
        count: (filters) => electron_1.ipcRenderer.invoke('expenses:count', filters),
        get: (id) => electron_1.ipcRenderer.invoke('expenses:get', id),
        create: (dto) => electron_1.ipcRenderer.invoke('expenses:create', dto),
        delete: (id) => electron_1.ipcRenderer.invoke('expenses:delete', id),
        getTotalByPeriod: (dateFrom, dateTo) => electron_1.ipcRenderer.invoke('expenses:getTotalByPeriod', dateFrom, dateTo),
    },
    workers: {
        list: (page, limit) => electron_1.ipcRenderer.invoke('workers:list', page, limit),
        count: () => electron_1.ipcRenderer.invoke('workers:count'),
        listActive: () => electron_1.ipcRenderer.invoke('workers:listActive'),
        get: (id) => electron_1.ipcRenderer.invoke('workers:get', id),
        create: (dto) => electron_1.ipcRenderer.invoke('workers:create', dto),
        update: (id, dto) => electron_1.ipcRenderer.invoke('workers:update', id, dto),
        delete: (id) => electron_1.ipcRenderer.invoke('workers:delete', id),
        deactivate: (id) => electron_1.ipcRenderer.invoke('workers:deactivate', id),
        activate: (id) => electron_1.ipcRenderer.invoke('workers:activate', id),
    },
    reports: {
        orders: (filters) => electron_1.ipcRenderer.invoke('reports:orders', filters),
        dentists: () => electron_1.ipcRenderer.invoke('reports:dentists'),
        materials: () => electron_1.ipcRenderer.invoke('reports:materials'),
        payments: (filters) => electron_1.ipcRenderer.invoke('reports:payments', filters),
        expenses: (filters) => electron_1.ipcRenderer.invoke('reports:expenses', filters),
        financial: (filters) => electron_1.ipcRenderer.invoke('reports:financial', filters),
        dashboardStats: () => electron_1.ipcRenderer.invoke('reports:dashboardStats'),
        getRecentOrders: (limit) => electron_1.ipcRenderer.invoke('reports:recentOrders', limit),
    },
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings:get'),
        update: (dto) => electron_1.ipcRenderer.invoke('settings:update', dto),
    },
    backup: {
        create: () => electron_1.ipcRenderer.invoke('backup:create'),
        list: () => electron_1.ipcRenderer.invoke('backup:list'),
        restore: (backupId) => electron_1.ipcRenderer.invoke('backup:restore', backupId),
        delete: (backupId) => electron_1.ipcRenderer.invoke('backup:delete', backupId),
        clearData: () => electron_1.ipcRenderer.invoke('backup:clearData'),
        getDirectory: () => electron_1.ipcRenderer.invoke('backup:getDirectory'),
        setDirectory: () => electron_1.ipcRenderer.invoke('backup:setDirectory'),
        getStats: () => electron_1.ipcRenderer.invoke('backup:getStats'),
        checkAutoBackup: () => electron_1.ipcRenderer.invoke('backup:checkAutoBackup'),
    },
};
electron_1.contextBridge.exposeInMainWorld('api', api);
// Export API
const exportApi = {
    dentists: () => electron_1.ipcRenderer.invoke('export:dentists'),
    orders: (filters) => electron_1.ipcRenderer.invoke('export:orders', filters),
    materials: () => electron_1.ipcRenderer.invoke('export:materials'),
    expenses: (filters) => electron_1.ipcRenderer.invoke('export:expenses', filters),
    payments: (filters) => electron_1.ipcRenderer.invoke('export:payments', filters),
    workers: () => electron_1.ipcRenderer.invoke('export:workers'),
};
electron_1.contextBridge.exposeInMainWorld('exportApi', exportApi);
// Print API
const printApi = {
    order: (orderId) => electron_1.ipcRenderer.invoke('print:order', orderId),
    invoice: (orderId) => electron_1.ipcRenderer.invoke('print:invoice', orderId),
    report: (title, data, columns) => electron_1.ipcRenderer.invoke('print:report', title, data, columns),
};
electron_1.contextBridge.exposeInMainWorld('printApi', printApi);
// WhatsApp API
const whatsAppApi = {
    connect: () => electron_1.ipcRenderer.invoke('whatsapp:connect'),
    disconnect: () => electron_1.ipcRenderer.invoke('whatsapp:disconnect'),
    reset: () => electron_1.ipcRenderer.invoke('whatsapp:reset'),
    getStatus: () => electron_1.ipcRenderer.invoke('whatsapp:getStatus'),
    sendMessage: (request) => electron_1.ipcRenderer.invoke('whatsapp:sendMessage', request),
    getMessageLogs: (limit, offset) => electron_1.ipcRenderer.invoke('whatsapp:getMessageLogs', limit, offset),
    getSettings: () => electron_1.ipcRenderer.invoke('whatsapp:getSettings'),
    updateSettings: (updates) => electron_1.ipcRenderer.invoke('whatsapp:updateSettings', updates),
    openQRWindow: () => electron_1.ipcRenderer.invoke('whatsapp:openQRWindow'),
    closeQRWindow: () => electron_1.ipcRenderer.invoke('whatsapp:closeQRWindow'),
};
electron_1.contextBridge.exposeInMainWorld('whatsAppApi', whatsAppApi);
// License API
const licenseApi = {
    getHardwareId: () => electron_1.ipcRenderer.invoke('license:getHardwareId'),
    getInfo: () => electron_1.ipcRenderer.invoke('license:getInfo'),
    isActivated: () => electron_1.ipcRenderer.invoke('license:isActivated'),
    activate: (licenseKey) => electron_1.ipcRenderer.invoke('license:activate', licenseKey),
    generateKey: (hardwareId) => electron_1.ipcRenderer.invoke('license:generateKey', hardwareId),
    deactivate: () => electron_1.ipcRenderer.invoke('license:deactivate'),
};
electron_1.contextBridge.exposeInMainWorld('licenseApi', licenseApi);
// Database API (for testing/development)
const databaseApi = {
    seedLargeDataset: () => electron_1.ipcRenderer.invoke('database:seedLargeDataset'),
    clearAllData: () => electron_1.ipcRenderer.invoke('database:clearAllData'),
};
electron_1.contextBridge.exposeInMainWorld('databaseApi', databaseApi);
// Utility API
const utilApi = {
    openExternal: (url) => electron_1.ipcRenderer.invoke('util:openExternal', url),
};
electron_1.contextBridge.exposeInMainWorld('utilApi', utilApi);
// Type declaration removed - using global.d.ts instead
