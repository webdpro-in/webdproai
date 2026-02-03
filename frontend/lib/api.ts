// WebDPro API Client - Frontend to Backend Communication
// SECURITY: Frontend ONLY calls backend API Gateway
// Frontend NEVER calls AI service, Bedrock, or other internal services directly

// ============================================
// API Base URLs (from environment variables)
// ============================================
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const PAYMENTS_BASE_URL = process.env.NEXT_PUBLIC_PAYMENTS_URL || "";
export const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || "";
export const INVENTORY_BASE_URL = process.env.NEXT_PUBLIC_INVENTORY_URL || "";
export const DELIVERY_BASE_URL = process.env.NEXT_PUBLIC_DELIVERY_URL || "";

// Legacy compatibility
export const BACKEND_URL = API_BASE_URL;

interface APIError {
   error: string;
   details?: string;
}

// Validation function - runs on module load
function validateBackendUrl(): void {
   if (!BACKEND_URL || !BACKEND_URL.startsWith("http")) {
      console.error(
         "Backend URL not configured. Set NEXT_PUBLIC_BACKEND_URL in .env.local.\n" +
         "Local: http://localhost:3001\n" +
         "Production: https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev"
      );
   }
}

// Call validation on module load
validateBackendUrl();

function getToken(): string | null {
   if (typeof window === "undefined") return null;
   return localStorage.getItem("token");
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
   if (!url || !url.startsWith("http")) {
      throw new Error(
         "API base URL not configured. Set NEXT_PUBLIC_BACKEND_URL in .env.local.\n" +
         "Local: http://localhost:3001\n" +
         "Production: https://93vhhkyxx7.execute-api.eu-north-1.amazonaws.com/dev"
      );
   }
   const token = getToken();
   const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
   };

   try {
      // Debug log to help identify URL issues
      // console.log(`[API] Fetching: ${url}`); 
      const res = await fetch(url, { ...options, headers });

      let data: unknown;
      try {
         // Clone response to safely read text if JSON fails
         const clone = res.clone();
         try {
            data = await res.json();
         } catch {
            // If JSON fails, try to read text for error details
            const text = await clone.text();
            console.error(`[API] Invalid JSON response from ${url}:`, text);
            throw new Error(`API request failed: Invalid JSON response`);
         }
      } catch (jsonErr) {
         throw jsonErr;
      }

      if (!res.ok) {
         const errorMessage = (data as APIError)?.error || `API request failed (${res.status})`;
         console.error(`[API] Error ${res.status} from ${url}:`, errorMessage);
         throw new Error(errorMessage);
      }
      return data as T;
   } catch (error: any) {
      console.error(`[API] Network or Parse Error for ${url}:`, error);
      // Check for common issues
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
         throw new Error(`Network error: Unable to connect to backend (${url}). Please check your internet connection or if the backend is reachable.`);
      }
      throw error;
   }
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
         `${BACKEND_URL}/stores/generate`,
         { method: "POST", body: JSON.stringify(data) }
      );
   },

   getStores: async () => {
      return fetchAPI<{ success: boolean; stores: any[]; count: number }>(
         `${BACKEND_URL}/stores`
      );
   },

   getStore: async (storeId: string) => {
      return fetchAPI<{ success: boolean; store: any }>(
         `${BACKEND_URL}/stores/${storeId}`
      );
   },

   updateStore: async (storeId: string, updates: {
      config?: any;
      custom_domain?: string;
      language?: string;
      currency?: string;
   }) => {
      return fetchAPI<{ success: boolean; message: string }>(
         `${BACKEND_URL}/stores/${storeId}`,
         { method: 'PUT', body: JSON.stringify(updates) }
      );
   },

   publishStore: async (storeId: string, subdomain?: string) => {
      return fetchAPI<{
         success: boolean;
         store: { store_id: string; status: string; live_url: string; domain: string };
      }>(
         `${BACKEND_URL}/stores/${storeId}/publish`,
         { method: "POST", body: JSON.stringify({ subdomain }) }
      );
   },

   regenerateStore: async (storeId: string, config?: any) => {
      return fetchAPI<{
         success: boolean;
         preview_url: string;
      }>(
         `${BACKEND_URL}/stores/${storeId}/regenerate`,
         { method: "POST", body: JSON.stringify({ config }) }
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
   },

   updateProduct: async (storeId: string, productId: string, updates: any) => {
      requireBase(INVENTORY_BASE_URL, "Inventory");
      return fetchAPI<unknown>(`${INVENTORY_BASE_URL}/inventory/${storeId}/products/${productId}`, {
         method: "PUT",
         body: JSON.stringify(updates)
      });
   },

   deleteProduct: async (storeId: string, productId: string) => {
      requireBase(INVENTORY_BASE_URL, "Inventory");
      return fetchAPI<{ success: boolean }>(`${INVENTORY_BASE_URL}/inventory/${storeId}/products/${productId}`, {
         method: "DELETE"
      });
   }
};

