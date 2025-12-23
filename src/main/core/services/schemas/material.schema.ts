import { z } from 'zod';
import { sanitizeString } from '../../utils/sanitization';

export const createMaterialSchema = z.object({
  code: z.string()
    .min(1, 'الكود مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'الكود مطلوب' }),
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'الاسم مطلوب' }),
  quantity: z.number()
    .min(0, 'الكمية يجب أن تكون صفر أو أكثر')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'الكمية يجب أن تكون رقم صحيح' }),
  min_quantity: z.number()
    .min(0, 'الحد الأدنى يجب أن يكون صفر أو أكثر')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'الحد الأدنى يجب أن يكون رقم صحيح' }),
  unit: z.string()
    .min(1, 'الوحدة مطلوبة')
    .transform(sanitizeString)
    .refine((val) => val !== null && val.length > 0, { message: 'الوحدة مطلوبة' }),
  cost_per_unit: z.number()
    .min(0, 'التكلفة يجب أن تكون صفر أو أكثر')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'التكلفة يجب أن تكون رقم صحيح' }),
  supplier: z.string().optional().transform(sanitizeString),
  last_purchase_date: z.number().optional(),
  expiry_date: z.number().optional(),
  category: z.string().optional().transform(sanitizeString),
  notes: z.string().optional().transform(sanitizeString),
}).refine(
  (data) => {
    // Validate that expiry_date is after last_purchase_date if both are provided
    if (data.expiry_date && data.last_purchase_date) {
      return data.expiry_date > data.last_purchase_date;
    }
    return true;
  },
  {
    message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ الشراء',
    path: ['expiry_date'],
  }
);

export const updateMaterialSchema = createMaterialSchema.partial().extend({
  id: z.number().positive('معرف غير صحيح'),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;