import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Lightbulb, Loader2, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../api';

function getUtilBarColor(util: number): string {
  if (util >= 0.7) return 'bg-green-500';
  if (util >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['analytics-usage', startDate, endDate],
    queryFn: () => analyticsApi.getUsage({ start: startDate || undefined, end: endDate || undefined }),
  });

  const { data: suggestData, isLoading: suggestLoading } = useQuery({
    queryKey: ['analytics-suggest'],
    queryFn: analyticsApi.getSuggestions,
  });

  const usage = usageData?.usage || [];
  const suggestions = suggestData?.suggestions || [];
  const maxCount = Math.max(...usage.map((u: any) => u.count), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">재고 분석</h1>
        <p className="text-sm text-gray-500 mt-1">박스 사용 패턴 및 최적 사이즈 분석</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">총 주문 수</div>
          <div className="text-3xl font-bold text-gray-900">
            {usageLoading ? '-' : usageData?.total_orders || 0}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">평균 공간 활용률</div>
          <div className="text-3xl font-bold text-gray-900">
            {usageLoading ? '-' : usageData?.avg_utilization ? `${Math.round(usageData.avg_utilization * 100)}%` : '0%'}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">사용 박스 종류</div>
          <div className="text-3xl font-bold text-gray-900">
            {usageLoading ? '-' : usage.length}
          </div>
        </div>
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
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 박스별 사용 통계 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">박스별 사용 빈도</h2>
        </div>

        {usageLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : usage.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">아직 확정된 주문이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">박스 추천 후 확정하면 통계가 생성됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usage.map((u: any) => (
              <div key={u.box_id} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-700 truncate">{u.box_name}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(u.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-gray-600 text-right">{u.count}건</span>
                  </div>
                </div>
                <div className="w-20 flex items-center gap-1">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getUtilBarColor(u.avg_utilization)}`}
                      style={{ width: `${(u.avg_utilization || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round((u.avg_utilization || 0) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 박스 사이즈 제안 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">최적 박스 사이즈 제안</h2>
        </div>

        {suggestLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">아직 제안할 내용이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">충분한 주문 이력이 쌓이면 제안이 생성됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s: any, i: number) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-900">{s.reason}</p>
                    <p className="text-sm text-amber-700 mt-1">
                      추천 크기: <span className="font-bold">{s.length} × {s.width} × {s.height} cm</span>
                    </p>
                  </div>
                  {s.estimated_savings > 0 && (
                    <span className="text-sm font-bold text-green-700 whitespace-nowrap">
                      예상 절감: ₩{s.estimated_savings.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
