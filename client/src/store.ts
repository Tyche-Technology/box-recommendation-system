import { create } from 'zustand';
import type { Product, RecommendResult } from '../../shared/types';

interface AppStore {
  // 제품 입력 상태
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (index: number) => void;
  updateProduct: (index: number, product: Product) => void;
  clearProducts: () => void;

  // 추천 결과
  results: RecommendResult[];
  setResults: (results: RecommendResult[]) => void;
  clearResults: () => void;

  // 선택된 추천
  selectedResult: RecommendResult | null;
  setSelectedResult: (result: RecommendResult | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  products: [],
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  removeProduct: (index) =>
    set((state) => ({
      products: state.products.filter((_, i) => i !== index),
    })),
  updateProduct: (index, product) =>
    set((state) => ({
      products: state.products.map((p, i) => (i === index ? product : p)),
    })),
  clearProducts: () => set({ products: [], results: [], selectedResult: null }),

  results: [],
  setResults: (results) => set({ results }),
  clearResults: () => set({ results: [], selectedResult: null }),

  selectedResult: null,
  setSelectedResult: (result) => set({ selectedResult: result }),
}));
