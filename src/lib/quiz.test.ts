import { describe, expect, test } from "vitest";
import { sampleQuestions } from "../data/sampleQuestions";
import { determineAwards } from "./awards";
import { createDefaultStats, determineRank, updateStatsWithHistory } from "./progression";
import { QUESTIONS_PER_PLAY, calculateResultSummary, createQuizSession, gradeAnswer, presentChoices } from "./quiz";
import { limitHistory } from "./storage";
import type { QuizHistory } from "../types";

describe("quiz helpers", () => {
  test("7問が重複なく選ばれる", () => {
    const session = createQuizSession(sampleQuestions, 1, () => 0.25);
    expect(session.questions).toHaveLength(QUESTIONS_PER_PLAY);
    expect(new Set(session.questions.map((question) => question.id)).size).toBe(QUESTIONS_PER_PLAY);
  });

  test("選択肢を並べ替えても正解判定が崩れない", () => {
    const question = sampleQuestions[0];
    const choices = presentChoices(question, () => 0.9);
    expect(choices).toHaveLength(4);
    const answer = gradeAnswer(question, question.correctAnswer);
    expect(answer.isCorrect).toBe(true);
  });

  test("得点が正しく計算される", () => {
    const answers = sampleQuestions.slice(0, 2).map((question, index) =>
      gradeAnswer(question, index === 0 ? question.correctAnswer : "A"),
    );
    const result = calculateResultSummary(answers, 1, "2026-07-22T00:00:00.000Z");
    expect(result.maxScore).toBe(20);
    expect(result.score).toBe(10);
  });

  test("ランク条件が正しく判定される", () => {
    const stats = createDefaultStats();
    stats.totalPlays = 10;
    stats.totalAnswers = 30;
    stats.totalCorrect = 80;
    stats.courseStats[1].attempts = 1;
    stats.courseStats[2].attempts = 1;
    stats.courseStats[3].attempts = 1;
    stats.courseStats[1].bestScore = 90;
    stats.courseStats[2].bestScore = 90;
    stats.courseStats[3].bestScore = 90;
    expect(determineRank(stats)).toBe("rank6");
  });

  test("表彰条件が正しく判定される", () => {
    const previous = createDefaultStats();
    const history: QuizHistory = {
      id: "1",
      playedAt: "2026-07-22T00:00:00.000Z",
      courseLevel: 1,
      courseName: "旅の記憶",
      score: 70,
      maxScore: 70,
      correctCount: 7,
      totalQuestions: 7,
      correctRate: 100,
      rankAfterPlay: "旅のたまご",
      awards: [],
      answers: sampleQuestions.slice(0, 7).map((question) => gradeAnswer(question, question.correctAnswer)),
    };
    const result = determineAwards(previous, history);
    expect(result.earnedThisPlay).toContain("初挑戦賞");
    expect(result.earnedThisPlay).toContain("満点賞");
    expect(result.earnedThisPlay).toContain("連続正解賞");
  });

  test("自己ベストが正しく更新される", () => {
    const previous = createDefaultStats();
    const history: QuizHistory = {
      id: "1",
      playedAt: "2026-07-22T00:00:00.000Z",
      courseLevel: 2,
      courseName: "旅の判断力",
      score: 80,
      maxScore: 100,
      correctCount: 8,
      totalQuestions: 7,
      correctRate: 80,
      rankAfterPlay: "見習い旅人",
      awards: [],
      answers: sampleQuestions.slice(30, 37).map((question) => gradeAnswer(question, question.correctAnswer)),
    };
    const next = updateStatsWithHistory(previous, history);
    expect(next.courseStats[2].bestScore).toBe(80);
    expect(next.courseStats[2].bestRate).toBe(80);
  });

  test("履歴が10件まで保存され、11件目で最古が削除される", () => {
    const histories = Array.from({ length: 11 }, (_, index) => ({
      id: String(index + 1),
      playedAt: "2026-07-22T00:00:00.000Z",
      courseLevel: 1 as const,
      courseName: "旅の記憶",
      score: 100 - index,
      maxScore: 100,
      correctCount: 10,
      totalQuestions: 10,
      correctRate: 100,
      rankAfterPlay: "旅のたまご",
      awards: [],
      answers: [],
    }));
    const limited = limitHistory(histories);
    expect(limited).toHaveLength(10);
    expect(limited.at(-1)?.id).toBe("10");
  });
});
