
export const ping = async (event: any) => {
   return {
      statusCode: 200,
      headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
         status: 'ok',
         service: 'webdpro-delivery',
         timestamp: new Date().toISOString()
      }),
   };
};
