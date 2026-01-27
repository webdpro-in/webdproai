export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const PAYMENTS_BASE_URL = process.env.NEXT_PUBLIC_PAYMENTS_URL || "";
export const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "";
export const INVENTORY_BASE_URL = process.env.NEXT_PUBLIC_INVENTORY_URL || "";

interface APIError {
   error: string;
   details?: string;
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
   const token = localStorage.getItem("token");

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

// --- AUTH ---
export const apiAuth = {
   requestOTP: async (phone: string) => {
      return fetchAPI<{ success: boolean; session: string; message: string }>(
         `${API_BASE_URL}/auth/otp/request`,
         { method: "POST", body: JSON.stringify({ phone, role: "BUSINESS_OWNER" }) }
      );
   },

   verifyOTP: async (phone: string, otp: string, session: string) => {
      return fetchAPI<{
         success: boolean;
         tokens: { accessToken: string; idToken: string; refreshToken: string };
         user: { id: string; phone: string; role: string; name: string };
      }>(
         `${API_BASE_URL}/auth/otp/verify`,
         { method: "POST", body: JSON.stringify({ phone, otp, session }) }
      );
   }
};

// --- STORES ---
export const apiStores = {
   generateStore: async (data: {
      prompt: string;
      storeType?: string;
      language?: string;
      currency?: string;
   }) => {
      return fetchAPI<{
         success: boolean;
         store: { store_id: string; status: string; preview_url: string; config: any };
      }>(
         `${API_BASE_URL}/stores/generate`,
         { method: "POST", body: JSON.stringify(data) }
      );
   },

   getStores: async () => {
      return fetchAPI<{ success: boolean; stores: any[]; count: number }>(
         `${API_BASE_URL}/stores`
      );
   },

   getStore: async (storeId: string) => {
      return fetchAPI<{ success: boolean; store: any }>(
         `${API_BASE_URL}/stores/${storeId}`
      );
   },

   publishStore: async (storeId: string, subdomain?: string) => {
      return fetchAPI<{
         success: boolean;
         store: { store_id: string; status: string; live_url: string; domain: string };
      }>(
         `${API_BASE_URL}/stores/${storeId}/publish`,
         { method: "POST", body: JSON.stringify({ subdomain }) }
      );
   }
};

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
   },

   createStoreOrder: async (orderId: string) => {
      return fetchAPI<{
         success: boolean;
         order_id: string;
         razorpay_order_id: string;
         amount: number;
         currency: string;
      }>(
         `${PAYMENTS_BASE_URL}/payments/checkout`,
         { method: "POST", body: JSON.stringify({ order_id: orderId }) }
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
      return fetchAPI<{ success: true; url: string }>(
         `${AI_BASE_URL}/ai/generate`,
         { method: "POST", body: JSON.stringify(data) }
      );
   }
};

// --- INVENTORY ---
export const apiInventory = {
   getProducts: async (storeId: string) => {
      return fetchAPI<any[]>(`${INVENTORY_BASE_URL}/inventory/${storeId}/products`);
   },

   createProduct: async (storeId: string, product: any) => {
      return fetchAPI(`${INVENTORY_BASE_URL}/inventory/${storeId}/products`, {
         method: "POST",
         body: JSON.stringify(product)
      });
   },

   updateStock: async (storeId: string, productId: string, quantity: number) => {
      return fetchAPI(`${INVENTORY_BASE_URL}/inventory/${storeId}/stock/${productId}`, {
         method: "PUT",
         body: JSON.stringify({ quantity, operation: "set" })
      });
   },

   getLowStock: async (storeId: string) => {
      return fetchAPI<any[]>(`${INVENTORY_BASE_URL}/inventory/${storeId}/low-stock`);
   }
};

// --- ORDERS ---
export const apiOrders = {
   listOrders: async (storeId: string) => {
      return fetchAPI<any[]>(`${API_BASE_URL}/stores/${storeId}/orders`);
   },

   updateOrderStatus: async (orderId: string, status: string) => {
      return fetchAPI<{ success: boolean; order: any }>(
         `${API_BASE_URL}/orders/${orderId}/status`,
         { method: "PUT", body: JSON.stringify({ status }) }
      );
   }
};