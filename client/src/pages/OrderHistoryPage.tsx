import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ChevronDown, ChevronUp, Loader2, ClipboardList } from 'lucide-react';
import { orderApi } from '../api';

function getUtilColor(util: number): string {
  if (util >= 0.7) return 'text-green-700 bg-green-50';
  if (util >= 0.4) return 'text-yellow-700 bg-yellow-50';
  return 'text-red-700 bg-red-50';
}

export default function OrderHistoryPage() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', startDate, endDate],
    queryFn: () => orderApi.getAll({ start: startDate || undefined, end: endDate || undefined, limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  const orders = data?.orders || [];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">주문 이력</h1>
        <p className="text-sm text-gray-500 mt-1">확정된 박스 추천 이력 조회</p>
      </div>

      {/* 기간 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            초기화
          </button>
          <span className="text-sm text-gray-400 ml-auto">총 {data?.total || 0}건</span>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">주문 이력이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">박스 추천 후 확정하면 이력이 저장됩니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order: any) => (
              <div key={order.id} className="hover:bg-gray-50">
                <div
                  className="flex items-center px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {order.order_ref}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getUtilColor(order.utilization)}`}>
                        {Math.round(order.utilization * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>박스: {order.box?.name || order.box_id}</span>
                      <span>{order.box ? `${order.box.length}×${order.box.width}×${order.box.height}cm` : ''}</span>
                      <span>{new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 주문 이력을 삭제하시겠습니까?')) deleteMutation.mutate(order.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedId === order.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* 확장: 제품 상세 */}
                {expandedId === order.id && order.items && (
                  <div className="px-5 pb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-gray-500 font-medium">제품명</th>
                          <th className="text-right py-2 text-gray-500 font-medium">가로</th>
                          <th className="text-right py-2 text-gray-500 font-medium">세로</th>
                          <th className="text-right py-2 text-gray-500 font-medium">높이</th>
                          <th className="text-right py-2 text-gray-500 font-medium">무게</th>
                          <th className="text-right py-2 text-gray-500 font-medium">수량</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item: any) => (
                          <tr key={item.id} className="border-b border-gray-50">
                            <td className="py-1.5 text-gray-700">{item.name}</td>
                            <td className="py-1.5 text-right text-gray-600">{item.length}cm</td>
                            <td className="py-1.5 text-right text-gray-600">{item.width}cm</td>
                            <td className="py-1.5 text-right text-gray-600">{item.height}cm</td>
                            <td className="py-1.5 text-right text-gray-600">{item.weight}kg</td>
                            <td className="py-1.5 text-right text-gray-600">{item.quantity}개</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 flex gap-6 text-xs text-gray-500">
                      <span>제품 부피: {order.total_volume?.toLocaleString()} cm³</span>
                      <span>박스 부피: {order.box_volume?.toLocaleString()} cm³</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
