"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownBusinessOnly = exports.requireRole = void 0;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const ownBusinessOnly = (req, res, next) => {
    const { id, businessId } = req.params;
    const targetId = businessId || id;
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    if (req.user.role === 'SUPER_ADMIN') {
        next();
        return;
    }
    if (req.user.businessId !== targetId) {
        res.status(403).json({ success: false, error: 'Access denied: not your business' });
        return;
    }
    next();
};
exports.ownBusinessOnly = ownBusinessOnly;
