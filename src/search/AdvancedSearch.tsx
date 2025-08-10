import { useState, useEffect, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import { FaFileExcel } from "react-icons/fa";
import { searchCompanies } from "../libs/api";
import type { Company, SearchRequest, SearchResponse } from "../types";
import CompanyDetailModal from "./CompanyDetailModal";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { useAppContext } from "../contexts/AppContext";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

// 地域グループ定義
const REGION_GROUPS = {
  "北海道・東北": ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  "中部": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  "関西": ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国・四国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"],
  "九州": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
};

// 選択肢定義（capitalKは千円単位なので、値も千円単位で設定）
const CAPITAL_OPTIONS = [
  { label: "1000万円未満", min: 0, max: 10000 },      // 1000万円 = 10,000千円（未満）
  { label: "1000万円-1億円", min: 10000, max: 100000 }, // 1億円未満
  { label: "1億円-10億円", min: 100000, max: 1000000 }, // 10億円未満
  { label: "10億円-100億円", min: 1000000, max: 10000000 }, // 100億円未満
  { label: "100億円以上", min: 10000000, max: null }
];

const EMPLOYEE_OPTIONS = [
  { label: "10人未満", min: 0, max: 10 },
  { label: "10-100人", min: 10, max: 100 },
  { label: "100-1000人", min: 100, max: 1000 },
  { label: "1000-1万人", min: 1000, max: 10000 },
  { label: "1万人以上", min: 10000, max: null }
];

const OFFICE_OPTIONS = [
  { label: "1箇所のみ", min: 1, max: 2 }, // 1のみ（2未満）
  { label: "2-5箇所", min: 2, max: 6 },    // 5まで（6未満）
  { label: "6-10箇所", min: 6, max: 11 },  // 10まで（11未満）
  { label: "11箇所以上", min: 11, max: null }
];

const FACTORY_OPTIONS = [
  { label: "なし", min: 0, max: 1 },       // 0のみ（1未満）
  { label: "1箇所のみ", min: 1, max: 2 },  // 1のみ（2未満）
  { label: "2-5箇所", min: 2, max: 6 },     // 5まで（6未満）
  { label: "6箇所以上", min: 6, max: null }
];

const FOUNDED_YEAR_OPTIONS = [
  { label: "1950年以前", min: null, max: 1950 },
  { label: "1950-1960年", min: 1950, max: 1960 },
  { label: "1960-1970年", min: 1960, max: 1970 },
  { label: "1970-1980年", min: 1970, max: 1980 },
  { label: "1980-1990年", min: 1980, max: 1990 },
  { label: "1990-2000年", min: 1990, max: 2000 },
  { label: "2000-2010年", min: 2000, max: 2010 },
  { label: "2010-2020年", min: 2010, max: 2020 },
  { label: "2020年以降", min: 2020, max: null }
];

interface FilterState {
  prefectures: string[];
  capital: { min: number | null; max: number | null } | null;
  employees: { min: number | null; max: number | null } | null;
  offices: { min: number | null; max: number | null } | null;
  factories: { min: number | null; max: number | null } | null;
  foundedYear: { min: number | null; max: number | null } | null;
}

const client = generateClient<Schema>();

export default function AdvancedSearch() {
  const { user } = useAppContext();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    prefectures: [],
    capital: null,
    employees: null,
    offices: null,
    factories: null,
    foundedYear: null
  });

  const [modalType, setModalType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const isFirstRender = useRef(true);
  const hasRestoredFilters = useRef(false);

  // URLパラメータから条件を復元
  useEffect(() => {
    const filtersParam = searchParams.get("filters");
    if (filtersParam && !hasRestoredFilters.current) {
      try {
        const restoredFilters = JSON.parse(filtersParam);
        console.log("URLから条件を復元:", restoredFilters);
        
        // FilterStateの形式に変換
        const newFilters: FilterState = {
          prefectures: restoredFilters.prefectures || [],
          capital: restoredFilters.capital || null,
          employees: restoredFilters.employees || null,
          offices: restoredFilters.offices || null,
          factories: restoredFilters.factories || null,
          foundedYear: restoredFilters.foundedYear || null
        };
        
        setFilters(newFilters);
        hasRestoredFilters.current = true;
        isFirstRender.current = false; // 復元時は初回レンダリングフラグをクリア
      } catch (e) {
        console.error("フィルターの復元に失敗:", e);
      }
    }
  }, [searchParams]);

  // 絞り込み条件が変更されたら自動検索
  useEffect(() => {
    // 初回レンダリング時はスキップ
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log("初回レンダリング - 検索をスキップ");
      return;
    }

    const hasFilters = 
      filters.prefectures.length > 0 ||
      filters.capital !== null ||
      filters.employees !== null ||
      filters.offices !== null ||
      filters.factories !== null ||
      filters.foundedYear !== null;

    console.log("フィルター変更検知:", { hasFilters, filters });

    if (hasFilters) {
      performSearch(true); // 新規検索
    } else {
      setCompanies([]);
      setTotal(0);
      setCursor(null);
      setHasMore(false);
    }
  }, [filters]);

  async function performSearch(isNewSearch: boolean = false) {
    console.log("performSearch呼び出し:", { isNewSearch, filters });
    
    // フィルターが何も設定されていない場合は検索しない
    const hasFilters = 
      filters.prefectures.length > 0 ||
      filters.capital !== null ||
      filters.employees !== null ||
      filters.offices !== null ||
      filters.factories !== null ||
      filters.foundedYear !== null;
    
    if (!hasFilters) {
      console.log("フィルターが設定されていないため検索をスキップ");
      setCompanies([]);
      setTotal(0);
      setCursor(null);
      setHasMore(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      let allCompanies: Company[] = [];
      let currentCursor: number | undefined = isNewSearch ? undefined : cursor || undefined;
      let hasMoreData = true;
      let fetchCount = 0;
      
      // フィルターがある場合はより多くのデータを取得
      const hasActiveFilters = filters.capital || filters.employees || filters.offices || 
                               filters.factories || filters.foundedYear || filters.prefectures.length > 0;
      
      // 都道府県が1つ選択されている場合は、その都道府県の全データを取得
      // その他のフィルターがある場合は10回（2000件）、ない場合は1回取得
      let maxFetches = 1;
      if (filters.prefectures.length === 1) {
        maxFetches = 50; // 都道府県のすべてのデータを取得（最大10,000件）
      } else if (hasActiveFilters && isNewSearch) {
        maxFetches = 10; // その他のフィルターの場合
      }

      while (hasMoreData && fetchCount < maxFetches) {
        const searchParams: SearchRequest = {
          limit: 200, // APIの実際の上限に合わせる
          orderBy: "revenueK_latest",
          desc: true,
          cursor: currentCursor !== null ? currentCursor : undefined
        };

        // 都道府県フィルターはAPIに送信（1つずつ処理）
        if (filters.prefectures.length === 1) {
          searchParams.pref = filters.prefectures[0];
        }
        // 複数都道府県の場合はクライアント側でフィルタリング

        console.log(`API呼び出し ${fetchCount + 1}回目:`, searchParams);
        
        // 読み込み状況を更新
        if (filters.prefectures.length === 1) {
          setLoadingMessage(`${filters.prefectures[0]}のデータを取得中... (${allCompanies.length}件取得済み)`);
        } else {
          setLoadingMessage(`データを取得中... (${allCompanies.length}件取得済み)`);
        }

        let response: SearchResponse;
        try {
          response = await searchCompanies(searchParams);
          console.log(`取得データ: ${response.items.length}件, total: ${response.total}, cursor: ${response.nextCursor}`);
        } catch (apiError: any) {
          console.error("APIエラー:", apiError);
          if (apiError.message.includes("502") || apiError.message.includes("500")) {
            setError("検索サービスが一時的に利用できません。しばらくしてから再度お試しください。");
          } else {
            setError(`検索エラー: ${apiError.message}`);
          }
          return;
        }

        // 1) 重複排除してマージ（id基準）
        const prevLen = allCompanies.length;
        allCompanies = Array.from(
          new Map([...allCompanies, ...response.items].map(c => [c.id, c]))
          .values()
        );

        // 2) APIがcursorを返さない場合のフォールバック（オフセット前進）
        if ('nextCursor' in response && response.nextCursor !== null && response.nextCursor !== undefined) {
          currentCursor = response.nextCursor as number;
        } else {
          // nextCursorが返されない場合はオフセットを計算
          const offset = typeof currentCursor === 'number' ? currentCursor : 0;
          currentCursor = offset + response.items.length;
        }

        // 3) 続きがあるかの判定を強化
        const serverSaysMore = 'nextCursor' in response && response.nextCursor != null;
        const gotNew = allCompanies.length > prevLen;
        const canInferMore =
          response.items.length === searchParams.limit && gotNew &&
          (!response.total || allCompanies.length < response.total);

        hasMoreData = serverSaysMore || canInferMore;
        
        fetchCount++;

        // フィルターがない場合は1回で終了
        if (!hasActiveFilters && !isNewSearch) break;
      }

      console.log(`合計取得データ: ${allCompanies.length}件`);

      // クライアント側で追加フィルタリング
      let filteredCompanies = allCompanies;

      // 複数都道府県が選択されている場合はここでフィルタリング
      if (filters.prefectures.length > 1) {
        filteredCompanies = filteredCompanies.filter(c => 
          c.pref && filters.prefectures.includes(c.pref)
        );
        console.log("都道府県フィルター適用後:", filteredCompanies.length, "件");
      }

      // 資本金でフィルタリング（maxは未満として扱う）
      if (filters.capital) {
        console.log("資本金フィルター適用前:", filteredCompanies.length, "件");
        console.log("資本金フィルター条件:", filters.capital);
        
        filteredCompanies = filteredCompanies.filter(c => {
          const capitalK = c.companyStats?.capitalK;
          if (capitalK == null) return false;
          const min = filters.capital?.min;
          const max = filters.capital?.max;
          if (min !== undefined && min !== null && capitalK < min) return false;
          if (max !== undefined && max !== null && capitalK >= max) return false; // maxは含まない（未満）
          return true;
        });
        
        console.log("資本金フィルター適用後:", filteredCompanies.length, "件");
      }

      if (filters.employees) {
        filteredCompanies = filteredCompanies.filter(c => {
          const employees = c.companyStats?.employees;
          if (employees == null) return false;
          const min = filters.employees?.min;
          const max = filters.employees?.max;
          if (min !== undefined && min !== null && employees < min) return false;
          if (max !== undefined && max !== null && employees >= max) return false; // maxは含まない（未満）
          return true;
        });
      }

      if (filters.offices) {
        filteredCompanies = filteredCompanies.filter(c => {
          const offices = c.companyStats?.offices;
          if (offices == null) return false;
          const min = filters.offices?.min;
          const max = filters.offices?.max;
          if (min !== undefined && min !== null && offices < min) return false;
          if (max !== undefined && max !== null && offices >= max) return false; // maxは含まない（未満）
          return true;
        });
      }

      if (filters.factories) {
        filteredCompanies = filteredCompanies.filter(c => {
          const factories = c.companyStats?.factories;
          if (factories == null) return false;
          const min = filters.factories?.min;
          const max = filters.factories?.max;
          if (min !== undefined && min !== null && factories < min) return false;
          if (max !== undefined && max !== null && factories >= max) return false; // maxは含まない（未満）
          return true;
        });
      }

      if (filters.foundedYear) {
        filteredCompanies = filteredCompanies.filter(c => {
          const foundingYm = c.founded?.foundingYm;
          if (!foundingYm) return false;
          const year = parseInt(foundingYm.substring(0, 4));
          const min = filters.foundedYear?.min;
          const max = filters.foundedYear?.max;
          if (min !== undefined && min !== null && year < min) return false;
          if (max !== undefined && max !== null && year >= max) return false; // maxは含まない（未満）
          return true;
        });
      }

      // 新規検索か追加読み込みか
      if (isNewSearch) {
        setCompanies(filteredCompanies);
        // フィルタリング後の件数を設定
        setTotal(filteredCompanies.length);
      } else {
        setCompanies(prev => [...prev, ...filteredCompanies]);
        // 追加読み込み時は既存の件数に追加
        setTotal(prev => prev + filteredCompanies.length);
      }
      
      setCursor(currentCursor || null);
      // まだデータが残っている場合は追加読み込み可能
      setHasMore(hasMoreData);
    } catch (err: any) {
      setError(err.message || "検索に失敗しました");
      console.error("検索エラー:", err);
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    if (!loading && hasMore) {
      performSearch(false);
    }
  }
  function handlePrefectureToggle(prefecture: string) {
    setFilters(prev => ({
      ...prev,
      prefectures: prev.prefectures.includes(prefecture)
        ? prev.prefectures.filter(p => p !== prefecture)
        : [...prev.prefectures, prefecture]
    }));
  }

  function handleRegionToggle(region: string) {
    const prefectures = REGION_GROUPS[region as keyof typeof REGION_GROUPS];
    const allSelected = prefectures.every(p => filters.prefectures.includes(p));
    
    setFilters(prev => ({
      ...prev,
      prefectures: allSelected
        ? prev.prefectures.filter(p => !prefectures.includes(p))
        : [...new Set([...prev.prefectures, ...prefectures])]
    }));
  }

  function getFilterLabel(type: string): string {
    switch (type) {
      case "prefecture":
        return filters.prefectures.length > 0 
          ? `${filters.prefectures.length}都道府県` 
          : "都道府県";
      case "capital":
        return filters.capital 
          ? CAPITAL_OPTIONS.find(o => o.min === filters.capital?.min)?.label || "資本金"
          : "資本金";
      case "employees":
        return filters.employees
          ? EMPLOYEE_OPTIONS.find(o => o.min === filters.employees?.min)?.label || "従業員数"
          : "従業員数";
      case "offices":
        return filters.offices
          ? OFFICE_OPTIONS.find(o => o.min === filters.offices?.min)?.label || "事業所数"
          : "事業所数";
      case "factories":
        return filters.factories
          ? FACTORY_OPTIONS.find(o => o.min === filters.factories?.min)?.label || "工場数"
          : "工場数";
      case "foundedYear":
        return filters.foundedYear
          ? FOUNDED_YEAR_OPTIONS.find(o => o.min === filters.foundedYear?.min)?.label || "設立年"
          : "設立年";
      default:
        return "";
    }
  }

  function clearAllFilters() {
    setFilters({
      prefectures: [],
      capital: null,
      employees: null,
      offices: null,
      factories: null,
      foundedYear: null
    });
  }

  async function saveSearchSettings() {
    try {
      // フィルター条件をJSON形式で保存
      const filterData = {
        prefectures: filters.prefectures,
        capital: filters.capital,
        employees: filters.employees,
        offices: filters.offices,
        factories: filters.factories,
        foundedYear: filters.foundedYear
      };

      // タイトルを自動生成
      const title = `絞り込み: ${getFilterSummary()}`;

      // タグを自動生成
      const tags = [];
      if (filters.prefectures.length > 0) {
        tags.push(...filters.prefectures);
      }
      if (filters.capital) {
        const option = CAPITAL_OPTIONS.find(o => o.min === filters.capital?.min);
        if (option) tags.push(option.label);
      }
      if (filters.employees) {
        const option = EMPLOYEE_OPTIONS.find(o => o.min === filters.employees?.min);
        if (option) tags.push(option.label);
      }
      if (filters.offices) {
        const option = OFFICE_OPTIONS.find(o => o.min === filters.offices?.min);
        if (option) tags.push(option.label);
      }
      if (filters.factories) {
        const option = FACTORY_OPTIONS.find(o => o.min === filters.factories?.min);
        if (option) tags.push(option.label);
      }
      if (filters.foundedYear) {
        const option = FOUNDED_YEAR_OPTIONS.find(o => o.min === filters.foundedYear?.min);
        if (option) tags.push(option.label);
      }

      await client.models.SavedQuery.create({
        title: title,
        keyword: null, // 絞り込み検索にはキーワードなし
        filters: JSON.stringify(filterData),
        lastResultCount: total,
        lastRunAt: new Date().toISOString(),
        usageCount: 1,
        tags: tags,
        isPublic: true,
        createdBy: user?.email || user?.username || "unknown",
        description: `絞り込み検索: ${getFilterSummary()}`
      });

      alert("検索条件を保存しました");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    }
  }

  function getFilterSummary() {
    const parts = [];
    if (filters.prefectures.length > 0) {
      parts.push(`都道府県: ${filters.prefectures.join(", ")}`);
    }
    if (filters.capital) {
      const option = CAPITAL_OPTIONS.find(o => o.min === filters.capital?.min);
      if (option) parts.push(`資本金: ${option.label}`);
    }
    if (filters.employees) {
      const option = EMPLOYEE_OPTIONS.find(o => o.min === filters.employees?.min);
      if (option) parts.push(`従業員数: ${option.label}`);
    }
    if (filters.offices) {
      const option = OFFICE_OPTIONS.find(o => o.min === filters.offices?.min);
      if (option) parts.push(`事業所数: ${option.label}`);
    }
    if (filters.factories) {
      const option = FACTORY_OPTIONS.find(o => o.min === filters.factories?.min);
      if (option) parts.push(`工場数: ${option.label}`);
    }
    if (filters.foundedYear) {
      const option = FOUNDED_YEAR_OPTIONS.find(o => o.min === filters.foundedYear?.min);
      if (option) parts.push(`設立年: ${option.label}`);
    }
    return parts.join(", ") || "条件なし";
  }

  async function exportToExcel() {
    if (!companies || companies.length === 0) {
      alert("エクスポートするデータがありません。先に検索を実行してください。");
      return;
    }

    try {
      // データを整形（APIから返される全ての利用可能なデータを含む）
      const exportData = companies.map(item => {
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

      // ファイル名を生成（日時と絞り込み条件を含む）
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const timeStr = now.toTimeString().slice(0, 5).replace(":", "");
      const filterSummary = getFilterSummary().slice(0, 30).replace(/[: ,]/g, "_");
      const fileName = `絞り込み検索_${dateStr}_${timeStr}_${filterSummary}.xlsx`;

      // ダウンロード
      XLSX.writeFile(wb, fileName);
      
      console.log(`${companies.length}件のデータをエクスポートしました: ${fileName}`);
    } catch (error) {
      console.error("エクスポートエラー:", error);
      alert("エクスポート中にエラーが発生しました。");
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">絞り込み検索</h1>
        <button
          type="button"
          onClick={exportToExcel}
          className="text-green-600 hover:text-green-700 transition-colors"
          title="検索結果をExcelファイルとしてダウンロード"
        >
          <FaFileExcel className="w-6 h-6" />
        </button>
      </div>

      {/* フィルターボタン群 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">絞り込み条件</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const hasFilters = filters.prefectures.length > 0 || filters.capital || 
                                  filters.employees || filters.offices || 
                                  filters.factories || filters.foundedYear;
                if (!hasFilters) {
                  alert("保存する条件を設定してください");
                  return;
                }
                saveSearchSettings();
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <BookmarkIcon className="w-4 h-4" />
              設定を保存
            </button>
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              すべてクリア
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setModalType("prefecture")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.prefectures.length > 0
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {getFilterLabel("prefecture")}
          </button>
          
          <button
            onClick={() => setModalType("capital")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.capital
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {getFilterLabel("capital")}
          </button>
          
          <button
            onClick={() => setModalType("employees")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.employees
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {getFilterLabel("employees")}
          </button>
          
          <button
            onClick={() => setModalType("offices")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.offices
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {getFilterLabel("offices")}
          </button>
          
          <button
            onClick={() => setModalType("factories")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.factories
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {getFilterLabel("factories")}
          </button>
          
          <button
            onClick={() => setModalType("foundedYear")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.foundedYear
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {getFilterLabel("foundedYear")}
          </button>
        </div>
        
        {/* フィルター使用時の注意 */}
        {(filters.capital || filters.employees || filters.offices || filters.factories || filters.foundedYear) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">ご注意：</span>
              フィルタリングは読み込み済みのデータに対して行われます。
              より多くのデータを検索するには「さらに読み込む」ボタンをクリックしてください。
            </p>
          </div>
        )}
      </div>

      {/* 検索結果 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">
            検索結果 {total > 0 && `(全${total}件)`}
          </h2>
          {companies.length > 0 && (
            <span className="text-sm text-gray-600">
              {companies.length}件表示中
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            {loadingMessage && (
              <p className="text-sm text-gray-600">{loadingMessage}</p>
            )}
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {Object.values(filters).some(f => f !== null && (Array.isArray(f) ? f.length > 0 : true))
              ? "条件に一致する企業が見つかりませんでした"
              : "絞り込み条件を選択してください"}
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
                    都道府県
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    資本金
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    従業員数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    事業所数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    工場数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    設立年
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {company.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.pref || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.companyStats?.capitalK 
                        ? (() => {
                            const capitalK = company.companyStats.capitalK;
                            if (capitalK >= 100000) { // 1億円以上
                              // 小数点2桁目を四捨五入（小数点1桁まで表示）
                              const oku = Math.round(capitalK / 10000) / 10;
                              return `${oku.toLocaleString()}億円`;
                            } else if (capitalK >= 10) { // 1万円以上
                              return `${(capitalK / 10).toLocaleString()}万円`;
                            } else {
                              return `${capitalK.toLocaleString()}千円`;
                            }
                          })()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.companyStats?.employees?.toLocaleString() || "-"}人
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.companyStats?.offices || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.companyStats?.factories || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.founded?.foundingYm 
                        ? `${company.founded.foundingYm.substring(0, 4)}年`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* さらに読み込むボタン */}
        {companies.length > 0 && hasMore && (
          <div className="p-4 text-center border-t">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  読み込み中...
                </span>
              ) : (
                `さらに読み込む (${companies.length}/${total || '?'}件表示中)`
              )}
            </button>
          </div>
        )}
        
        {/* 全件表示済み */}
        {companies.length > 0 && !hasMore && total > 0 && (
          <div className="p-4 text-center text-gray-500 border-t">
            全{total}件を表示中
          </div>
        )}
      </div>

      {/* 都道府県選択モーダル */}
      <Transition appear show={modalType === "prefecture"} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalType(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                    都道府県を選択
                    <button onClick={() => setModalType(null)}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-4">
                    {Object.entries(REGION_GROUPS).map(([region, prefectures]) => (
                      <div key={region} className="border rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() => handleRegionToggle(region)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                          >
                            {region}
                          </button>
                          <span className="text-xs text-gray-500">
                            ({prefectures.filter(p => filters.prefectures.includes(p)).length}/{prefectures.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {prefectures.map(prefecture => (
                            <button
                              key={prefecture}
                              onClick={() => handlePrefectureToggle(prefecture)}
                              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                                filters.prefectures.includes(prefecture)
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 hover:bg-gray-200"
                              }`}
                            >
                              {prefecture}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, prefectures: [] }))}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      クリア
                    </button>
                    <button
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      適用
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 資本金選択モーダル */}
      <Transition appear show={modalType === "capital"} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalType(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                    資本金を選択
                    <button onClick={() => setModalType(null)}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-2">
                    {CAPITAL_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            capital: { min: option.min, max: option.max }
                          }));
                          setModalType(null);
                        }}
                        className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                          filters.capital?.min === option.min && filters.capital?.max === option.max
                            ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, capital: null }));
                        setModalType(null);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      クリア
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 従業員数選択モーダル */}
      <Transition appear show={modalType === "employees"} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalType(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                    従業員数を選択
                    <button onClick={() => setModalType(null)}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-2">
                    {EMPLOYEE_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            employees: { min: option.min, max: option.max }
                          }));
                          setModalType(null);
                        }}
                        className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                          filters.employees?.min === option.min && filters.employees?.max === option.max
                            ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, employees: null }));
                        setModalType(null);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      クリア
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 事業所数選択モーダル */}
      <Transition appear show={modalType === "offices"} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalType(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                    事業所数を選択
                    <button onClick={() => setModalType(null)}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-2">
                    {OFFICE_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            offices: { min: option.min, max: option.max }
                          }));
                          setModalType(null);
                        }}
                        className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                          filters.offices?.min === option.min && filters.offices?.max === option.max
                            ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, offices: null }));
                        setModalType(null);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      クリア
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 工場数選択モーダル */}
      <Transition appear show={modalType === "factories"} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalType(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                    工場数を選択
                    <button onClick={() => setModalType(null)}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-2">
                    {FACTORY_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            factories: { min: option.min, max: option.max }
                          }));
                          setModalType(null);
                        }}
                        className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                          filters.factories?.min === option.min && filters.factories?.max === option.max
                            ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, factories: null }));
                        setModalType(null);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      クリア
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 設立年選択モーダル */}
      <Transition appear show={modalType === "foundedYear"} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalType(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                    設立年を選択
                    <button onClick={() => setModalType(null)}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {FOUNDED_YEAR_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            foundedYear: { min: option.min, max: option.max }
                          }));
                          setModalType(null);
                        }}
                        className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                          filters.foundedYear?.min === option.min && filters.foundedYear?.max === option.max
                            ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, foundedYear: null }));
                        setModalType(null);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      クリア
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 企業詳細モーダル */}
      <CompanyDetailModal
        company={selectedCompany}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCompany(null);
        }}
      />
    </div>
  );
}