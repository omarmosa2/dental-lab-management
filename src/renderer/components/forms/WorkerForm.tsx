import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Worker, CreateWorkerDto, UpdateWorkerDto } from '../../../shared/types/api.types';

const workerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  salary: z.number().min(0, 'الراتب يجب أن يكون رقم موجب'),
  hire_date: z.string().min(1, 'تاريخ التوظيف مطلوب'),
  specialization: z.string().optional(),
  performance_rating: z.number().min(0).max(5).optional(),
  national_id: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type WorkerFormData = z.infer<typeof workerSchema>;

export interface WorkerFormProps {
  initialData?: Worker;
  onSubmit: (data: CreateWorkerDto | UpdateWorkerDto) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkerForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: WorkerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      phone: initialData.phone,
      salary: initialData.salary,
      hire_date: new Date(initialData.hire_date * 1000).toISOString().split('T')[0],
      specialization: initialData.specialization || '',
      performance_rating: initialData.performance_rating || 0,
      national_id: initialData.national_id || '',
      address: initialData.address || '',
      notes: initialData.notes || '',
    } : {
      name: '',
      phone: '',
      salary: 0,
      hire_date: new Date().toISOString().split('T')[0],
      specialization: '',
      performance_rating: 0,
      national_id: '',
      address: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: WorkerFormData) => {
    try {
      const submitData: CreateWorkerDto = {
        name: data.name,
        phone: data.phone,
        salary: data.salary,
        hire_date: Math.floor(new Date(data.hire_date).getTime() / 1000),
        specialization: data.specialization,
        performance_rating: data.performance_rating,
        national_id: data.national_id,
        address: data.address,
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
          label="اسم العامل *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="أدخل اسم العامل"
        />

        <Input
          label="رقم الهاتف *"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder="09xxxxxxxx"
          dir="ltr"
        />

        <Input
          label="الراتب (ل.س) *"
          type="number"
          {...register('salary', { valueAsNumber: true })}
          error={errors.salary?.message}
          placeholder="0"
        />

        <Input
          label="تاريخ التوظيف *"
          type="date"
          {...register('hire_date')}
          error={errors.hire_date?.message}
        />

        <Select
          label="التخصص (اختياري)"
          {...register('specialization')}
          error={errors.specialization?.message}
          options={[
            { value: '', label: 'اختر التخصص' },
            { value: 'سيراميك', label: 'سيراميك' },
            { value: 'معادن', label: 'معادن' },
            { value: 'تقويم', label: 'تقويم' },
            { value: 'زراعة', label: 'زراعة' },
            { value: 'أطقم', label: 'أطقم' },
            { value: 'عام', label: 'عام' },
          ]}
        />

        <Input
          label="تقييم الأداء (0-5) (اختياري)"
          type="number"
          {...register('performance_rating', { valueAsNumber: true })}
          error={errors.performance_rating?.message}
          placeholder="0"
          min="0"
          max="5"
          step="0.1"
        />

        <Input
          label="الرقم الوطني (اختياري)"
          {...register('national_id')}
          error={errors.national_id?.message}
          placeholder="رقم الهوية الوطنية"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          العنوان (اختياري)
        </label>
        <textarea
          {...register('address')}
          rows={2}
          className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
          placeholder="العنوان الكامل..."
        />
        {errors.address && (
          <p className="mt-1 text-sm text-error">{errors.address.message}</p>
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