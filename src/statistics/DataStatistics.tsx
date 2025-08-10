import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { searchCompanies } from "../libs/api";
import type { Company } from "../types";
import CompanyDetailModal from "../search/CompanyDetailModal";
import "./DataStatistics.css";

const client = generateClient<Schema>();

interface MatrixCell {
  prefecture: string;
  largeCategory: string;
  mediumCategory: string;
  count: number;
}

interface CompanyListModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  title: string;
  loading: boolean;
}

function CompanyListModal({ isOpen, onClose, companies, title, loading }: CompanyListModalProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="border-b p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 100px)" }}>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : companies.length === 0 ? (
              <p className="text-center text-gray-500 py-8">該当する企業がありません</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">会社名</th>
                    <th className="px-3 py-2 text-left">住所</th>
                    <th className="px-3 py-2 text-left">業種</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{company.id}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsDetailOpen(true);
                          }}
                          className="text-blue-600 underline hover:text-blue-800 text-left"
                        >
                          {company.name}
                        </button>
                      </td>
                      <td className="px-3 py-2">{company.address?.text || "-"}</td>
                      <td className="px-3 py-2">{(company.industryNames || []).join(", ") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      <CompanyDetailModal
        company={selectedCompany}
        isOpen={isDetailOpen}
        searchKeyword=""
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCompany(null);
        }}
      />
    </>
  );
}

