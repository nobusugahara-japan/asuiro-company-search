import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Company: a
    .model({
      // 企業識別情報
      edinetCode: a.string(),
      tsrCompanyCode: a.string(),
      indexKanaName: a.string(),
      indexKanjiName: a.string(),
      reportSurveyDate: a.date(),
      
      // 上場情報
      marketSegment: a.string(),
      
      // 事業内容
      businessContent1: a.string(),
      businessContent2: a.string(),
      businessContent3: a.string(),
      businessContent4: a.string(),
      businessContent5: a.string(),
      businessContent6: a.string(),
      businessRatio1: a.float(),
      businessRatio2: a.float(),
      businessRatio3: a.float(),
      businessRatio4: a.float(),
      businessRatio5: a.float(),
      businessRatio6: a.float(),
      numberOfOffices: a.integer(),
      
      // 仕入先
      supplierName1: a.string(),
      supplierName2: a.string(),
      supplierName3: a.string(),
      supplierName4: a.string(),
      supplierName5: a.string(),
      supplierName6: a.string(),
      
      // 代表者情報
      ceoResidenceCode: a.string(),
      ceoResidenceName: a.string(),
      ceoAddressJisCode: a.string(),
      ceoAddressTsrCode: a.string(),
      ceoBankruptcyHistory: a.string(),
      ceoBirthplaceCode: a.string(),
      ceoBirthplaceName: a.string(),
      ceoAppointmentDate: a.date(),
      ceoZodiacCode: a.string(),
      ceoZodiacName: a.string(),
      ceoTitle: a.string(),
      ceoEducationGradType: a.string(),
      ceoEducationGradName: a.string(),
      ceoEducationSchoolCode: a.string(),
      ceoEducationSchoolName: a.string(),
      ceoName: a.string(),
      ceoNameKana: a.string(),
      ceoCurrentAddress: a.string(),
      ceoCurrentAddressKana: a.string(),
      ceoAddressBarcodeInfo: a.string(),
      ceoBirthDate: a.date(),
      ceoGender: a.string(),
      ceoSubtitle: a.string(),
      ceoHobbyCode1: a.string(),
      ceoHobbyCode2: a.string(),
      ceoHobbyCode3: a.string(),
      ceoHobbyName1: a.string(),
      ceoHobbyName2: a.string(),
      ceoHobbyName3: a.string(),
      ceoPostalCode: a.string(),
      ceoPhoneNumber: a.string(),
      
      // 企業基本情報
      companyDbUpdateDate: a.date(),
      companyAddressJisCode: a.string(),
      companyAddressTsrCode: a.string(),
      companyLocation: a.string(),
      companyLocationBarcodeInfo: a.string(),
      companyPostalCode: a.string(),
      companyPhoneNumber: a.string(),
      foundedYearMonth: a.string(),
      
      // 取引銀行
      bankCode1: a.string(),
      bankCode2: a.string(),
      bankCode3: a.string(),
      bankCode4: a.string(),
      bankCode5: a.string(),
      bankCode6: a.string(),
      bankCode7: a.string(),
      bankCode8: a.string(),
      bankCode9: a.string(),
      bankCode10: a.string(),
      bankName1: a.string(),
      bankName2: a.string(),
      bankName3: a.string(),
      bankName4: a.string(),
      bankName5: a.string(),
      bankName6: a.string(),
      bankName7: a.string(),
      bankName8: a.string(),
      bankName9: a.string(),
      bankName10: a.string(),
      bankBranchName1: a.string(),
      bankBranchName2: a.string(),
      bankBranchName3: a.string(),
      bankBranchName4: a.string(),
      bankBranchName5: a.string(),
      bankBranchName6: a.string(),
      bankBranchName7: a.string(),
      bankBranchName8: a.string(),
      bankBranchName9: a.string(),
      bankBranchName10: a.string(),
      
      // 企業構造
      corporateStatusCode: a.string(),
      numberOfFactories: a.integer(),
      
      // 役員情報
      directorTitle1: a.string(),
      directorTitle2: a.string(),
      directorTitle3: a.string(),
      directorTitle4: a.string(),
      directorTitle5: a.string(),
      directorTitle6: a.string(),
      directorTitle7: a.string(),
      directorTitle8: a.string(),
      directorTitle9: a.string(),
      directorTitle10: a.string(),
      directorName1: a.string(),
      directorName2: a.string(),
      directorName3: a.string(),
      directorName4: a.string(),
      directorName5: a.string(),
      directorName6: a.string(),
      directorName7: a.string(),
      directorName8: a.string(),
      directorName9: a.string(),
      directorName10: a.string(),
      directorSubtitle1: a.string(),
      directorSubtitle2: a.string(),
      directorSubtitle3: a.string(),
      directorSubtitle4: a.string(),
      directorSubtitle5: a.string(),
      directorSubtitle6: a.string(),
      directorSubtitle7: a.string(),
      directorSubtitle8: a.string(),
      directorSubtitle9: a.string(),
      directorSubtitle10: a.string(),
      corporateDirectorFlag1: a.string(),
      corporateDirectorFlag2: a.string(),
      corporateDirectorFlag3: a.string(),
      corporateDirectorFlag4: a.string(),
      corporateDirectorFlag5: a.string(),
      corporateDirectorFlag6: a.string(),
      corporateDirectorFlag7: a.string(),
      corporateDirectorFlag8: a.string(),
      corporateDirectorFlag9: a.string(),
      corporateDirectorFlag10: a.string(),
      
      // 従業員・商品
      numberOfEmployees: a.integer(),
      productCode1: a.string(),
      productCode2: a.string(),
      productCode3: a.string(),
      productCode4: a.string(),
      productCode5: a.string(),
      productCode6: a.string(),
      productName1: a.string(),
      productName2: a.string(),
      productName3: a.string(),
      productName4: a.string(),
      productName5: a.string(),
      productName6: a.string(),
      
      // 株主情報
      shareholdingRatio1: a.float(),
      shareholdingRatio2: a.float(),
      shareholdingRatio3: a.float(),
      shareholdingRatio4: a.float(),
      shareholdingRatio5: a.float(),
      shareholdingRatio6: a.float(),
      shareholderName1: a.string(),
      shareholderName2: a.string(),
      shareholderName3: a.string(),
      shareholderName4: a.string(),
      shareholderName5: a.string(),
      shareholderName6: a.string(),
      
      // 業種情報
      industryCode1: a.string(),
      industryCode2: a.string(),
      industryCode3: a.string(),
      industryCode4: a.string(),
      industryCode5: a.string(),
      industryCode6: a.string(),
      industryName1: a.string(),
      industryName2: a.string(),
      industryName3: a.string(),
      industryName4: a.string(),
      industryName5: a.string(),
      industryName6: a.string(),
      industrySalesRankNationalTotal: a.integer(),
      industrySalesRankNational: a.integer(),
      industrySalesRankFiscalYear: a.string(),
      industrySalesRankPrefectureTotal: a.integer(),
      industrySalesRankPrefecture: a.integer(),
      
      // 概況・商号
      overview: a.string(),
      formalCorporateNameKanji: a.string(),
      foundedBeforeEdoPeriod: a.string(),
      corporateNameKana: a.string(),
      corporatePrefixSuffix: a.string(),
      abbreviatedCorporateNameKanji: a.string(),
      
      // 決算情報1
      settlement1Profit: a.integer(),
      settlement1Sales: a.integer(),
      settlement1Months: a.integer(),
      settlement1FiscalYear: a.string(),
      settlement1TaxCategory: a.string(),
      settlement1EquityRatio: a.float(),
      settlement1EstimateFlag: a.string(),
      settlement1FinancialFlag: a.string(),
      settlement1TotalDividend: a.integer(),
      
      // 決算情報2
      settlement2Profit: a.integer(),
      settlement2Sales: a.integer(),
      settlement2Months: a.integer(),
      settlement2FiscalYear: a.string(),
      settlement2TaxCategory: a.string(),
      settlement2EquityRatio: a.float(),
      settlement2EstimateFlag: a.string(),
      settlement2FinancialFlag: a.string(),
      settlement2TotalDividend: a.integer(),
      
      // 決算情報3
      settlement3Profit: a.integer(),
      settlement3Sales: a.integer(),
      settlement3Months: a.integer(),
      settlement3FiscalYear: a.string(),
      settlement3TaxCategory: a.string(),
      settlement3EquityRatio: a.float(),
      settlement3EstimateFlag: a.string(),
      settlement3FinancialFlag: a.string(),
      settlement3TotalDividend: a.integer(),
      
      // その他
      establishmentDate: a.date(),
      securitiesStockCode: a.string(),
      creditScore: a.integer(),
      surveyDate: a.date(),
      majorityVotingRightsHolder: a.string(),
      
      // 販売先
      customerName1: a.string(),
      customerName2: a.string(),
      customerName3: a.string(),
      customerName4: a.string(),
      customerName5: a.string(),
      customerName6: a.string(),
      
      // 資本金
      capitalStock: a.integer(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
