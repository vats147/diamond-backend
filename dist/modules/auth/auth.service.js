"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerLogin = exports.adminLogin = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../../config/db"));
const jwt_1 = require("../../config/jwt");
/**
 * Unified login that handles both SUPER_ADMIN and OWNER roles
 */
const login = async (input) => {
    const user = await db_1.default.user.findUnique({
        where: { email: input.email },
        include: { business: { select: { id: true, slug: true, isActive: true } } }
    });
    if (!user) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }
    // Block login if the business is inactive
    if (user.role === 'OWNER' && user.business?.isActive === false) {
        throw Object.assign(new Error('This business account has been deactivated. Please contact support.'), { statusCode: 403 });
    }
    if (input.password) {
        const valid = await bcrypt_1.default.compare(input.password, user.passwordHash);
        if (!valid) {
            throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
        }
    }
    const payload = { sub: user.id, role: user.role };
    if (user.role === 'OWNER' && user.businessId) {
        payload.businessId = user.businessId;
    }
    const token = (0, jwt_1.signToken)(payload);
    return {
        token,
        user: {
            id: user.id,
            role: user.role,
            email: user.email,
            ...(user.businessId && { businessId: user.businessId, businessSlug: user.business?.slug })
        }
    };
};
exports.login = login;
const adminLogin = async (input) => {
    return (0, exports.login)(input);
};
exports.adminLogin = adminLogin;
const ownerLogin = async (input) => {
    return (0, exports.login)(input);
};
exports.ownerLogin = ownerLogin;
