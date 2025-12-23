import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook لإدارة سلوك مفتاح Enter بشكل ذكي
 * - في الصفحات العادية: يرجع للقائمة الرئيسية
 * - في النماذج والمودال: يقوم بعمل submit
 */
export function useEnterKeyNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleEnterKey = (event: KeyboardEvent) => {
      // تجاهل إذا لم يكن Enter
      if (event.key !== 'Enter') return;

      const target = event.target as HTMLElement;
      
      // تحديد السياق الحالي
      const isInForm = target.closest('form') !== null;
      const isInModal = target.closest('[role="dialog"]') !== null || 
                        target.closest('.modal') !== null;
      const isButton = target.tagName === 'BUTTON';
      const isSubmitButton = isButton && (target as HTMLButtonElement).type === 'submit';
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isTextarea = target.tagName === 'TEXTAREA';
      const isSearchInput = target.classList.contains('search-input') || 
                           target.getAttribute('type') === 'search';
      
      // حالات عدم التدخل (دع السلوك الافتراضي يعمل):
      // 1. إذا كان في textarea (للسماح بالسطر الجديد)
      if (isTextarea && !event.ctrlKey) {
        return;
      }
      
      // 2. إذا كان في نموذج وضغط Enter في input field
      if (isInForm && isInputField) {
        // دع النموذج يتعامل معه (submit)
        return;
      }
      
      // 3. إذا كان في modal وضغط على زر submit
      if (isInModal && (isSubmitButton || isButton)) {
        // دع الزر يتعامل معه
        return;
      }

      // 4. إذا كان في حقل بحث
      if (isSearchInput) {
        // دع البحث يتعامل معه
        return;
      }

      // حالات التدخل (العودة للقائمة):
      // 1. إذا كان في صفحة عادية (ليس في نموذج أو modal)
      if (!isInForm && !isInModal && location.pathname !== '/menu') {
        event.preventDefault();
        navigate('/menu');
        return;
      }

      // 2. إذا كان في modal لكن ليس في input field (إغلاق المودال)
      if (isInModal && !isInputField && !isButton) {
        // ابحث عن زر الإغلاق أو الإلغاء
        const modal = target.closest('[role="dialog"]') || target.closest('.modal');
        if (modal) {
          const closeButton = modal.querySelector('[data-close]') as HTMLButtonElement;
          const cancelButton = modal.querySelector('button[type="button"]') as HTMLButtonElement;
          
          if (closeButton) {
            event.preventDefault();
            closeButton.click();
          } else if (cancelButton && cancelButton.textContent?.includes('إلغاء')) {
            event.preventDefault();
            cancelButton.click();
          }
        }
      }
    };

    window.addEventListener('keydown', handleEnterKey);
    return () => window.removeEventListener('keydown', handleEnterKey);
  }, [navigate, location]);
}