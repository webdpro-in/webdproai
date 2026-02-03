import { APIGatewayProxyEvent } from 'aws-lambda';

export interface APIGatewayEvent extends Omit<APIGatewayProxyEvent, 'body'> {
   body: string | null;
}

export const response = (statusCode: number, body: any) => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

export const getTenantId = (event: APIGatewayEvent): string | null => {
   const isLocalDev = process.env.IS_OFFLINE === 'true' || process.env.AWS_SAM_LOCAL === 'true';

   const authorizerTenantId = event.requestContext?.authorizer?.claims?.['custom:tenant_id'];
   if (authorizerTenantId) {
      return authorizerTenantId;
   }

   try {
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      if (!authHeader) {
         if (isLocalDev) {
            console.log('[getTenantId] No auth header, using default tenant for local dev');
            return 'local-dev-tenant';
         }
         return null;
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      return payload['custom:tenant_id'] || payload.sub || null;
   } catch (error) {
      console.error('Error decoding token:', error);
      if (isLocalDev) {
         console.log('[getTenantId] Token decode failed, using default tenant for local dev');
         return 'local-dev-tenant';
      }
      return null;
   }
};
