import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { boxApi } from '../api';
import type { Box, BoxInput } from '../../../shared/types';

const EMPTY_FORM: BoxInput = { name: '', length: 0, width: 0, height: 0, weight_limit: 0, cost: 0 };

export default function BoxCatalogPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BoxInput>({ ...EMPTY_FORM });

  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ['boxes'],
    queryFn: () => boxApi.getAll(true),
  });

  const createMutation = useMutation({
    mutationFn: boxApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BoxInput> }) => boxApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: boxApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boxes'] }),
  });

  function handleToggleActive(box: Box) {
    updateMutation.mutate({ id: box.id, data: { is_active: !box.is_active } });
  }

  function startEdit(box: Box) {
    setEditingId(box.id);
    setForm({
      name: box.name,
      length: box.length,
      width: box.width,
      height: box.height,
      weight_limit: box.weight_limit,
      cost: box.cost,
    });
  }

  function saveEdit(id: string) {
    updateMutation.mutate({ id, data: form });
  }

  function handleCreate() {
    if (!form.name || !form.length || !form.width || !form.height) return;
    createMutation.mutate(form);
  }

  function handleField(field: keyof BoxInput, value: string) {
    if (field === 'name') {
      setForm((f) => ({ ...f, name: value }));
    } else {
      setForm((f) => ({ ...f, [field]: parseFloat(value) || 0 }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">박스 카탈로그</h1>
          <p className="text-sm text-gray-500 mt-1">사용 가능한 박스 목록 관리</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm({ ...EMPTY_FORM }); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '취소' : '박스 추가'}
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">새 박스 추가</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">이름</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="박스 이름"
              />
            </div>
            {(['length', 'width', 'height'] as const).map((dim) => (
              <div key={dim}>
                <label className="block text-xs text-gray-500 mb-1">
                  {dim === 'length' ? '가로' : dim === 'width' ? '세로' : '높이'} (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form[dim] || ''}
                  onChange={(e) => handleField(dim, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">무게 한도 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weight_limit || ''}
                onChange={(e) => handleField('weight_limit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">비용 (원)</label>
              <input
                type="number"
                step="10"
                value={form.cost || ''}
                onChange={(e) => handleField('cost', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 박스 목록 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 박스가 없습니다. 박스를 추가하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">상태</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">이름</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">가로</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">세로</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">높이</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">부피</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">무게 한도</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">비용</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">작업</th>
                </tr>
              </thead>
              <tbody>
                {boxes.map((box: Box) => (
                  <tr
                    key={box.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${!box.is_active ? 'opacity-50' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggleActive(box)} title={box.is_active ? '비활성화' : '활성화'}>
                        {box.is_active ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === box.id ? (
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => handleField('name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{box.name}</span>
                      )}
                    </td>
                    {editingId === box.id ? (
                      <>
                        {(['length', 'width', 'height'] as const).map((dim) => (
                          <td key={dim} className="py-3 px-4">
                            <input
                              type="number"
                              step="0.1"
                              value={form[dim] || ''}
                              onChange={(e) => handleField(dim, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                            />
                          </td>
                        ))}
                        <td className="py-3 px-4 text-right text-gray-600">
                          {((form.length || 0) * (form.width || 0) * (form.height || 0)).toLocaleString()} cm³
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.1"
                            value={form.weight_limit || ''}
                            onChange={(e) => handleField('weight_limit', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="10"
                            value={form.cost || ''}
                            onChange={(e) => handleField('cost', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-right text-gray-600">{box.length}cm</td>
                        <td className="py-3 px-4 text-right text-gray-600">{box.width}cm</td>
                        <td className="py-3 px-4 text-right text-gray-600">{box.height}cm</td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {(box.length * box.width * box.height).toLocaleString()} cm³
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">{box.weight_limit}kg</td>
                        <td className="py-3 px-4 text-right text-gray-600">₩{box.cost.toLocaleString()}</td>
                      </>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === box.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(box.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(box)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm('이 박스를 삭제하시겠습니까?')) deleteMutation.mutate(box.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
