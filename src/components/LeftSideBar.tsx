import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Disclosure, Transition } from "@headlessui/react";
import { RiMenuFold3Fill, RiMenuFold4Fill } from "react-icons/ri";
import { 
  ChevronDownIcon,
  HomeIcon,
  // MagnifyingGlassIcon,
  // ChartBarIcon,
  CircleStackIcon,
  DocumentTextIcon,
  CogIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";

const menuGroups = [
  {
    title: "メイン",
    icon: <HomeIcon className="w-5 h-5" />,
    items: [
      { label: "ホーム", path: "/" },
      { label: "企業検索", path: "/company-search" },
      { label: "企業詳細", path: "/company-detail" },
      { label: "企業分析", path: "/company-analysis" },
      { label: "ダッシュボード", path: "/dashboard" },
    ],
  },
  {
    title: "データ管理",
    icon: <CircleStackIcon className="w-5 h-5" />,
    items: [
      { label: "データ管理", path: "/data-management" },
      { label: "データインポート", path: "/admin/import" },
      { label: "データエクスポート", path: "/admin/export" },
      { label: "データ同期", path: "/data-sync" },
    ],
  },
  {
    title: "レポート",
    icon: <DocumentTextIcon className="w-5 h-5" />,
    items: [
      { label: "レポート一覧", path: "/reports" },
      { label: "レポート作成", path: "/reports/create" },
      { label: "レポートテンプレート", path: "/reports/templates" },
    ],
  },
  {
    title: "管理者用",
    icon: <CogIcon className="w-5 h-5" />,
    items: [
      { label: "ユーザー管理", path: "/admin/users" },
      { label: "システム設定", path: "/admin/system" },
      { label: "監査ログ", path: "/admin/audit" },
    ],
  },
  {
    title: "開発用",
    icon: <BeakerIcon className="w-5 h-5" />,
    items: [
      { label: "APIテスト", path: "/dev/api-test" },
      { label: "データベース管理", path: "/dev/database" },
      { label: "パフォーマンス", path: "/dev/performance" },
      { label: "デバッグ", path: "/dev/debug" },
    ],
  },
];

export default function LeftSideBar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    setUserName("ユーザー名");
  }, []);

  return (
    <aside
      className={`fixed inset-y-0 left-0 bg-blue-900 text-white z-40 flex flex-col transition-all duration-300 ease-in-out ${
        open ? "w-64" : "w-16"
      } shadow-lg overflow-hidden`}
    >
      {/* ヘッダー部分 */}
      <div className="h-16 border-b border-blue-800">
        <button
          className="h-full w-full flex items-center gap-3 px-4 hover:bg-blue-800 transition-colors focus:outline-none focus:bg-blue-800"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <RiMenuFold3Fill size={24} className="flex-shrink-0" />
          ) : (
            <RiMenuFold4Fill size={24} className="flex-shrink-0" />
          )}
          {open && (
            <span className="font-medium text-lg whitespace-nowrap">
              {userName}
            </span>
          )}
        </button>
      </div>

      {/* ナビゲーション部分 */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2" style={{ minWidth: 0 }}>
        {menuGroups.map((group) => (
          <div key={group.title}>
            {open ? (
              <Disclosure defaultOpen>
                {({ open: disclosureOpen }) => (
                  <>
                    <Disclosure.Button className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden">
                      <span className="whitespace-nowrap">{group.title}</span>
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          disclosureOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Disclosure.Button>
                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <Disclosure.Panel className="mt-1 space-y-1 overflow-hidden">
                        {group.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="block px-4 py-2 text-sm text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors ml-2 whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            ) : (
              // 閉じている時はアイコンを表示
              <div className="py-1">
                <Link
                  to={group.items[0].path}
                  className="flex items-center justify-center w-10 h-10 hover:bg-blue-800 rounded-lg transition-colors mx-auto"
                  title={group.title}
                >
                  {group.icon}
                </Link>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* フッター部分 */}
      <div className="p-3 border-t border-blue-800">
        {open ? (
          <button
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 whitespace-nowrap"
            onClick={() => console.log("サインアウト")}
          >
            サインアウト
          </button>
        ) : (
          <button
            className="flex items-center justify-center w-10 h-10 hover:bg-blue-800 rounded-lg transition-colors mx-auto"
            onClick={() => console.log("サインアウト")}
            title="サインアウト"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}