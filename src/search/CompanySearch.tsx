import { useMemo, useRef, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { searchCompanies } from "../libs/api";
import type { Company, SearchRequest, SearchResponse } from "../types";
import CompanyDetailModal from "./CompanyDetailModal";

const PREFS = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県",
  "東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県",
  "香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"
];

export default function CompanySearch() {
  const [q, setQ] = useState("");
  const lastKeyRef = useRef<string>("");
  const [cleared, setCleared] = useState(false);
  const [pref, setPref] = useState("");
  const [revenueMinK, setMin] = useState<string>("");
  const [revenueMaxK, setMax] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<SearchResponse | null>(null);
  const [items, setItems] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reqBase: SearchRequest = useMemo(() => {
    const qTrim = q.trim();
    return {
      q: qTrim ? qTrim : undefined,
      pref: pref || undefined,
      revenueMinK: revenueMinK ? Number(revenueMinK) : undefined,
      revenueMaxK: revenueMaxK ? Number(revenueMaxK) : undefined,
      orderBy: "revenueK_latest",
      desc: true,
      limit: 20,
    };
  }, [q, pref, revenueMinK, revenueMaxK]);

  const queryKey = useMemo(() => JSON.stringify(reqBase), [reqBase]);

  useEffect(() => {
    setItems([]);
    setResp(null);
    setCleared(true); // 条件変更直後は「未検索＝なし」表示
  }, [queryKey]);

  async function runSearch(cursor?: number) {
    setLoading(true);
    setError(null);
    try {
      const key = queryKey;
      const sameCondition = lastKeyRef.current === key;
      const append = sameCondition && typeof cursor === "number" && cursor > 0;

      const data = await searchCompanies({ ...reqBase, cursor });

      setResp(data);
      setItems(prev => (append ? [...prev, ...data.items] : data.items));
      lastKeyRef.current = key;
      setCleared(false); // 検索実行後は未検索フラグOFF
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

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-semibold mb-4">企業検索</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        {/* 1行目: キーワード検索と検索ボタン */}
        <div className="flex justify-center gap-3 items-end">
          <div className="w-full md:w-2/3">
            <label className="block text-sm font-medium mb-1 text-center">キーワード（全文）</label>
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 pr-10"
                placeholder="例: 海苔 / 札幌 / 印刷 / 乾物卸売業 など"
              />
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white rounded-xl px-8 py-2 disabled:opacity-60"
          >
            {loading ? "検索中…" : "検索"}
          </button>
        </div>

        {/* 2行目: その他の検索条件 */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">都道府県</label>
              <select
                value={pref}
                onChange={(e) => setPref(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">（指定なし）</option>
                {PREFS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">売上Min（千円）</label>
              <input
                value={revenueMinK}
                onChange={(e) => setMin(e.target.value)}
                inputMode="numeric"
                className="w-full border rounded-xl px-3 py-2"
                placeholder="3000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">売上Max（千円）</label>
              <input
                value={revenueMaxK}
                onChange={(e) => setMax(e.target.value)}
                inputMode="numeric"
                className="w-full border rounded-xl px-3 py-2"
                placeholder="10000000"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white rounded-xl px-8 py-2 disabled:opacity-60"
              >
                {loading ? "絞り込み中…" : "絞り込み"}
              </button>
            </div>
          </div>
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
                  <th className="px-3 py-2 text-left">概要</th>
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
                    <td className="px-3 py-2 line-clamp-2 max-w-[28ch]">{c.outline || "-"}</td>
                  </tr>
                ))}
                {/* 未検索＝なし */}
                {cleared && !loading && items.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">なし</td></tr>
                )}
                {/* 検索済みだが該当なし */}
                {!cleared && !items.length && resp && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">該当なし</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {resp?.nextCursor !== null && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => runSearch(resp!.nextCursor!)}
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCompany(null);
        }}
      />
    </div>
  );
}
