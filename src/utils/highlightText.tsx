import React from "react";

/**
 * テキスト内の検索キーワードをハイライト表示する
 * @param text - 表示するテキスト
 * @param keyword - ハイライトするキーワード
 * @returns ハイライト済みのReact要素
 */
export function highlightText(
  text: string | null | undefined,
  keyword: string | null | undefined
): React.ReactNode {
  if (!text) return text;
  if (!keyword || keyword.trim() === "") return text;

  // キーワードをスペースで分割して、各単語でハイライト
  const keywords = keyword.trim().split(/\s+/);
  
  // 正規表現用にエスケープ
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  // すべてのキーワードを含む正規表現パターンを作成
  const pattern = keywords.map(k => escapeRegex(k)).join("|");
  
  if (!pattern) return text;
  
  try {
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => {
          // マッチした部分をハイライト
          if (regex.test(part)) {
            return (
              <mark
                key={index}
                className="bg-yellow-200 text-black px-0.5 rounded"
              >
                {part}
              </mark>
            );
          }
          return part;
        })}
      </>
    );
  } catch (e) {
    // 正規表現エラーの場合は元のテキストを返す
    return text;
  }
}

/**
 * ReactNodeまたは文字列を受け取り、文字列の場合のみハイライト処理を行う
 */
export function highlightIfString(
  content: React.ReactNode,
  keyword: string | null | undefined
): React.ReactNode {
  if (typeof content === "string") {
    return highlightText(content, keyword);
  }
  return content;
}