import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import Home from "./components/Home";
import Header from "./components/Header";
import LeftSideBar from "./components/LeftSideBar";
import CompanySearch from "./search/CompanySearch";
import SearchHistory from "./search/SearchHistory";
import DataImport from "./admin/DataImport";
import DataStatisticsComponent from "./statistics/DataStatistics";
import StatusList from "./statistics/StatusList";

function AppContent() {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <Authenticator />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

function AppRouter() {
  const { sidebarOpen, setSidebarOpen, activeSection, setActiveSection } = useAppContext();
  const location = useLocation();
  
  // ルートパス（"/"）にいるかどうかを判定
  const isOnHomePage = location.pathname === "/";
  
  // セクションボックスを表示するかどうかの判定
  const showSectionBoxes = !sidebarOpen && isOnHomePage;

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftSideBar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <Header sidebarOpen={sidebarOpen} />
      <main 
        className="transition-all duration-300" 
        style={{ 
          marginLeft: sidebarOpen ? '240px' : '64px',
          paddingTop: '60px' 
        }}
      >
        {/* アイコンクリックで表示されるコンテンツ（ホームページでのみ表示） */}
        {showSectionBoxes && (
          <div className="p-6">
            {activeSection === "メイン" && <MainSectionContent />}
            {activeSection === "レポート" && <ReportSectionContent />}
            {activeSection === "管理者用" && <AdminSectionContent />}
            {activeSection === "開発用" && <DevSectionContent />}
          </div>
        )}
        
        {/* 常にルーティングは有効 */}
        {!showSectionBoxes && (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/company-search" element={<CompanySearch />} />
            <Route path="/advanced-search" element={<AdvancedSearch />} />
            <Route path="/search-history" element={<SearchHistory />} />
            <Route path="/company-detail" element={<CompanyDetail />} />
            <Route path="/data-statistics" element={<DataStatistics />} />
            <Route path="/status-list" element={<StatusList />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="/admin/import" element={<DataImport />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}


function CompanyDetail() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">企業詳細</h1>
      <p>企業詳細機能は現在開発中です。</p>
    </div>
  );
}

import AdvancedSearchComponent from "./search/AdvancedSearch";

function AdvancedSearch() {
  return <AdvancedSearchComponent />;
}

// セクションコンテンツコンポーネント
function MainSectionContent() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useAppContext();
  
  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(true);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/company-search')}
      >
        <h3 className="text-lg font-semibold mb-2">ワード検索</h3>
        <p className="text-gray-600">キーワードで企業を検索</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/advanced-search')}
      >
        <h3 className="text-lg font-semibold mb-2">絞り込み検索</h3>
        <p className="text-gray-600">詳細条件で企業を検索</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/search-history')}
      >
        <h3 className="text-lg font-semibold mb-2">検索済み条件一覧</h3>
        <p className="text-gray-600">保存した検索条件を管理</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/data-statistics')}
      >
        <h3 className="text-lg font-semibold mb-2">全データ統計</h3>
        <p className="text-gray-600">データの統計情報を表示</p>
      </div>
    </div>
  );
}

function ReportSectionContent() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useAppContext();
  
  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(true);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/reports')}
      >
        <h3 className="text-lg font-semibold mb-2">レポート一覧</h3>
        <p className="text-gray-600">作成済みレポートを表示</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/reports/create')}
      >
        <h3 className="text-lg font-semibold mb-2">レポート作成</h3>
        <p className="text-gray-600">新規レポートを作成</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/reports/templates')}
      >
        <h3 className="text-lg font-semibold mb-2">レポートテンプレート</h3>
        <p className="text-gray-600">テンプレートを管理</p>
      </div>
    </div>
  );
}

function AdminSectionContent() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useAppContext();
  
  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(true);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/admin/import')}
      >
        <h3 className="text-lg font-semibold mb-2">データインポート</h3>
        <p className="text-gray-600">ExcelやCSVデータをインポート</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/admin/users')}
      >
        <h3 className="text-lg font-semibold mb-2">ユーザー管理</h3>
        <p className="text-gray-600">ユーザーアカウントを管理</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/admin/system')}
      >
        <h3 className="text-lg font-semibold mb-2">システム設定</h3>
        <p className="text-gray-600">システムの設定を変更</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/admin/audit')}
      >
        <h3 className="text-lg font-semibold mb-2">監査ログ</h3>
        <p className="text-gray-600">システムログを確認</p>
      </div>
    </div>
  );
}

function DevSectionContent() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useAppContext();
  
  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(true);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleNavigate('/dev/dev1')}
      >
        <h3 className="text-lg font-semibold mb-2">開発ツール</h3>
        <p className="text-gray-600">開発用ツールとデバッグ機能</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => alert('APIテスト機能は開発中です')}
      >
        <h3 className="text-lg font-semibold mb-2">APIテスト</h3>
        <p className="text-gray-600">API接続をテスト</p>
      </div>
      <div 
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => alert('データベース機能は開発中です')}
      >
        <h3 className="text-lg font-semibold mb-2">データベース</h3>
        <p className="text-gray-600">DBスキーマと接続確認</p>
      </div>
    </div>
  );
}

function DataStatistics() {
  return <DataStatisticsComponent />;
}

function DataManagement() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">データ管理</h1>
      <p>データ管理機能は現在開発中です。</p>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;