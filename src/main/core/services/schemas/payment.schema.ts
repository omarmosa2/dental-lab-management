import { z } from 'zod';

export const createPaymentSchema = z.object({
  order_id: z.number().min(1, 'يجب اختيار طلب'),
  amount: z.number().min(0, 'المبلغ يجب أن يكون صفر أو أكثر'),
  discount: z.number().min(0, 'الخصم يجب أن يكون صفر أو أكثر'),
  date: z.number(),
  payment_method: z.enum(['cash', 'check', 'transfer', 'card'] as const).default('cash'),
  receipt_number: z.string().optional(),
  received_by: z.string().optional(),
  note: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;