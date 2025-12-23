import { z } from 'zod';
import { sanitizeString, sanitizePhone, sanitizeNationalId } from '../../utils/sanitization';

// Phone validation regex
const phoneRegex = /^[0-9+\-\s()]{10,}$/;

export const createWorkerSchema = z.object({
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'الاسم مطلوب' }),
  phone: z.string()
    .min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل')
    .regex(phoneRegex, 'رقم هاتف غير صحيح')
    .transform(sanitizePhone)
    .refine((val) => val !== null, { message: 'رقم الهاتف مطلوب' }),
  salary: z.number()
    .min(0, 'الراتب يجب أن يكون صفر أو أكثر')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'الراتب يجب أن يكون رقم صحيح' }),
  hire_date: z.number()
    .refine((val) => val > 0, { message: 'تاريخ التوظيف مطلوب' }),
  specialization: z.string().optional().transform(sanitizeString),
  performance_rating: z.number()
    .min(0, 'التقييم يجب أن يكون بين 0 و 5')
    .max(5, 'التقييم يجب أن يكون بين 0 و 5')
    .default(0),
  national_id: z.string()
    .optional()
    .transform(sanitizeNationalId)
    .refine(
      (val) => val === null || val.length === 11,
      { message: 'الرقم الوطني يجب أن يكون 11 رقم' }
    ),
  address: z.string().optional().transform(sanitizeString),
  notes: z.string().optional().transform(sanitizeString),
});

export const updateWorkerSchema = createWorkerSchema.partial().extend({
  id: z.number().positive('معرف غير صحيح'),
  status: z.enum(['active', 'inactive'] as const).optional(),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;