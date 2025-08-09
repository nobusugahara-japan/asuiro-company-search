import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AppTab {
  path: string;
  label: string;
}

const routeNameMap: Record<string, string> = {
  "/company-search": 'ワード検索',
  "/advanced-search": '絞り込み検索',
  "/search-history": '検索済み条件一覧',
  "/company-detail": '企業詳細',
  "/data-statistics": '全データ統計',
  "/admin/import": 'データインポート',
  "/admin/users": 'ユーザー管理',
  "/admin/system": 'システム設定',
  "/admin/audit": '監査ログ',
  "/reports": 'レポート一覧',
  "/reports/create": 'レポート作成',
  "/reports/templates": 'レポートテンプレート',
  "/dev/dev1": '開発1',
};

const MAX_TABS = 8; // 最大表示タブ数

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
      setTabs((prev) => {
        // 既存のタブがある場合は最前面に移動
        const existingIndex = prev.findIndex((t) => t.path === path);
        if (existingIndex !== -1) {
          const newTabs = [...prev];
          const [tab] = newTabs.splice(existingIndex, 1);
          return [tab, ...newTabs];
        }
        // 新しいタブを追加（最大数を超える場合は古いものを削除）
        const newTabs = [{ path, label }, ...prev];
        return newTabs.slice(0, MAX_TABS);
      });
    }
  }, [location.pathname]);

  const closeTab = (path: string) =>
    setTabs((prev) => prev.filter((t) => t.path !== path));

  return (
    <header
      className="fixed top-0 z-40 bg-white shadow rounded-lg transition-all duration-300"
      style={{
        left: sidebarOpen ? '275px' : '7vw',
        width: sidebarOpen ? 'calc(100% - 275px - 7vw)' : 'calc(100% - 10vw)',
      }}
    >
      <div className="px-4 py-1 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">最近使用:</span>
          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
            <Link
              to="/"
              className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ホーム
            </Link>
            {tabs.map((tab, index) => {
              const active = location.pathname.startsWith(tab.path);
              return (
                <div
                  key={tab.path}
                  className={`group flex items-center gap-1 px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-all ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    opacity: index === 0 ? 1 : index === 1 ? 0.9 : index === 2 ? 0.8 : 0.7,
                  }}
                >
                  <Link to={tab.path} className="flex items-center gap-1">
                    {index === 0 && (
                      <span className="text-xs">●</span>
                    )}
                    {tab.label}
                  </Link>
                  <button
                    aria-label="close tab"
                    onClick={(e) => {
                      e.preventDefault();
                      closeTab(tab.path);
                    }}
                    className={`ml-1 h-4 w-4 flex items-center justify-center rounded transition-opacity ${
                      active 
                        ? 'hover:bg-white/20 text-white' 
                        : 'hover:bg-gray-300 text-gray-600'
                    } opacity-0 group-hover:opacity-100`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}