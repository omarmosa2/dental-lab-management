import { z } from 'zod';
import { sanitizeString } from '../../utils/sanitization';

export const createOrderSchema = z.object({
  dentist_id: z.number()
    .positive('يجب اختيار طبيب')
    .refine((val) => val > 0, { message: 'يجب اختيار طبيب' }),
  case_type: z.string()
    .min(1, 'نوع الحالة مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'نوع الحالة مطلوب' }),
  tooth_numbers: z.array(z.string())
    .min(1, 'يجب اختيار رقم سن واحد على الأقل')
    .refine((arr) => arr.length > 0, { message: 'يجب اختيار رقم سن واحد على الأقل' }),
  shade: z.string()
    .min(1, 'اللون مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'اللون مطلوب' }),
  main_material: z.string()
    .min(1, 'المادة الأساسية مطلوبة')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'المادة الأساسية مطلوبة' }),
  finish_type: z.string()
    .min(1, 'نوع التشطيب مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'نوع التشطيب مطلوب' }),
  notes: z.string().optional().transform(sanitizeString),
  quantity: z.number()
    .min(1, 'الكمية يجب أن تكون 1 أو أكثر')
    .refine((val) => Number.isInteger(val), { message: 'الكمية يجب أن تكون رقم صحيح' }),
  date_received: z.number()
    .positive('تاريخ الاستلام مطلوب'),
  date_due: z.number()
    .positive('تاريخ التسليم مطلوب'),
  urgency_level: z.enum(['normal', 'urgent', 'emergency'] as const).default('normal'),
  warranty_period: z.number()
    .min(0, 'فترة الضمان يجب أن تكون صفر أو أكثر')
    .default(0),
  try_in_date: z.number().optional(),
  remake_reason: z.string().optional().transform(sanitizeString),
  price: z.number()
    .min(0, 'السعر يجب أن يكون صفر أو أكثر')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'السعر يجب أن يكون رقم صحيح' }),
  assigned_worker_id: z.number().optional(),
}).refine(
  (data) => {
    // Validate that date_due is after date_received
    return data.date_due > data.date_received;
  },
  {
    message: 'تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام',
    path: ['date_due'],
  }
).refine(
  (data) => {
    // Validate that try_in_date is between date_received and date_due if provided
    if (data.try_in_date) {
      return data.try_in_date >= data.date_received && data.try_in_date <= data.date_due;
    }
    return true;
  },
  {
    message: 'تاريخ التجربة يجب أن يكون بين تاريخ الاستلام والتسليم',
    path: ['try_in_date'],
  }
);

export const updateOrderSchema = createOrderSchema.partial().extend({
  id: z.number().positive('معرف غير صحيح'),
  status: z.enum(['pending', 'in_progress', 'completed', 'ready', 'delivered', 'cancelled'] as const).optional(),
  date_delivered: z.number().optional(),
  revision_count: z.number().min(0).optional(),
}).refine(
  (data) => {
    // Validate that date_delivered is after date_received if both are provided
    if (data.date_delivered && data.date_received) {
      return data.date_delivered >= data.date_received;
    }
    return true;
  },
  {
    message: 'تاريخ التسليم الفعلي يجب أن يكون بعد تاريخ الاستلام',
    path: ['date_delivered'],
  }
);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;