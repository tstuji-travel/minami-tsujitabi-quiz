import { COURSE_META } from "../data/courses";
import { RANKS } from "../data/ranks";
import type {
  CourseLevel,
  QuizHistory,
  RankDefinition,
  RankId,
  RankProgressItem,
  StoredStats,
} from "../types";

export const createDefaultStats = (): StoredStats => ({
  totalPlays: 0,
  totalAnswers: 0,
  totalCorrect: 0,
  currentRankId: "rank1",
  unlockedAwards: [],
  courseStats: {
    1: { attempts: 0, bestScore: 0, bestRate: 0 },
    2: { attempts: 0, bestScore: 0, bestRate: 0 },
    3: { attempts: 0, bestScore: 0, bestRate: 0 },
  },
  questionStats: {},
});

export const getRankById = (rankId: RankId): RankDefinition =>
  RANKS.find((rank) => rank.id === rankId) ?? RANKS[0];

const bestScoreAtLeast = (stats: StoredStats, level: CourseLevel, score: number): boolean =>
  stats.courseStats[level].bestScore >= score;

export const determineRank = (stats: StoredStats): RankId => {
  const attemptedAllCourses = [1, 2, 3].every(
    (level) => stats.courseStats[level as CourseLevel].attempts > 0,
  );

  if (
    [1, 2, 3].every((level) => bestScoreAtLeast(stats, level as CourseLevel, 90)) &&
    stats.totalPlays >= 10 &&
    stats.totalCorrect >= 80
  ) {
    return "rank6";
  }

  if (
    bestScoreAtLeast(stats, 2, 80) &&
    bestScoreAtLeast(stats, 3, 80) &&
    stats.totalCorrect >= 60
  ) {
    return "rank5";
  }

  if (
    [1, 2, 3].every((level) => bestScoreAtLeast(stats, level as CourseLevel, 70)) &&
    stats.totalAnswers >= 30
  ) {
    return "rank4";
  }

  if (attemptedAllCourses && [1, 2, 3].some((level) => bestScoreAtLeast(stats, level as CourseLevel, 70))) {
    return "rank3";
  }

  if (stats.totalPlays >= 1) {
    return "rank2";
  }

  return "rank1";
};

export const getNextRank = (rankId: RankId): RankDefinition | null => {
  const index = RANKS.findIndex((rank) => rank.id === rankId);
  return index === -1 || index === RANKS.length - 1 ? null : RANKS[index + 1];
};

export const getNextRankProgress = (stats: StoredStats): RankProgressItem[] => {
  switch (stats.currentRankId) {
    case "rank1":
      return [{ label: "いずれか1コースに挑戦する", done: stats.totalPlays >= 1 }];
    case "rank2":
      return [
        { label: "3コースすべてに挑戦する", done: [1, 2, 3].every((level) => stats.courseStats[level as CourseLevel].attempts > 0) },
        { label: "いずれか1コースで70点以上", done: [1, 2, 3].some((level) => stats.courseStats[level as CourseLevel].bestScore >= 70) },
      ];
    case "rank3":
      return [
        ...([1, 2, 3] as const).map((level) => ({
          label: `${COURSE_META[level].name} 70点以上`,
          done: stats.courseStats[level].bestScore >= 70,
        })),
        { label: "累計30問回答", done: stats.totalAnswers >= 30, current: stats.totalAnswers, target: 30 },
      ];
    case "rank4":
      return [
        { label: "旅の判断力で80点以上", done: stats.courseStats[2].bestScore >= 80 },
        { label: "クアラルンプール予習で80点以上", done: stats.courseStats[3].bestScore >= 80 },
        { label: "累計正解数60問以上", done: stats.totalCorrect >= 60, current: stats.totalCorrect, target: 60 },
      ];
    case "rank5":
      return [
        ...([1, 2, 3] as const).map((level) => ({
          label: `${COURSE_META[level].name} 90点以上`,
          done: stats.courseStats[level].bestScore >= 90,
        })),
        { label: "累計挑戦回数10回以上", done: stats.totalPlays >= 10, current: stats.totalPlays, target: 10 },
        { label: "累計正解数80問以上", done: stats.totalCorrect >= 80, current: stats.totalCorrect, target: 80 },
      ];
    default:
      return [{ label: "最高ランク達成済み", done: true }];
  }
};

export const updateStatsWithHistory = (stats: StoredStats, history: QuizHistory): StoredStats => {
  const next: StoredStats = structuredClone(stats);
  next.totalPlays += 1;
  next.totalAnswers += history.totalQuestions;
  next.totalCorrect += history.correctCount;

  const courseStats = next.courseStats[history.courseLevel];
  courseStats.attempts += 1;
  courseStats.bestScore = Math.max(courseStats.bestScore, history.score);
  courseStats.bestRate = Math.max(courseStats.bestRate, history.correctRate);

  for (const answer of history.answers) {
    const current = next.questionStats[answer.questionId] ?? {
      attempts: 0,
      correct: 0,
      lastResult: null,
    };
    current.attempts += 1;
    if (answer.isCorrect) {
      current.correct += 1;
    }
    current.lastResult = answer.isCorrect ? "correct" : "incorrect";
    next.questionStats[answer.questionId] = current;
  }

  next.currentRankId = determineRank(next);
  return next;
};
