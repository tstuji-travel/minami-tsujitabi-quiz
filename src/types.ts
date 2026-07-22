export type CourseLevel = 1 | 2 | 3;

export type QuizChoiceKey = "A" | "B" | "C" | "D";

export type QuizQuestion = {
  id: string;
  level: CourseLevel;
  levelName: string;
  theme: string;
  category: string;
  question: string;
  choices: Record<QuizChoiceKey, string>;
  correctAnswer: QuizChoiceKey;
  correctText: string;
  explanation: string;
  tags: string[];
  sourceTitle: string;
  sourceUrl: string;
  points: number;
  enabled: boolean;
};

export type PresentedChoice = {
  key: QuizChoiceKey;
  text: string;
};

export type QuizAnswerRecord = {
  questionId: string;
  question: string;
  selectedAnswer: QuizChoiceKey;
  selectedText: string;
  correctAnswer: QuizChoiceKey;
  correctText: string;
  explanation: string;
  isCorrect: boolean;
  pointsEarned: number;
  pointsAvailable: number;
};

export type QuizSession = {
  courseLevel: CourseLevel;
  courseName: string;
  questions: QuizQuestion[];
};

export type QuizHistory = {
  id: string;
  playedAt: string;
  courseLevel: CourseLevel;
  courseName: string;
  score: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  correctRate: number;
  rankAfterPlay: string;
  awards: string[];
  answers: QuizAnswerRecord[];
};

export type QuestionStat = {
  attempts: number;
  correct: number;
  lastResult: "correct" | "incorrect" | null;
};

export type CourseStats = {
  attempts: number;
  bestScore: number;
  bestRate: number;
};

export type StoredStats = {
  totalPlays: number;
  totalAnswers: number;
  totalCorrect: number;
  currentRankId: RankId;
  unlockedAwards: string[];
  courseStats: Record<CourseLevel, CourseStats>;
  questionStats: Record<string, QuestionStat>;
};

export type VersionedData<T> = {
  version: number;
  data: T;
};

export type RankId =
  | "rank1"
  | "rank2"
  | "rank3"
  | "rank4"
  | "rank5"
  | "rank6";

export type RankDefinition = {
  id: RankId;
  name: string;
  description: string;
};

export type RankProgressItem = {
  label: string;
  done: boolean;
  current?: number;
  target?: number;
};

export type AwardResult = {
  earnedThisPlay: string[];
  unlockedAwards: string[];
};
