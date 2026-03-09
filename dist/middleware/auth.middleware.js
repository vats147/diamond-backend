"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../config/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = (0, jwt_1.verifyToken)(token);
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