export default function DataStatistics() {
  const [loading, setLoading] = useState(true);
  const [matrixData, setMatrixData] = useState<Map<string, number>>(new Map());
  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [industries, setIndustries] = useState<{ large: string; medium: string }[]>([]);
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [modalCompanies, setModalCompanies] = useState<Company[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 中分類は常に表示
  const showMediumCategories = true;

  // 初期データの読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      // 都道府県マスターを取得
      const prefectureSet = new Set<string>();
      let nextToken: string | undefined = undefined;
      do {
        const res = await client.models.AddressMaster.list({ limit: 1000, nextToken });
        res.data?.forEach(r => {
          if (r.prefectureName) {
            prefectureSet.add(r.prefectureName);
          }
        });
        nextToken = res.nextToken as any;
        if (prefectureSet.size >= 47) break;
      } while (nextToken);

      // デフォルトの都道府県リスト
      const defaultPrefectures = [
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
        "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府",
        "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県",
        "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県",
        "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県",
        "宮崎県", "鹿児島県", "沖縄県"
      ];

      const prefList = prefectureSet.size > 0 
        ? Array.from(prefectureSet).sort((a, b) => {
            const aIndex = defaultPrefectures.indexOf(a);
            const bIndex = defaultPrefectures.indexOf(b);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            return a.localeCompare(b, "ja");
          })
        : defaultPrefectures;

      setPrefectures(prefList);

      // 業種マスターを取得
      const industryMap = new Map<string, Set<string>>();
      nextToken = undefined;
      do {
        const res = await client.models.IndustryMaster.list({ limit: 1000, nextToken });
        res.data?.forEach(r => {
          if (r.largeCategory) {
            if (!industryMap.has(r.largeCategory)) {
              industryMap.set(r.largeCategory, new Set());
            }
            if (r.mediumCategory) {
              industryMap.get(r.largeCategory)?.add(r.mediumCategory);
            }
          }
        });
        nextToken = res.nextToken as any;
      } while (nextToken);

      // 業種リストを作成
      const industryList: { large: string; medium: string }[] = [];
      Array.from(industryMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0], "ja"))
        .forEach(([large, mediums]) => {
          // 大分類のみのエントリを追加
          industryList.push({ large, medium: "" });
          // 中分類のエントリを追加
          Array.from(mediums)
            .sort((a, b) => a.localeCompare(b, "ja"))
            .forEach(medium => {
              industryList.push({ large, medium });
            });
        });

      setIndustries(industryList);

      // 初期ロード時に中分類も自動集計
      if (showMediumCategories) {
        await loadMatrixCounts(prefList, industryList); // 先に大分類を即時表示
        prefetchMediumCounts(prefList, industryList);   // 中分類はBGで順次埋める
      } else {
        await loadMatrixCounts(prefList, industryList.filter(i => !i.medium));
      }
    } catch (error) {
      console.error("初期データ読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  }

  // 中分類をバックグラウンドで事前集計して埋める
  async function prefetchMediumCounts(prefs: string[], inds: { large: string; medium: string }[]) {
    const mediumInds = inds.filter(i => i.medium);
    const prefBatchSize = 3; // API負荷を抑える
    
    for (let i = 0; i < prefs.length; i += prefBatchSize) {
      const prefBatch = prefs.slice(i, i + prefBatchSize);
      
      await Promise.all(prefBatch.map(async (pref) => {
        for (const ind of mediumInds) {
          const key = `${pref}-${ind.large}-${ind.medium}`;
          
          // スキップ判定を削除（stateの古いスナップショットを見てしまうため）
          
          try {
            const res = await searchCompanies({
              pref,
              industryMajor: ind.large,
              industryMidName: ind.medium,
              limit: 1,
            });
            
            setMatrixData(prev => {
              const next = new Map(prev);
              if (prev.get(key) === -1) { // 未ロードの場合のみ更新
                next.set(key, res.total || 0);
              }
              return next;
            });
          } catch (error) {
            console.error(`中分類カウント取得エラー (${pref}, ${ind.large}, ${ind.medium}):`, error);
            setMatrixData(prev => {
              const next = new Map(prev);
              if (prev.get(key) === -1) {
                next.set(key, 0);
              }
              return next;
            });
          }
        }
      }));
      
      console.log(`中分類進捗: ${Math.min(i + prefBatchSize, prefs.length)}/${prefs.length} 都道府県`);
    }
  }

  async function loadMatrixCounts(prefs: string[], inds: { large: string; medium: string }[]) {
    const newMatrix = new Map<string, number>();
    
    // 大分類のみのデータを全都道府県で取得
    console.log("大分類データを読み込み中...");
    const largeInds = inds.filter(ind => !ind.medium);
    
    // バッチ処理で効率的に読み込み（5都道府県ずつ）
    const prefBatchSize = 5;
    for (let i = 0; i < prefs.length; i += prefBatchSize) {
      const prefBatch = prefs.slice(i, i + prefBatchSize);
      
      await Promise.all(prefBatch.map(async (pref) => {
        await Promise.all(largeInds.map(async (ind) => {
          try {
            const result = await searchCompanies({
              pref,
              industryMajor: ind.large,
              industryMidName: undefined,
              limit: 1,
            });
            
            const key = `${pref}-${ind.large}-`;
            newMatrix.set(key, result.total || 0);
          } catch (error) {
            console.error(`カウント取得エラー (${pref}, ${ind.large}):`, error);
            const key = `${pref}-${ind.large}-`;
            newMatrix.set(key, 0);
          }
        }));
      }));
      
      console.log(`進捗: ${Math.min(i + prefBatchSize, prefs.length)}/${prefs.length} 都道府県`);
    }
    
    // 中分類のデータは遅延ロード用に-1で初期化
    const mediumInds = inds.filter(ind => ind.medium);
    prefs.forEach(pref => {
      mediumInds.forEach(ind => {
        const key = `${pref}-${ind.large}-${ind.medium}`;
        newMatrix.set(key, -1); // -1は未ロードを示す
      });
    });
    
    setMatrixData(newMatrix);
  }

  async function handleCellClick(pref: string, large: string, medium: string) {
    setSelectedCell({ prefecture: pref, largeCategory: large, mediumCategory: medium, count: 0 });
    setIsModalOpen(true);
    setModalLoading(true);
    
    try {
      const result = await searchCompanies({
        pref,
        industryMajor: large,
        industryMidName: medium || undefined,
        limit: 100,
      });
      
      setModalCompanies(result.items);
    } catch (error) {
      console.error("企業リスト取得エラー:", error);
      setModalCompanies([]);
    } finally {
      setModalLoading(false);
    }
  }

  function getCellCount(pref: string, large: string, medium: string): number {
    const key = `${pref}-${large}-${medium}`;
    const value = matrixData.get(key);
    return value !== undefined ? value : -1;
  }
  
  async function loadCellCount(pref: string, large: string, medium: string) {
    const key = `${pref}-${large}-${medium}`;
    try {
      const result = await searchCompanies({
        pref,
        industryMajor: large,
        industryMidName: medium || undefined,
        limit: 1,
      });
      
      const newMatrix = new Map(matrixData);
      newMatrix.set(key, result.total || 0);
      setMatrixData(newMatrix);
      return result.total || 0;
    } catch (error) {
      console.error(`カウント取得エラー (${pref}, ${large}, ${medium}):`, error);
      const newMatrix = new Map(matrixData);
      newMatrix.set(key, 0);
      setMatrixData(newMatrix);
      return 0;
    }
  }

  // 表示する業種リストを取得
  const displayIndustries = showMediumCategories 
    ? industries 
    : industries.filter(i => !i.medium);

  return (
    <div className="mx-auto max-w-full p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">全データ統計</h1>
        <p className="text-sm text-gray-600 mt-2">
          都道府県×業種のマトリックスで企業数を表示。数字をクリックすると企業リストが表示されます。
        </p>
      </div>


      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="overflow-auto relative" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <table className="min-w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-gray-100 border p-2 text-left font-medium">
                  都道府県 ＼ 業種
                </th>
                {displayIndustries.map((ind, idx) => (
                  <th key={idx} className="sticky top-0 bg-gray-100 border p-1 text-center font-medium min-w-[40px] max-w-[60px]">
                    <div className="writing-mode-vertical">
                      {ind.medium ? (
                        <span className="text-gray-600">└ {ind.medium}</span>
                      ) : (
                        <span>{ind.large}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prefectures.map((pref) => (
                <tr key={pref}>
                  <td className="sticky left-0 bg-white border p-2 font-medium">
                    {pref}
                  </td>
                  {displayIndustries.map((ind, idx) => {
                    const count = getCellCount(pref, ind.large, ind.medium);
                    return (
                      <td key={idx} className={`border p-1 text-center text-xs ${ind.medium ? "bg-gray-50" : ""}`}>
                        {count === -1 ? (
                          <button
                            onClick={async () => {
                              const loadedCount = await loadCellCount(pref, ind.large, ind.medium);
                              if (loadedCount > 0) {
                                handleCellClick(pref, ind.large, ind.medium);
                              }
                            }}
                            className="text-gray-400 hover:text-blue-600"
                            title="クリックして読み込み"
                          >
                            ...
                          </button>
                        ) : count > 0 ? (
                          <button
                            onClick={() => handleCellClick(pref, ind.large, ind.medium)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                          >
                            {count}
                          </button>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CompanyListModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCell(null);
          setModalCompanies([]);
        }}
        companies={modalCompanies}
        title={
          selectedCell
            ? `${selectedCell.prefecture} - ${selectedCell.largeCategory}${
                selectedCell.mediumCategory ? ` - ${selectedCell.mediumCategory}` : ""
              }`
            : ""
        }
        loading={modalLoading}
      />
    </div>
  );
}