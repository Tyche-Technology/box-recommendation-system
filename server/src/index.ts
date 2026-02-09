import express from 'express';
import cors from 'cors';
import { getDb, initializeSchema } from './db/schema';
import { boxesRouter } from './routes/boxes';
import { recommendRouter } from './routes/recommend';
import { ordersRouter } from './routes/orders';
import { analyticsRouter } from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 3001;

// DB 초기화
const db = getDb();
initializeSchema(db);

// 미들웨어
app.use(cors());
app.use(express.json());

// DB를 req에 주입
app.use((req, _res, next) => {
  (req as any).db = db;
  next();
});

// 라우터
app.use('/api/boxes', boxesRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);

// 헬스 체크
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

// 종료 시 DB 닫기
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
