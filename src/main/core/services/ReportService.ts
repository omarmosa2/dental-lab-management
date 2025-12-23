import type { Database } from 'sql.js';
import log from 'electron-log';
import type { Order, Dentist, Material, Payment, Expense } from '../../../shared/types/api.types';

export interface ReportFilters {
  dateFrom?: number;
  dateTo?: number;
  dentistId?: number;
  status?: string;
  materialId?: number;
  category?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  completedOrders: number;
  pendingOrders: number;
  totalOrders: number;
}

export class ReportService {
  constructor(private db: Database) {}

  async generateOrdersReport(filters: ReportFilters = {}): Promise<Order[]> {
    try {
      log.info('ReportService.generateOrdersReport', { filters });
      let query = `SELECT o.*, d.name as dentist_name, d.phone as dentist_phone, w.name as worker_name FROM orders o LEFT JOIN dentists d ON o.dentist_id = d.id LEFT JOIN workers w ON o.assigned_worker_id = w.id WHERE 1=1`;
      const params: any[] = [];
      if (filters.dateFrom) { query += ' AND o.date_received >= ?'; params.push(filters.dateFrom); }
      if (filters.dateTo) { query += ' AND o.date_received <= ?'; params.push(filters.dateTo); }
      if (filters.dentistId) { query += ' AND o.dentist_id = ?'; params.push(filters.dentistId); }
      if (filters.status) { query += ' AND o.status = ?'; params.push(filters.status); }
      query += ' ORDER BY o.date_received DESC';
      const stmt = this.db.prepare(query);
      stmt.bind(params);
      const orders: Order[] = [];
      while (stmt.step()) { orders.push(stmt.getAsObject() as any); }
      stmt.free();
      return orders;
    } catch (error) { log.error('ReportService.generateOrdersReport - error', error); throw error; }
  }

  async generateDentistsReport(): Promise<Dentist[]> {
    try {
      log.info('ReportService.generateDentistsReport');
      const query = `SELECT d.*, COUNT(o.id) as total_orders FROM dentists d LEFT JOIN orders o ON d.id = o.dentist_id GROUP BY d.id ORDER BY d.name`;
      const stmt = this.db.prepare(query);
      const dentists: any[] = [];
      while (stmt.step()) { dentists.push(stmt.getAsObject()); }
      stmt.free();
      return dentists;
    } catch (error) { log.error('ReportService.generateDentistsReport - error', error); throw error; }
  }

  async generateMaterialsReport(): Promise<Material[]> {
    try {
      log.info('ReportService.generateMaterialsReport');
      const stmt = this.db.prepare('SELECT * FROM materials ORDER BY name');
      const materials: Material[] = [];
      while (stmt.step()) { materials.push(stmt.getAsObject() as any); }
      stmt.free();
      return materials;
    } catch (error) { log.error('ReportService.generateMaterialsReport - error', error); throw error; }
  }

  async generatePaymentsReport(filters: ReportFilters = {}): Promise<Payment[]> {
    try {
      log.info('ReportService.generatePaymentsReport', { filters });
      let query = `SELECT p.*, o.order_number, d.name as dentist_name FROM payments p LEFT JOIN orders o ON p.order_id = o.id LEFT JOIN dentists d ON o.dentist_id = d.id WHERE 1=1`;
      const params: any[] = [];
      if (filters.dateFrom) { query += ' AND p.date >= ?'; params.push(filters.dateFrom); }
      if (filters.dateTo) { query += ' AND p.date <= ?'; params.push(filters.dateTo); }
      query += ' ORDER BY p.date DESC';
      const stmt = this.db.prepare(query);
      stmt.bind(params);
      const payments: any[] = [];
      while (stmt.step()) { payments.push(stmt.getAsObject()); }
      stmt.free();
      return payments;
    } catch (error) { log.error('ReportService.generatePaymentsReport - error', error); throw error; }
  }

  async generateExpensesReport(filters: ReportFilters = {}): Promise<Expense[]> {
    try {
      log.info('ReportService.generateExpensesReport', { filters });
      let query = 'SELECT * FROM expenses WHERE 1=1';
      const params: any[] = [];
      if (filters.dateFrom) { query += ' AND date >= ?'; params.push(filters.dateFrom); }
      if (filters.dateTo) { query += ' AND date <= ?'; params.push(filters.dateTo); }
      if (filters.category) { query += ' AND category = ?'; params.push(filters.category); }
      query += ' ORDER BY date DESC';
      const stmt = this.db.prepare(query);
      stmt.bind(params);
      const expenses: Expense[] = [];
      while (stmt.step()) { expenses.push(stmt.getAsObject() as any); }
      stmt.free();
      return expenses;
    } catch (error) { log.error('ReportService.generateExpensesReport - error', error); throw error; }
  }

