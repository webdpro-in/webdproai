# AWS Amplify Configuration Guide

To resolve the **500 Internal Server Error** and make your application work, you must configure the following Environment Variables in the Amplify Console.

## 1. Environment Variables

Go to **Amplify Console > App settings > Environment variables** and add these key-value pairs.

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_AI_URL` | `https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_INVENTORY_URL` | `https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_PAYMENTS_URL` | `https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_CLOUDFRONT_DOMAIN` | `d3qhkomcxcxmtl.cloudfront.net` |
| `NEXT_PUBLIC_ASSETS_BUCKET` | `webdpro-assets-dev` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `eu-north-1_RfO53Cz5t` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `7g6sqvvnqsg628napds0k73190` |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | `webdpro-auth-prod-2026` |
| `NEXT_PUBLIC_COGNITO_REGION` | `eu-north-1` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `<your-razorpay-key-id>` |
| `NEXT_PUBLIC_APP_URL` | `https://webdpro.in` |

> **Note:** You can also set `NEXT_PUBLIC_APP_URL` to your default Amplify URL (e.g., `https://main.dfi4inao7jk0t.amplifyapp.com`) if you haven't set up the custom domain `webdpro.in` yet.

## 2. Important: Update Cognito Callback URLs

Since you are setting `NEXT_PUBLIC_APP_URL` to `https://webdpro.in`, you **MUST** update your AWS Cognito User Pool to allow this domain for login redirects.

1.  Go to the **AWS Cognito Console**.
2.  Select User Pool: `eu-north-1_RfO53Cz5t`.
3.  Go to **App Integration** tab.
4.  Find "App client settings" or "Hosted UI" settings.
5.  Add `https://webdpro.in/auth/callback` to the **Allowed Callback URLs**.
6.  Add `https://webdpro.in/auth/logout` to the **Allowed Sign-out URLs**.
    *(If you use the Amplify default domain, add `https://main.dfi4inao7jk0t.amplifyapp.com/auth/callback` instead)*.

## 3. Redeploy

After saving these settings in Amplify, go to the **Hosting** page and click **Redeploy this version** to apply the changes.
