import { COURSE_META } from "../data/courses";
import { getLongestCorrectStreak } from "./quiz";
import type { AwardResult, QuizHistory, StoredStats } from "../types";

export const determineAwards = (
  previousStats: StoredStats,
  history: QuizHistory,
): AwardResult => {
  const earned = new Set<string>();

  if (previousStats.totalPlays === 0) {
    earned.add("初挑戦賞");
  }
  if (previousStats.courseStats[history.courseLevel].attempts === 0) {
    earned.add("コースデビュー賞");
  }
  if (history.score > previousStats.courseStats[history.courseLevel].bestScore) {
    earned.add("自己ベスト更新賞");
  }
  if (history.score === history.maxScore) {
    earned.add("満点賞");
  }
  if (getLongestCorrectStreak(history.answers) >= 5) {
    earned.add("連続正解賞");
  }
  if (history.courseLevel === 1 && history.score >= 80) {
    earned.add("旅の記憶名人");
  }
  if (history.courseLevel === 2 && history.score >= 80) {
    earned.add("判断力アップ賞");
  }
  if (history.courseLevel === 3 && history.score >= 80) {
    earned.add("KL予習ばっちり賞");
  }
  if (
    previousStats.courseStats[1].attempts +
      previousStats.courseStats[2].attempts +
      previousStats.courseStats[3].attempts >
      0 &&
    [1, 2, 3].every((level) =>
      level === history.courseLevel
        ? true
        : previousStats.courseStats[level as 1 | 2 | 3].attempts > 0,
    )
  ) {
    earned.add("3コース制覇賞");
  }

  if (
    history.answers.some((answer) => {
      const stat = previousStats.questionStats[answer.questionId];
      return answer.isCorrect && stat && stat.attempts > stat.correct;
    })
  ) {
    earned.add("リベンジ成功賞");
  }

  const unlocked = Array.from(new Set([...previousStats.unlockedAwards, ...earned])).sort();
  return {
    earnedThisPlay: Array.from(earned),
    unlockedAwards: unlocked,
  };
};

export const describeCourseAwards = (): string[] =>
  Object.values(COURSE_META).map((course) => `${course.name}にちなんだ表彰があります`);
