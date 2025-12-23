import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Material, CreateMaterialDto, UpdateMaterialDto } from '../../../shared/types/api.types';
import { Units } from '../../../shared/constants/enums';

const materialSchema = z.object({
  code: z.string().min(1, 'الكود مطلوب'),
  name: z.string().min(1, 'الاسم مطلوب'),
  quantity: z.number().min(0, 'الكمية يجب أن تكون رقم موجب'),
  min_quantity: z.number().min(0, 'الحد الأدنى يجب أن يكون رقم موجب'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  cost_per_unit: z.number().min(0, 'التكلفة يجب أن تكون رقم موجب'),
  supplier: z.string().optional(),
  last_purchase_date: z.string().optional(),
  expiry_date: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

export interface MaterialFormProps {
  initialData?: Material;
  onSubmit: (data: CreateMaterialDto | UpdateMaterialDto) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MaterialForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: MaterialFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: initialData ? {
      ...initialData,
      last_purchase_date: initialData.last_purchase_date 
        ? new Date(initialData.last_purchase_date * 1000).toISOString().split('T')[0]
        : '',
      expiry_date: initialData.expiry_date
        ? new Date(initialData.expiry_date * 1000).toISOString().split('T')[0]
        : '',
    } : {
      code: '',
      name: '',
      quantity: 0,
      min_quantity: 0,
      unit: '',
      cost_per_unit: 0,
      supplier: '',
      last_purchase_date: '',
      expiry_date: '',
      category: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: MaterialFormData) => {
    try {
      const submitData: CreateMaterialDto = {
        code: data.code,
        name: data.name,
        quantity: data.quantity,
        min_quantity: data.min_quantity,
        unit: data.unit,
        cost_per_unit: data.cost_per_unit,
        supplier: data.supplier,
        last_purchase_date: data.last_purchase_date 
          ? Math.floor(new Date(data.last_purchase_date).getTime() / 1000)
          : undefined,
        expiry_date: data.expiry_date
          ? Math.floor(new Date(data.expiry_date).getTime() / 1000)
          : undefined,
        category: data.category,
        notes: data.notes,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error will be handled by parent component
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="كود المادة *"
          {...register('code')}
          error={errors.code?.message}
          placeholder="مثال: MAT001"
        />

        <Input
          label="اسم المادة *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="مثال: زيركون أبيض"
        />

        <Input
          label="الكمية الحالية *"
          type="number"
          {...register('quantity', { valueAsNumber: true })}
          error={errors.quantity?.message}
          placeholder="0"
        />

        <Input
          label="الحد الأدنى للمخزون *"
          type="number"
          {...register('min_quantity', { valueAsNumber: true })}
          error={errors.min_quantity?.message}
          placeholder="0"
        />

        <Select
          label="الوحدة *"
          {...register('unit')}
          error={errors.unit?.message}
          options={[
            { value: '', label: 'اختر الوحدة' },
            ...Units.map(u => ({ value: u, label: u }))
          ]}
        />

        <Input
          label="التكلفة لكل وحدة (ل.س) *"
          type="number"
          {...register('cost_per_unit', { valueAsNumber: true })}
          error={errors.cost_per_unit?.message}
          placeholder="0"
        />

        <Input
          label="المورد (اختياري)"
          {...register('supplier')}
          error={errors.supplier?.message}
          placeholder="اسم المورد"
        />

        <Select
          label="الفئة (اختياري)"
          {...register('category')}
          error={errors.category?.message}
          options={[
            { value: '', label: 'اختر الفئة' },
            { value: 'سيراميك', label: 'سيراميك' },
            { value: 'معادن', label: 'معادن' },
            { value: 'أكريليك', label: 'أكريليك' },
            { value: 'شمع', label: 'شمع' },
            { value: 'جبس', label: 'جبس' },
            { value: 'أدوات', label: 'أدوات' },
            { value: 'مواد لاصقة', label: 'مواد لاصقة' },
            { value: 'أخرى', label: 'أخرى' },
          ]}
        />

        <Input
          label="تاريخ آخر شراء (اختياري)"
          type="date"
          {...register('last_purchase_date')}
          error={errors.last_purchase_date?.message}
        />

        <Input
          label="تاريخ الانتهاء (اختياري)"
          type="date"
          {...register('expiry_date')}
          error={errors.expiry_date?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          ملاحظات (اختياري)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
          placeholder="أي ملاحظات إضافية..."
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-error">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {initialData ? 'تحديث' : 'إضافة'}
        </Button>
      </div>
    </form>
  );
}