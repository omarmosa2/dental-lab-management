"use strict";
// Shared Constants and Enums
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitaShadeGroups = exports.VitaShades = exports.DentistSpecializations = exports.MaterialCategories = exports.WorkerSpecializations = exports.PaymentMethodLabels = exports.PaymentMethods = exports.PaymentTermsLabels = exports.PaymentTerms = exports.UrgencyLevelLabels = exports.UrgencyLevels = exports.Units = exports.FinishTypes = exports.Materials = exports.CaseTypes = exports.ExpenseCategories = exports.WorkerStatusLabels = exports.WorkerStatus = exports.GenderLabels = exports.Gender = exports.OrderStatusLabels = exports.OrderStatus = void 0;
exports.OrderStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};
exports.OrderStatusLabels = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    ready: 'جاهز',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
};
exports.Gender = {
    MALE: 'male',
    FEMALE: 'female',
};
exports.GenderLabels = {
    male: 'ذكر',
    female: 'أنثى',
};
exports.WorkerStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};
exports.WorkerStatusLabels = {
    active: 'نشط',
    inactive: 'غير نشط',
};
exports.ExpenseCategories = [
    'رواتب',
    'مواد خام',
    'كهرباء',
    'إيجار',
    'صيانة',
    'أخرى',
];
exports.CaseTypes = [
    'تاج',
    'جسر',
    'طقم كامل',
    'طقم جزئي',
    'زراعة',
    'تقويم',
    'فينير',
    'إنلاي/أونلاي',
];
exports.Materials = [
    'زيركون',
    'إيماكس',
    'معدن',
    'بورسلين',
    'أكريليك',
    'كوبالت كروم',
];
exports.FinishTypes = [
    'لامع',
    'مطفي',
    'نصف لامع',
];
exports.Units = [
    'قطعة',
    'كيلوغرام',
    'غرام',
    'لتر',
    'ملليلتر',
];
exports.UrgencyLevels = {
    NORMAL: 'normal',
    URGENT: 'urgent',
    EMERGENCY: 'emergency',
};
exports.UrgencyLevelLabels = {
    normal: 'عادي',
    urgent: 'مستعجل',
    emergency: 'طارئ',
};
exports.PaymentTerms = {
    IMMEDIATE: 'immediate',
    SEVEN_DAYS: '7_days',
    FIFTEEN_DAYS: '15_days',
    THIRTY_DAYS: '30_days',
};
exports.PaymentTermsLabels = {
    immediate: 'فوري',
    '7_days': '7 أيام',
    '15_days': '15 يوم',
    '30_days': '30 يوم',
};
exports.PaymentMethods = {
    CASH: 'cash',
    CHECK: 'check',
    TRANSFER: 'transfer',
    CARD: 'card',
};
exports.PaymentMethodLabels = {
    cash: 'نقدي',
    check: 'شيك',
    transfer: 'تحويل بنكي',
    card: 'بطاقة',
};
exports.WorkerSpecializations = [
    'سيراميك',
    'معادن',
    'تقويم',
    'زراعة',
    'أطقم',
    'عام',
];
exports.MaterialCategories = [
    'سيراميك',
    'معادن',
    'أكريليك',
    'شمع',
    'جبس',
    'أدوات',
    'مواد لاصقة',
    'أخرى',
];
exports.DentistSpecializations = [
    'عام',
    'تجميل',
    'تقويم',
    'جراحة',
    'زراعة',
    'أطفال',
    'لثة',
];
// Vita Shade Guide - Standard dental shade colors
exports.VitaShades = [
    // A Group (Reddish Brown)
    { code: 'A1', name: 'A1', group: 'A', color: '#F5EDE1', description: 'بني محمر فاتح جداً' },
    { code: 'A2', name: 'A2', group: 'A', color: '#F0E6D6', description: 'بني محمر فاتح' },
    { code: 'A3', name: 'A3', group: 'A', color: '#E8DACC', description: 'بني محمر متوسط' },
    { code: 'A3.5', name: 'A3.5', group: 'A', color: '#E0D0BE', description: 'بني محمر متوسط داكن' },
    { code: 'A4', name: 'A4', group: 'A', color: '#D8C6B0', description: 'بني محمر داكن' },
    // B Group (Reddish Yellow)
    { code: 'B1', name: 'B1', group: 'B', color: '#F5F0E1', description: 'أصفر محمر فاتح جداً' },
    { code: 'B2', name: 'B2', group: 'B', color: '#F0EAD6', description: 'أصفر محمر فاتح' },
    { code: 'B3', name: 'B3', group: 'B', color: '#E8E0CC', description: 'أصفر محمر متوسط' },
    { code: 'B4', name: 'B4', group: 'B', color: '#E0D6BE', description: 'أصفر محمر داكن' },
    // C Group (Gray)
    { code: 'C1', name: 'C1', group: 'C', color: '#F0F0E8', description: 'رمادي فاتح جداً' },
    { code: 'C2', name: 'C2', group: 'C', color: '#E8E8DC', description: 'رمادي فاتح' },
    { code: 'C3', name: 'C3', group: 'C', color: '#E0E0D0', description: 'رمادي متوسط' },
    { code: 'C4', name: 'C4', group: 'C', color: '#D8D8C4', description: 'رمادي داكن' },
    // D Group (Reddish Gray)
    { code: 'D2', name: 'D2', group: 'D', color: '#F0E8DC', description: 'رمادي محمر فاتح' },
    { code: 'D3', name: 'D3', group: 'D', color: '#E8DCD0', description: 'رمادي محمر متوسط' },
    { code: 'D4', name: 'D4', group: 'D', color: '#E0D0C4', description: 'رمادي محمر داكن' },
    // Bleach Shades (Extra Light)
    { code: 'BL1', name: 'BL1', group: 'BL', color: '#FDFBF7', description: 'تبييض فاتح جداً' },
    { code: 'BL2', name: 'BL2', group: 'BL', color: '#FAF8F0', description: 'تبييض فاتح' },
    { code: 'BL3', name: 'BL3', group: 'BL', color: '#F7F5E8', description: 'تبييض متوسط' },
    { code: 'BL4', name: 'BL4', group: 'BL', color: '#F4F2E0', description: 'تبييض' },
];
exports.VitaShadeGroups = {
    A: 'بني محمر',
    B: 'أصفر محمر',
    C: 'رمادي',
    D: 'رمادي محمر',
    BL: 'تبييض',
};
