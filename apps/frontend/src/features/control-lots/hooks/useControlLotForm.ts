import { useState } from 'react';
import type { ControlLotResponseDto, CreateControlLotDto } from '@/lib/types/api';

export function useControlLotForm(initialData?: ControlLotResponseDto) {
  const [formData, setFormData] = useState({
    testId: initialData?.testId.toString() || '',
    lotNumber: initialData?.lotNumber || '',
    expirationDate: initialData?.expirationDate 
      ? new Date(initialData.expirationDate).toISOString().split('T')[0] 
      : '',
    targetValue: initialData?.targetValue?.toString() || '',
    mean: initialData?.mean?.toString() || '',
    sd: initialData?.standardDeviation?.toString() || '',
    ucl: initialData?.upperControlLimit?.toString() || '',
    lcl: initialData?.lowerControlLimit?.toString() || '',
    uwl: initialData?.upperWarningLimit?.toString() || '',
    lwl: initialData?.lowerWarningLimit?.toString() || '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const autoCalculateLimits = () => {
    const meanVal = parseFloat(formData.mean);
    const sdVal = parseFloat(formData.sd);
    if (isNaN(meanVal) || isNaN(sdVal)) return 'Invalid numbers';

    setFormData(prev => ({
      ...prev,
      ucl: (meanVal + 3 * sdVal).toFixed(2),
      lcl: (meanVal - 3 * sdVal).toFixed(2),
      uwl: (meanVal + 2 * sdVal).toFixed(2),
      lwl: (meanVal - 2 * sdVal).toFixed(2),
    }));
    return null;
  };

  const resetFormFields = () => {
    setFormData({
      testId: '',
      lotNumber: '',
      expirationDate: '',
      targetValue: '',
      mean: '',
      sd: '',
      ucl: '',
      lcl: '',
      uwl: '',
      lwl: '',
    });
  };

  const getPayload = (): CreateControlLotDto => ({
    testId: parseInt(formData.testId),
    lotNumber: formData.lotNumber,
    expirationDate: formData.expirationDate,
    targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
    mean: formData.mean ? parseFloat(formData.mean) : undefined,
    standardDeviation: formData.sd ? parseFloat(formData.sd) : undefined,
    upperControlLimit: formData.ucl ? parseFloat(formData.ucl) : undefined,
    lowerControlLimit: formData.lcl ? parseFloat(formData.lcl) : undefined,
    upperWarningLimit: formData.uwl ? parseFloat(formData.uwl) : undefined,
    lowerWarningLimit: formData.lwl ? parseFloat(formData.lwl) : undefined,
  });

  return { formData, handleChange, autoCalculateLimits, resetFormFields, getPayload };
}
