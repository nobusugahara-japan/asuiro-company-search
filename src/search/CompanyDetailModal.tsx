import { Fragment, type ReactNode, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { Company } from "../types";
import { FIELD_LABELS, VALUE_DICTIONARIES, formatters } from "../locales/fieldMapping";
import { highlightText } from "../utils/highlightText";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

interface CompanyDetailModalProps {
  company: Company | null;
  isOpen: boolean;
  searchKeyword?: string;
  onClose: () => void;
}

const client = generateClient<Schema>();

export default function CompanyDetailModal({ company, isOpen, searchKeyword, onClose }: CompanyDetailModalProps) {
  const [companyStatus, setCompanyStatus] = useState<string>("選択なし");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (company?.id) {
      // 既存のステータスを取得
      const fetchStatus = async () => {
        try {
          const { data } = await client.models.CompanyInfo.get({ id: company.id });
          if (data?.status) {
            setCompanyStatus(data.status);
          } else {
            setCompanyStatus("選択なし");
          }
        } catch (error) {
          console.error("Error fetching company status:", error);
          setCompanyStatus("選択なし");
        }
      };
      fetchStatus();
    }
  }, [company?.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!company?.id || isUpdating) return;
    
    setIsUpdating(true);
    try {
      // 追加フィールドの準備
      const companyName = company.name || undefined;
      const prefectureName = company.pref || undefined;
      const industryMajor = Array.isArray(company.industryMajor) 
        ? company.industryMajor.join(", ") 
        : company.industryMajor || undefined;
      const industryMidName = Array.isArray(company.industryMidName)
        ? company.industryMidName.join(", ")
        : company.industryMidName || undefined;
      
      // 既存レコードの存在確認
      const { data: existingData } = await client.models.CompanyInfo.get({ id: company.id });
      
      if (existingData) {
        // 更新
        await client.models.CompanyInfo.update({ 
          id: company.id,
          status: newStatus,
          companyName,
          prefectureName,
          industryMajor,
          industryMidName
        });
      } else {
        // 新規作成
        await client.models.CompanyInfo.create({
          id: company.id,
          status: newStatus,
          companyName,
          prefectureName,
          industryMajor,
          industryMidName
        });
      }
      
      setCompanyStatus(newStatus);
    } catch (error) {
      console.error("Error updating company status:", error);
      alert("ステータスの保存に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!company) return null;

  const c = company;
  const f = formatters;
  const dict = VALUE_DICTIONARIES;

  const dash = (v: unknown) => {
    if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) {
      return "-";
    }
    // 文字列の場合はハイライト処理を適用
    if (typeof v === "string") {
      return highlightText(v, searchKeyword);
    }
    return v as ReactNode;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
          <div className="flex min-h-full items-start justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-gray-900 flex justify-between items-center">
                  企業詳細情報
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                {/* ヘッダ */}
                <div className="mt-4 border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-2xl font-bold">{dash(c.name)}</h4>
                      <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                        <span>ID: {dash(c.id)}</span>
                        {c.nameKana ? <span>カナ: {c.nameKana}</span> : null}
                        {typeof c.rating === "number" ? (
                          <span>
                            {FIELD_LABELS["rating"]}: {c.rating}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <label className="text-sm font-medium text-gray-700 mb-1">ステータス</label>
                      <select
                        value={companyStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="選択なし">選択なし</option>
                        <option value="AP取得">AP取得</option>
                        <option value="受注">受注</option>
                        <option value="失注">失注</option>
                      </select>
                      {isUpdating && (
                        <span className="text-xs text-gray-500 mt-1">保存中...</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-8">
                  {/* 基本/所在地 */}
                  <Section title="基本情報">
                    <DLGrid
                      rows={[
                        [FIELD_LABELS["pref"], dash(c.pref)],
                        [FIELD_LABELS["address.text"], dash(c.address?.text)],
                        [FIELD_LABELS["address.zip"], dash(c.address?.zip)],
                        [FIELD_LABELS["address.tel"], c.address?.tel ? f.tel(c.address.tel) : "-"],
                        [
                          FIELD_LABELS["outline"],
                          <span key="outline" className="whitespace-pre-wrap">
                            {dash(c.outline)}
                          </span>,
                        ],
                      ]}
                    />
                  </Section>

                  {/* 法人情報・創業/設立・規模・データ日付 */}
                  <Section title="法人・沿革・規模">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card title="法人情報">
                        <DLGrid
                          rows={[
                            [
                              FIELD_LABELS["legal.positionBeforeAfter"],
                              dash(
                                dict.positionBeforeAfter?.[String(c.legal?.positionBeforeAfter ?? "")] ??
                                  c.legal?.positionBeforeAfter
                              ),
                            ],
                            [FIELD_LABELS["legal.corpFormCode"], dash(c.legal?.corpFormCode)],
                            [FIELD_LABELS["legal.indexKanjiName"], dash(c.legal?.indexKanjiName)],
                            [FIELD_LABELS["legal.indexKanaName"], dash(c.legal?.indexKanaName)],
                          ]}
                        />
                      </Card>

                      <Card title="創業・設立">
                        <DLGrid
                          rows={[
                            [FIELD_LABELS["founded.foundingYm"], f.ym(c.founded?.foundingYm)],
                            [FIELD_LABELS["founded.edoFoundedYear"], dash(c.founded?.edoFoundedYear)],
                            [FIELD_LABELS["founded.incorporationYmd"], f.ymd(c.founded?.incorporationYmd)],
                          ]}
                        />
                      </Card>

                      <Card title="会社規模">
                        <DLGrid
                          rows={[
                            [FIELD_LABELS["companyStats.capitalK"], f.kYen(c.companyStats?.capitalK)],
                            [FIELD_LABELS["companyStats.employees"], f.int(c.companyStats?.employees)],
                            [FIELD_LABELS["companyStats.factories"], f.int(c.companyStats?.factories)],
                            [FIELD_LABELS["companyStats.offices"], f.int(c.companyStats?.offices)],
                          ]}
                        />
                      </Card>
                    </div>

                    <div className="mt-6">
                      <Card title="データ基準日">
                        <DLGrid
                          rows={[
                            [FIELD_LABELS["dataDates.surveyYmd"], f.ymd(c.dataDates?.surveyYmd)],
                            [FIELD_LABELS["dataDates.reportSurveyYmd"], f.ymd(c.dataDates?.reportSurveyYmd)],
                            [FIELD_LABELS["dataDates.dbUpdateYmd"], f.ymd(c.dataDates?.dbUpdateYmd)],
                          ]}
                        />
                      </Card>
                    </div>
                  </Section>

                  {/* 業種・扱い品・取引先 */}
                  <Section title="業種・扱い品・取引先">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card title="業種">
                        <DLGrid
                          rows={[
                            [FIELD_LABELS["industry[]"], c.industry?.length ? c.industry.join(", ") : "-"],
                            [FIELD_LABELS["industryNames[]"], c.industryNames?.length ? c.industryNames.join(", ") : "-"],
                          ]}
                        />
                      </Card>

                      <Card title="扱い品">
                        {c.products?.length ? (
                          <Table
                            cols={[FIELD_LABELS["products[].code"], FIELD_LABELS["products[].name"]]}
                            rows={c.products.map((p) => [dash(p.code), dash(p.name)])}
                          />
                        ) : (
                          <Empty />
                        )}
                      </Card>

                      <Card title="取引先">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-2">{FIELD_LABELS["clients[]"]}</h5>
                            {c.clients?.length ? <List items={c.clients} keyword={searchKeyword} /> : <Empty />}
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-2">{FIELD_LABELS["suppliers[]"]}</h5>
                            {c.suppliers?.length ? <List items={c.suppliers} keyword={searchKeyword} /> : <Empty />}
                          </div>
                        </div>
                      </Card>
                    </div>
                  </Section>

                  {/* 株主・役員・銀行 */}
                  <Section title="株主・役員・取引銀行">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card title="株主">
                        {c.shareholders?.length ? (
                          <Table
                            cols={[FIELD_LABELS["shareholders[].name"], FIELD_LABELS["shareholders[].ratio"]]}
                            rows={c.shareholders.map((s) => [dash(s.name), s.ratio == null ? "-" : `${s.ratio}%`])}
                          />
                        ) : (
                          <Empty />
                        )}
                      </Card>

                      <Card title="役員">
                        {c.officers?.length ? (
                          <Table
                            cols={[
                              FIELD_LABELS["officers[].name"],
                              FIELD_LABELS["officers[].title"],
                              FIELD_LABELS["officers[].position"],
                              FIELD_LABELS["officers[].corpFlag"],
                            ]}
                            rows={c.officers.map((o) => [dash(o.name), dash(o.title), dash(o.position), dash(o.corpFlag)])}
                          />
                        ) : (
                          <Empty />
                        )}
                      </Card>

                      <Card title="取引銀行">
                        {c.banks?.length ? (
                          <Table
                            cols={[FIELD_LABELS["banks[].code"], FIELD_LABELS["banks[].name"], FIELD_LABELS["banks[].branch"]]}
                            rows={c.banks.map((b) => [dash(b.code), dash(b.name), dash(b.branch)])}
                          />
                        ) : (
                          <Empty />
                        )}
                      </Card>
                    </div>
                  </Section>

                  {/* 事業内容 */}
                  <Section title="事業内容">
                    <Card>
                      {c.businessItems?.length ? (
                        <Table
                          cols={[FIELD_LABELS["businessItems[].text"], FIELD_LABELS["businessItems[].ratio"]]}
                          rows={c.businessItems.map((b) => [dash(b.text), b.ratio == null ? "-" : `${b.ratio}%`])}
                        />
                      ) : (
                        <Empty />
                      )}
                    </Card>
                  </Section>

                  {/* 財務情報（表形式） */}
                  {c.financials?.length ? (
                    <Section title="財務情報（決算）">
                      <Card>
                        <Table
                          cols={[
                            FIELD_LABELS["financials[].yearMonth"],
                            FIELD_LABELS["financials[].months"],
                            FIELD_LABELS["financials[].revenueK"],
                            FIELD_LABELS["financials[].profitK"],
                            FIELD_LABELS["financials[].equityRatio"],
                            FIELD_LABELS["financials[].dividendK"],
                            FIELD_LABELS["financials[].estimateFlag"],
                            FIELD_LABELS["financials[].taxInclFlag"],
                            FIELD_LABELS["financials[].hasFinance"],
                          ]}
                          rows={c.financials.map((fr) => [
                            fr.yearMonth ? `${fr.yearMonth.slice(0, 4)}/${fr.yearMonth.slice(4, 6)}` : "-",
                            dash(fr.months),
                            f.kYen(fr.revenueK),
                            f.kYen(fr.profitK),
                            fr.equityRatio == null ? "-" : `${fr.equityRatio}%`,
                            f.kYen(fr.dividendK),
                            dash(fr.estimateFlag),
                            dash(fr.taxInclFlag),
                            dict.boolean01?.[String(fr.hasFinance ?? "")] ?? dash(fr.hasFinance),
                          ])}
                        />
                      </Card>
                    </Section>
                  ) : null}

                  {/* 上場・コード */}
                  <Section title="上場・各コード">
                    <Card>
                      <DLGrid
                        rows={[
                          [
                            FIELD_LABELS["listing.market"],
                            dict.market?.[String(c.listing?.market ?? "")] ?? dash(c.listing?.market),
                          ],
                          [FIELD_LABELS["listing.ticker"], dash(c.listing?.ticker)],
                          [FIELD_LABELS["listing.edinet"], dash(c.listing?.edinet)],
                        ]}
                      />
                    </Card>
                  </Section>

                  {/* 代表者 */}
                  <Section title="代表者">
                    <Card>
                      <DLGrid
                        rows={[
                          [FIELD_LABELS["representative.name"], dash(c.representative?.name)],
                          [FIELD_LABELS["representative.kana"], dash(c.representative?.kana)],
                          [FIELD_LABELS["representative.title"], dash(c.representative?.title)],
                          [FIELD_LABELS["representative.birthYmd"], f.ymd(c.representative?.birthYmd)],
                          [
                            FIELD_LABELS["representative.gender"],
                            dict.gender?.[String(c.representative?.gender ?? "")] ?? dash(c.representative?.gender),
                          ],
                          [FIELD_LABELS["representative.sinceYmd"], f.ymd(c.representative?.sinceYmd)],
                          [FIELD_LABELS["representative.tel"], c.representative?.tel ? f.tel(c.representative.tel) : "-"],
                          [FIELD_LABELS["representative.zip"], dash(c.representative?.zip)],
                          [FIELD_LABELS["representative.address"], dash(c.representative?.address)],
                          [FIELD_LABELS["representative.addressKana"], dash(c.representative?.addressKana)],
                          [FIELD_LABELS["representative.addressBarcode"], dash(c.representative?.addressBarcode)],
                          [FIELD_LABELS["representative.birthplaceCode"], dash(c.representative?.birthplaceCode)],
                          [FIELD_LABELS["representative.birthplaceName"], dash(c.representative?.birthplaceName)],
                          [FIELD_LABELS["representative.lastEduSchoolCode"], dash(c.representative?.lastEduSchoolCode)],
                          [FIELD_LABELS["representative.lastEduSchool"], dash(c.representative?.lastEduSchool)],
                          [FIELD_LABELS["representative.lastEduGradType"], dash(c.representative?.lastEduGradType)],
                          [FIELD_LABELS["representative.lastEduDegree"], dash(c.representative?.lastEduDegree)],
                          [FIELD_LABELS["representative.zodiacCode"], dash(c.representative?.zodiacCode)],
                          [FIELD_LABELS["representative.zodiacName"], dash(c.representative?.zodiacName)],
                          [FIELD_LABELS["representative.residenceCode"], dash(c.representative?.residenceCode)],
                          [FIELD_LABELS["representative.residenceName"], dash(c.representative?.residenceName)],
                          [
                            FIELD_LABELS["representative.bankruptcyHistory"],
                            dict.boolean01?.[String(c.representative?.bankruptcyHistory ?? "")] ??
                              dash(c.representative?.bankruptcyHistory),
                          ],
                        ]}
                      />

                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-2">{FIELD_LABELS["representative.hobbies[].name"]}</h5>
                        {c.representative?.hobbies?.length ? (
                          <Table
                            cols={[
                              FIELD_LABELS["representative.hobbies[].code"],
                              FIELD_LABELS["representative.hobbies[].name"],
                            ]}
                            rows={c.representative.hobbies.map((h) => [dash(h.code), dash(h.name)])}
                          />
                        ) : (
                          <Empty />
                        )}
                      </div>
                    </Card>
                  </Section>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    閉じる
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/* ========== 小物コンポーネント ========== */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      {title ? <h4 className="text-sm font-semibold mb-3">{title}</h4> : null}
      {children}
    </div>
  );
}

function DLGrid({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      {rows.map(([k, v], i) => (
        <div key={`${k}-${i}`} className="flex flex-col">
          <dt className="text-xs text-gray-500">{k}</dt>
          <dd className="text-sm text-gray-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ cols, rows }: { cols: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {cols.map((c, i) => (
              <th key={`${c}-${i}`} className="px-3 py-2 text-left font-medium text-gray-700">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i} className="border-t">
                {r.map((cell, j) => (
                  <td key={j} className="px-3 py-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={cols.length} className="px-3 py-4 text-center text-gray-500">
                なし
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function List({ items, keyword }: { items: string[]; keyword?: string }) {
  return (
    <ul className="list-disc pl-5 text-sm">
      {items.map((v, i) => (
        <li key={`${v}-${i}`}>{highlightText(v, keyword)}</li>
      ))}
    </ul>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">なし</div>;
}

