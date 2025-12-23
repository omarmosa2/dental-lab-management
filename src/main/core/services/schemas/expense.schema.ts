import { z } from 'zod';

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'الوصف مطلوب'),
  amount: z.number().min(0, 'المبلغ يجب أن يكون صفر أو أكثر'),
  category: z.string().min(1, 'الفئة مطلوبة'),
  date: z.number(),
  payment_method: z.enum(['cash', 'check', 'transfer', 'card'] as const).default('cash'),
  receipt_number: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;