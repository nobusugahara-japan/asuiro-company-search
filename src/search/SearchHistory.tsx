import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { TrashIcon, MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const client = generateClient<Schema>();

export default function SearchHistory() {
  const navigate = useNavigate();
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  useEffect(() => {
    loadSavedQueries();
  }, [sortBy]);

  async function loadSavedQueries() {
    setLoading(true);
    setError(null);
    try {
      const response = await client.models.SavedQuery.list({
        limit: 100,
      });

      if (response.data) {
        let queries = [...response.data];
        
        // ソート処理
        if (sortBy === "recent") {
          queries.sort((a, b) => {
            const dateA = new Date(a.lastRunAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.lastRunAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        } else if (sortBy === "popular") {
          queries.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        }

        setSavedQueries(queries);
      }
    } catch (err: any) {
      setError(err.message || "データの取得に失敗しました");
      console.error("検索履歴の取得エラー:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuery(id: string) {
    if (!confirm("この検索条件を削除しますか？")) return;

    try {
      console.log("削除対象ID:", id);
      const result = await client.models.SavedQuery.delete({ id });
      console.log("削除結果:", result);
      
      if (result.errors) {
        console.error("削除エラー:", result.errors);
        alert("削除に失敗しました: " + JSON.stringify(result.errors));
        return;
      }
      
      // UIから削除
      setSavedQueries(prev => prev.filter(q => q.id !== id));
      console.log("UIから削除完了");
      
      // 削除後に再度リストを取得して確認（デバッグ用）
      setTimeout(async () => {
        const checkResult = await client.models.SavedQuery.list({
          filter: { id: { eq: id } }
        });
        if (checkResult.data && checkResult.data.length > 0) {
          console.error("削除後も存在:", checkResult.data[0]);
          alert("削除に失敗しました。ページを再読み込みしてください。");
        } else {
          console.log("削除確認OK");
        }
      }, 1000);
    } catch (err: any) {
      console.error("削除エラー詳細:", err);
      alert("削除に失敗しました: " + err.message);
    }
  }

  function handleSearchAgain(query: any) {
    // 検索条件を復元して適切な検索画面に遷移
    let filters = {};
    try {
      filters = query.filters ? JSON.parse(query.filters) : {};
    } catch (e) {
      console.error("フィルターのパース失敗:", e);
      filters = {};
    }
    
    // 絞り込み検索の条件があるかチェック
    const hasAdvancedFilters = 
      filters.prefectures?.length > 0 ||
      filters.capital !== null && filters.capital !== undefined ||
      filters.employees !== null && filters.employees !== undefined ||
      filters.offices !== null && filters.offices !== undefined ||
      filters.factories !== null && filters.factories !== undefined ||
      filters.foundedYear !== null && filters.foundedYear !== undefined;
    
    if (hasAdvancedFilters) {
      // 絞り込み検索へ遷移
      const params = new URLSearchParams();
      params.set("filters", JSON.stringify(filters));
      console.log("絞り込み検索へ遷移:", `/advanced-search?${params.toString()}`);
      navigate(`/advanced-search?${params.toString()}`);
    } else {
      // ワード検索へ遷移
      const params = new URLSearchParams();
      
      // キーワードがnullまたは空文字でない場合のみ設定
      if (query.keyword) {
        params.set("q", query.keyword);
      }
      if (filters.pref) {
        params.set("pref", filters.pref);
      }
      
      console.log("ワード検索へ遷移:", `/company-search?${params.toString()}`);
      navigate(`/company-search?${params.toString()}`);
    }
  }

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatFilters(filtersJson: string | null | undefined) {
    if (!filtersJson) return "-";
    try {
      const filters = JSON.parse(filtersJson);
      const parts = [];
      
      // ワード検索のフィルター
      if (filters.pref) parts.push(`都道府県: ${filters.pref}`);
      
      // 絞り込み検索のフィルター
      if (filters.prefectures && filters.prefectures.length > 0) {
        parts.push(`都道府県: ${filters.prefectures.join(", ")}`);
      }
      if (filters.capital) {
        const capitalLabels: Record<string, string> = {
          "1": "1千万円未満",
          "2": "1千万円～1億円",
          "3": "1億円～10億円",
          "4": "10億円～100億円",
          "5": "100億円以上"
        };
        parts.push(`資本金: ${capitalLabels[filters.capital] || filters.capital}`);
      }
      if (filters.employees) {
        const employeesLabels: Record<string, string> = {
          "1": "10人未満",
          "2": "10～50人",
          "3": "50～100人",
          "4": "100～500人",
          "5": "500人以上"
        };
        parts.push(`従業員数: ${employeesLabels[filters.employees] || filters.employees}`);
      }
      if (filters.offices) {
        const officesLabels: Record<string, string> = {
          "1": "1事業所",
          "2": "2～5事業所",
          "3": "6～10事業所",
          "4": "11事業所以上"
        };
        parts.push(`事業所数: ${officesLabels[filters.offices] || filters.offices}`);
      }
      if (filters.factories) {
        const factoriesLabels: Record<string, string> = {
          "0": "工場なし",
          "1": "1工場",
          "2": "2～5工場",
          "3": "6工場以上"
        };
        parts.push(`工場数: ${factoriesLabels[filters.factories] || filters.factories}`);
      }
      if (filters.foundedYear) {
        if (filters.foundedYear.min || filters.foundedYear.max) {
          const min = filters.foundedYear.min || "";
          const max = filters.foundedYear.max || "";
          parts.push(`設立年: ${min}${min && max ? "～" : ""}${max}年`);
        }
      }
      
      return parts.length > 0 ? parts.join(", ") : "-";
    } catch {
      return "-";
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <h1 className="text-2xl font-semibold mb-4">検索済み条件一覧</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <h1 className="text-2xl font-semibold mb-4">検索済み条件一覧</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">検索済み条件一覧</h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sortBy === "recent"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ClockIcon className="inline w-4 h-4 mr-1" />
            最近の検索
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sortBy === "popular"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            人気順
          </button>
        </div>
      </div>

      {savedQueries.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">まだ検索履歴がありません</p>
          <p className="text-sm text-gray-500 mt-1">
            ワード検索を実行すると、ここに履歴が表示されます
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <p className="text-sm text-blue-700">
              <span className="font-medium">💡 ヒント:</span> 行をクリックすると、その条件で再検索します
            </p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  検索条件
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  キーワード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  絞り込み
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  結果数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用回数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最終検索
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {savedQueries.map((query) => (
                <tr 
                  key={query.id} 
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                  onClick={(e) => {
                    // 削除ボタンなどのクリックの場合は行クリックを無効化
                    if ((e.target as HTMLElement).closest('button')) return;
                    handleSearchAgain(query);
                  }}
                  title="クリックして再検索"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                      {query.title}
                    </div>
                    {query.description && (
                      <div className="text-xs text-gray-500">{query.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {query.keyword || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatFilters(query.filters)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {query.lastResultCount !== null && query.lastResultCount !== undefined
                        ? `${query.lastResultCount}件`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {query.usageCount || 0}回
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(query.lastRunAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSearchAgain(query);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="この条件で再検索"
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuery(query.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="削除"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {savedQueries.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          全 {savedQueries.length} 件の検索履歴
        </div>
      )}
    </div>
  );
}