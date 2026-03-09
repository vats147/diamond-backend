import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import * as ctrl from './admin.controller';

const router = Router();

// All admin routes require Super Admin authentication
router.use(authenticate, requireRole('SUPER_ADMIN'));

/**
 * @route  GET /api/admin/metrics
 * @desc   Get system-wide counts and recent activity for the Admin Dashboard
 * @access Super Admin
 * @returns { success, data: { totals, recentBusinesses, recentInquiries } }
 * @errors 401 | 403
 */
router.get('/metrics', ctrl.getDashboardMetrics);

/**
 * @route  GET /api/admin/logs
 * @desc   Get paginated system request logs
 * @access Super Admin
 * @query  page?, limit?, method?, statusCode?, search?
 * @returns { success, data: { logs[], total, page, limit, totalPages } }
 * @errors 401 | 403
 */
router.get('/logs', ctrl.getSystemLogs);

/**
 * @route  GET /api/admin/developer/keys
 * @desc   List all API keys in the system across all businesses
 * @access Super Admin
 */
router.get('/developer/keys', ctrl.listAllApiKeys);

/**
 * @route  DELETE /api/admin/developer/keys/:id
 * @desc   Revoke any API key globally
 * @access Super Admin
 */
router.delete('/developer/keys/:id', ctrl.revokeApiKeyGlobally);

export default router;
