const { CognitoIdentityServiceProvider } = require('aws-sdk');

const cognito = new CognitoIdentityServiceProvider({ region: 'eu-north-1' });

const USER_POOL_ID = 'eu-north-1_RfO53Cz5t'; // WebDPro User Pool ID
const GOOGLE_CLIENT_ID = '391013453181-jtog3kcr028dhifcfo692d1ks8sofj1j.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

async function fixIdP() {
   try {
      console.log(`Updating Google IdP for User Pool: ${USER_POOL_ID}...`);
      console.log(`Setting Client ID: ${GOOGLE_CLIENT_ID}`);

      const params = {
         UserPoolId: USER_POOL_ID,
         ProviderName: 'Google',
         ProviderDetails: {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            authorize_scopes: 'email profile openid',
            attributes_url: 'https://people.googleapis.com/v1/people/me?personFields=',
            attributes_url_add_attributes: 'true',
            authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
            oidc_issuer: 'https://accounts.google.com',
            token_request_method: 'POST',
            token_url: 'https://www.googleapis.com/oauth2/v4/token'
         }
      };

      await cognito.updateIdentityProvider(params).promise();
      console.log('✅ Google Identity Provider updated successfully!');

   } catch (error) {
      console.error('❌ Failed to update Identity Provider:', error);
   }
}

fixIdP();
