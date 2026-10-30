import { Request, Response } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import * as dashboardService from "./dashboard.service";

export const getDashboardDataHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId || null;
  const data = await dashboardService.getDashboardData(tenantId);
  res.status(200).json(data);
});

export const getShadowStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId || null;
  const data = await dashboardService.getShadowAgentStats(tenantId);
  res.status(200).json(data);
});

export const getModelStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId || null;
  const data = await dashboardService.getModelStats(tenantId);
  res.status(200).json(data);
});

export const getVerifiedStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId || null;
  const data = await dashboardService.getVerifiedAgentStats(tenantId);
  res.status(200).json(data);
});

export const getSecurityPostureHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId || null;
  const period = (req.query.period as "7d" | "30d" | "90d") || "30d";
  const environment = (req.query.environment as any) || "all";
  const data = await dashboardService.getSecurityPostureData(tenantId, period, environment);
  res.status(200).json(data);
});

