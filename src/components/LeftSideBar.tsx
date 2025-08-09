import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Disclosure, Transition } from "@headlessui/react";
import { RiMenuFold3Fill, RiMenuFold4Fill } from "react-icons/ri";
import { signOut } from "aws-amplify/auth";
import { useAppContext } from "../contexts/AppContext";
import { 
  ChevronDownIcon,
  HomeIcon,
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
      { label: "ワード検索", path: "/company-search" },
      { label: "絞り込み検索", path: "/advanced-search" },
      { label: "検索済み条件一覧", path: "/search-history" },
      { label: "全データ統計", path: "/data-statistics" },
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
      { label: "データインポート", path: "/admin/import" },
      { label: "ユーザー管理", path: "/admin/users" },
      { label: "システム設定", path: "/admin/system" },
      { label: "監査ログ", path: "/admin/audit" },
    ],
  },
  {
    title: "開発用",
    icon: <BeakerIcon className="w-5 h-5" />,
    items: [
      { label: "開発1", path: "/dev/dev1" },
    ],
  },
];

export default function LeftSideBar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { user } = useAppContext();
  const sidebarRef = useRef<HTMLElement>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ユーザー名の表示を生成
  const displayName = user ? 
    (user.lastName && user.firstName ? 
      `${user.lastName} ${user.firstName}` : 
      user.username) : 
    "ユーザー名";

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log("サインアウトしました");
      // ページをリロードして認証状態をリセット
      window.location.reload();
    } catch (error) {
      console.error("サインアウトエラー:", error);
    }
  };

  // サイドバー外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  // 3秒間操作がなければ自動で閉じる
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (open) {
        inactivityTimerRef.current = setTimeout(() => {
          setOpen(false);
        }, 10000);
      }
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    if (open) {
      resetInactivityTimer();
      document.addEventListener('mousemove', handleActivity);
      document.addEventListener('keypress', handleActivity);
      document.addEventListener('click', handleActivity);
      document.addEventListener('touchstart', handleActivity);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [open, setOpen]);

  return (
    <aside
      ref={sidebarRef}
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
              {displayName}
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
                            onClick={(e) => {
                              console.log("Navigating to:", item.path);
                              // イベントの伝播を止める
                              e.stopPropagation();
                            }}
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
            className="w-full py-2 px-4 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
            onClick={handleSignOut}
          >
            サインアウト
          </button>
        ) : (
          <button
            className="flex items-center justify-center w-10 h-10 hover:bg-blue-800 rounded-lg transition-colors mx-auto"
            onClick={handleSignOut}
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