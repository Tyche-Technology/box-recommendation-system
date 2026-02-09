import type Database from 'better-sqlite3';
import type { UsageStats, BoxSuggestion, AnalyticsResponse } from '../../../shared/types';

/**
 * 박스 사용 통계 조회
 */
export function getUsageStats(
  db: Database.Database,
  startDate?: string,
  endDate?: string
): AnalyticsResponse {
  let whereClause = "WHERE o.status = 'confirmed'";
  const params: any[] = [];

  if (startDate) {
    whereClause += ' AND o.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    whereClause += ' AND o.created_at <= ?';
    params.push(endDate);
  }

  const usage = db.prepare(`
    SELECT
      b.id as box_id,
      b.name as box_name,
      COUNT(o.id) as count,
      AVG(o.utilization) as avg_utilization,
      COUNT(o.id) as total_orders
    FROM orders o
    JOIN boxes b ON o.box_id = b.id
    ${whereClause}
    GROUP BY b.id
    ORDER BY count DESC
  `).all(...params) as UsageStats[];

  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      AVG(utilization) as avg_utilization
    FROM orders o
    ${whereClause}
  `).get(...params) as { total_orders: number; avg_utilization: number } | undefined;

  return {
    usage,
    period: {
      start: startDate || '전체',
      end: endDate || '전체',
    },
    total_orders: totals?.total_orders || 0,
    avg_utilization: totals?.avg_utilization || 0,
  };
}

/**
 * 최적 박스 사이즈 제안
 * 주문 이력 분석 후 자주 사용되는 크기 범위에서 새 박스 사이즈 제안
 */
export function suggestBoxSizes(db: Database.Database): BoxSuggestion[] {
  const suggestions: BoxSuggestion[] = [];

  // 공간 활용률이 낮은 주문들의 제품 크기 분석
  const lowUtilOrders = db.prepare(`
    SELECT o.id, o.utilization, o.box_volume, o.total_volume,
           b.length as box_length, b.width as box_width, b.height as box_height
    FROM orders o
    JOIN boxes b ON o.box_id = b.id
    WHERE o.status = 'confirmed' AND o.utilization < 0.4
    ORDER BY o.created_at DESC
    LIMIT 100
  `).all() as any[];

  if (lowUtilOrders.length >= 3) {
    // 낮은 활용률 주문들의 실제 제품 부피 평균
    const avgVolume = lowUtilOrders.reduce((s: number, o: any) => s + o.total_volume, 0) / lowUtilOrders.length;

    // 적절한 크기 제안 (1.3배 부피 + 완충재)
    const targetVolume = avgVolume * 1.3;
    const side = Math.cbrt(targetVolume);
    const suggestedLength = Math.ceil(side + 4);
    const suggestedWidth = Math.ceil(side + 4);
    const suggestedHeight = Math.ceil(side * 0.8 + 4);

    suggestions.push({
      length: suggestedLength,
      width: suggestedWidth,
      height: suggestedHeight,
      reason: `활용률 40% 미만 주문 ${lowUtilOrders.length}건 분석 결과, 중간 크기 박스 추가 권장`,
      estimated_savings: Math.round(lowUtilOrders.length * 200), // 대략적 절감액
    });
  }

  // 가장 많이 사용되는 박스 크기 분석
  const topBoxes = db.prepare(`
    SELECT b.id, b.name, b.length, b.width, b.height,
           COUNT(o.id) as usage_count,
           AVG(o.utilization) as avg_util
    FROM orders o
    JOIN boxes b ON o.box_id = b.id
    WHERE o.status = 'confirmed'
    GROUP BY b.id
    ORDER BY usage_count DESC
    LIMIT 3
  `).all() as any[];

  for (const box of topBoxes) {
    if (box.avg_util > 0.85) {
      // 활용률이 너무 높으면 약간 큰 박스 제안
      suggestions.push({
        length: Math.ceil(box.length * 1.15),
        width: Math.ceil(box.width * 1.15),
        height: Math.ceil(box.height * 1.15),
        reason: `'${box.name}' 박스 평균 활용률 ${Math.round(box.avg_util * 100)}% — 약간 큰 사이즈 추가 시 여유 확보`,
        estimated_savings: 0,
      });
    }
  }

  return suggestions;
}
