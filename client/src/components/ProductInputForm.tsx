import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../../../shared/types';

interface Props {
  onAdd: (product: Product) => void;
}

const INITIAL: Product = { name: '', length: 0, width: 0, height: 0, weight: 0, quantity: 1 };

export default function ProductInputForm({ onAdd }: Props) {
  const [form, setForm] = useState<Product>({ ...INITIAL });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '제품명을 입력하세요';
    if (form.length <= 0) e.length = '양수 입력';
    if (form.width <= 0) e.width = '양수 입력';
    if (form.height <= 0) e.height = '양수 입력';
    if (form.quantity < 1) e.quantity = '1 이상';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onAdd({ ...form, name: form.name.trim() });
    setForm({ ...INITIAL });
    setErrors({});
  }

  function handleChange(field: keyof Product, value: string) {
    if (field === 'name') {
      setForm((f) => ({ ...f, name: value }));
    } else {
      setForm((f) => ({ ...f, [field]: parseFloat(value) || 0 }));
    }
    if (errors[field]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">제품 추가</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <label className="block text-xs text-gray-500 mb-1">제품명</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="제품 이름"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {(['length', 'width', 'height'] as const).map((dim) => (
          <div key={dim}>
            <label className="block text-xs text-gray-500 mb-1">
              {dim === 'length' ? '가로' : dim === 'width' ? '세로' : '높이'} (cm)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form[dim] || ''}
              onChange={(e) => handleChange(dim, e.target.value)}
              placeholder="cm"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[dim] ? 'border-red-400' : 'border-gray-300'
              }`}
            />
          </div>
        ))}

        <div>
          <label className="block text-xs text-gray-500 mb-1">무게 (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            placeholder="kg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">수량</label>
          <input
            type="number"
            min="1"
            value={form.quantity || ''}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="개"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.quantity ? 'border-red-400' : 'border-gray-300'
            }`}
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
      </div>
    </form>
  );
}