  async generateFinancialSummary(filters: ReportFilters = {}): Promise<FinancialSummary> {
    try {
      log.info('ReportService.generateFinancialSummary', { filters });
      let revenueQuery = 'SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status = ?';
      const revenueParams: any[] = ['completed'];
      if (filters.dateFrom) { revenueQuery += ' AND date_received >= ?'; revenueParams.push(filters.dateFrom); }
      if (filters.dateTo) { revenueQuery += ' AND date_received <= ?'; revenueParams.push(filters.dateTo); }
      const revenueStmt = this.db.prepare(revenueQuery);
      revenueStmt.bind(revenueParams);
      revenueStmt.step();
      const totalRevenue = revenueStmt.getAsObject().total as number;
      revenueStmt.free();

      let expensesQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1';
      const expensesParams: any[] = [];
      if (filters.dateFrom) { expensesQuery += ' AND date >= ?'; expensesParams.push(filters.dateFrom); }
      if (filters.dateTo) { expensesQuery += ' AND date <= ?'; expensesParams.push(filters.dateTo); }
      const expensesStmt = this.db.prepare(expensesQuery);
      expensesStmt.bind(expensesParams);
      expensesStmt.step();
      const totalExpenses = expensesStmt.getAsObject().total as number;
      expensesStmt.free();

      let pendingQuery = `SELECT COALESCE(SUM(o.price - COALESCE(p.total_paid, 0)), 0) as total FROM orders o LEFT JOIN (SELECT order_id, SUM(amount) as total_paid FROM payments GROUP BY order_id) p ON o.id = p.order_id WHERE o.status != ?`;
      const pendingParams: any[] = ['cancelled'];
      if (filters.dateFrom) { pendingQuery += ' AND o.date_received >= ?'; pendingParams.push(filters.dateFrom); }
      if (filters.dateTo) { pendingQuery += ' AND o.date_received <= ?'; pendingParams.push(filters.dateTo); }
      const pendingStmt = this.db.prepare(pendingQuery);
      pendingStmt.bind(pendingParams);
      pendingStmt.step();
      const pendingPayments = pendingStmt.getAsObject().total as number;
      pendingStmt.free();

      let ordersQuery = `SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) as pending FROM orders WHERE 1=1`;
      const ordersParams: any[] = ['completed', 'pending', 'in_progress'];
      if (filters.dateFrom) { ordersQuery += ' AND date_received >= ?'; ordersParams.push(filters.dateFrom); }
      if (filters.dateTo) { ordersQuery += ' AND date_received <= ?'; ordersParams.push(filters.dateTo); }
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
        completedOrders: ordersData.completed as number,
        pendingOrders: ordersData.pending as number,
        totalOrders: ordersData.total as number,
      };
    } catch (error) { log.error('ReportService.generateFinancialSummary - error', error); throw error; }
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
    const totalDentists = dentistsStmt.getAsObject().total as number;
    dentistsStmt.free();
    
    const materialsStmt = this.db.prepare('SELECT COUNT(*) as total FROM materials WHERE quantity <= min_quantity');
    materialsStmt.step();
    const lowStockMaterials = materialsStmt.getAsObject().total as number;
    materialsStmt.free();
    
    const revenueStmt = this.db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status = ? AND date_received >= ?');
    revenueStmt.bind(['completed', monthStart]);
    revenueStmt.step();
    const monthlyRevenue = revenueStmt.getAsObject().total as number;
    revenueStmt.free();
    
    const expensesStmt = this.db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ?');
    expensesStmt.bind([monthStart]);
    expensesStmt.step();
    const monthlyExpenses = expensesStmt.getAsObject().total as number;
    expensesStmt.free();
    
    return {
      totalOrders: ordersData.total as number,
      pendingOrders: ordersData.pending as number,
      completedOrders: ordersData.completed as number,
      totalDentists,
      lowStockMaterials,
      monthlyRevenue,
      monthlyExpenses
    };
  }

  async getRecentOrders(limit = 10): Promise<Order[]> {
    const stmt = this.db.prepare('SELECT o.*, d.name as dentist_name FROM orders o LEFT JOIN dentists d ON o.dentist_id = d.id ORDER BY o.date_received DESC LIMIT ?');
    stmt.bind([limit]);
    const orders: any[] = [];
    while (stmt.step()) { orders.push(stmt.getAsObject()); }
    stmt.free();
    return orders;
  }
}