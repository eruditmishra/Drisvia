-- ============================================================
-- Migration 020: Posture daily snapshots for real risk trends
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS posture_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  snapshot_date DATE NOT NULL,
  overall_score INTEGER NOT NULL,
  total_agents INTEGER NOT NULL,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  shadow_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_posture_snapshots_unique 
  ON posture_daily_snapshots (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), snapshot_date);

CREATE INDEX IF NOT EXISTS idx_posture_snapshots_lookup 
  ON posture_daily_snapshots (tenant_id, snapshot_date ASC);

COMMIT;
