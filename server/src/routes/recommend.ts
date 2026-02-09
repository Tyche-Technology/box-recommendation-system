import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { Box, RecommendRequest } from '../../../shared/types';
import { recommendBoxes } from '../services/recommendation';

export const recommendRouter = Router();

recommendRouter.post('/', (req, res) => {
  const db: Database.Database = (req as any).db;
  const { products, padding = 2 } = req.body as RecommendRequest;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, message: '제품 목록이 필요합니다.' });
  }

  // 입력 검증
  for (const p of products) {
    if (!p.length || !p.width || !p.height || p.length <= 0 || p.width <= 0 || p.height <= 0) {
      return res.status(400).json({ success: false, message: '모든 제품의 크기(가로/세로/높이)는 양수여야 합니다.' });
    }
    if (!p.quantity || p.quantity < 1) {
      return res.status(400).json({ success: false, message: '수량은 1 이상이어야 합니다.' });
    }
  }

  // 활성 박스 목록 조회
  const boxes = db.prepare('SELECT * FROM boxes WHERE is_active = 1 ORDER BY length * width * height ASC').all() as Box[];

  if (boxes.length === 0) {
    return res.json({ success: false, results: [], noFit: true, message: '등록된 박스가 없습니다.' });
  }

  const results = recommendBoxes(
    products,
    boxes.map((b) => ({ ...b, is_active: Boolean(b.is_active) })),
    padding
  );

  if (results.length === 0) {
    return res.json({
      success: true,
      results: [],
      noFit: true,
      message: '적합한 박스를 찾을 수 없습니다. 제품이 너무 크거나 무겁습니다.',
    });
  }

  res.json({ success: true, results, noFit: false });
});
