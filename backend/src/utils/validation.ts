/**
 * Input Validation Utilities
 * Common validation functions for request data
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateString(value: unknown, fieldName: string, options?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}): void {
  validateRequired(value, fieldName);
  
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }
  
  if (options?.minLength && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      fieldName
    );
  }
  
  if (options?.maxLength && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      fieldName
    );
  }
  
  if (options?.pattern && !options.pattern.test(value)) {
    throw new ValidationError(
      `${fieldName} has invalid format`,
      fieldName
    );
  }
}

export function validateEmail(value: unknown, fieldName: string = 'email'): void {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  validateString(value, fieldName, { pattern: emailPattern });
}

export function validatePhone(value: unknown, fieldName: string = 'phone'): void {
  const phonePattern = /^\+?[1-9]\d{1,14}$/;
  validateString(value, fieldName, { pattern: phonePattern });
}

export function validateUUID(value: unknown, fieldName: string): void {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  validateString(value, fieldName, { pattern: uuidPattern });
}

export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): void {
  validateRequired(value, fieldName);
  
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName,
      { allowedValues }
    );
  }
}

export function validateNumber(value: unknown, fieldName: string, options?: {
  min?: number;
  max?: number;
  integer?: boolean;
}): void {
  validateRequired(value, fieldName);
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a number`, fieldName);
  }
  
  if (options?.integer && !Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be an integer`, fieldName);
  }
  
  if (options?.min !== undefined && num < options.min) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.min}`,
      fieldName
    );
  }
  
  if (options?.max !== undefined && num > options.max) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.max}`,
      fieldName
    );
  }
}

export function sanitizeString(value: string): string {
  // Remove potential XSS vectors
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function parseJSON<T = unknown>(value: string | null, fieldName: string = 'body'): T {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new ValidationError(`${fieldName} must be valid JSON`, fieldName);
  }
}
