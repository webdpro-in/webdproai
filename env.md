# Environment Variable Checklist (FINAL)

## Frontend (.env.production / .env.local)

```env
NEXT_PUBLIC_BACKEND_URL=https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev
NEXT_PUBLIC_AI_URL=https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev
NEXT_PUBLIC_INVENTORY_URL=https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev
NEXT_PUBLIC_ORDERS_URL=<WAITING_FOR_INFO>
NEXT_PUBLIC_PAYMENTS_URL=https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev
NEXT_PUBLIC_DELIVERY_URL=<WAITING_FOR_DEPLOY>
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=https://d3qhkomcxcxmtl.cloudfront.net
NEXT_PUBLIC_REGION=eu-north-1
```

## Backend Services

### Backend
- AI_SERVICE_URL: https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev
- INVENTORY_SERVICE_URL: https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev
- PAYMENTS_SERVICE_URL: https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev

### Other Services
Ensure all services share the same `DYNAMODB_TABLE_PREFIX` (webdpro) and `AWS_REGION` (eu-north-1).
