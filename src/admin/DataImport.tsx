import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";

const client = generateClient<Schema>();

export default function DataImport() {
  const [activeTab, setActiveTab] = useState<"user" | "company" | "industry" | "address">("user");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Excelファイルを読み込んでJSONに変換
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          
          // 最初のシートを取得
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // JSONに変換
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  // ユーザーデータのインポート処理
  const handleUserImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Excelファイルを読み込み
      const data = await readExcelFile(file);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        // Excelの列名に対応（大文字小文字の両方に対応）
        const email = row.email || row.Email || row.EMAIL || "";
        const firstName = row.firstName || row.FirstName || row.名 || "";
        const lastName = row.lastName || row.LastName || row.姓 || "";
        const department = row.department || row.Department || row.部署 || "";
        
        if (!email) continue;

        try {
          // ユーザーを作成
          await client.models.User.create({
            id: email, // emailをIDとして使用
            userId: "", // 空欄
            email: email,
            userName: "", // 空欄
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            department: department || undefined,
          });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${email}: ${error}`);
          console.error(`Failed to import user ${email}:`, error);
        }
      }

      setUploadResult({
        type: errorCount === 0 ? "success" : "error",
        message: `インポート完了: ${successCount}件成功${errorCount > 0 ? `, ${errorCount}件失敗` : ""}${
          errors.length > 0 ? `\nエラー: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}` : ""
        }`,
      });
    } catch (error) {
      setUploadResult({
        type: "error",
        message: `ファイル読み込みエラー: ${error}`,
      });
    } finally {
      setIsUploading(false);
      // ファイル選択をリセット
      event.target.value = "";
    }
  };

  // 業種マスターのインポート処理
  const handleIndustryImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Excelファイルを読み込み
      const data = await readExcelFile(file);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        const smallCategoryCode = row.小分類コード || row.smallCategoryCode || "";
        const smallCategory = row.小分類 || row.smallCategory || "";
        const mediumCategoryCode = row.中分類コード || row.mediumCategoryCode || "";
        const mediumCategory = row.中分類 || row.mediumCategory || "";
        const largeCategoryCode = row.大分類コード || row.largeCategoryCode || "";
        const largeCategory = row.大分類 || row.largeCategory || "";
        
        if (!smallCategoryCode) continue;

        try {
          await client.models.IndustryMaster.create({
            smallCategoryCode,
            smallCategory,
            mediumCategoryCode,
            mediumCategory,
            largeCategoryCode,
            largeCategory,
          });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${smallCategoryCode}: ${error}`);
          console.error(`Failed to import industry ${smallCategoryCode}:`, error);
        }
      }

      setUploadResult({
        type: errorCount === 0 ? "success" : "error",
        message: `インポート完了: ${successCount}件成功${errorCount > 0 ? `, ${errorCount}件失敗` : ""}${
          errors.length > 0 ? `\nエラー: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}` : ""
        }`,
      });
    } catch (error) {
      setUploadResult({
        type: "error",
        message: `ファイル読み込みエラー: ${error}`,
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // 住所マスターのインポート処理
  const handleAddressImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Excelファイルを読み込み
      const data = await readExcelFile(file);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        const administrativeAreaCode = row.行政区域コード || row.administrativeAreaCode || "";
        const prefectureCode = row.都道府県コード || row.prefectureCode || "";
        const prefectureName = row["都道府県名（漢字）"] || row["都道府県名"] || row.prefectureName || "";
        const municipalityName = row["市区町村名（漢字）"] || row["市区町村名"] || row.municipalityName || "";
        const prefectureNameKana = row["都道府県名（ｶﾅ）"] || row["都道府県名（カナ）"] || row.prefectureNameKana || "";
        const municipalityNameKana = row["市区町村名（ｶﾅ）"] || row["市区町村名（カナ）"] || row.municipalityNameKana || "";
        
        if (!administrativeAreaCode) continue;

        try {
          await client.models.AddressMaster.create({
            administrativeAreaCode,
            prefectureCode,
            prefectureName,
            municipalityName,
            prefectureNameKana,
            municipalityNameKana,
          });
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`${administrativeAreaCode}: ${error}`);
          console.error(`Failed to import address ${administrativeAreaCode}:`, error);
        }
      }

      setUploadResult({
        type: errorCount === 0 ? "success" : "error",
        message: `インポート完了: ${successCount}件成功${errorCount > 0 ? `, ${errorCount}件失敗` : ""}${
          errors.length > 0 ? `\nエラー: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}` : ""
        }`,
      });
    } catch (error) {
      setUploadResult({
        type: "error",
        message: `ファイル読み込みエラー: ${error}`,
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // 会社データのインポート処理
  const handleCompanyImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Excelファイルを読み込み
      const companies = await readExcelFile(file);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const company of companies) {
        try {
          // Excelデータをフォーマット
          const formattedCompany = {
            id: company.id || company.ID || company.企業ID || "",
            name: company.name || company.Name || company.会社名 || "",
            pref: company.pref || company.Prefecture || company.都道府県 || "",
            address: {
              text: company.address || company.Address || company.住所 || ""
            },
            industry: company.industry ? 
              (typeof company.industry === "string" ? company.industry.split(",") : company.industry) : [],
            industryNames: company.industryNames ? 
              (typeof company.industryNames === "string" ? company.industryNames.split(",") : company.industryNames) : []
          };

          // 会社データをAPIに送信
          const response = await fetch("/api/companies", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formattedCompany),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          successCount++;
        } catch (error) {
          errorCount++;
          const companyName = company.name || company.Name || company.会社名 || company.id || "不明";
          errors.push(`${companyName}: ${error}`);
          console.error(`Failed to import company:`, error);
        }
      }

      setUploadResult({
        type: errorCount === 0 ? "success" : "error",
        message: `インポート完了: ${successCount}件成功${errorCount > 0 ? `, ${errorCount}件失敗` : ""}${
          errors.length > 0 ? `\nエラー: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}` : ""
        }`,
      });
    } catch (error) {
      setUploadResult({
        type: "error",
        message: `ファイル処理エラー: ${error}`,
      });
    } finally {
      setIsUploading(false);
      // ファイル選択をリセット
      event.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-6">データインポート</h1>

      {/* タブ選択 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("user")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "user"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            ユーザーデータ
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "company"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            会社データ
          </button>
          <button
            onClick={() => setActiveTab("industry")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "industry"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            業種マスター
          </button>
          <button
            onClick={() => setActiveTab("address")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "address"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            住所マスター
          </button>
        </nav>
      </div>

      {/* ユーザーデータインポート */}
      {activeTab === "user" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">ユーザーデータのインポート</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">ファイル形式:</h3>
              <p className="text-sm text-gray-600">Excel形式（.xlsx, .xls）</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-xs font-medium mb-2">必要な列（ヘッダー行）:</p>
                <table className="text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">email</th>
                      <th className="text-left p-1">firstName</th>
                      <th className="text-left p-1">lastName</th>
                      <th className="text-left p-1">department</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1">user1@example.com</td>
                      <td className="p-1">太郎</td>
                      <td className="p-1">山田</td>
                      <td className="p-1">営業部</td>
                    </tr>
                    <tr>
                      <td className="p-1">user2@example.com</td>
                      <td className="p-1">花子</td>
                      <td className="p-1">鈴木</td>
                      <td className="p-1">開発部</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">インポート項目:</h3>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                <li>email: メールアドレス（必須、IDとしても使用）</li>
                <li>firstName: 名（オプション）- 日本語の「名」も可</li>
                <li>lastName: 姓（オプション）- 日本語の「姓」も可</li>
                <li>department: 部署（オプション）- 日本語の「部署」も可</li>
              </ul>
              <p className="text-sm text-gray-500 mt-2">
                ※ userIdとuserNameは自動的に空欄で設定されます<br />
                ※ 列名は大文字小文字を区別しません
              </p>
            </div>

            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="user-file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <DocumentTextIcon className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">クリックしてファイルを選択</span>
                  </p>
                  <p className="text-xs text-gray-500">Excel形式のファイル (.xlsx, .xls)</p>
                </div>
                <input
                  id="user-file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleUserImport}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 会社データインポート */}
      {activeTab === "company" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">会社データのインポート</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">ファイル形式:</h3>
              <p className="text-sm text-gray-600">Excel形式（.xlsx, .xls）</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-xs font-medium mb-2">必要な列（ヘッダー行）:</p>
                <table className="text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">id</th>
                      <th className="text-left p-1">name</th>
                      <th className="text-left p-1">pref</th>
                      <th className="text-left p-1">address</th>
                      <th className="text-left p-1">industry</th>
                      <th className="text-left p-1">industryNames</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1">12345</td>
                      <td className="p-1">株式会社サンプル</td>
                      <td className="p-1">東京都</td>
                      <td className="p-1">東京都千代田区...</td>
                      <td className="p-1">5223,5229</td>
                      <td className="p-1">食品卸売業,その他</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">注意事項:</h3>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                <li>Excelの最初のシートからデータを読み込みます</li>
                <li>1行目はヘッダー行として扱われます</li>
                <li>industry, industryNamesは複数値の場合、カンマ区切りで入力</li>
                <li>日本語の列名（会社名、都道府県、住所など）も使用可能</li>
                <li>大量データの場合は分割してインポートを推奨</li>
              </ul>
            </div>

            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="company-file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <DocumentTextIcon className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">クリックしてファイルを選択</span>
                  </p>
                  <p className="text-xs text-gray-500">Excel形式のファイル (.xlsx, .xls)</p>
                </div>
                <input
                  id="company-file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleCompanyImport}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 業種マスターインポート */}
      {activeTab === "industry" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">業種マスターのインポート</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">ファイル形式:</h3>
              <p className="text-sm text-gray-600">Excel形式（.xlsx, .xls）</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-xs font-medium mb-2">必要な列（ヘッダー行）:</p>
                <table className="text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">小分類コード</th>
                      <th className="text-left p-1">小分類</th>
                      <th className="text-left p-1">中分類コード</th>
                      <th className="text-left p-1">中分類</th>
                      <th className="text-left p-1">大分類コード</th>
                      <th className="text-left p-1">大分類</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1">0111</td>
                      <td className="p-1">米作農業</td>
                      <td className="p-1">011</td>
                      <td className="p-1">耕種農業</td>
                      <td className="p-1">01</td>
                      <td className="p-1">農業</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">注意事項:</h3>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                <li>小分類コードが主キーとして使用されます</li>
                <li>英語の列名（smallCategoryCode等）も使用可能</li>
                <li>すべての項目が必須です</li>
              </ul>
            </div>

            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="industry-file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <DocumentTextIcon className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">クリックしてファイルを選択</span>
                  </p>
                  <p className="text-xs text-gray-500">Excel形式のファイル (.xlsx, .xls)</p>
                </div>
                <input
                  id="industry-file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleIndustryImport}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 住所マスターインポート */}
      {activeTab === "address" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">住所マスターのインポート</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">ファイル形式:</h3>
              <p className="text-sm text-gray-600">Excel形式（.xlsx, .xls）</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-xs font-medium mb-2">必要な列（ヘッダー行）:</p>
                <table className="text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">行政区域コード</th>
                      <th className="text-left p-1">都道府県コード</th>
                      <th className="text-left p-1">都道府県名（漢字）</th>
                      <th className="text-left p-1">市区町村名（漢字）</th>
                      <th className="text-left p-1">都道府県名（ｶﾅ）</th>
                      <th className="text-left p-1">市区町村名（ｶﾅ）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1">01101</td>
                      <td className="p-1">01</td>
                      <td className="p-1">北海道</td>
                      <td className="p-1">札幌市中央区</td>
                      <td className="p-1">ホッカイドウ</td>
                      <td className="p-1">サッポロシチュウオウク</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">注意事項:</h3>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                <li>行政区域コードが主キーとして使用されます</li>
                <li>英語の列名（administrativeAreaCode等）も使用可能</li>
                <li>すべての項目が必須です</li>
                <li>カナは全角カタカナで入力してください</li>
              </ul>
            </div>

            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="address-file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <DocumentTextIcon className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">クリックしてファイルを選択</span>
                  </p>
                  <p className="text-xs text-gray-500">Excel形式のファイル (.xlsx, .xls)</p>
                </div>
                <input
                  id="address-file-upload"
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleAddressImport}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* アップロード中の表示 */}
      {isUploading && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-sm text-blue-700">データをインポート中...</p>
          </div>
        </div>
      )}

      {/* 結果表示 */}
      {uploadResult && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            uploadResult.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm whitespace-pre-line ${
              uploadResult.type === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {uploadResult.message}
          </p>
        </div>
      )}
    </div>
  );
}