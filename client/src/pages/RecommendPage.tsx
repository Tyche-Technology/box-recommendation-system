import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, RotateCcw, CheckCircle2, Loader2, PackageX } from 'lucide-react';
import { useAppStore } from '../store';
import { recommendApi, orderApi } from '../api';
import ProductInputForm from '../components/ProductInputForm';
import ProductList from '../components/ProductList';
import BoxResult from '../components/BoxResult';
import type { Product, RecommendResponse } from '../../../shared/types';

export default function RecommendPage() {
  const {
    products,
    addProduct,
    removeProduct,
    clearProducts,
    results,
    setResults,
    clearResults,
    selectedResult,
    setSelectedResult,
  } = useAppStore();

  const [noFitMessage, setNoFitMessage] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [padding, setPadding] = useState(2);

  const recommendMutation = useMutation({
    mutationFn: () => recommendApi.recommend({ products, padding }),
    onSuccess: (data: RecommendResponse) => {
      if (data.noFit) {
        setNoFitMessage(data.message || '적합한 박스를 찾을 수 없습니다.');
        setResults([]);
      } else {
        setResults(data.results);
        setNoFitMessage('');
        if (data.results.length > 0) {
          setSelectedResult(data.results[0]);
        }
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!selectedResult) throw new Error('박스를 선택하세요');
      return orderApi.create({
        box_id: selectedResult.box.id,
        total_volume: selectedResult.totalProductVolume,
        box_volume: selectedResult.boxVolume,
        utilization: selectedResult.utilization,
        items: products.map((p) => ({
          name: p.name,
          length: p.length,
          width: p.width,
          height: p.height,
          weight: p.weight,
          quantity: p.quantity,
        })),
      });
    },
    onSuccess: () => {
      setConfirmSuccess(true);
      setTimeout(() => {
        setConfirmSuccess(false);
        clearProducts();
      }, 2000);
    },
  });

  function handleReset() {
    clearProducts();
    setNoFitMessage('');
    setConfirmSuccess(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">박스 추천</h1>
          <p className="text-sm text-gray-500 mt-1">
            제품 크기를 입력하면 최적의 박스를 추천합니다
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          초기화
        </button>
      </div>

      {/* 제품 입력 폼 */}
      <ProductInputForm onAdd={(p: Product) => { addProduct(p); clearResults(); setNoFitMessage(''); }} />

      {/* 입력된 제품 목록 */}
      <ProductList products={products} onRemove={(i: number) => { removeProduct(i); clearResults(); }} />

      {/* 추천 버튼 & 완충재 설정 */}
      {products.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => recommendMutation.mutate()}
            disabled={recommendMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {recommendMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            최적 박스 추천받기
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <label htmlFor="padding">완충재 여유:</label>
            <input
              id="padding"
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={padding}
              onChange={(e) => setPadding(parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>cm (각 면)</span>
          </div>
        </div>
      )}

      {/* 에러 */}
      {recommendMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {(recommendMutation.error as Error).message}
        </div>
      )}

      {/* 적합한 박스 없음 */}
      {noFitMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <PackageX className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-amber-700 font-medium">{noFitMessage}</p>
          <p className="text-sm text-amber-600 mt-1">
            박스 카탈로그에서 더 큰 박스를 추가하거나, 제품을 분할 포장해 보세요.
          </p>
        </div>
      )}

      {/* 추천 결과 */}
      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            추천 결과 ({results.length}개)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, i) => (
              <BoxResult
                key={r.box.id}
                result={r}
                rank={i + 1}
                isSelected={selectedResult?.box.id === r.box.id}
                onSelect={() => setSelectedResult(r)}
              />
            ))}
          </div>

          {/* 확정 버튼 */}
          {selectedResult && (
            <div className="mt-5 flex items-center gap-4">
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending || confirmSuccess}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  confirmSuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                }`}
              >
                {confirmSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    주문 저장 완료!
                  </>
                ) : confirmMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {selectedResult.box.name} 선택 확정
                  </>
                )}
              </button>
              <span className="text-sm text-gray-500">
                선택한 박스로 주문 이력에 저장됩니다
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
