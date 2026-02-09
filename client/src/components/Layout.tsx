import { NavLink } from 'react-router-dom';
import { Package, Box, ClipboardList, BarChart3, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', label: '박스 추천', icon: Package },
  { to: '/catalog', label: '박스 카탈로그', icon: Box },
  { to: '/orders', label: '주문 이력', icon: ClipboardList },
  { to: '/analytics', label: '재고 분석', icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">박스 추천</span>
          </div>
          <button
            className="lg:hidden p-1 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">tychetech.io 풀필먼트</p>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="lg:hidden flex items-center h-16 px-4 bg-white border-b border-gray-200">
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-bold text-gray-900">박스 추천 시스템</span>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
