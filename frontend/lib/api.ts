export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const PAYMENTS_BASE_URL = process.env.NEXT_PUBLIC_PAYMENTS_URL || "";
export const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "";
export const INVENTORY_BASE_URL = process.env.NEXT_PUBLIC_INVENTORY_URL || "";

interface APIError {
   error: string;
   details?: string;
}

function getToken(): string | null {
   if (typeof window === "undefined") return null;
   return localStorage.getItem("token");
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
   if (!url || !url.startsWith("http")) {
      throw new Error("API base URL not configured. Set NEXT_PUBLIC_API_URL (and related) in .env.local.");
   }
   const token = getToken();
   const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
   };

   const res = await fetch(url, { ...options, headers });
   let data: unknown;
   try {
      data = await res.json();
   } catch {
      data = {};
   }
   if (!res.ok) {
      throw new Error((data as APIError)?.error || `API request failed (${res.status})`);
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

function requireBase(base: string, name: string): asserts base is string {
   if (!base || !base.startsWith("http")) {
      throw new Error(`${name} API URL not configured. Add it to .env.local.`);
   }
}

// --- PAYMENTS ---
export const apiPayments = {
   onboardMerchant: async (data: {
      tenant_id: string;
      name: string;
      email: string;
      business_name: string;
   }) => {
      requireBase(PAYMENTS_BASE_URL, "Payments");
      return fetchAPI<{ success: true; account_id: string }>(
         `${PAYMENTS_BASE_URL}/payments/onboard`,
         { method: "POST", body: JSON.stringify(data) }
      );
   },

   createSubscription: async (tenantId: string, planId: string) => {
      requireBase(PAYMENTS_BASE_URL, "Payments");
      return fetchAPI<{ success: true; subscription_id: string; short_url: string }>(
         `${PAYMENTS_BASE_URL}/payments/subscription`,
         { method: "POST", body: JSON.stringify({ tenantId, planId }) }
      );
   },

   createStoreOrder: async (orderId: string) => {
      requireBase(PAYMENTS_BASE_URL, "Payments");
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
      if (!AI_BASE_URL || !AI_BASE_URL.startsWith("http")) {
         throw new Error("AI URL not configured. Set NEXT_PUBLIC_AI_URL in .env.local.");
      }
      return fetchAPI<{ success: true; url: string }>(
         `${AI_BASE_URL}/ai/generate`,
         { method: "POST", body: JSON.stringify(data) }
      );
   }
};

// --- INVENTORY ---
export const apiInventory = {
   getProducts: async (storeId: string) => {
      requireBase(INVENTORY_BASE_URL, "Inventory");
      return fetchAPI<unknown[]>(`${INVENTORY_BASE_URL}/inventory/${storeId}/products`);
   },

   createProduct: async (storeId: string, product: unknown) => {
      requireBase(INVENTORY_BASE_URL, "Inventory");
      return fetchAPI<unknown>(`${INVENTORY_BASE_URL}/inventory/${storeId}/products`, {
         method: "POST",
         body: JSON.stringify(product)
      });
   },

   updateStock: async (storeId: string, productId: string, quantity: number) => {
      requireBase(INVENTORY_BASE_URL, "Inventory");
      return fetchAPI<unknown>(`${INVENTORY_BASE_URL}/inventory/${storeId}/stock/${productId}`, {
         method: "PUT",
         body: JSON.stringify({ quantity, operation: "set" })
      });
   },

   getLowStock: async (storeId: string) => {
      requireBase(INVENTORY_BASE_URL, "Inventory");
      return fetchAPI<unknown[]>(`${INVENTORY_BASE_URL}/inventory/${storeId}/low-stock`);
   }
};

// --- ORDERS ---
export const apiOrders = {
   listOrders: async (storeId: string) => {
      const data = await fetchAPI<{ success?: boolean; orders?: unknown[]; count?: number }>(
         `${API_BASE_URL}/stores/${storeId}/orders`
      );
      return Array.isArray((data as { orders?: unknown[] }).orders)
         ? (data as { orders: unknown[] }).orders
         : [];
   },

   updateOrderStatus: async (orderId: string, status: string) => {
      return fetchAPI<{ success: boolean; order: unknown }>(
         `${API_BASE_URL}/orders/${orderId}/status`,
         { method: "PUT", body: JSON.stringify({ status }) }
      );
   }
};