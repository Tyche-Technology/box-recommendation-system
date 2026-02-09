import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import type Database from 'better-sqlite3';
import type { Order, OrderInput } from '../../../shared/types';

export const ordersRouter = Router();

function getDb(req: any): Database.Database {
  return req.db;
}

// 주문 이력 조회
ordersRouter.get('/', (req, res) => {
  const db = getDb(req);
  const { start, end, limit = '50', offset = '0' } = req.query as Record<string, string>;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (start) {
    whereClause += ' AND o.created_at >= ?';
    params.push(start);
  }
  if (end) {
    whereClause += ' AND o.created_at <= ?';
    params.push(end);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o ${whereClause}`).get(...params) as { count: number };

  const orders = db.prepare(`
    SELECT o.*, b.name as box_name, b.length as box_length, b.width as box_width, b.height as box_height
    FROM orders o
    LEFT JOIN boxes b ON o.box_id = b.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset)) as any[];

  // 각 주문의 아이템 조회
  const ordersWithItems = orders.map((order) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return {
      ...order,
      box: order.box_name ? {
        id: order.box_id,
        name: order.box_name,
        length: order.box_length,
        width: order.box_width,
        height: order.box_height,
      } : null,
      items,
    };
  });

  res.json({ orders: ordersWithItems, total: total.count });
});

// 주문 생성 (추천 확정)
ordersRouter.post('/', (req, res) => {
  const db = getDb(req);
  const input = req.body as OrderInput;

  if (!input.box_id || !input.items || input.items.length === 0) {
    return res.status(400).json({ error: '박스 ID와 제품 목록이 필요합니다.' });
  }

  const orderId = uuid();
  const now = new Date().toISOString();

  const orderRef = input.order_ref || `ORD-${Date.now().toString(36).toUpperCase()}`;

  db.prepare(`
    INSERT INTO orders (id, order_ref, box_id, total_volume, box_volume, utilization, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?)
  `).run(orderId, orderRef, input.box_id, input.total_volume, input.box_volume, input.utilization, now);

  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, name, length, width, height, weight, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItems = db.transaction((items: OrderInput['items']) => {
    for (const item of items) {
      insertItem.run(uuid(), orderId, item.name, item.length, item.width, item.height, item.weight || 0, item.quantity || 1);
    }
  });

  insertItems(input.items);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json({ ...order, items });
});

// 주문 삭제
ordersRouter.delete('/:id', (req, res) => {
  const db = getDb(req);
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
  }

  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);

  res.json({ message: '주문이 삭제되었습니다.' });
});
