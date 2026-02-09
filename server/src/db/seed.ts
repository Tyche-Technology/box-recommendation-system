import { v4 as uuid } from 'uuid';
import { getDb, initializeSchema } from './schema';

const INITIAL_BOXES = [
  { name: '소형 (S)', length: 22, width: 19, height: 9, weight_limit: 2, cost: 300 },
  { name: '소중형 (SM)', length: 27, width: 22, height: 15, weight_limit: 5, cost: 450 },
  { name: '중형 (M)', length: 34, width: 25, height: 21, weight_limit: 10, cost: 600 },
  { name: '중대형 (ML)', length: 41, width: 31, height: 28, weight_limit: 15, cost: 800 },
  { name: '대형 (L)', length: 48, width: 38, height: 34, weight_limit: 20, cost: 1000 },
  { name: '특대형 (XL)', length: 55, width: 45, height: 40, weight_limit: 25, cost: 1300 },
  { name: '초특대형 (XXL)', length: 65, width: 50, height: 45, weight_limit: 30, cost: 1600 },
  { name: '플랫 (FLAT)', length: 40, width: 30, height: 10, weight_limit: 5, cost: 400 },
];

function seed() {
  const db = getDb();
  initializeSchema(db);

  const existing = db.prepare('SELECT COUNT(*) as count FROM boxes').get() as { count: number };

  if (existing.count > 0) {
    console.log(`이미 ${existing.count}개의 박스 데이터가 있습니다. 시드를 건너뜁니다.`);
    db.close();
    return;
  }

  const insert = db.prepare(`
    INSERT INTO boxes (id, name, length, width, height, weight_limit, cost, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  const insertMany = db.transaction((boxes: typeof INITIAL_BOXES) => {
    for (const box of boxes) {
      insert.run(uuid(), box.name, box.length, box.width, box.height, box.weight_limit, box.cost);
    }
  });

  insertMany(INITIAL_BOXES);

  console.log(`✅ ${INITIAL_BOXES.length}개의 박스 데이터가 시드되었습니다.`);
  db.close();
}

seed();
