import { COURSE_META } from "../data/courses";
import type {
  CourseLevel,
  PresentedChoice,
  QuizAnswerRecord,
  QuizChoiceKey,
  QuizHistory,
  QuizQuestion,
  QuizSession,
} from "../types";

export const QUESTIONS_PER_PLAY = 7;

export const shuffle = <T,>(items: T[], random = Math.random): T[] => {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
};

export const getCourseQuestions = (
  questions: QuizQuestion[],
  level: CourseLevel,
): QuizQuestion[] => questions.filter((question) => question.enabled && question.level === level);

export const createQuizSession = (
  questions: QuizQuestion[],
  level: CourseLevel,
  random = Math.random,
): QuizSession => {
  const courseQuestions = getCourseQuestions(questions, level);
  const selected = shuffle(courseQuestions, random).slice(0, QUESTIONS_PER_PLAY);
  return {
    courseLevel: level,
    courseName: COURSE_META[level].name,
    questions: selected,
  };
};

export const presentChoices = (
  question: QuizQuestion,
  random = Math.random,
): PresentedChoice[] => {
  const choices = (Object.entries(question.choices) as [QuizChoiceKey, string][])
    .map(([key, text]) => ({ key, text }));
  return shuffle(choices, random);
};

export const gradeAnswer = (
  question: QuizQuestion,
  selectedAnswer: QuizChoiceKey,
): QuizAnswerRecord => {
  const isCorrect = selectedAnswer === question.correctAnswer;
  return {
    questionId: question.id,
    question: question.question,
    selectedAnswer,
    selectedText: question.choices[selectedAnswer],
    correctAnswer: question.correctAnswer,
    correctText: question.correctText,
    explanation: question.explanation,
    isCorrect,
    pointsEarned: isCorrect ? question.points : 0,
    pointsAvailable: question.points,
  };
};

export const calculateResultSummary = (
  answers: QuizAnswerRecord[],
  courseLevel: CourseLevel,
  playedAt: string,
): Omit<QuizHistory, "id" | "rankAfterPlay" | "awards"> => {
  const score = answers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
  const maxScore = answers.reduce((sum, answer) => sum + answer.pointsAvailable, 0);
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalQuestions = answers.length;
  const correctRate = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  return {
    playedAt,
    courseLevel,
    courseName: COURSE_META[courseLevel].name,
    score,
    maxScore,
    correctCount,
    totalQuestions,
    correctRate,
    answers,
  };
};

export const getLongestCorrectStreak = (answers: QuizAnswerRecord[]): number => {
  let longest = 0;
  let current = 0;
  for (const answer of answers) {
    if (answer.isCorrect) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
};
