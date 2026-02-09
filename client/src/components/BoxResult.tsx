import { Check, AlertTriangle } from 'lucide-react';
import type { RecommendResult } from '../../../shared/types';

interface Props {
  result: RecommendResult;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

function getUtilizationColor(util: number): string {
  if (util >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
  if (util >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function getUtilizationBarColor(util: number): string {
  if (util >= 0.7) return 'bg-green-500';
  if (util >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function BoxResult({ result, rank, isSelected, onSelect }: Props) {
  const utilPct = Math.round(result.utilization * 100);
  const colorClass = getUtilizationColor(result.utilization);
  const barColor = getUtilizationBarColor(result.utilization);

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-100' : 'border-gray-200'
      }`}
    >
      {rank === 1 && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
          추천
        </span>
      )}

      {isSelected && (
        <div className="absolute top-3 right-3">
          <Check className="w-5 h-5 text-blue-600" />
        </div>
      )}

      <h4 className="text-base font-bold text-gray-900 mb-1">{result.box.name}</h4>
      <p className="text-sm text-gray-500 mb-3">
        {result.box.length} × {result.box.width} × {result.box.height} cm
      </p>

      {/* 활용률 바 */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">공간 활용률</span>
          <span className={`text-sm font-bold px-2 py-0.5 rounded border ${colorClass}`}>
            {utilPct}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${utilPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>
          <span className="block text-gray-400">제품 부피</span>
          <span className="font-medium text-gray-700">
            {result.totalProductVolume.toLocaleString()} cm³
          </span>
        </div>
        <div>
          <span className="block text-gray-400">박스 부피</span>
          <span className="font-medium text-gray-700">
            {result.boxVolume.toLocaleString()} cm³
          </span>
        </div>
        <div>
          <span className="block text-gray-400">박스 비용</span>
          <span className="font-medium text-gray-700">₩{result.box.cost.toLocaleString()}</span>
        </div>
        <div>
          <span className="block text-gray-400">무게 한도</span>
          <span className="font-medium text-gray-700">{result.box.weight_limit}kg</span>
        </div>
      </div>

      {result.utilization < 0.4 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          공간 활용률이 낮습니다. 더 작은 박스를 고려해보세요.
        </div>
      )}
    </div>
  );
}
