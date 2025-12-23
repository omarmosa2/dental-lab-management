import { z } from 'zod';
import { sanitizeString, sanitizePhone } from '../../utils/sanitization';

// Phone validation regex (Syrian format)
const phoneRegex = /^[0-9+\-\s()]{10,}$/;

export const createDentistSchema = z.object({
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'الاسم مطلوب' }),
  gender: z.enum(['male', 'female'], { 
    message: 'الجنس مطلوب'
  }),
  residence: z.string()
    .min(1, 'مكان الإقامة مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'مكان الإقامة مطلوب' }),
  phone: z.string()
    .min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل')
    .regex(phoneRegex, 'رقم هاتف غير صحيح')
    .transform(sanitizePhone)
    .refine((val) => val !== null, { message: 'رقم الهاتف مطلوب' }),
  clinic_name: z.string().optional().transform(sanitizeString),
  specialization: z.string().optional().transform(sanitizeString),
  case_types: z.array(z.string()).optional().default([]),
  payment_terms: z.enum(['immediate', '7_days', '15_days', '30_days'] as const).optional().default('immediate'),
  discount_rate: z.number()
    .min(0, 'نسبة الخصم يجب أن تكون بين 0 و 100')
    .max(100, 'نسبة الخصم يجب أن تكون بين 0 و 100')
    .optional()
    .default(0),
  cost: z.number()
    .min(0, 'التكلفة يجب أن تكون صفر أو أكثر')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'التكلفة يجب أن تكون رقم صحيح' }),
  notes: z.string().optional().transform(sanitizeString),
});

export const updateDentistSchema = createDentistSchema.partial().extend({
  id: z.number().positive('معرف غير صحيح'),
});

export type CreateDentistInput = z.infer<typeof createDentistSchema>;
export type UpdateDentistInput = z.infer<typeof updateDentistSchema>;