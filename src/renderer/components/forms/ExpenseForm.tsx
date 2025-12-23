import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ExpenseCategories } from '../../../shared/constants/enums';

const expenseSchema = z.object({
  description: z.string().min(1, 'الوصف مطلوب'),
  amount: z.number().min(0, 'المبلغ يجب أن يكون رقم موجب'),
  category: z.string().min(1, 'الفئة مطلوبة'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  payment_method: z.string().optional(),
  receipt_number: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export interface ExpenseFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ExpenseForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      receipt_number: '',
      vendor: '',
      notes: '',
    },
  });

  const handleFormSubmit = (data: ExpenseFormData) => {
    const submitData = {
      ...data,
      date: Math.floor(new Date(data.date).getTime() / 1000),
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="الوصف *"
          {...register('description')}
          error={errors.description?.message}
          placeholder="مثال: فاتورة كهرباء"
        />

        <Input
          label="المبلغ (ل.س) *"
          type="number"
          {...register('amount', { valueAsNumber: true })}
          error={errors.amount?.message}
          placeholder="0"
        />

        <Select
          label="الفئة *"
          {...register('category')}
          error={errors.category?.message}
          options={[
            { value: '', label: 'اختر الفئة' },
            ...ExpenseCategories.map(cat => ({ value: cat, label: cat }))
          ]}
        />

        <Input
          label="التاريخ *"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />

        <Select
          label="طريقة الدفع (اختياري)"
          {...register('payment_method')}
          error={errors.payment_method?.message}
          options={[
            { value: 'cash', label: 'نقدي' },
            { value: 'check', label: 'شيك' },
            { value: 'transfer', label: 'تحويل بنكي' },
            { value: 'card', label: 'بطاقة' },
          ]}
        />

        <Input
          label="رقم الإيصال (اختياري)"
          {...register('receipt_number')}
          error={errors.receipt_number?.message}
          placeholder="رقم الإيصال أو الفاتورة"
        />

        <Input
          label="المورد/الجهة (اختياري)"
          {...register('vendor')}
          error={errors.vendor?.message}
          placeholder="اسم المورد أو الجهة المدفوع لها"
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
          إضافة
        </Button>
      </div>
    </form>
  );
}