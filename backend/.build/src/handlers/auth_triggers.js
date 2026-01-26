"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthChallengeResponse = exports.createAuthChallenge = exports.defineAuthChallenge = void 0;
const client_sns_1 = require("@aws-sdk/client-sns");
const sns = new client_sns_1.SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const defineAuthChallenge = (event) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    else if (session.length === 1 && session[0].challengeName === 'CUSTOM_CHALLENGE' && session[0].challengeResult === true) {
        // Step 2: Challenge passed -> Issue Tokens
        event.response.issueTokens = true;
        event.response.failAuthentication = false;
    }
    else {
        // Failure or exhausted attempts
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    }
    return event;
});
exports.defineAuthChallenge = defineAuthChallenge;
const createAuthChallenge = (event) => __awaiter(void 0, void 0, void 0, function* () {
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
            yield sns.send(new client_sns_1.PublishCommand({
                PhoneNumber: event.request.userAttributes.phone_number,
                Message: `Your WebDPro Login OTP is: ${otp}`,
            }));
        }
        catch (error) {
            console.error('[AUTH] Failed to send SMS:', error);
            // We swallow this error so the test can continue using the CloudWatch log
        }
    }
    return event;
});
exports.createAuthChallenge = createAuthChallenge;
const verifyAuthChallengeResponse = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const expectedAnswer = event.request.privateChallengeParameters.otp;
    const userAnswer = event.request.challengeAnswer;
    if (userAnswer === expectedAnswer) {
        event.response.answerCorrect = true;
    }
    else {
        event.response.answerCorrect = false;
    }
    return event;
});
exports.verifyAuthChallengeResponse = verifyAuthChallengeResponse;
