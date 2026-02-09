import { Router } from 'express';
import type Database from 'better-sqlite3';
import { getUsageStats, suggestBoxSizes } from '../services/analytics';

export const analyticsRouter = Router();

function getDb(req: any): Database.Database {
  return req.db;
}

// 사용 통계
analyticsRouter.get('/usage', (req, res) => {
  const db = getDb(req);
  const { start, end } = req.query as Record<string, string>;

  const stats = getUsageStats(db, start, end);
  res.json(stats);
});

// 최적 박스 사이즈 제안
analyticsRouter.get('/suggest', (req, res) => {
  const db = getDb(req);

  const suggestions = suggestBoxSizes(db);
  res.json({ suggestions });
});
