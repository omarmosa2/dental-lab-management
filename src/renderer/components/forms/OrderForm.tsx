import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ShadeSelector } from '../ui/ShadeSelector';
import type { Order, Dentist, Worker } from '../../../shared/types/api.types';
import { CaseTypes, Materials, FinishTypes } from '../../../shared/constants/enums';

const orderSchema = z.object({
  dentist_id: z.number().min(1, 'يجب اختيار الطبيب'),
  case_type: z.string().min(1, 'نوع الحالة مطلوب'),
  tooth_numbers: z.string().min(1, 'أرقام الأسنان مطلوبة'),
  shade: z.string().min(1, 'اللون مطلوب'),
  main_material: z.string().min(1, 'المادة الأساسية مطلوبة'),
  finish_type: z.string().min(1, 'نوع الإنهاء مطلوب'),
  notes: z.string().optional(),
  quantity: z.number().min(1, 'الكمية يجب أن تكون على الأقل 1'),
  date_received: z.string().min(1, 'تاريخ الاستلام مطلوب'),
  date_due: z.string().min(1, 'تاريخ التسليم مطلوب'),
  urgency_level: z.string().optional(),
  warranty_period: z.number().min(0).optional().or(z.undefined()),
  try_in_date: z.string().optional(),
  remake_reason: z.string().optional(),
  unit_price: z.number().min(0, 'سعر الوحدة يجب أن يكون رقم موجب'),
  price: z.number().min(0, 'السعر الإجمالي يجب أن يكون رقم موجب'),
  assigned_worker_id: z.number().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export interface OrderFormProps {
  initialData?: Order;
  dentists: Dentist[];
  workers: Worker[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrderForm({
  initialData,
  dentists,
  workers,
  onSubmit,
  onCancel,
  isLoading = false,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: initialData ? {
      dentist_id: initialData.dentist_id,
      case_type: initialData.case_type,
      tooth_numbers: typeof initialData.tooth_numbers === 'string' 
        ? initialData.tooth_numbers 
        : JSON.parse(initialData.tooth_numbers).join(', '),
      shade: initialData.shade,
      main_material: initialData.main_material,
      finish_type: initialData.finish_type,
      notes: initialData.notes || '',
      quantity: initialData.quantity,
      date_received: new Date(initialData.date_received * 1000).toISOString().split('T')[0],
      date_due: new Date(initialData.date_due * 1000).toISOString().split('T')[0],
      urgency_level: initialData.urgency_level || '',
      warranty_period: initialData.warranty_period || undefined,
      try_in_date: initialData.try_in_date 
        ? new Date(initialData.try_in_date * 1000).toISOString().split('T')[0]
        : '',
      remake_reason: initialData.remake_reason || '',
      unit_price: initialData.quantity > 0 ? initialData.price / initialData.quantity : 0,
      price: initialData.price,
      assigned_worker_id: initialData.assigned_worker_id || 0,
    } : {
      dentist_id: 0,
      case_type: '',
      tooth_numbers: '',
      shade: '',
      main_material: '',
      finish_type: '',
      notes: '',
      quantity: 1,
      date_received: new Date().toISOString().split('T')[0],
      date_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      urgency_level: '',
      warranty_period: undefined,
      try_in_date: '',
      remake_reason: '',
      unit_price: 0,
      price: 0,
      assigned_worker_id: 0,
    },
  });

  // Watch quantity and unit_price to calculate total price
  const quantity = watch('quantity');
  const unitPrice = watch('unit_price');

  useEffect(() => {
    const totalPrice = (quantity || 0) * (unitPrice || 0);
    setValue('price', totalPrice);
  }, [quantity, unitPrice, setValue]);

  const handleFormSubmit = (data: OrderFormData) => {
    const submitData: any = {
      dentist_id: data.dentist_id,
      case_type: data.case_type,
      tooth_numbers: data.tooth_numbers.split(',').map(n => n.trim()),
      shade: data.shade,
      main_material: data.main_material,
      finish_type: data.finish_type,
      notes: data.notes,
      quantity: data.quantity,
      date_received: Math.floor(new Date(data.date_received).getTime() / 1000),
      date_due: Math.floor(new Date(data.date_due).getTime() / 1000),
      urgency_level: data.urgency_level && data.urgency_level !== '' ? data.urgency_level as any : undefined,
      warranty_period: typeof data.warranty_period === 'number' && !isNaN(data.warranty_period) ? data.warranty_period : undefined,
      try_in_date: data.try_in_date && data.try_in_date !== '' ? Math.floor(new Date(data.try_in_date).getTime() / 1000) : undefined,
      remake_reason: data.remake_reason || undefined,
      price: data.price,
      assigned_worker_id: data.assigned_worker_id === 0 ? undefined : data.assigned_worker_id,
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="الطبيب *"
          {...register('dentist_id', { valueAsNumber: true })}
          error={errors.dentist_id?.message}
          options={[
            { value: 0, label: 'اختر الطبيب' },
            ...dentists.map(d => ({ value: d.id, label: d.name }))
          ]}
        />

        <Select
          label="نوع الحالة *"
          {...register('case_type')}
          error={errors.case_type?.message}
          options={[
            { value: '', label: 'اختر نوع الحالة' },
            ...CaseTypes.map(ct => ({ value: ct, label: ct }))
          ]}
        />

        <Input
          label="أرقام الأسنان * (مفصولة بفاصلة)"
          {...register('tooth_numbers')}
          error={errors.tooth_numbers?.message}
          placeholder="مثال: 11, 12, 13"
        />

        <Controller
          name="shade"
          control={control}
          render={({ field }) => (
            <ShadeSelector
              value={field.value}
              onChange={field.onChange}
              error={errors.shade?.message}
            />
          )}
        />

        <Select
          label="المادة الأساسية *"
          {...register('main_material')}
          error={errors.main_material?.message}
          options={[
            { value: '', label: 'اختر المادة' },
            ...Materials.map(m => ({ value: m, label: m }))
          ]}
        />

        <Select
          label="نوع الإنهاء *"
          {...register('finish_type')}
          error={errors.finish_type?.message}
          options={[
            { value: '', label: 'اختر نوع الإنهاء' },
            ...FinishTypes.map(ft => ({ value: ft, label: ft }))
          ]}
        />

        <Input
          label="الكمية *"
          type="number"
          {...register('quantity', { valueAsNumber: true })}
          error={errors.quantity?.message}
          placeholder="1"
          min="1"
        />

        <Input
          label="سعر الوحدة (ل.س) *"
          type="number"
          {...register('unit_price', { valueAsNumber: true })}
          error={errors.unit_price?.message}
          placeholder="0"
          min="0"
        />

        <Input
          label="السعر الإجمالي (ل.س)"
          type="number"
          {...register('price', { valueAsNumber: true })}
          error={errors.price?.message}
          placeholder="0"
          disabled
          className="bg-neutral-100 dark:bg-neutral-700"
        />

        <Input
          label="تاريخ الاستلام *"
          type="date"
          {...register('date_received')}
          error={errors.date_received?.message}
        />

        <Input
          label="تاريخ التسليم المتوقع *"
          type="date"
          {...register('date_due')}
          error={errors.date_due?.message}
        />

        <Select
          label="مستوى الأولوية (اختياري)"
          {...register('urgency_level')}
          error={errors.urgency_level?.message}
          options={[
            { value: '', label: 'اختر مستوى الأولوية' },
            { value: 'normal', label: 'عادي' },
            { value: 'urgent', label: 'مستعجل' },
            { value: 'emergency', label: 'طارئ' },
          ]}
        />

        <Input
          label="فترة الضمان (أيام) (اختياري)"
          type="number"
          {...register('warranty_period', { 
            setValueAs: (v) => v === '' || v === null ? undefined : Number(v)
          })}
          error={errors.warranty_period?.message}
          placeholder="0"
          min="0"
        />

        <Input
          label="تاريخ التجربة (اختياري)"
          type="date"
          {...register('try_in_date')}
          error={errors.try_in_date?.message}
        />

        <Select
          label="العامل المكلف (اختياري)"
          {...register('assigned_worker_id', { valueAsNumber: true })}
          error={errors.assigned_worker_id?.message}
          options={[
            { value: 0, label: 'غير محدد' },
            ...workers.filter(w => w.status === 'active').map(w => ({ value: w.id, label: w.name }))
          ]}
        />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            سبب الإعادة (اختياري)
          </label>
          <textarea
            {...register('remake_reason')}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
            placeholder="إذا كان هذا الطلب إعادة لطلب سابق، اذكر السبب..."
          />
          {errors.remake_reason && (
            <p className="mt-1 text-sm text-error">{errors.remake_reason.message}</p>
          )}
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