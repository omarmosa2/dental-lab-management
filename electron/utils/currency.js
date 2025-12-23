"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY = void 0;
exports.formatCurrency = formatCurrency;
exports.CURRENCY = {
    code: 'SYP',
    symbol: 'ل.س',
    locale: 'ar-SY',
};
const formatter = new Intl.NumberFormat(exports.CURRENCY.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});
function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '')
        return `0 ${exports.CURRENCY.symbol}`;
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (Number.isNaN(n))
        return `0 ${exports.CURRENCY.symbol}`;
    return `${formatter.format(n)} ${exports.CURRENCY.symbol}`;
}
exports.default = formatCurrency;
