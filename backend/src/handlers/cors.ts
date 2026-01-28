/**
 * CORS Handler for OPTIONS Preflight Requests
 * Handles CORS preflight checks for all API endpoints
 */

interface APIGatewayEvent {
  [key: string]: any;
}

interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string | boolean>;
  body: string;
}

/**
 * Handle OPTIONS requests for CORS preflight
 * Returns 200 with all required CORS headers
 */
export const handleOptions = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    },
    body: '',
  };
};
