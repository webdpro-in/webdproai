"use strict";
/**
 * AI Service Client
 * HTTP client for calling AI generation service
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.aiClient = exports.AIServiceClient = void 0;
class AIServiceClient {
    constructor() {
        // In production, this would be the AI service API Gateway URL
        // For now, we'll use direct function calls as fallback
        this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002';
    }
    generateWebsite(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try HTTP call first
                if (this.baseUrl !== 'http://localhost:3002') {
                    const response = yield fetch(`${this.baseUrl}/ai/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(request),
                    });
                    if (!response.ok) {
                        throw new Error(`AI service returned ${response.status}`);
                    }
                    return yield response.json();
                }
                // Fallback to direct import (for development)
                const { orchestrateSiteGeneration } = yield Promise.resolve().then(() => __importStar(require('../../ai_services/src/orchestrator')));
                const result = yield orchestrateSiteGeneration(request.input, request.tenantId, request.storeId);
                return {
                    success: true,
                    data: result
                };
            }
            catch (error) {
                console.error('AI service call failed:', error);
                return {
                    success: false,
                    error: 'AI generation failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
    }
}
exports.AIServiceClient = AIServiceClient;
exports.aiClient = new AIServiceClient();
