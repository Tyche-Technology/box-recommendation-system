import { Trash2 } from 'lucide-react';
import type { Product } from '../../../shared/types';

interface Props {
  products: Product[];
  onRemove: (index: number) => void;
}

export default function ProductList({ products, onRemove }: Props) {
  if (products.length === 0) return null;

  const totalVolume = products.reduce(
    (sum, p) => sum + p.length * p.width * p.height * p.quantity,
    0
  );
  const totalWeight = products.reduce((sum, p) => sum + p.weight * p.quantity, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          입력된 제품 ({products.length}종)
        </h3>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>총 부피: {totalVolume.toLocaleString()} cm³</span>
          <span>총 무게: {totalWeight.toFixed(1)} kg</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">제품명</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">가로</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">세로</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">높이</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">무게</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">수량</th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500">부피</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">{p.name}</td>
                <td className="py-2 px-2 text-right text-gray-600">{p.length}cm</td>
                <td className="py-2 px-2 text-right text-gray-600">{p.width}cm</td>
                <td className="py-2 px-2 text-right text-gray-600">{p.height}cm</td>
                <td className="py-2 px-2 text-right text-gray-600">{p.weight}kg</td>
                <td className="py-2 px-2 text-right text-gray-600">{p.quantity}개</td>
                <td className="py-2 px-2 text-right text-gray-600">
                  {(p.length * p.width * p.height * p.quantity).toLocaleString()} cm³
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => onRemove(i)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
