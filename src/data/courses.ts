import type { CourseLevel } from "../types";

export const APP_NAME = "美南のツジ旅クイズ";

export const STORAGE_KEYS = {
  history: "minami-tsujitabi-quiz-history",
  stats: "minami-tsujitabi-quiz-stats",
  settings: "minami-tsujitabi-quiz-settings",
} as const;

export const DATA_VERSION = 1;

export const COURSE_META: Record<
  CourseLevel,
  {
    name: string;
    excelLevelName: string;
    description: string;
    imageLabel: string;
    accent: string;
  }
> = {
  1: {
    name: "旅の記憶",
    excelLevelName: "旅の記憶",
    description: "父娘旅のアルバムをめくるように、楽しい思い出をたどるコース。",
    imageLabel: "旅のアルバム",
    accent: "#2f7ed8",
  },
  2: {
    name: "旅の判断力",
    excelLevelName: "旅の判断力",
    description: "次の旅で役立つ判断や工夫を学べる、作戦会議コース。",
    imageLabel: "コンパス",
    accent: "#f1a63b",
  },
  3: {
    name: "クアラルンプール予習",
    excelLevelName: "KL予習",
    description: "文化や食事、交通や安全を学んで、出発前の準備を整えるコース。",
    imageLabel: "ツインタワー",
    accent: "#3da46b",
  },
};
