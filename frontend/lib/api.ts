export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const PAYMENTS_BASE_URL = process.env.NEXT_PUBLIC_PAYMENTS_URL || "";
export const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "";
export const INVENTORY_BASE_URL = process.env.NEXT_PUBLIC_INVENTORY_URL || "";

interface APIError {
   error: string;
   details?: string;
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
   const token = localStorage.getItem("token"); // For Cognito Auth if integrated later

   const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options?.headers,
   };

   const res = await fetch(url, { ...options, headers });
   const data = await res.json();

   if (!res.ok) {
      throw new Error((data as APIError).error || "API Request Failed");
   }

   return data as T;
}

// --- PAYMENTS ---
export const apiPayments = {
   onboardMerchant: async (data: {
      tenant_id: string;
      name: string;
      email: string;
      business_name: string;
   }) => {
      return fetchAPI<{ success: true; account_id: string }>(
         `${PAYMENTS_BASE_URL}/payments/onboard`,
         { method: "POST", body: JSON.stringify(data) }
      );
   },

   createSubscription: async (tenantId: string, planId: string) => {
      return fetchAPI<{ success: true; subscription_id: string; short_url: string }>(
         `${PAYMENTS_BASE_URL}/payments/subscription`,
         { method: "POST", body: JSON.stringify({ tenantId, planId }) }
      );
   }
};

// --- AI SERVICES ---
export const apiAI = {
   generateWebsite: async (data: {
      businessName: string;
      description?: string;
      themePreference?: string;
      tenantId: string;
   }) => {
      // Assuming headers will carry Tenant ID in real auth, but MVP might pass in body
      return fetchAPI<{ success: true; url: string }>(
         `${AI_BASE_URL}/ai/generate`,
         { method: "POST", body: JSON.stringify(data) }
      );
   }
};

// --- ORDERS ---
export const apiOrders = {
   listOrders: async (tenantId: string): Promise<any[]> => {
      return fetchAPI<any[]>(`${API_BASE_URL}/orders?tenantId=${tenantId}`);
   }
};

// --- INVENTORY ---
export const apiInventory = {
   updateStock: async (storeId: string, productId: string, qty: number) => {
      return fetchAPI(`${INVENTORY_BASE_URL}/inventory/${storeId}/stock/${productId}`, {
         method: "PUT",
         body: JSON.stringify({ quantity: qty, operation: "set" })
      });
   }
};