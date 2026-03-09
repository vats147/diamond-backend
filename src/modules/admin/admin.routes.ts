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

export default router;
