import { FormikErrors } from 'formik';
import { JSX, useEffect, useRef } from 'react';

type FormValidationFocusProps<TValues extends Record<string, unknown>> = {
  errors: FormikErrors<TValues>;
  submitCount: number;
  isSubmitting: boolean;
  fieldOrder: ReadonlyArray<keyof TValues>;
};

const focusElement = (fieldName: string): void => {
  const field = document.querySelector<HTMLElement>(`[name="${fieldName}"]`);

  if (!field) {
    return;
  }

  field.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    field.focus();

    if (document.activeElement === field) {
      return;
    }

    const nestedFocusable = field.querySelector<HTMLElement>('input, textarea, select, [role="combobox"]');
    nestedFocusable?.focus();
  }, 50);
};

const FormValidationFocus = <TValues extends Record<string, unknown>,>({
  errors,
  submitCount,
  isSubmitting,
  fieldOrder,
}: FormValidationFocusProps<TValues>): JSX.Element | null => {
  const handledSubmitCountRef = useRef(0);

  useEffect(() => {
    if (submitCount === 0 || isSubmitting || handledSubmitCountRef.current === submitCount) {
      return;
    }

    const firstErrorField = fieldOrder.find((fieldName) => Boolean(errors[fieldName]));

    if (!firstErrorField) {
      return;
    }

    handledSubmitCountRef.current = submitCount;
    focusElement(String(firstErrorField));
  }, [errors, fieldOrder, isSubmitting, submitCount]);

  return null;
};

export default FormValidationFocus;
