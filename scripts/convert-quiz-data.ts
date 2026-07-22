import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";
import type { QuizChoiceKey, QuizQuestion } from "../src/types";

const workbookPath = path.resolve(process.cwd(), "public/excel/ツジ旅クイズデータベース_90問.xlsx");
const outputPath = path.resolve(process.cwd(), "public/data/quizzes.json");
const targetSheet = "クイズDB";

type Row = Record<string, unknown>;

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["true", "1", "yes"].includes(value.trim().toLowerCase());
  return false;
};

const parseTags = (value: unknown): string[] =>
  typeof value === "string"
    ? value.split(/[、,|]/).map((tag) => tag.trim()).filter(Boolean)
    : [];

const validAnswers: QuizChoiceKey[] = ["A", "B", "C", "D"];
const errors: string[] = [];
const seenIds = new Set<string>();

if (!fs.existsSync(workbookPath)) {
  console.error(`Excelファイルが見つかりません: ${workbookPath}`);
  process.exit(1);
}

const workbook = xlsx.readFile(workbookPath);
const worksheet = workbook.Sheets[targetSheet];

if (!worksheet) {
  console.error(`シート「${targetSheet}」が見つかりません。`);
  process.exit(1);
}

const rows = xlsx.utils.sheet_to_json<Row>(worksheet, { defval: "" });

const quizzes = rows.flatMap((row, index) => {
  const line = index + 2;
  const id = String(row["問題ID"] ?? "").trim();
  const level = Number(row["レベル"]);
  const correctAnswer = String(row["正解"] ?? "").trim() as QuizChoiceKey;
  const points = Number(row["配点"]);

  if (!id) errors.push(`${line}行目: 問題IDが空です`);
  if (seenIds.has(id)) errors.push(`${line}行目: 問題ID ${id} が重複しています`);
  seenIds.add(id);
  for (const key of validAnswers) {
    if (!String(row[`選択肢${key}`] ?? "").trim()) {
      errors.push(`${line}行目: 選択肢${key} が空です`);
    }
  }
  if (!validAnswers.includes(correctAnswer)) {
    errors.push(`${line}行目: 正解が A-D ではありません`);
  }
  if (Number.isNaN(points)) {
    errors.push(`${line}行目: 配点が数値ではありません`);
  }

  const quiz: QuizQuestion = {
    id,
    level: level as 1 | 2 | 3,
    levelName: String(row["レベル名"] ?? "").trim(),
    theme: String(row["テーマ"] ?? "").trim(),
    category: String(row["カテゴリ"] ?? "").trim(),
    question: String(row["問題文"] ?? "").trim(),
    choices: {
      A: String(row["選択肢A"] ?? "").trim(),
      B: String(row["選択肢B"] ?? "").trim(),
      C: String(row["選択肢C"] ?? "").trim(),
      D: String(row["選択肢D"] ?? "").trim(),
    },
    correctAnswer,
    correctText: String(row["正解文"] ?? "").trim(),
    explanation: String(row["解説"] ?? "").trim(),
    tags: parseTags(row["タグ"]),
    sourceTitle: String(row["出典タイトル"] ?? "").trim(),
    sourceUrl: String(row["出典URL"] ?? "").trim(),
    points,
    enabled: normalizeBoolean(row["有効"]),
  };

  return [quiz];
});

const enabledCounts = quizzes.filter((quiz) => quiz.enabled).reduce<Record<number, number>>((counts, quiz) => {
  counts[quiz.level] = (counts[quiz.level] ?? 0) + 1;
  return counts;
}, {});

for (const level of [1, 2, 3]) {
  if ((enabledCounts[level] ?? 0) !== 30) {
    errors.push(`レベル${level}: 有効な問題数が30問ではありません (${enabledCounts[level] ?? 0}問)`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

fs.writeFileSync(outputPath, JSON.stringify(quizzes.filter((quiz) => quiz.enabled), null, 2));
console.log(`変換完了: ${outputPath}`);
