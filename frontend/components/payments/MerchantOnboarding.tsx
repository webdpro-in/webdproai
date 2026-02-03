'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, Building2, CheckCircle } from 'lucide-react';

interface MerchantOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function MerchantOnboarding({ onComplete, onSkip }: MerchantOnboardingProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({
    accountNumber: '',
    ifscCode: '',
    businessName: '',
    gstin: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Account Number: 9-18 digits
    if (!formData.accountNumber || !/^\d{9,18}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }

    // IFSC Code: XXXX0XXXXXX format
    if (!formData.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0001234)';
    }

    // Business Name: Required, max 100 chars
    if (!formData.businessName || formData.businessName.length > 100) {
      newErrors.businessName = 'Business name required (max 100 characters)';
    }

    // GSTIN: Optional, but if provided must be 15 chars
    if (formData.gstin && formData.gstin.length !== 15) {
      newErrors.gstin = 'GSTIN must be exactly 15 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStep('processing');

    try {
      // TODO: Integrate with backend merchant onboarding API
      // await apiPayments.onboardMerchant({...})
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setStep('success');
      
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error('Merchant onboarding failed:', error);
      setStep('form');
      setErrors({ submit: 'Failed to setup payment account. Please try again.' });
    }
  };

  if (step === 'processing') {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting up your payment account...</h3>
        <p className="text-sm text-gray-600">This will only take a moment</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Account Setup Complete!</h3>
        <p className="text-sm text-gray-600">You can now accept payments from customers</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4">
          <CreditCard className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Payment Account</h2>
        <p className="text-gray-600">
          Connect your bank account to start accepting payments from customers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.submit}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
            <Building2 className="w-5 h-5" />
            <span>Bank Account Details</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Account Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
              placeholder="Enter 9-18 digit account number"
              maxLength={18}
              className={errors.accountNumber ? 'border-red-300' : ''}
            />
            {errors.accountNumber && (
              <p className="text-xs text-red-600 mt-1">{errors.accountNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.ifscCode}
              onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
              placeholder="e.g., SBIN0001234"
              maxLength={11}
              className={errors.ifscCode ? 'border-red-300' : ''}
            />
            {errors.ifscCode && (
              <p className="text-xs text-red-600 mt-1">{errors.ifscCode}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Format: XXXX0XXXXXX</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Enter your business name"
              maxLength={100}
              className={errors.businessName ? 'border-red-300' : ''}
            />
            {errors.businessName && (
              <p className="text-xs text-red-600 mt-1">{errors.businessName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN (Optional)
            </label>
            <Input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              placeholder="15-character GSTIN"
              maxLength={15}
              className={errors.gstin ? 'border-red-300' : ''}
            />
            {errors.gstin && (
              <p className="text-xs text-red-600 mt-1">{errors.gstin}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Required for GST-registered businesses</p>
          </div>
        </div>

        <div className="flex gap-3">
          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="flex-1"
            >
              Skip for Now
            </Button>
          )}
          <Button
            type="submit"
            variant="premium"
            className="flex-1"
          >
            Setup Payment Account
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your payment information is securely processed by Razorpay
        </p>
      </form>
    </div>
  );
}
