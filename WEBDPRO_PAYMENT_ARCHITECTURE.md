# 🏦 WebDPro Payment Architecture - Dual Flow System

## 🎯 **CORE CONCEPT**

**Two Separate Payment Flows:**
1. **Customer Orders** → Merchant's Razorpay Account (Embedded)
2. **WebDPro Subscriptions** → Our Razorpay Account (Direct)

**Key Principle:** WebDPro NEVER touches customer money, only subscription money.

---

## 💰 **FLOW 1: Customer Order Payments (Embedded Razorpay)**

### **Merchant Experience (60 seconds setup):**
```
Step 1: Merchant clicks "Enable Payments"
Step 2: Enter 4 details:
  - Business name
  - Mobile (OTP verification)  
  - Bank account number
  - IFSC code
Step 3: Payments start working immediately
```

### **Technical Implementation:**
```
Customer Order Flow:
1. Customer clicks "Buy" on merchant website
2. Generated website calls WebDPro Order API
3. WebDPro creates order in merchant's Razorpay account
4. Customer pays → Money goes to merchant's Razorpay balance
5. Razorpay settles to merchant's bank account
6. WebDPro gets webhook → Updates order status
```

### **Behind the Scenes:**
- Razorpay Partner API creates merchant accounts
- Each merchant gets isolated Razorpay account
- WebDPro uses Partner credentials to manage accounts
- Money flow: Customer → Merchant Bank (WebDPro never touches)

---

## 💳 **FLOW 2: WebDPro Subscription Payments (Direct)**

### **Subscription Plans:**
```
🆓 FREE PLAN (1 business)
  - 1 website
  - Basic AI generation
  - 100 orders/month
  - WebDPro branding

💎 PRO PLAN (₹999/month)
  - 3 websites
  - Advanced AI features
  - Unlimited orders
  - Custom domain
  - No branding

🚀 ENTERPRISE (₹4999/month)
  - 10 websites
  - White-label solution
  - Priority support
  - Custom integrations
```

### **Technical Implementation:**
```
Subscription Flow:
1. Merchant upgrades plan in WebDPro dashboard
2. WebDPro creates subscription using OUR Razorpay keys
3. Merchant pays → Money goes to WebDPro account
4. WebDPro updates merchant plan in database
5. Features unlocked immediately
```

---

## 🏗️ **DATABASE SCHEMA**

### **Merchants Table:**
```sql
merchants:
  merchant_id (PK)
  phone
  email
  plan_type (free/pro/enterprise)
  subscription_status (active/expired/cancelled)
  subscription_id (Razorpay subscription ID)
  businesses_count (0-10 based on plan)
  created_at
  updated_at
```

### **Merchant Payment Accounts:**
```sql
merchant_payment_accounts:
  merchant_id (PK)
  razorpay_account_id
  account_status (pending/active/suspended)
  business_name
  bank_account
  ifsc_code
  kyc_status
  created_at
```

### **Orders Table:**
```sql
orders:
  order_id (PK)
  merchant_id
  business_id
  customer_phone
  items (JSON)
  total_amount
  payment_status (pending/paid/failed)
  razorpay_order_id
  razorpay_payment_id
  created_at
```

### **Subscriptions Table:**
```sql
subscriptions:
  subscription_id (PK)
  merchant_id
  plan_type
  amount
  status (active/cancelled/expired)
  razorpay_subscription_id
  next_billing_date
  created_at
```

---

## 🔐 **SECURITY & COMPLIANCE**

### **Multi-Tenant Isolation:**
```
✅ Each merchant → Separate Razorpay account
✅ Each business → Separate S3 folder
✅ Each order → Merchant-specific partition key
✅ No cross-merchant data access
✅ Bank-level security standards
```

### **Payment Security:**
```
✅ PCI DSS compliant (Razorpay handles)
✅ RBI compliant (Partner API)
✅ No card data storage
✅ Encrypted webhooks
✅ Rate limiting on APIs
```

---

## 🚀 **API ENDPOINTS**

### **Merchant Payment Setup:**
```
POST /merchants/{merchantId}/payments/setup
Body: {
  businessName: string,
  mobile: string,
  bankAccount: string,
  ifscCode: string
}
```

### **Customer Order Creation:**
```
POST /orders/create
Body: {
  businessId: string,
  items: Array,
  customerPhone: string,
  totalAmount: number
}
```

### **Subscription Management:**
```
POST /subscriptions/create
PUT /subscriptions/{id}/upgrade
DELETE /subscriptions/{id}/cancel
```

---

## 🎯 **IMPLEMENTATION PHASES**

### **Phase 1: Core Payment System**
- [x] Dual Razorpay integration
- [x] Merchant account creation
- [x] Order processing
- [x] Webhook handling

### **Phase 2: Subscription System**
- [x] Plan management
- [x] Billing cycles
- [x] Feature gating
- [x] Upgrade/downgrade flows

### **Phase 3: Advanced Features**
- [ ] Analytics dashboard
- [ ] Automated settlements
- [ ] Dispute management
- [ ] Multi-currency support

---

## 💡 **FUTURE-PROOF DESIGN**

### **Scalability:**
- Microservices architecture
- Event-driven communication
- Horizontal scaling ready
- Multi-region deployment

### **Extensibility:**
- Plugin architecture for payment gateways
- Webhook system for integrations
- API-first design
- White-label ready

### **Maintainability:**
- Clean code architecture
- Comprehensive testing
- Monitoring & alerting
- Documentation-driven development

---

## 🏆 **COMPETITIVE ADVANTAGES**

1. **Zero Payment Friction:** 60-second merchant onboarding
2. **Legal Safety:** RBI compliant, no money handling
3. **Merchant Trust:** Direct bank settlements
4. **Scale Ready:** 1 to 100,000 merchants
5. **Investor Friendly:** Clean revenue model

**This is the Shopify-killer architecture, done right.**