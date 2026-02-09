import type { Box, Product, RecommendResult } from '../../../shared/types';
import { tryPack, calculateTotalVolume, calculateTotalWeight } from './packing';

/**
 * 제품 목록에 대해 최적 박스를 추천
 * 모든 활성 박스에 대해 패킹 시도 후 가장 작은 적합 박스 반환
 */
export function recommendBoxes(
  products: Product[],
  boxes: Box[],
  padding: number = 2
): RecommendResult[] {
  const totalWeight = calculateTotalWeight(products);
  const totalVolume = calculateTotalVolume(products);

  // 활성 박스만, 부피 오름차순 정렬
  const activeBoxes = boxes
    .filter((b) => b.is_active)
    .sort((a, b) => {
      const volA = a.length * a.width * a.height;
      const volB = b.length * b.width * b.height;
      return volA - volB;
    });

  const results: RecommendResult[] = [];

  for (const box of activeBoxes) {
    // 무게 제한 확인
    if (box.weight_limit > 0 && totalWeight > box.weight_limit) {
      continue;
    }

    const boxVolume = box.length * box.width * box.height;
    const packResult = tryPack(products, box, padding);

    if (packResult.fits) {
      const utilization = packResult.totalVolume / boxVolume;
      results.push({
        box,
        utilization,
        totalProductVolume: totalVolume,
        boxVolume,
        fits: true,
        arrangement: packResult.placed,
      });
    }
  }

  // 공간 활용률 내림차순 정렬 (가장 꽉 차는 박스 우선)
  results.sort((a, b) => b.utilization - a.utilization);

  return results;
}
