import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AppTab {
  path: string;
  label: string;
}

const routeNameMap: Record<string, string> = {
  "/company-search": '企業検索',
  "/company-detail": '企業詳細',
  "/company-analysis": '企業分析',
  "/data-management": 'データ管理',
  "/admin/import": 'データインポート',
  "/admin/export": 'データエクスポート',
  "/settings": '設定',
  "/reports": 'レポート',
  "/dashboard": 'ダッシュボード',
};

export default function Header({ sidebarOpen }: { sidebarOpen: boolean }) {
  console.log('[Header] sidebarOpen =', sidebarOpen);
  const location = useLocation();
  const [tabs, setTabs] = useState<AppTab[]>(() => {
    try {
      const savedTabs = localStorage.getItem('appTabs');
      return savedTabs ? JSON.parse(savedTabs) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('appTabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    const found = Object.entries(routeNameMap).find(([path]) =>
      location.pathname.startsWith(path),
    );
    if (found) {
      const [path, label] = found;
      setTabs((prev) =>
        prev.some((t) => t.path === path) ? prev : [...prev, { path, label }],
      );
    }
  }, [location.pathname]);

  const closeTab = (path: string) =>
    setTabs((prev) => prev.filter((t) => t.path !== path));

  return (
    <header
      className="fixed top-0 z-40 flex h-12 items-center bg-white px-6 shadow rounded-lg transition-all duration-300"
      style={{
        left: sidebarOpen ? '275px' : '7vw',
        width: sidebarOpen ? 'calc(100% - 275px - 7vw)' : 'calc(100% - 10vw)',
      }}
    >
      <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <Link
          to="/"
          className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${
            location.pathname === '/'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ホーム
        </Link>
        {tabs.map((tab) => {
          const active = location.pathname.startsWith(tab.path);
          return (
            <div
              key={tab.path}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Link to={tab.path}>
                {tab.label}
              </Link>
              <button
                aria-label="close tab"
                onClick={() => closeTab(tab.path)}
                className="ml-2 h-5 w-5 flex items-center justify-center rounded hover:bg-black/10"
              >
                ×
              </button>
            </div>
          );
        })}
      </nav>
    </header>
  );
}