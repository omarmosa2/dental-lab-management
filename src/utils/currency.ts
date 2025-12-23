export const CURRENCY = {
  code: 'SYP',
  symbol: 'ل.س',
  locale: 'ar-SY',
};

const formatter = new Intl.NumberFormat(CURRENCY.locale, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return `0 ${CURRENCY.symbol}`;
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return `0 ${CURRENCY.symbol}`;
  return `${formatter.format(n)} ${CURRENCY.symbol}`;
}

export default formatCurrency;
