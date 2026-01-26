import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
   return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
   }).format(amount);
}

export function formatDate(date: Date | string): string {
   return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
   }).format(new Date(date));
}

export function generateOTP(): string {
   return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidEmail(email: string): boolean {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return emailRegex.test(email);
}

export function isValidMobile(mobile: string): boolean {
   const mobileRegex = /^[6-9]\d{9}$/;
   return mobileRegex.test(mobile);
}
