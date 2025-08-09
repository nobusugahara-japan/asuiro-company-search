
export const FIELD_LABELS: Record<string, string> = {
  // 会社基本
  "id": "TSR企業コード",
  "name": "会社名（正式）",
  "nameKana": "会社名カナ",
  "pref": "都道府県",
  "outline": "概況",

  // 法人情報
  "legal.positionBeforeAfter": "法人格前後区分",
  "legal.corpFormCode": "商号法人格コード",
  "legal.indexKanjiName": "インデックス漢字商号",
  "legal.indexKanaName": "インデックスカナ商号",

  // 創業・設立
  "founded.foundingYm": "創業年月（西暦）",
  "founded.edoFoundedYear": "江戸時代以前創業年",
  "founded.incorporationYmd": "設立年月日（西暦）",

  // 規模
  "companyStats.capitalK": "資本金（千円）",
  "companyStats.employees": "従業員数",
  "companyStats.factories": "工場数",
  "companyStats.offices": "事業所数",

  // データ基準日
  "dataDates.surveyYmd": "調査年月日",
  "dataDates.reportSurveyYmd": "レポート調査年月日",
  "dataDates.dbUpdateYmd": "企業DB更新年月日",

  // その他基本
  "ultimateShareholderName": "議決権最上位者名",
  "rating": "評点",

  // 住所
  "address.zip": "企業郵便番号",
  "address.text": "企業所在地",
  "address.tel": "企業電話番号",
  "address.tsrCode": "企業住所コード_TSRコード",
  "address.jisCode": "企業住所コード_JISコード",
  "address.barcode": "企業所在地バーコード情報",

  // 業種・扱い品
  "industry[]": "業種コード",
  "industryNames[]": "業種名称",
  "products[].code": "扱い品コード",
  "products[].name": "扱い品名称",

  // 取引先
  "clients[]": "販売先名称",
  "suppliers[]": "仕入先名称",

  // 株主
  "shareholders[].name": "株主名称",
  "shareholders[].ratio": "持株比率（％）",

  // 役員
  "officers[].name": "役員名",
  "officers[].title": "役名",
  "officers[].position": "肩書名",
  "officers[].corpFlag": "法人役員識別区分",

  // 取引銀行
  "banks[].code": "取引銀行コード",
  "banks[].name": "取引銀行名",
  "banks[].branch": "取引銀行店舗名",

  // 事業内容
  "businessItems[].text": "事業内容",
  "businessItems[].ratio": "事業内容構成比率（％）",

  // 決算（複数年）
  "financials[].yearMonth": "決算年月",
  "financials[].months": "月数",
  "financials[].revenueK": "売上高（千円）",
  "financials[].profitK": "利益金（千円）",
  "financials[].equityRatio": "自己資本比率（％）",
  "financials[].dividendK": "配当総額（千円）",
  "financials[].estimateFlag": "見込・推定区分",
  "financials[].taxInclFlag": "税込引区分",
  "financials[].hasFinance": "財務有無フラグ",

  // 上場・コード類
  "listing.market": "上場市場区分",
  "listing.ticker": "証券株式コード",
  "listing.edinet": "EDINETコード",

  // 代表者
  "representative.name": "代表者氏名",
  "representative.kana": "代表者氏名カナ",
  "representative.title": "代表者役名/肩書名",
  "representative.birthYmd": "代表者生年月日（西暦）",
  "representative.gender": "代表者男女区分",
  "representative.sinceYmd": "代表者就任年月日（西暦）",
  "representative.tel": "代表者電話番号",
  "representative.zip": "代表者郵便番号",
  "representative.address": "代表者現住所",
  "representative.addressKana": "代表者現住所カナ",
  "representative.addressBarcode": "代表者現住所バーコード情報",
  "representative.bankruptcyHistory": "代表者倒産経歴",
  "representative.birthplaceCode": "代表者出身地コード",
  "representative.birthplaceName": "代表者出身地名称",
  "representative.lastEduSchoolCode": "代表者最終学歴_学校コード",
  "representative.lastEduSchool": "代表者最終学歴_学校名称",
  "representative.lastEduGradType": "代表者最終学歴_卒業区分",
  "representative.lastEduDegree": "代表者最終学歴_卒業名",
  "representative.zodiacCode": "代表者干支コード",
  "representative.zodiacName": "代表者干支名称",
  "representative.residenceCode": "代表者住居コード",
  "representative.residenceName": "代表者住居名称",
  "representative.hobbies[].code": "代表者趣味コード",
  "representative.hobbies[].name": "代表者趣味名称",
};

// 値の辞書（わかる範囲の一般例）
export const VALUE_DICTIONARIES: {
  [key: string]: { [key: string]: string } | undefined;
  gender: { [key: string]: string };
  positionBeforeAfter: { [key: string]: string };
  boolean01: { [key: string]: string };
  market: { [key: string]: string };
} = {
  // 例：性別（※仕様に合わせて調整）
  gender: { "1": "男性", "2": "女性" },

  // 例：法人格前後区分（※実データ定義に合わせて調整）
  positionBeforeAfter: { "1": "法人格前", "2": "法人格後" },

  // 例：見込・推定区分／税込引区分／財務有無フラグ（0/1のフラグ系）
  boolean01: { "0": "なし", "1": "あり" },

  // 例：上場市場区分（コード体系がある場合はここに）
  market: {
    "1": "東証プライム", "2": "東証スタンダード", "3": "東証グロース",
    "9": "非上場" // 仮
  },
};

export const formatters = {
  ymd: (s?: string | null) => (s && /^\d{8}$/.test(s) ? `${s.slice(0,4)}/${s.slice(4,6)}/${s.slice(6,8)}` : s || "-"),
  ym:  (s?: string | null) => (s && /^\d{6}$/.test(s) ? `${s.slice(0,4)}/${s.slice(4,2)}` : s || "-"),
  int: (n?: number | null) => (typeof n === "number" ? n.toLocaleString() : "-"),
  kYen: (n?: number | null) => (typeof n === "number" ? `${n.toLocaleString()} 千円` : "-"),
  percent: (n?: number | null) => (typeof n === "number" ? `${n}%` : "-"),
  tel: (s?: string | null) => (s ? s.replace(/\s+/g, "") : "-"),
  fallback: (v: any) => (v ?? "-"),
};

