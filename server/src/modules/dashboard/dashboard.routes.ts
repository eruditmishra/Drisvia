import { Router } from "express";
import {
  getDashboardDataHandler,
  getShadowStatsHandler,
  getModelStatsHandler,
  getVerifiedStatsHandler,
  getSecurityPostureHandler,
} from "./dashboard.controller";
import { requirePermission } from "../../rbac/rbac.middleware";

const router = Router();

// Dashboard is accessible to all roles (view permission)
router.get("/stats",          requirePermission("dashboard", "view"), getDashboardDataHandler);
router.get("/posture",        requirePermission("dashboard", "view"), getSecurityPostureHandler);
router.get("/shadow-stats",   requirePermission("dashboard", "view"), getShadowStatsHandler);
router.get("/model-stats",    requirePermission("dashboard", "view"), getModelStatsHandler);
router.get("/verified-stats", requirePermission("dashboard", "view"), getVerifiedStatsHandler);

export default router;