// --- ORDERS ---
export const apiOrders = {
   listOrders: async (storeId: string) => {
      const data = await fetchAPI<{ success?: boolean; orders?: unknown[]; count?: number }>(
         `${BACKEND_URL}/stores/${storeId}/orders`
      );
      return Array.isArray((data as { orders?: unknown[] }).orders)
         ? (data as { orders: unknown[] }).orders
         : [];
   },

   updateOrderStatus: async (orderId: string, status: string) => {
      return fetchAPI<{ success: boolean; order: unknown }>(
         `${BACKEND_URL}/orders/${orderId}/status`,
         { method: "PUT", body: JSON.stringify({ status }) }
      );
   }
};


// --- DOMAINS ---
export const apiDomains = {
   connectDomain: async (storeId: string, domain: string) => {
      return fetchAPI<{
         success: boolean;
         domain: string;
         dns_records: Array<{ type: string; name: string; value: string }>;
      }>(
         `${BACKEND_URL}/stores/${storeId}/domain`,
         { method: 'POST', body: JSON.stringify({ domain }) }
      );
   },

   getDomainStatus: async (storeId: string) => {
      return fetchAPI<{
         success: boolean;
         domain: string;
         status: 'pending' | 'verified' | 'failed';
         dns_verified: boolean;
      }>(
         `${BACKEND_URL}/stores/${storeId}/domain/status`
      );
   },

   verifyDomain: async (storeId: string) => {
      return fetchAPI<{
         success: boolean;
         verified: boolean;
         message: string;
      }>(
         `${BACKEND_URL}/stores/${storeId}/domain/verify`,
         { method: 'POST' }
      );
   }
};

// --- DELIVERY ---
export const apiDelivery = {
   assignOrder: async (orderId: string, agentId: string) => {
      requireBase(DELIVERY_BASE_URL, "Delivery");
      return fetchAPI<{ success: true; delivery_id: string }>(
         `${DELIVERY_BASE_URL}/delivery/orders/${orderId}/assign`,
         { method: "POST", body: JSON.stringify({ agent_id: agentId }) }
      );
   },

   updateStatus: async (deliveryId: string, status: string, location?: any) => {
      requireBase(DELIVERY_BASE_URL, "Delivery");
      return fetchAPI<{ success: true }>(
         `${DELIVERY_BASE_URL}/delivery/${deliveryId}/status`,
         { method: "PUT", body: JSON.stringify({ status, location }) }
      );
   },

   getTracking: async (deliveryId: string) => {
      requireBase(DELIVERY_BASE_URL, "Delivery");
      return fetchAPI<any>(`${DELIVERY_BASE_URL}/delivery/${deliveryId}/tracking`);
   },

   // Agent facing
   getAssignments: async (agentId: string) => {
      requireBase(DELIVERY_BASE_URL, "Delivery");
      return fetchAPI<any>(`${DELIVERY_BASE_URL}/delivery/agent/${agentId}/assignments`);
   }
};

