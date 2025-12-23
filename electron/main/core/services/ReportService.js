"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
class ReportService {
    constructor(db) {
        this.db = db;
    }
    async generateOrdersReport(filters = {}) {
        try {
            electron_log_1.default.info('ReportService.generateOrdersReport', { filters });
            let query = `SELECT o.*, d.name as dentist_name, d.phone as dentist_phone, w.name as worker_name FROM orders o LEFT JOIN dentists d ON o.dentist_id = d.id LEFT JOIN workers w ON o.assigned_worker_id = w.id WHERE 1=1`;
            const params = [];
            if (filters.dateFrom) {
                query += ' AND o.date_received >= ?';
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ' AND o.date_received <= ?';
                params.push(filters.dateTo);
            }
            if (filters.dentistId) {
                query += ' AND o.dentist_id = ?';
                params.push(filters.dentistId);
            }
            if (filters.status) {
                query += ' AND o.status = ?';
                params.push(filters.status);
            }
            query += ' ORDER BY o.date_received DESC';
            const stmt = this.db.prepare(query);
            stmt.bind(params);
            const orders = [];
            while (stmt.step()) {
                orders.push(stmt.getAsObject());
            }
            stmt.free();
            return orders;
        }
        catch (error) {
            electron_log_1.default.error('ReportService.generateOrdersReport - error', error);
            throw error;
        }
    }
    async generateDentistsReport() {
        try {
            electron_log_1.default.info('ReportService.generateDentistsReport');
            const query = `SELECT d.*, COUNT(o.id) as total_orders FROM dentists d LEFT JOIN orders o ON d.id = o.dentist_id GROUP BY d.id ORDER BY d.name`;
            const stmt = this.db.prepare(query);
            const dentists = [];
            while (stmt.step()) {
                dentists.push(stmt.getAsObject());
            }
            stmt.free();
            return dentists;
        }
        catch (error) {
            electron_log_1.default.error('ReportService.generateDentistsReport - error', error);
            throw error;
        }
    }
    async generateMaterialsReport() {
        try {
            electron_log_1.default.info('ReportService.generateMaterialsReport');
            const stmt = this.db.prepare('SELECT * FROM materials ORDER BY name');
            const materials = [];
            while (stmt.step()) {
                materials.push(stmt.getAsObject());
            }
            stmt.free();
            return materials;
        }
        catch (error) {
            electron_log_1.default.error('ReportService.generateMaterialsReport - error', error);
            throw error;
        }
    }
    async generatePaymentsReport(filters = {}) {
        try {
            electron_log_1.default.info('ReportService.generatePaymentsReport', { filters });
            let query = `SELECT p.*, o.order_number, d.name as dentist_name FROM payments p LEFT JOIN orders o ON p.order_id = o.id LEFT JOIN dentists d ON o.dentist_id = d.id WHERE 1=1`;
            const params = [];
            if (filters.dateFrom) {
                query += ' AND p.date >= ?';
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ' AND p.date <= ?';
                params.push(filters.dateTo);
            }
            query += ' ORDER BY p.date DESC';
            const stmt = this.db.prepare(query);
            stmt.bind(params);
            const payments = [];
            while (stmt.step()) {
                payments.push(stmt.getAsObject());
            }
            stmt.free();
            return payments;
        }
        catch (error) {
            electron_log_1.default.error('ReportService.generatePaymentsReport - error', error);
            throw error;
        }
    }
    async generateExpensesReport(filters = {}) {
        try {
            electron_log_1.default.info('ReportService.generateExpensesReport', { filters });
            let query = 'SELECT * FROM expenses WHERE 1=1';
            const params = [];
            if (filters.dateFrom) {
                query += ' AND date >= ?';
                params.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                query += ' AND date <= ?';
                params.push(filters.dateTo);
            }
            if (filters.category) {
                query += ' AND category = ?';
                params.push(filters.category);
            }
            query += ' ORDER BY date DESC';
            const stmt = this.db.prepare(query);
            stmt.bind(params);
            const expenses = [];
            while (stmt.step()) {
                expenses.push(stmt.getAsObject());
            }
            stmt.free();
            return expenses;
        }
        catch (error) {
            electron_log_1.default.error('ReportService.generateExpensesReport - error', error);
            throw error;
        }
    }
    async generateFinancialSummary(filters = {}) {
        try {
            electron_log_1.default.info('ReportService.generateFinancialSummary', { filters });
            let revenueQuery = 'SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status = ?';
            const revenueParams = ['completed'];
            if (filters.dateFrom) {
                revenueQuery += ' AND date_received >= ?';
                revenueParams.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                revenueQuery += ' AND date_received <= ?';
                revenueParams.push(filters.dateTo);
            }
            const revenueStmt = this.db.prepare(revenueQuery);
            revenueStmt.bind(revenueParams);
            revenueStmt.step();
            const totalRevenue = revenueStmt.getAsObject().total;
            revenueStmt.free();
            let expensesQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1';
            const expensesParams = [];
            if (filters.dateFrom) {
                expensesQuery += ' AND date >= ?';
                expensesParams.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                expensesQuery += ' AND date <= ?';
                expensesParams.push(filters.dateTo);
            }
            const expensesStmt = this.db.prepare(expensesQuery);
            expensesStmt.bind(expensesParams);
            expensesStmt.step();
            const totalExpenses = expensesStmt.getAsObject().total;
            expensesStmt.free();
            let pendingQuery = `SELECT COALESCE(SUM(o.price - COALESCE(p.total_paid, 0)), 0) as total FROM orders o LEFT JOIN (SELECT order_id, SUM(amount) as total_paid FROM payments GROUP BY order_id) p ON o.id = p.order_id WHERE o.status != ?`;
            const pendingParams = ['cancelled'];
            if (filters.dateFrom) {
                pendingQuery += ' AND o.date_received >= ?';
                pendingParams.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                pendingQuery += ' AND o.date_received <= ?';
                pendingParams.push(filters.dateTo);
            }
            const pendingStmt = this.db.prepare(pendingQuery);
            pendingStmt.bind(pendingParams);
            pendingStmt.step();
            const pendingPayments = pendingStmt.getAsObject().total;
            pendingStmt.free();
            let ordersQuery = `SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) as pending FROM orders WHERE 1=1`;
            const ordersParams = ['completed', 'pending', 'in_progress'];
            if (filters.dateFrom) {
                ordersQuery += ' AND date_received >= ?';
                ordersParams.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                ordersQuery += ' AND date_received <= ?';
                ordersParams.push(filters.dateTo);
            }
            const ordersStmt = this.db.prepare(ordersQuery);
            ordersStmt.bind(ordersParams);
            ordersStmt.step();
            const ordersData = ordersStmt.getAsObject();
            ordersStmt.free();
            return {
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                pendingPayments,
                completedOrders: ordersData.completed,
                pendingOrders: ordersData.pending,
                totalOrders: ordersData.total,
            };
        }
        catch (error) {
            electron_log_1.default.error('ReportService.generateFinancialSummary - error', error);
            throw error;
        }
    }
    async getDashboardStats() {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthStart = startOfMonth.getTime() / 1000;
        const ordersStmt = this.db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed FROM orders');
        ordersStmt.bind(['pending', 'completed']);
        ordersStmt.step();
        const ordersData = ordersStmt.getAsObject();
        ordersStmt.free();
        const dentistsStmt = this.db.prepare('SELECT COUNT(*) as total FROM dentists');
        dentistsStmt.step();
        const totalDentists = dentistsStmt.getAsObject().total;
        dentistsStmt.free();
        const materialsStmt = this.db.prepare('SELECT COUNT(*) as total FROM materials WHERE quantity <= min_quantity');
        materialsStmt.step();
        const lowStockMaterials = materialsStmt.getAsObject().total;
        materialsStmt.free();
        const revenueStmt = this.db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status = ? AND date_received >= ?');
        revenueStmt.bind(['completed', monthStart]);
        revenueStmt.step();
        const monthlyRevenue = revenueStmt.getAsObject().total;
        revenueStmt.free();
        const expensesStmt = this.db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ?');
        expensesStmt.bind([monthStart]);
        expensesStmt.step();
        const monthlyExpenses = expensesStmt.getAsObject().total;
        expensesStmt.free();
        return {
            totalOrders: ordersData.total,
            pendingOrders: ordersData.pending,
            completedOrders: ordersData.completed,
            totalDentists,
            lowStockMaterials,
            monthlyRevenue,
            monthlyExpenses
        };
    }
    async getRecentOrders(limit = 10) {
        const stmt = this.db.prepare('SELECT o.*, d.name as dentist_name FROM orders o LEFT JOIN dentists d ON o.dentist_id = d.id ORDER BY o.date_received DESC LIMIT ?');
        stmt.bind([limit]);
        const orders = [];
        while (stmt.step()) {
            orders.push(stmt.getAsObject());
        }
        stmt.free();
        return orders;
    }
}
exports.ReportService = ReportService;
