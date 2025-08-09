import { useMemo, useRef, useEffect, useState } from "react";
import { FaSearch, FaFileExcel } from "react-icons/fa";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
import { searchCompanies } from "../libs/api";
import type { Company, SearchRequest, SearchResponse } from "../types";
import CompanyDetailModal from "./CompanyDetailModal";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { useAppContext } from "../contexts/AppContext";
import * as XLSX from "xlsx";

const PREFS = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県",
  "東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県",
  "香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"
];

const client = generateClient<Schema>();

// 入力クエリの正規化（全角→半角、連続空白の圧縮）
function normalizeQuery(s: string) {
  return s.replace(/\u3000/g, " ").trim().replace(/\s+/g, " ");
}

export default function CompanySearch() {
  const { user } = useAppContext();
  const location = useLocation();
  const [q, setQ] = useState("");
  const lastKeyRef = useRef<string>("");
  const [cleared, setCleared] = useState(false);
  const [pref, setPref] = useState("");
  const [paramsLoaded, setParamsLoaded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<SearchResponse | null>(null);
  const [items, setItems] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reqBase: SearchRequest = useMemo(() => {
    const qNorm = normalizeQuery(q);
    return {
      q: qNorm ? qNorm : undefined,
      pref: pref || undefined,
      orderBy: "revenueK_latest",
      desc: true,
      limit: 20,
    };
  }, [q, pref]);

  const queryKey = useMemo(() => JSON.stringify(reqBase), [reqBase]);

  // URLパラメータから検索条件を復元
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQ = params.get("q");
    const urlPref = params.get("pref");

    if (urlQ !== null) setQ(urlQ);
    if (urlPref !== null) setPref(urlPref);
    
    setParamsLoaded(true);
  }, [location.search]);

  // パラメータがロードされた後、自動検索を実行
  useEffect(() => {
    if (paramsLoaded && location.search) {
      const params = new URLSearchParams(location.search);
      if (params.get("q") || params.get("pref")) {
        // 少し遅延を入れて、状態が確実に更新されてから検索を実行
        const timer = setTimeout(() => {
          runSearch(0);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [paramsLoaded, location.search]);

  useEffect(() => {
    if (paramsLoaded) {
      setItems([]);
      setResp(null);
      setCleared(true); // 条件変更直後は「未検索＝なし」表示
    }
  }, [queryKey]);

  // 都道府県が変更されたら自動検索
  const prevPrefRef = useRef(pref);
  useEffect(() => {
    if (paramsLoaded && pref !== prevPrefRef.current) {
      prevPrefRef.current = pref;
      // 既に検索済みの場合のみ自動検索（初回検索後）
      if (items.length > 0 || resp) {
        runSearch(0);
      }
    }
  }, [pref, paramsLoaded]);

  async function handleSaveSettings() {
    // 検索条件がない場合は保存しない
    if (!q && !pref) {
      alert("保存する検索条件を入力してください。");
      return;
    }

    // 検索結果の件数を取得（現在の結果から）
    const resultCount = resp?.total || items.length || 0;
    
    try {
      await saveSearchQuery(resultCount);
      alert("検索条件を保存しました。");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("検索条件の保存に失敗しました。");
    }
  }

  async function saveSearchQuery(resultCount: number) {
    try {
      // 検索条件を作成
      const filters = {
        pref: pref || undefined,
      };

      // タイトルを生成（キーワードと絞り込み条件を含む）
      let title = q || "全件検索";
      if (pref) title += ` / ${pref}`;

      // 既存の同じ検索条件を探す
      const existingQueries = await client.models.SavedQuery.list({
        filter: {
          keyword: { eq: q || undefined },
          title: { eq: title }
        }
      });

      const now = new Date().toISOString();

      if (existingQueries.data && existingQueries.data.length > 0) {
        // 既存の検索条件を更新（使用回数をインクリメント）
        const existing = existingQueries.data[0];
        await client.models.SavedQuery.update({
          id: existing.id,
          lastResultCount: resultCount,
          lastRunAt: now,
          usageCount: (existing.usageCount || 0) + 1,
        });
        console.log("検索条件を更新しました:", title);
      } else {
        // 新規の検索条件を保存
        await client.models.SavedQuery.create({
          title: title,
          keyword: q || undefined,
          filters: JSON.stringify(filters),
          lastResultCount: resultCount,
          lastRunAt: now,
          usageCount: 1,
          isPublic: true,
          createdBy: user?.email || user?.username || "unknown",
          description: `キーワード「${q || "なし"}」での検索`,
        });
        console.log("新しい検索条件を保存しました:", title);
      }
    } catch (error) {
      console.error("検索条件の保存に失敗しました:", error);
    }
  }

  async function runSearch(cursor?: number) {
    setLoading(true);
    setError(null);
    try {
      const key = queryKey;
      const sameCondition = lastKeyRef.current === key;
      const append = sameCondition && typeof cursor === "number" && cursor > 0;

      // デバッグ用: 実際の検索条件をログ出力
      console.log("検索実行:", { ...reqBase, cursor });

      const data = await searchCompanies({ ...reqBase, cursor });

      setResp(data);
      setItems(prev => (append ? [...prev, ...data.items] : data.items));
      lastKeyRef.current = key;
      setCleared(false); // 検索実行後は未検索フラグOFF

      // 自動保存を無効化（手動保存ボタンを使用）
      // if (!cursor || cursor === 0) {
      //   await saveSearchQuery(data.total || data.items.length);
      // }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(0); // 0 は置換モード
  }

  function handleCompanyClick(company: Company) {
    setSelectedCompany(company);
    setIsModalOpen(true);
  }

  async function exportToExcel() {
    if (!items || items.length === 0) {
      alert("エクスポートするデータがありません。先に検索を実行してください。");
      return;
    }

    try {
      // デバッグ: 最初のアイテムの構造を確認
      if (items.length > 0) {
        console.log("検索結果の最初のアイテム:", items[0]);
      }

      // データを整形（APIから返される全ての利用可能なデータを含む）
      const exportData = items.map(item => {
        // 最新の財務情報を取得
        const latestFinancial = item.financials && item.financials.length > 0 
          ? item.financials[0] 
          : null;

        return {
          "企業ID": item.id || "",
          "企業名": item.name || "",
          "企業名カナ": item.nameKana || "",
          "都道府県": item.pref || "",
          "郵便番号": item.address?.zip || "",
          "住所": item.address?.text || "",
          "電話番号": item.address?.tel || "",
          "概要": item.outline || "",
          "評価": item.rating || "",
          "業種コード": item.industry?.join(", ") || "",
          "業種名": item.industryNames?.join(", ") || "",
          
          // 法人情報
          "法人種別": item.legal?.corpFormCode || "",
          "索引漢字名": item.legal?.indexKanjiName || "",
          "索引カナ名": item.legal?.indexKanaName || "",
          
          // 創業・設立情報
          "創業年月": item.founded?.foundingYm || "",
          "江戸創業年": item.founded?.edoFoundedYear || "",
          "設立年月日": item.founded?.incorporationYmd || "",
          
          // 会社規模
          "資本金（千円）": item.companyStats?.capitalK || "",
          "従業員数": item.companyStats?.employees || "",
          "工場数": item.companyStats?.factories || "",
          "事業所数": item.companyStats?.offices || "",
          
          // 財務情報（最新）
          "売上高（千円）": latestFinancial?.revenueK || "",
          "利益（千円）": latestFinancial?.profitK || "",
          "自己資本比率": latestFinancial?.equityRatio || "",
          "決算年月": latestFinancial?.yearMonth || "",
          
          // 上場情報
          "上場市場": item.listing?.market || "",
          "証券コード": item.listing?.ticker || "",
          "EDINETコード": item.listing?.edinet || "",
          
          // 代表者情報
          "代表者名": item.representative?.name || "",
          "代表者カナ": item.representative?.kana || "",
          "代表者役職": item.representative?.title || "",
          "代表者電話": item.representative?.tel || "",
          
          // データ基準日
          "調査年月日": item.dataDates?.surveyYmd || "",
          "DB更新日": item.dataDates?.dbUpdateYmd || "",
          
          // 取引関係
          "取引先": item.clients?.join(", ") || "",
          "仕入先": item.suppliers?.join(", ") || "",
          
          // 事業内容
          "事業内容": item.businessItems?.map(b => b.text).filter(t => t).join(", ") || "",
          
          // 取引銀行
          "取引銀行": item.banks?.map(b => `${b.name || ""}${b.branch ? " " + b.branch : ""}`).filter(t => t).join(", ") || "",
          
          // 役員（最大3名まで）
          "役員1": item.officers && item.officers[0] ? `${item.officers[0].title || ""} ${item.officers[0].name || ""}` : "",
          "役員2": item.officers && item.officers[1] ? `${item.officers[1].title || ""} ${item.officers[1].name || ""}` : "",
          "役員3": item.officers && item.officers[2] ? `${item.officers[2].title || ""} ${item.officers[2].name || ""}` : "",
          
          // 株主（最大3名まで）
          "株主1": item.shareholders && item.shareholders[0] ? `${item.shareholders[0].name || ""} (${item.shareholders[0].ratio || ""}%)` : "",
          "株主2": item.shareholders && item.shareholders[1] ? `${item.shareholders[1].name || ""} (${item.shareholders[1].ratio || ""}%)` : "",
          "株主3": item.shareholders && item.shareholders[2] ? `${item.shareholders[2].name || ""} (${item.shareholders[2].ratio || ""}%)` : ""
        };
      });

      // ワークブックを作成
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "検索結果");

      // 列幅を自動調整
      const maxWidth = 50;
      const wscols = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length + 2, 
          Math.max(...exportData.map(row => String(row[key as keyof typeof row] || "").length)) + 2))
      }));
      ws['!cols'] = wscols;

      // ファイル名を生成（日時とキーワードを含む）
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const timeStr = now.toTimeString().slice(0, 5).replace(":", "");
      const keyword = q ? `_${q.slice(0, 20)}` : "";
      const prefecture = pref ? `_${pref}` : "";
      const fileName = `検索結果_${dateStr}_${timeStr}${keyword}${prefecture}.xlsx`;

      // ダウンロード
      XLSX.writeFile(wb, fileName);
      
      console.log(`${items.length}件のデータをエクスポートしました: ${fileName}`);
    } catch (error) {
      console.error("エクスポートエラー:", error);
      alert("エクスポート中にエラーが発生しました。");
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">ワード検索</h1>
        <button
          type="button"
          onClick={exportToExcel}
          className="text-green-600 hover:text-green-700 transition-colors"
          title="検索結果をExcelファイルとしてダウンロード"
        >
          <FaFileExcel className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex justify-center gap-2 items-end">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-1">キーワード（全項目対象）</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border rounded-xl pl-10 pr-10 py-2"
                placeholder="例: 海苔 札幌 印刷 乾物卸売業（スペースでAND／&quot;射出 成形&quot; はフレーズ）"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setItems([]);
                    setResp(null);
                    setCleared(true);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleSaveSettings}
            className="flex items-center gap-1 bg-blue-600 text-white text-sm rounded-lg px-3 py-2 hover:bg-blue-700"
            title="現在の検索条件を保存"
          >
            <BookmarkIcon className="w-4 h-4" />
            設定を保存
          </button>
          
          <div className="w-48">
            <label className="block text-sm font-medium mb-1">都道府県</label>
            <select
              value={pref}
              onChange={(e) => setPref(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="">全国</option>
              {PREFS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "検索中…" : "検索"}
          </button>
        </div>
      </form>

      {error && <div className="mt-4 text-red-600 text-sm">Error: {error}</div>}

      <div className="mt-6">
        <div className="text-sm text-gray-600 mb-2">
          {cleared && !loading
            ? "結果: なし（未検索）"
            : resp
              ? `総件数: ${resp.total.toLocaleString()} 件`
              : "検索条件を指定して実行してください"}
        </div>

        {loading && !resp && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">会社名</th>
                  <th className="px-3 py-2 text-left">都道府県</th>
                  <th className="px-3 py-2 text-left">住所</th>
                  <th className="px-3 py-2 text-left">業種名</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2 font-mono">{c.id}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleCompanyClick(c)}
                        className="text-blue-600 underline hover:text-blue-800 text-left"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-3 py-2">{c.pref || "-"}</td>
                    <td className="px-3 py-2">{c.address?.text || "-"}</td>
                    <td className="px-3 py-2">{(c.industryNames || []).join(", ") || "-"}</td>
                  </tr>
                ))}
                {/* 未検索＝なし */}
                {cleared && !loading && items.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">なし</td></tr>
                )}
                {/* 検索済みだが該当なし */}
                {!cleared && !items.length && resp && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">該当なし</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {resp && resp.nextCursor !== null && resp.nextCursor !== undefined && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => runSearch(resp.nextCursor || undefined)}
              disabled={loading}
              className="bg-white border rounded-xl px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
            >
              もっと見る
            </button>
          </div>
        )}
      </div>

      <CompanyDetailModal
        company={selectedCompany}
        isOpen={isModalOpen}
        searchKeyword={q}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCompany(null);
        }}
      />
    </div>
  );
}
