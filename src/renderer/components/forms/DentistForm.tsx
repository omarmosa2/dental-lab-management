import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Dentist, CreateDentistDto, UpdateDentistDto } from '../../../shared/types/api.types';

const dentistSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  gender: z.union([z.literal('male'), z.literal('female')]).refine((val) => val === 'male' || val === 'female', {
    message: 'الجنس مطلوب'
  }),
  residence: z.string().min(1, 'السكن مطلوب'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  clinic_name: z.string().optional(),
  specialization: z.string().optional(),
  case_types: z.string().optional(),
  payment_terms: z.enum(['immediate', '7_days', '15_days', '30_days'] as const).optional(),
  discount_rate: z.number().min(0).max(100).optional(),
  cost: z.number().min(0, 'التكلفة يجب أن تكون رقم موجب'),
  notes: z.string().optional(),
});

type DentistFormData = z.infer<typeof dentistSchema>;

// Helper function to convert comma-separated string to array
function stringToArray(str: string | undefined): string[] {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(item => item.trim()).filter(item => item !== '');
}

export interface DentistFormProps {
  initialData?: Dentist;
  onSubmit: (data: CreateDentistDto | UpdateDentistDto) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DentistForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: DentistFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DentistFormData>({
    resolver: zodResolver(dentistSchema),
    defaultValues: initialData ? {
      ...initialData,
      case_types: Array.isArray(initialData.case_types) 
        ? initialData.case_types.join(', ') 
        : initialData.case_types || '',
      payment_terms: initialData.payment_terms || undefined,
      discount_rate: initialData.discount_rate || undefined,
    } : {
      name: '',
      gender: 'male',
      residence: '',
      phone: '',
      clinic_name: '',
      specialization: '',
      case_types: '',
      payment_terms: undefined,
      discount_rate: undefined,
      cost: 0,
      notes: '',
    },
  });

  const handleFormSubmit = async (data: DentistFormData) => {
    try {
      // Convert string fields to arrays before submitting
      const transformedData: CreateDentistDto = {
        name: data.name,
        gender: data.gender,
        residence: data.residence,
        phone: data.phone,
        clinic_name: data.clinic_name,
        specialization: data.specialization,
        case_types: stringToArray(data.case_types),
        payment_terms: data.payment_terms,
        discount_rate: data.discount_rate,
        cost: data.cost,
        notes: data.notes,
      };

      await onSubmit(transformedData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error will be handled by parent component
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="اسم الطبيب *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="أدخل اسم الطبيب"
        />

        <Select
          label="الجنس *"
          {...register('gender')}
          error={errors.gender?.message}
          options={[
            { value: 'male', label: 'ذكر' },
            { value: 'female', label: 'أنثى' },
          ]}
        />

        <Input
          label="السكن *"
          {...register('residence')}
          error={errors.residence?.message}
          placeholder="المدينة أو المنطقة"
        />

        <Input
          label="رقم الهاتف *"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder="09xxxxxxxx"
          dir="ltr"
        />

        <Input
          label="اسم العيادة (اختياري)"
          {...register('clinic_name')}
          error={errors.clinic_name?.message}
          placeholder="عيادة الدكتور..."
        />

        <Select
          label="التخصص (اختياري)"
          {...register('specialization')}
          error={errors.specialization?.message}
          options={[
            { value: '', label: 'اختر التخصص' },
            { value: 'عام', label: 'عام' },
            { value: 'تجميل', label: 'تجميل' },
            { value: 'تقويم', label: 'تقويم' },
            { value: 'جراحة', label: 'جراحة' },
            { value: 'زراعة', label: 'زراعة' },
            { value: 'أطفال', label: 'أطفال' },
            { value: 'لثة', label: 'لثة' },
          ]}
        />

        <Input
          label="أنواع الحالات المفضلة (اختياري)"
          {...register('case_types')}
          error={errors.case_types?.message}
          placeholder="افصل بفاصلة: تيجان، جسور، زراعة"
        />

        <Select
          label="شروط الدفع (اختياري)"
          {...register('payment_terms')}
          error={errors.payment_terms?.message}
          options={[
            { value: '', label: 'اختر شروط الدفع' },
            { value: 'immediate', label: 'فوري' },
            { value: '7_days', label: '7 أيام' },
            { value: '15_days', label: '15 يوم' },
            { value: '30_days', label: '30 يوم' },
          ]}
        />

        <Input
          label="نسبة الخصم الدائمة (%) (اختياري)"
          type="number"
          {...register('discount_rate', { valueAsNumber: true })}
          error={errors.discount_rate?.message}
          placeholder="0"
          min="0"
          max="100"
        />

        <Input
          label="التكلفة الافتراضية (ل.س) *"
          type="number"
          {...register('cost', { valueAsNumber: true })}
          error={errors.cost?.message}
          placeholder="0"
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