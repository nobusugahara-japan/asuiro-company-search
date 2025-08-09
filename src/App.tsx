import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import Home from "./components/Home";
import Header from "./components/Header";
import LeftSideBar from "./components/LeftSideBar";
import CompanySearch from "./search/CompanySearch";

function AppContent() {
  const { isAuthenticated, sidebarOpen, setSidebarOpen } = useAppContext();

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
      <div className="min-h-screen bg-gray-50">
        <LeftSideBar open={sidebarOpen} setOpen={setSidebarOpen} />
        <Header sidebarOpen={sidebarOpen} />
        <main 
          className="transition-all duration-300" 
          style={{ 
            marginLeft: sidebarOpen ? '240px' : '64px',
            paddingTop: '60px' 
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/company-search" element={<CompanySearch />} />
            <Route path="/advanced-search" element={<AdvancedSearch />} />
            <Route path="/company-detail" element={<CompanyDetail />} />
            <Route path="/data-statistics" element={<DataStatistics />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
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

function AdvancedSearch() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">絞り込み検索</h1>
      <p>絞り込み検索機能は現在開発中です。</p>
    </div>
  );
}

function DataStatistics() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">全データ統計</h1>
      <p>全データ統計機能は現在開発中です。</p>
    </div>
  );
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