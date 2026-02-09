import type { Product, PlacedItem } from '../../../shared/types';

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

interface FreeSpace {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
}

/**
 * 6방향 회전 생성 (모든 가능한 방향)
 */
function getOrientations(dim: Dimensions): Dimensions[] {
  const { length: l, width: w, height: h } = dim;
  const set = new Set<string>();
  const orientations: Dimensions[] = [];

  for (const [a, b, c] of [
    [l, w, h], [l, h, w],
    [w, l, h], [w, h, l],
    [h, l, w], [h, w, l],
  ]) {
    const key = `${a}-${b}-${c}`;
    if (!set.has(key)) {
      set.add(key);
      orientations.push({ length: a, width: b, height: c });
    }
  }

  return orientations;
}

/**
 * 아이템이 공간에 들어갈 수 있는지 확인
 */
function fitsInSpace(item: Dimensions, space: FreeSpace): boolean {
  return (
    item.length <= space.length + 0.001 &&
    item.width <= space.width + 0.001 &&
    item.height <= space.height + 0.001
  );
}

/**
 * 공간 분할: 아이템을 배치한 후 남은 공간을 3개로 분할
 */
function splitSpace(space: FreeSpace, item: Dimensions): FreeSpace[] {
  const spaces: FreeSpace[] = [];

  // 오른쪽 공간 (x축)
  const rightLength = space.length - item.length;
  if (rightLength > 0.001) {
    spaces.push({
      x: space.x + item.length,
      y: space.y,
      z: space.z,
      length: rightLength,
      width: space.width,
      height: space.height,
    });
  }

  // 앞쪽 공간 (y축)
  const frontWidth = space.width - item.width;
  if (frontWidth > 0.001) {
    spaces.push({
      x: space.x,
      y: space.y + item.width,
      z: space.z,
      length: item.length,
      width: frontWidth,
      height: space.height,
    });
  }

  // 위쪽 공간 (z축)
  const topHeight = space.height - item.height;
  if (topHeight > 0.001) {
    spaces.push({
      x: space.x,
      y: space.y,
      z: space.z + item.height,
      length: item.length,
      width: item.width,
      height: topHeight,
    });
  }

  return spaces;
}

/**
 * 제품 목록을 수량만큼 펼침
 */
function expandProducts(products: Product[]): { name: string; dims: Dimensions; weight: number }[] {
  const items: { name: string; dims: Dimensions; weight: number }[] = [];
  for (const p of products) {
    for (let i = 0; i < p.quantity; i++) {
      items.push({
        name: p.quantity > 1 ? `${p.name} (${i + 1}/${p.quantity})` : p.name,
        dims: { length: p.length, width: p.width, height: p.height },
        weight: p.weight,
      });
    }
  }
  return items;
}

/**
 * First Fit Decreasing 빈 패킹 알고리즘
 * 박스 내부에 제품들을 배치할 수 있는지 확인
 */
export function tryPack(
  products: Product[],
  boxDims: Dimensions,
  padding: number = 2
): { fits: boolean; placed: PlacedItem[]; totalVolume: number } {
  // 완충재 적용한 유효 박스 크기
  const effectiveBox: Dimensions = {
    length: boxDims.length - padding * 2,
    width: boxDims.width - padding * 2,
    height: boxDims.height - padding * 2,
  };

  if (effectiveBox.length <= 0 || effectiveBox.width <= 0 || effectiveBox.height <= 0) {
    return { fits: false, placed: [], totalVolume: 0 };
  }

  // 제품 펼침 후 부피 내림차순 정렬 (FFD)
  const items = expandProducts(products);
  items.sort((a, b) => {
    const volA = a.dims.length * a.dims.width * a.dims.height;
    const volB = b.dims.length * b.dims.width * b.dims.height;
    return volB - volA;
  });

  let totalVolume = 0;
  const placed: PlacedItem[] = [];

  // 여유 공간 목록 (초기: 전체 박스)
  let freeSpaces: FreeSpace[] = [
    { x: 0, y: 0, z: 0, ...effectiveBox },
  ];

  for (const item of items) {
    const orientations = getOrientations(item.dims);
    let bestFit: { spaceIdx: number; orientation: Dimensions; wasteVolume: number } | null = null;

    // 가장 잘 맞는 공간+방향 찾기
    for (let si = 0; si < freeSpaces.length; si++) {
      const space = freeSpaces[si];
      for (const orient of orientations) {
        if (fitsInSpace(orient, space)) {
          const spaceVol = space.length * space.width * space.height;
          const itemVol = orient.length * orient.width * orient.height;
          const waste = spaceVol - itemVol;
          if (!bestFit || waste < bestFit.wasteVolume) {
            bestFit = { spaceIdx: si, orientation: orient, wasteVolume: waste };
          }
        }
      }
    }

    if (!bestFit) {
      return { fits: false, placed, totalVolume };
    }

    const space = freeSpaces[bestFit.spaceIdx];
    const orient = bestFit.orientation;

    placed.push({
      name: item.name,
      x: space.x + padding,
      y: space.y + padding,
      z: space.z + padding,
      length: orient.length,
      width: orient.width,
      height: orient.height,
    });

    totalVolume += orient.length * orient.width * orient.height;

    // 사용한 공간 제거 후 분할된 공간 추가
    const newSpaces = splitSpace(space, orient);
    freeSpaces.splice(bestFit.spaceIdx, 1, ...newSpaces);

    // 공간 정렬: 작은 공간 우선 (Best Fit)
    freeSpaces.sort((a, b) => {
      const volA = a.length * a.width * a.height;
      const volB = b.length * b.width * b.height;
      return volA - volB;
    });
  }

  return { fits: true, placed, totalVolume };
}

/**
 * 제품 총 부피 계산
 */
export function calculateTotalVolume(products: Product[]): number {
  return products.reduce((sum, p) => {
    return sum + p.length * p.width * p.height * p.quantity;
  }, 0);
}

/**
 * 제품 총 무게 계산
 */
export function calculateTotalWeight(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.weight * p.quantity, 0);
}
