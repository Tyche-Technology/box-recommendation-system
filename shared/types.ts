// 박스 타입
export interface Box {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight_limit: number;
  cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoxInput {
  name: string;
  length: number;
  width: number;
  height: number;
  weight_limit: number;
  cost: number;
  is_active?: boolean;
}

// 제품 타입
export interface Product {
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
}

// 추천 요청/응답
export interface RecommendRequest {
  products: Product[];
  padding?: number; // 완충재 여유 (기본 2cm)
}

export interface RecommendResult {
  box: Box;
  utilization: number; // 0~1
  totalProductVolume: number;
  boxVolume: number;
  fits: boolean;
  arrangement: PlacedItem[];
}

export interface RecommendResponse {
  success: boolean;
  results: RecommendResult[];
  noFit?: boolean;
  message?: string;
}

// 패킹 알고리즘 관련
export interface PlacedItem {
  name: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
}

// 주문 타입
export interface Order {
  id: string;
  order_ref: string;
  box_id: string;
  total_volume: number;
  box_volume: number;
  utilization: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
  box?: Box;
}

export interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
}

export interface OrderInput {
  order_ref?: string;
  box_id: string;
  total_volume: number;
  box_volume: number;
  utilization: number;
  items: Omit<OrderItem, 'id' | 'order_id'>[];
}

// 분석 타입
export interface UsageStats {
  box_id: string;
  box_name: string;
  count: number;
  avg_utilization: number;
  total_orders: number;
}

export interface BoxSuggestion {
  length: number;
  width: number;
  height: number;
  reason: string;
  estimated_savings: number;
}

export interface AnalyticsResponse {
  usage: UsageStats[];
  period: { start: string; end: string };
  total_orders: number;
  avg_utilization: number;
}
