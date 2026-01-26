import {
   DefineAuthChallengeTriggerEvent,
   CreateAuthChallengeTriggerEvent,
   VerifyAuthChallengeResponseTriggerEvent
} from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });

export const defineAuthChallenge = async (event: DefineAuthChallengeTriggerEvent) => {
   // If user is not found, fail
   if (event.request.userNotFound) {
      event.response.issueTokens = false;
      event.response.failAuthentication = true;
      return event;
   }

   // Dynamic state machine for Custom Auth
   const { session } = event.request;

   if (session.length === 0) {
      // Step 1: Issue Custom Challenge (OTP)
      event.response.issueTokens = false;
      event.response.failAuthentication = false;
      event.response.challengeName = 'CUSTOM_CHALLENGE';
   } else if (session.length === 1 && session[0].challengeName === 'CUSTOM_CHALLENGE' && session[0].challengeResult === true) {
      // Step 2: Challenge passed -> Issue Tokens
      event.response.issueTokens = true;
      event.response.failAuthentication = false;
   } else {
      // Failure or exhausted attempts
      event.response.issueTokens = false;
      event.response.failAuthentication = true;
   }

   return event;
};

export const createAuthChallenge = async (event: CreateAuthChallengeTriggerEvent) => {
   if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Log OTP for debugging/dev (Critical for "free" testing without ensuring SMS delivery)
      console.log(`[AUTH] Generated OTP for ${event.request.userAttributes.phone_number}: ${otp}`);

      // Set private parameters (Cognito uses this to verify, but DOES NOT send to client)
      event.response.privateChallengeParameters = { otp };

      // Set public parameters (sent to client)
      event.response.publicChallengeParameters = {
         phone: event.request.userAttributes.phone_number
      };

      // Attempt to send SMS via SNS
      try {
         await sns.send(new PublishCommand({
            PhoneNumber: event.request.userAttributes.phone_number,
            Message: `Your WebDPro Login OTP is: ${otp}`,
         }));
      } catch (error) {
         console.error('[AUTH] Failed to send SMS:', error);
         // We swallow this error so the test can continue using the CloudWatch log
      }
   }
   return event;
};

export const verifyAuthChallengeResponse = async (event: VerifyAuthChallengeResponseTriggerEvent) => {
   const expectedAnswer = event.request.privateChallengeParameters.otp;
   const userAnswer = event.request.challengeAnswer;

   if (userAnswer === expectedAnswer) {
      event.response.answerCorrect = true;
   } else {
      event.response.answerCorrect = false;
   }
   return event;
};
