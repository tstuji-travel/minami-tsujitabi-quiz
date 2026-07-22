import { sampleQuestions } from "../data/sampleQuestions";
import type { QuizQuestion } from "../types";

export const loadQuestions = async (): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch("./data/quizzes.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Failed to load quiz data");
    }
    const loaded = (await response.json()) as QuizQuestion[];
    return loaded.length > 0 ? loaded : sampleQuestions;
  } catch {
    return sampleQuestions;
  }
};
