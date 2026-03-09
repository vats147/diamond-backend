import jwt from 'jsonwebtoken';
import { env } from './env';

export interface JwtPayload {
    sub: string;
    role: 'SUPER_ADMIN' | 'OWNER';
    businessId?: string;
    iss?: string;
    aud?: string;
}

const ISSUER = 'diamond-market-api';
const AUDIENCE = 'diamond-market-client';
// Algorithm is ALWAYS HS256 — hardcoded, never from token header.
// This prevents the "alg:none" and RS256→HS256 confusion attacks.
const ALGORITHM: jwt.Algorithm = 'HS256';

export const signToken = (payload: Omit<JwtPayload, 'iss' | 'aud'>): string => {
    return jwt.sign(
        { ...payload, iss: ISSUER, aud: AUDIENCE },
        env.JWT_SECRET,
        {
            algorithm: ALGORITHM,
            expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
            notBefore: 0, // token not valid before issue time
        }
    );
};

export const verifyToken = (token: string): JwtPayload => {
    // Explicitly list allowed algorithms — prevents alg:none / confusion attack.
    // Pass issuer + audience so any tampered or foreign token is rejected.
    const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: [ALGORITHM],     // explicit allowlist — never trust header
        issuer: ISSUER,
        audience: AUDIENCE,
        complete: false,
    }) as JwtPayload;

    // Extra: ensure required fields exist (paranoid check)
    if (!decoded.sub || !decoded.role) {
        throw new jwt.JsonWebTokenError('Token missing required claims');
    }

    return decoded;
};
