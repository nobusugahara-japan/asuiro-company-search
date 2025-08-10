import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      userName: a.string().required(),
      firstName: a.string(),
      lastName: a.string(),
      department: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read", "create", "update", "delete"]),
    ]),
  SavedQuery: a
    .model({
      title: a.string().required(),
      keyword: a.string(),
      filters: a.json(),
      lastResultCount: a.integer(),
      lastRunAt: a.string(),
      usageCount: a.integer().default(0),
      tags: a.string().array(),
      isPublic: a.boolean().default(true),
      createdBy: a.string(),
      description: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read", "create", "update", "delete"]),
    ]),

  // 累計カウンタ
  CompanyImpressionsTotal: a.model({
      companyId: a.string().required(), // PK
      count: a.integer().required().default(0),
    })
    .identifier(["companyId"]) // ← companyId を主キーに
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update"])]),
  
    // 日次カウンタ（ランキング/推移用）
  CompanyImpressionsDaily: a.model({
      date: a.string().required(),      // PK (YYYY-MM-DD)
      companyId: a.string().required(), // SK
      count: a.integer().required().default(0),
      // 任意: TTL 用の epoch 秒（一定期間で消すなら）
      ttl: a.integer(),
    })
    .identifier(["date", "companyId"])
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update"])]),

  // Industry Master
  IndustryMaster: a.model({
      smallCategoryCode: a.string().required(),     // 小分類コード
      smallCategory: a.string().required(),         // 小分類
      mediumCategoryCode: a.string().required(),    // 中分類コード
      mediumCategory: a.string().required(),        // 中分類
      largeCategoryCode: a.string().required(),     // 大分類コード
      largeCategory: a.string().required(),         // 大分類
    })
    .identifier(["smallCategoryCode"])
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update", "delete"])]),

  // Address Master
  AddressMaster: a.model({
      administrativeAreaCode: a.string().required(),  // 行政区域コード
      prefectureCode: a.string().required(),          // 都道府県コード
      prefectureName: a.string().required(),          // 都道府県名（漢字）
      municipalityName: a.string().required(),        // 市区町村名（漢字）
      prefectureNameKana: a.string().required(),      // 都道府県名（ｶﾅ）
      municipalityNameKana: a.string().required(),    // 市区町村名（ｶﾅ）
    })
    .identifier(["administrativeAreaCode"])
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update", "delete"])]),

  // Company Info
  CompanyInfo: a.model({
      id: a.string().required(),
      status: a.string().required(),
      prefectureName: a.string(),
      industryMajor: a.string(),
      industryMidName: a.string()
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update", "delete"])]),
  });

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
