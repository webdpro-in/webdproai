# WebDPro DynamoDB Table Schemas

## Overview
All tables use `on-demand` capacity mode for cost optimization.
Tables are prefixed with `webdpro-` for organization.

---

## Table: webdpro-tenants

**Description**: Multi-tenant isolation. Each business owner is a tenant.

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| tenant_id | String | PK | Unique tenant identifier |
| owner_user_id | String | - | Reference to user who owns tenant |
| business_name | String | - | Business name |
| plan | String | - | Subscription plan (FREE/PRO/ENTERPRISE) |
| subscription_status | String | - | ACTIVE/CANCELLED/EXPIRED |
| razorpay_customer_id | String | - | For recurring payments |
| store_count | Number | - | Number of stores created |
| max_stores | Number | - | Store limit based on plan |
| created_at | String | - | ISO timestamp |
| updated_at | String | - | ISO timestamp |

```json
{
  "TableName": "webdpro-tenants",
  "KeySchema": [
    { "AttributeName": "tenant_id", "KeyType": "HASH" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "tenant_id", "AttributeType": "S" }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## Table: webdpro-users

**Description**: User profiles (all roles).

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| phone | String | PK | Phone number (unique identifier) |
| user_id | String | - | Internal user ID |
| role | String | - | SUPER_ADMIN/BUSINESS_OWNER/DELIVERY_AGENT/CUSTOMER |
| tenant_id | String | - | Linked tenant (for BUSINESS_OWNER) |
| name | String | - | Display name |
| email | String | - | Email address |
| cognito_sub | String | - | Cognito user pool subject |
| is_active | Boolean | - | Account active status |
| created_at | String | - | ISO timestamp |

```json
{
  "TableName": "webdpro-users",
  "KeySchema": [
    { "AttributeName": "phone", "KeyType": "HASH" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "phone", "AttributeType": "S" }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## Table: webdpro-stores

**Description**: AI-generated websites/stores.

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| tenant_id | String | PK | Partition key for tenant isolation |
| store_id | String | SK | Unique store identifier |
| status | String | - | GENERATING/DRAFT/PAID/PUBLISHED/SUSPENDED |
| prompt | String | - | Original AI prompt |
| store_type | String | - | grocery/restaurant/clinic/fashion/general |
| config | Map | - | Generated site configuration |
| language | String | - | Site language |
| currency | String | - | Currency (INR) |
| domain | String | - | Subdomain: store.webdpro.in |
| custom_domain | String | - | Custom domain if purchased |
| live_url | String | - | Production URL |
| preview_url | String | - | Draft preview URL |
| published_at | String | - | First publish timestamp |
| created_at | String | - | ISO timestamp |

```json
{
  "TableName": "webdpro-stores",
  "KeySchema": [
    { "AttributeName": "tenant_id", "KeyType": "HASH" },
    { "AttributeName": "store_id", "KeyType": "RANGE" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "tenant_id", "AttributeType": "S" },
    { "AttributeName": "store_id", "AttributeType": "S" }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## Table: webdpro-products

**Description**: Products/items for each store.

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| store_id | String | PK | Store this product belongs to |
| product_id | String | SK | Unique product identifier |
| name | String | - | Product name |
| description | String | - | Product description |
| price | Number | - | Price in currency |
| currency | String | - | INR |
| category | String | - | Product category |
| images | List | - | Array of image URLs |
| stock_quantity | Number | - | Current stock |
| low_stock_threshold | Number | - | Alert threshold |
| is_active | Boolean | - | Available for purchase |
| prediction | Map | - | AI stock prediction data |
| created_at | String | - | ISO timestamp |

```json
{
  "TableName": "webdpro-products",
  "KeySchema": [
    { "AttributeName": "store_id", "KeyType": "HASH" },
    { "AttributeName": "product_id", "KeyType": "RANGE" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "store_id", "AttributeType": "S" },
    { "AttributeName": "product_id", "AttributeType": "S" }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## Table: webdpro-orders

**Description**: Customer orders.

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| order_id | String | PK | Unique order identifier |
| tenant_id | String | GSI | For tenant queries |
| store_id | String | GSI | For store queries |
| status | String | - | PENDING_PAYMENT/CONFIRMED/PREPARING/OUT_FOR_DELIVERY/DELIVERED/CANCELLED |
| items | List | - | Array of order items |
| subtotal | Number | - | Items total |
| delivery_fee | Number | - | Delivery charge |
| total_amount | Number | - | Final total |
| customer_name | String | - | Customer name |
| customer_phone | String | - | Customer phone |
| delivery_address | String | - | Delivery address |
| payment_method | String | - | UPI/CARD/COD |
| payment_status | String | - | PENDING/PAID/FAILED/COD_PENDING |
| razorpay_payment_id | String | - | Payment reference |
| delivery_agent_id | String | - | Assigned agent |
| delivered_at | String | - | Delivery timestamp |
| created_at | String | - | ISO timestamp |

```json
{
  "TableName": "webdpro-orders",
  "KeySchema": [
    { "AttributeName": "order_id", "KeyType": "HASH" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "order_id", "AttributeType": "S" },
    { "AttributeName": "store_id", "AttributeType": "S" },
    { "AttributeName": "tenant_id", "AttributeType": "S" }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "store-index",
      "KeySchema": [
        { "AttributeName": "store_id", "KeyType": "HASH" }
      ],
      "Projection": { "ProjectionType": "ALL" }
    },
    {
      "IndexName": "tenant-index",
      "KeySchema": [
        { "AttributeName": "tenant_id", "KeyType": "HASH" }
      ],
      "Projection": { "ProjectionType": "ALL" }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## Table: webdpro-deliveries

**Description**: Delivery assignments and tracking.

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| agent_id | String | PK | Delivery agent ID |
| delivery_id | String | SK | Unique delivery identifier |
| order_id | String | - | Linked order |
| tenant_id | String | - | Tenant reference |
| store_id | String | - | Store reference |
| status | String | - | PENDING/PICKED_UP/IN_TRANSIT/DELIVERED/FAILED |
| customer_name | String | - | Customer name |
| customer_phone | String | - | Customer phone |
| delivery_address | String | - | Address |
| is_cod | Boolean | - | Cash on delivery |
| cod_amount | Number | - | COD amount |
| cod_collected | Boolean | - | Cash collected |
| cod_collected_amount | Number | - | Actual collected |
| last_location | Map | - | GPS coordinates |
| picked_up_at | String | - | Pickup timestamp |
| delivered_at | String | - | Delivery timestamp |
| created_at | String | - | ISO timestamp |

```json
{
  "TableName": "webdpro-deliveries",
  "KeySchema": [
    { "AttributeName": "agent_id", "KeyType": "HASH" },
    { "AttributeName": "delivery_id", "KeyType": "RANGE" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "agent_id", "AttributeType": "S" },
    { "AttributeName": "delivery_id", "AttributeType": "S" }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## Table: webdpro-payments

**Description**: Payment records and reconciliation.

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| tenant_id | String | PK | Tenant reference |
| payment_id | String | SK | Payment/Razorpay order ID |
| order_id | String | - | Linked order |
| store_id | String | - | Store reference |
| amount | Number | - | Payment amount |
| currency | String | - | INR |
| payment_method | String | - | UPI/CARD/COD |
| status | String | - | CREATED/CAPTURED/FAILED/REFUNDED |
| razorpay_order_id | String | - | Razorpay order |
| razorpay_payment_id | String | - | Razorpay payment |
| collected_by | String | - | For COD: agent ID |
| created_at | String | - | ISO timestamp |

```json
{
  "TableName": "webdpro-payments",
  "KeySchema": [
    { "AttributeName": "tenant_id", "KeyType": "HASH" },
    { "AttributeName": "payment_id", "KeyType": "RANGE" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "tenant_id", "AttributeType": "S" },
    { "AttributeName": "payment_id", "AttributeType": "S" }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

---

## Create Tables Script

```bash
# Create all DynamoDB tables
aws dynamodb create-table --cli-input-json file://tables/tenants.json
aws dynamodb create-table --cli-input-json file://tables/users.json
aws dynamodb create-table --cli-input-json file://tables/stores.json
aws dynamodb create-table --cli-input-json file://tables/products.json
aws dynamodb create-table --cli-input-json file://tables/orders.json
aws dynamodb create-table --cli-input-json file://tables/deliveries.json
aws dynamodb create-table --cli-input-json file://tables/payments.json
```
