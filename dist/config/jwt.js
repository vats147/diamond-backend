"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
const ISSUER = 'diamond-market-api';
const AUDIENCE = 'diamond-market-client';
// Algorithm is ALWAYS HS256 — hardcoded, never from token header.
// This prevents the "alg:none" and RS256→HS256 confusion attacks.
const ALGORITHM = 'HS256';
const signToken = (payload) => {
    return jsonwebtoken_1.default.sign({ ...payload, iss: ISSUER, aud: AUDIENCE }, env_1.env.JWT_SECRET, {
        algorithm: ALGORITHM,
        expiresIn: env_1.env.JWT_EXPIRES_IN,
        notBefore: 0, // token not valid before issue time
    });
};
exports.signToken = signToken;
const verifyToken = (token) => {
    // Explicitly list allowed algorithms — prevents alg:none / confusion attack.
    // Pass issuer + audience so any tampered or foreign token is rejected.
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
        algorithms: [ALGORITHM], // explicit allowlist — never trust header
        issuer: ISSUER,
        audience: AUDIENCE,
        complete: false,
    });
    // Extra: ensure required fields exist (paranoid check)
    if (!decoded.sub || !decoded.role) {
        throw new jsonwebtoken_1.default.JsonWebTokenError('Token missing required claims');
    }
    return decoded;
};
exports.verifyToken = verifyToken;
