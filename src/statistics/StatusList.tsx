import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import type { Company} from "../types";
import CompanyDetailModal from "../search/CompanyDetailModal";
import { searchCompanies } from "../libs/api";

const client = generateClient<Schema>();

export default function StatusList() {
  const [statusData, setStatusData] = useState<Array<{
    id: string;
    status: string;
    company?: Company;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    try {
      setLoading(true);
      
      // CompanyInfoからステータスデータを取得
      const { data: companyInfos } = await client.models.CompanyInfo.list();
      
      if (companyInfos && companyInfos.length > 0) {
        const filteredInfos = companyInfos.filter(info => info.status !== "選択なし");
        
        if (filteredInfos.length === 0) {
          setStatusData([]);
          return;
        }
        
        // 全てのIDを収集してバッチで検索（効率化）
        const allIds = filteredInfos.map(info => info.id);
        console.log("Searching for companies with IDs:", allIds);
        
        // まず、IDを直接検索してみる
        let companyMap = new Map<string, Company>();
        
        // バッチでIDで検索を試行
        try {
          for (const id of allIds) {
            try {
              // 単一IDでの検索を試行
              const searchResponse = await searchCompanies({
                q: id, // IDそのものを検索
                limit: 10 // 複数結果の可能性も考慮
              });
              
              // IDが完全一致する企業を探す
              const exactMatch = searchResponse.items.find(company => company.id === id);
              if (exactMatch) {
                companyMap.set(id, exactMatch);
                console.log(`Found company for ID ${id}:`, exactMatch.name);
              } else {
                console.log(`No exact match found for ID ${id}, found ${searchResponse.items.length} search results`);
                // デバッグ用に最初の結果も確認
                if (searchResponse.items.length > 0) {
                  console.log(`First search result for ID ${id}:`, {
                    id: searchResponse.items[0].id, 
                    name: searchResponse.items[0].name
                  });
                }
              }
            } catch (idError) {
              console.error(`Error searching for company with ID ${id}:`, idError);
            }
          }
        } catch (batchError) {
          console.error("Error in batch company search:", batchError);
        }
        
        // 結果をマッピング
        const enrichedData = filteredInfos.map((info) => {
          const matchedCompany = companyMap.get(info.id);
          
          return {
            id: info.id,
            status: info.status,
            company: matchedCompany
          };
        });
        
        setStatusData(enrichedData);
      }
    } catch (error) {
      console.error("Error fetching status data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
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
                  会社名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  業種
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
                    {item.company ? (
                      <button
                        onClick={() => item.company && handleCompanyClick(item.company)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {item.company.name || "-"}
                      </button>
                    ) : (
                      <span className="text-gray-400">ID: {item.id}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const industries = [];
                      if (item.company?.industryMajor) {
                        if (Array.isArray(item.company.industryMajor)) {
                          industries.push(...item.company.industryMajor);
                        } else {
                          industries.push(item.company.industryMajor);
                        }
                      }
                      if (item.company?.industryMidName) {
                        if (Array.isArray(item.company.industryMidName)) {
                          industries.push(...item.company.industryMidName);
                        } else {
                          industries.push(item.company.industryMidName);
                        }
                      }
                      return industries.length > 0 ? industries.join(", ") : "-";
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.company?.pref || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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