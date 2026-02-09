import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import type Database from 'better-sqlite3';
import type { Box, BoxInput } from '../../../shared/types';

export const boxesRouter = Router();

function getDb(req: any): Database.Database {
  return req.db;
}

// 전체 박스 목록 조회
boxesRouter.get('/', (req, res) => {
  const db = getDb(req);
  const includeInactive = req.query.includeInactive === 'true';

  let query = 'SELECT * FROM boxes';
  if (!includeInactive) {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY length * width * height ASC';

  const boxes = db.prepare(query).all() as Box[];
  res.json(boxes.map((b) => ({ ...b, is_active: Boolean(b.is_active) })));
});

// 단일 박스 조회
boxesRouter.get('/:id', (req, res) => {
  const db = getDb(req);
  const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(req.params.id) as Box | undefined;

  if (!box) {
    return res.status(404).json({ error: '박스를 찾을 수 없습니다.' });
  }

  res.json({ ...box, is_active: Boolean(box.is_active) });
});

// 박스 추가
boxesRouter.post('/', (req, res) => {
  const db = getDb(req);
  const input = req.body as BoxInput;

  if (!input.name || !input.length || !input.width || !input.height) {
    return res.status(400).json({ error: '이름, 가로, 세로, 높이는 필수입니다.' });
  }

  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO boxes (id, name, length, width, height, weight_limit, cost, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.name, input.length, input.width, input.height, input.weight_limit || 0, input.cost || 0, input.is_active !== false ? 1 : 0, now, now);

  const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(id) as Box;
  res.status(201).json({ ...box, is_active: Boolean(box.is_active) });
});

// 박스 수정
boxesRouter.put('/:id', (req, res) => {
  const db = getDb(req);
  const input = req.body as Partial<BoxInput>;
  const existing = db.prepare('SELECT * FROM boxes WHERE id = ?').get(req.params.id) as Box | undefined;

  if (!existing) {
    return res.status(404).json({ error: '박스를 찾을 수 없습니다.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE boxes SET
      name = COALESCE(?, name),
      length = COALESCE(?, length),
      width = COALESCE(?, width),
      height = COALESCE(?, height),
      weight_limit = COALESCE(?, weight_limit),
      cost = COALESCE(?, cost),
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ?
  `).run(
    input.name ?? null,
    input.length ?? null,
    input.width ?? null,
    input.height ?? null,
    input.weight_limit ?? null,
    input.cost ?? null,
    input.is_active !== undefined ? (input.is_active ? 1 : 0) : null,
    now,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM boxes WHERE id = ?').get(req.params.id) as Box;
  res.json({ ...updated, is_active: Boolean(updated.is_active) });
});

// 박스 삭제
boxesRouter.delete('/:id', (req, res) => {
  const db = getDb(req);
  const existing = db.prepare('SELECT * FROM boxes WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '박스를 찾을 수 없습니다.' });
  }

  // 주문에서 사용 중인 박스는 비활성화만
  const usedInOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE box_id = ?').get(req.params.id) as { count: number };

  if (usedInOrders.count > 0) {
    db.prepare('UPDATE boxes SET is_active = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
    return res.json({ message: '주문 이력이 있어 비활성화 처리되었습니다.' });
  }

  db.prepare('DELETE FROM boxes WHERE id = ?').run(req.params.id);
  res.json({ message: '박스가 삭제되었습니다.' });
});
