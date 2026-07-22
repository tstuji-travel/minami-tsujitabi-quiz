import type { QuizQuestion } from "../types";

const levels = [
  { level: 1 as const, levelName: "旅の記憶", theme: "父娘旅の思い出", categoryBase: "思い出" },
  { level: 2 as const, levelName: "旅の判断力", theme: "旅の判断と工夫", categoryBase: "判断" },
  { level: 3 as const, levelName: "KL予習", theme: "クアラルンプール予習", categoryBase: "KL" },
];

export const sampleQuestions: QuizQuestion[] = levels.flatMap((course) =>
  Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    const id = `Q${course.level}${String(number).padStart(2, "0")}`;
    const correctAnswer = (["A", "B", "C", "D"] as const)[index % 4];
    return {
      id,
      level: course.level,
      levelName: course.levelName,
      theme: course.theme,
      category: `${course.categoryBase}${Math.floor(index / 5) + 1}`,
      question: `${course.levelName}の問題 ${number}。旅先で覚えておきたいポイントはどれ？`,
      choices: {
        A: `${course.levelName}のヒントA-${number}`,
        B: `${course.levelName}のヒントB-${number}`,
        C: `${course.levelName}のヒントC-${number}`,
        D: `${course.levelName}のヒントD-${number}`,
      },
      correctAnswer,
      correctText: `${course.levelName}のヒント${correctAnswer}-${number}`,
      explanation: `${course.levelName}で大切な学びを確認するための解説 ${number} です。`,
      tags: [course.levelName, `タグ${(index % 3) + 1}`],
      sourceTitle: `${course.levelName}メモ ${number}`,
      sourceUrl: "",
      points: 10,
      enabled: true,
    };
  }),
);
