import { useNavigate } from "react-router-dom";
import { FaSearch, FaBuilding, FaChartBar, FaDatabase } from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50" style={{ marginLeft: "3vw" }}>
      <div className="flex gap-5 mt-16">
        <div
          className="
            w-[200px] h-[100px] bg-blue-100 flex justify-center items-center
            cursor-pointer rounded shadow transition-shadow
            hover:shadow-lg ml-5
          "
          onClick={() => navigate("/company-search")}
        >
          <span className="text-lg text-blue-900 flex items-center">
            企業検索
            <FaSearch className="ml-2 text-blue-700" size={22} />
          </span>
        </div>
        
        <div
          className="
            w-[200px] h-[100px] bg-green-100 flex justify-center items-center
            cursor-pointer rounded shadow transition-shadow
            hover:shadow-lg ml-5
          "
          onClick={() => navigate("/company-detail")}
        >
          <span className="text-lg text-green-900 flex items-center">
            企業詳細
            <FaBuilding className="ml-2 text-green-700" size={22} />
          </span>
        </div>
        
        <div
          className="
            w-[200px] h-[100px] bg-purple-100 flex justify-center items-center
            cursor-pointer rounded shadow transition-shadow
            hover:shadow-lg ml-5
          "
          onClick={() => navigate("/company-analysis")}
        >
          <span className="text-lg text-purple-900 flex items-center">
            企業分析
            <FaChartBar className="ml-2 text-purple-700" size={22} />
          </span>
        </div>
        
        <div
          className="
            w-[200px] h-[100px] bg-orange-100 flex justify-center items-center
            cursor-pointer rounded shadow transition-shadow
            hover:shadow-lg ml-5
          "
          onClick={() => navigate("/data-management")}
        >
          <span className="text-lg text-orange-900 flex items-center">
            データ管理
            <FaDatabase className="ml-2 text-orange-700" size={22} />
          </span>
        </div>

        <div className="w-[200px] h-[100px] bg-gray-200 flex items-center rounded shadow pl-4">
          <span className="text-lg text-gray-400">その他は現在作成中</span>
        </div>
      </div>
    </div>
  );
}