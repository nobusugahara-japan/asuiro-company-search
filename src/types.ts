export type SearchRequest = {
  q?: string;
  pref?: string;
  industry?: string[];      // 例: ["5223","5229"]
  industryMajor?: string;   // 業種大分類
  industryMidName?: string; // 業種中分類
  revenueMinK?: number;
  revenueMaxK?: number;
  orderBy?: string;         // "revenueK_latest" など
  desc?: boolean;           // true=降順
  limit?: number;           // 1..200
  cursor?: number;          // 続きを取得
};

export type Company = {
  id: string;
  name: string;
  nameKana?: string | null;
  pref?: string | null;
  outline?: string | null;
  rating?: number | null;
  
  // 住所情報
  address?: {
    text?: string | null;
    zip?: string | null;
    tel?: string | null;
  } | null;
  
  // 業種情報
  industryMajor?: string | string[];
  industryMidName?: string | string[];
  industry?: string[] | null;
  industryNames?: string[] | null;
  
  // 法人情報
  legal?: {
    positionBeforeAfter?: string | null;
    corpFormCode?: string | null;
    indexKanjiName?: string | null;
    indexKanaName?: string | null;
  } | null;
  
  // 創業・設立情報
  founded?: {
    foundingYm?: string | null;
    edoFoundedYear?: string | null;
    incorporationYmd?: string | null;
  } | null;
  
  // 会社規模
  companyStats?: {
    capitalK?: number | null;
    employees?: number | null;
    factories?: number | null;
    offices?: number | null;
  } | null;
  
  // データ基準日
  dataDates?: {
    surveyYmd?: string | null;
    reportSurveyYmd?: string | null;
    dbUpdateYmd?: string | null;
  } | null;
  
  // 扱い品
  products?: Array<{
    code?: string | null;
    name?: string | null;
  }> | null;
  
  // 取引先
  clients?: string[] | null;
  suppliers?: string[] | null;
  
  // 株主
  shareholders?: Array<{
    name?: string | null;
    ratio?: number | null;
  }> | null;
  
  // 役員
  officers?: Array<{
    name?: string | null;
    title?: string | null;
    position?: string | null;
    corpFlag?: string | null;
  }> | null;
  
  // 取引銀行
  banks?: Array<{
    code?: string | null;
    name?: string | null;
    branch?: string | null;
  }> | null;
  
  // 事業内容
  businessItems?: Array<{
    text?: string | null;
    ratio?: number | null;
  }> | null;
  
  // 財務情報
  financials?: Array<{
    yearMonth?: string | null;
    months?: number | null;
    revenueK?: number | null;
    profitK?: number | null;
    equityRatio?: number | null;
    dividendK?: number | null;
    estimateFlag?: string | null;
    taxInclFlag?: string | null;
    hasFinance?: number | null;
  }> | null;
  
  // 上場情報
  listing?: {
    market?: string | null;
    ticker?: string | null;
    edinet?: string | null;
  } | null;
  
  // 代表者情報
  representative?: {
    name?: string | null;
    kana?: string | null;
    title?: string | null;
    birthYmd?: string | null;
    gender?: string | null;
    sinceYmd?: string | null;
    tel?: string | null;
    zip?: string | null;
    address?: string | null;
    addressKana?: string | null;
    addressBarcode?: string | null;
    birthplaceCode?: string | null;
    birthplaceName?: string | null;
    lastEduSchoolCode?: string | null;
    lastEduSchool?: string | null;
    lastEduGradType?: string | null;
    lastEduDegree?: string | null;
    zodiacCode?: string | null;
    zodiacName?: string | null;
    residenceCode?: string | null;
    residenceName?: string | null;
    bankruptcyHistory?: number | null;
    hobbies?: Array<{
      code?: string | null;
      name?: string | null;
    }> | null;
  } | null;
};

export type SearchResponse = {
  total: number;
  nextCursor: number | null;
  items: Company[];
};