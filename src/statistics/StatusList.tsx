import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import type { Company } from "../types";
import CompanyDetailModal from "../search/CompanyDetailModal";
import { searchCompanies } from "../libs/api";

const client = generateClient<Schema>();

export default function StatusList() {
  const [statusData, setStatusData] = useState<Array<{
    id: string;
    companyName?: string | null;
    status: string;
    prefectureName?: string | null;
    industryMajor?: string | null;
    industryMidName?: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    try {
      setLoading(true);
      
      // CompanyInfoからステータスデータを取得
      const { data: companyInfos } = await client.models.CompanyInfo.list();
      
      if (companyInfos && companyInfos.length > 0) {
        // 選択なしを除外してデータを設定
        const filteredData = companyInfos
          .filter(info => info.status !== "選択なし")
          .map(info => ({
            id: info.id,
            companyName: (info as any).companyName,
            status: info.status,
            prefectureName: (info as any).prefectureName,
            industryMajor: (info as any).industryMajor,
            industryMidName: (info as any).industryMidName
          }));
        
        setStatusData(filteredData);
      }
    } catch (error) {
      console.error("Error fetching status data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = async (companyId: string) => {
    setSearchingCompany(true);
    try {
      // IDで企業を検索
      const searchResp = await searchCompanies({
        q: companyId,
        limit: 10
      });
      
      // IDが完全一致する企業を探す
      const matchedCompany = searchResp.items?.find(c => c.id === companyId);
      
      if (matchedCompany) {
        setSelectedCompany(matchedCompany);
        setIsModalOpen(true);
      } else {
        alert(`企業ID: ${companyId} の詳細データが見つかりませんでした。`);
      }
    } catch (error) {
      console.error("Error searching company:", error);
      alert("企業データの検索中にエラーが発生しました。");
    } finally {
      setSearchingCompany(false);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      // CompanyInfoを更新
      await client.models.CompanyInfo.update({
        id: itemId,
        status: newStatus
      });
      
      // ローカルの状態を更新
      setStatusData(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
      
      setEditingStatusId(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("ステータスの更新に失敗しました");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "AP取得":
        return "bg-blue-100 text-blue-800";
      case "受注":
        return "bg-green-100 text-green-800";
      case "失注":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">ステータス記載済み一覧</h2>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
        </div>
      ) : statusData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          ステータスが設定されている企業はありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  企業ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  会社名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業種（大分類）
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業種（中分類）
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  都道府県
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statusData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleCompanyClick(item.id)}
                      disabled={searchingCompany}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {item.id}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.companyName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.industryMajor || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.industryMidName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.prefectureName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingStatusId === item.id ? (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        onBlur={() => setEditingStatusId(null)}
                        disabled={updatingStatus}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      >
                        <option value="選択なし">選択なし</option>
                        <option value="AP取得">AP取得</option>
                        <option value="受注">受注</option>
                        <option value="失注">失注</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingStatusId(item.id)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${getStatusBadgeColor(item.status)}`}
                        disabled={updatingStatus}
                      >
                        {item.status}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 検索中のローディング表示 */}
      {searchingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-600">企業データを検索中...</p>
          </div>
        </div>
      )}

      {/* 企業詳細モーダル */}
      <CompanyDetailModal
        company={selectedCompany}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCompany(null);
          // モーダルを閉じた後にデータを再取得（ステータスが更新されている可能性があるため）
          fetchStatusData();
        }}
      />
    </div>
  );
}