import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { CourseCard } from "./components/CourseCard";
import { ProgressBar } from "./components/ProgressBar";
import { APP_NAME, COURSE_META } from "./data/courses";
import { loadQuestions } from "./lib/data";
import { determineAwards } from "./lib/awards";
import { determineRank, getNextRank, getNextRankProgress, getRankById, updateStatsWithHistory } from "./lib/progression";
import { QUESTIONS_PER_PLAY, createQuizSession, gradeAnswer, presentChoices, calculateResultSummary } from "./lib/quiz";
import { clearAllData, loadHistory, loadSettings, loadStats, saveHistory, saveSettings, saveStats } from "./lib/storage";
import type { CourseLevel, PresentedChoice, QuizAnswerRecord, QuizHistory, QuizQuestion, QuizSession, StoredStats } from "./types";

type Screen =
  | { name: "home" }
  | { name: "course"; level: CourseLevel }
  | { name: "quiz"; session: QuizSession }
  | { name: "result"; history: QuizHistory; rankUpFrom: string | null; rankUpTo: string | null; earnedAwards: string[] }
  | { name: "history" }
  | { name: "growth" }
  | { name: "settings" };

export default function App() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [stats, setStats] = useState<StoredStats>(loadStats);
  const [history, setHistory] = useState<QuizHistory[]>(loadHistory);
  const [soundEnabled, setSoundEnabled] = useState(loadSettings().soundEnabled);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerRecord[]>([]);
  const [presentedChoices, setPresentedChoices] = useState<PresentedChoice[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [buildDate, setBuildDate] = useState("");

  useEffect(() => {
    loadQuestions().then(setQuestions);
    setBuildDate(new Date().toLocaleString("ja-JP"));
  }, []);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveSettings({ soundEnabled });
  }, [soundEnabled]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then((registration) => {
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      }).catch(() => undefined);
    }
  }, []);

  const groupedCounts = useMemo(
    () => ({
      1: questions.filter((question) => question.level === 1 && question.enabled).length,
      2: questions.filter((question) => question.level === 2 && question.enabled).length,
      3: questions.filter((question) => question.level === 3 && question.enabled).length,
    }),
    [questions],
  );

  const currentRank = getRankById(stats.currentRankId);
  const nextRank = getNextRank(stats.currentRankId);
  const nextRankProgress = getNextRankProgress(stats);

  const startCourse = (level: CourseLevel) => {
    const session = createQuizSession(questions, level);
    setQuizIndex(0);
    setQuizAnswers([]);
    setSelectedChoice(null);
    setPresentedChoices(presentChoices(session.questions[0]));
    setScreen({ name: "quiz", session });
  };

  const answerCurrent = (choice: string) => {
    if (screen.name !== "quiz" || selectedChoice) {
      return;
    }
    const question = screen.session.questions[quizIndex];
    const result = gradeAnswer(question, choice as "A" | "B" | "C" | "D");
    setSelectedChoice(choice);
    setQuizAnswers((current) => [...current, result]);
  };

  const moveNext = () => {
    if (screen.name !== "quiz") {
      return;
    }
    const nextIndex = quizIndex + 1;
    if (nextIndex >= screen.session.questions.length) {
      const base = calculateResultSummary(
        quizAnswers,
        screen.session.courseLevel,
        new Date().toISOString(),
      );
      const previousRank = getRankById(stats.currentRankId).name;
      const tempHistory: QuizHistory = {
        id: crypto.randomUUID(),
        ...base,
        rankAfterPlay: previousRank,
        awards: [],
      };
      const awardResult = determineAwards(stats, tempHistory);
      const nextStats = updateStatsWithHistory(stats, tempHistory);
      nextStats.unlockedAwards = awardResult.unlockedAwards;
      const rankAfterPlay = getRankById(determineRank(nextStats)).name;
      const finalHistory: QuizHistory = {
        ...tempHistory,
        rankAfterPlay,
        awards: awardResult.earnedThisPlay,
      };
      setStats(nextStats);
      setHistory((current) => [finalHistory, ...current].slice(0, 10));
      setScreen({
        name: "result",
        history: finalHistory,
        rankUpFrom: previousRank === rankAfterPlay ? null : previousRank,
        rankUpTo: previousRank === rankAfterPlay ? null : rankAfterPlay,
        earnedAwards: awardResult.earnedThisPlay,
      });
      return;
    }

    setQuizIndex(nextIndex);
    setSelectedChoice(null);
    setPresentedChoices(presentChoices(screen.session.questions[nextIndex]));
  };

  const resetData = () => {
    const secondConfirm = window.confirm("本当に消去しますか？この操作は元に戻せません。");
    if (!secondConfirm) {
      return;
    }
    clearAllData();
    setStats(loadStats());
    setHistory(loadHistory());
    setSoundEnabled(loadSettings().soundEnabled);
    setScreen({ name: "home" });
  };

  const currentQuestion = screen.name === "quiz" ? screen.session.questions[quizIndex] : null;
  const currentAnswer = selectedChoice ? quizAnswers[quizAnswers.length - 1] : null;
  const currentScore = quizAnswers.reduce((sum, answer) => sum + answer.pointsEarned, 0);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">美南の旅人ランク</p>
          <h1>{APP_NAME}</h1>
          <p className="hero-copy">
            {currentRank.name}として、次の旅の準備を進めよう。iPad で遊びやすい大きめ UI を意識したデザインです。
          </p>
        </div>
        <div className="hero-rank">
          <span>現在</span>
          <strong>{currentRank.name}</strong>
        </div>
      </header>

      {updateReady ? (
        <section className="update-banner card">
          <p>新しいバージョンがあります</p>
          <button className="secondary-button" onClick={() => window.location.reload()}>
            更新する
          </button>
        </section>
      ) : null}

      <nav className="top-nav">
        <button onClick={() => setScreen({ name: "home" })}>トップ</button>
        <button onClick={() => setScreen({ name: "history" })}>回答履歴</button>
        <button onClick={() => setScreen({ name: "growth" })}>成長記録</button>
        <button onClick={() => setScreen({ name: "settings" })}>設定</button>
      </nav>

      {screen.name === "home" ? (
        <main className="stack">
          <section className="card">
            <h2>次のランクへの進捗</h2>
            <p>{nextRank ? `次の「${nextRank.name}」まで` : "最高ランク達成済みです"}</p>
            <div className="check-list">
              {nextRankProgress.map((item) => (
                <div className="check-item" key={item.label}>
                  <strong>{item.label}</strong>
                  <span className={`status-chip ${item.done ? "status-done" : "status-pending"}`}>
                    {item.done ? "達成" : "未達"}
                  </span>
                  {item.target ? <small>{item.current} / {item.target}</small> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="course-grid">
            {([1, 2, 3] as const).map((level) => (
              <CourseCard
                key={level}
                level={level}
                questionCount={groupedCounts[level]}
                stats={stats.courseStats[level]}
                onOpen={(nextLevel) => setScreen({ name: "course", level: nextLevel })}
              />
            ))}
          </section>
        </main>
      ) : null}

      {screen.name === "course" ? (
        <main className="stack">
          <section className="card detail-card">
            <div className="course-pill" style={{ "--accent": COURSE_META[screen.level].accent } as CSSProperties}>
              {COURSE_META[screen.level].imageLabel}
            </div>
            <h2>{COURSE_META[screen.level].name}</h2>
            <p className="course-description">{COURSE_META[screen.level].description}</p>
            <div className="detail-grid">
              <div className="mini-card">
                <strong>1回の出題数</strong>
                <p>{QUESTIONS_PER_PLAY}問</p>
              </div>
              <div className="mini-card">
                <strong>コース総数</strong>
                <p>{groupedCounts[screen.level]}問</p>
              </div>
              <div className="mini-card">
                <strong>自己ベスト</strong>
                <p>{stats.courseStats[screen.level].attempts === 0 ? "まだ挑戦していません" : `${stats.courseStats[screen.level].bestScore}点`}</p>
              </div>
              <div className="mini-card">
                <strong>挑戦回数</strong>
                <p>{stats.courseStats[screen.level].attempts}回</p>
              </div>
              <div className="mini-card">
                <strong>出題カテゴリ</strong>
                <p>{Array.from(new Set(questions.filter((question) => question.level === screen.level).map((question) => question.category))).join(" / ")}</p>
              </div>
            </div>
            <button className="primary-button" onClick={() => startCourse(screen.level)}>
              挑戦開始
            </button>
          </section>
        </main>
      ) : null}

      {screen.name === "quiz" && currentQuestion ? (
        <main className="stack">
          <section className="card">
            <div className="quiz-header">
              <div>
                <p className="eyebrow">{screen.session.courseName}</p>
                <h2>{quizIndex + 1} / {QUESTIONS_PER_PLAY}</h2>
              </div>
              <div className="score-box">現在の得点 {currentScore}点</div>
            </div>
            <ProgressBar value={quizIndex + (selectedChoice ? 1 : 0)} max={QUESTIONS_PER_PLAY} label="進捗" />
            <p className="question-text">{currentQuestion.question}</p>
            <div className="choice-list">
              {presentedChoices.map((choice) => {
                const isSelected = selectedChoice === choice.key;
                const isCorrect = currentAnswer?.correctAnswer === choice.key;
                const status = !selectedChoice
                  ? ""
                  : isCorrect
                    ? " choice-correct"
                    : isSelected
                      ? " choice-incorrect"
                      : "";
                return (
                  <button
                    key={choice.key}
                    className={`choice-button${status}`}
                    onClick={() => answerCurrent(choice.key)}
                    disabled={Boolean(selectedChoice)}
                  >
                    <span>{choice.key}</span>
                    <strong>{choice.text}</strong>
                    {selectedChoice ? (
                      <em>{isCorrect ? "正解" : isSelected ? "あなたの回答" : "\u00a0"}</em>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {currentAnswer ? (
              <div className="answer-panel">
                <p>{currentAnswer.isCorrect ? "正解です" : "今回は不正解です"}</p>
                <p>正解: {currentAnswer.correctAnswer} {currentAnswer.correctText}</p>
                <p>{currentAnswer.explanation}</p>
                <button className="primary-button" onClick={moveNext}>
                  {quizIndex === 9 ? "結果を見る" : "次の問題"}
                </button>
              </div>
            ) : null}
            <button
              className="ghost-button"
              onClick={() => {
                if (window.confirm("挑戦を中断してトップへ戻りますか？")) {
                  setScreen({ name: "home" });
                }
              }}
            >
              トップへ戻る
            </button>
          </section>
        </main>
      ) : null}

      {screen.name === "result" ? (
        <main className="stack">
          <section className="card">
            <p className="eyebrow">結果画面</p>
            <h2>結果発表</h2>
            <div className="result-summary-grid">
              <div className="mini-card">
                <strong>コース</strong>
                <p>{screen.history.courseName}</p>
              </div>
              <div className="mini-card">
                <strong>得点</strong>
                <p>{screen.history.score} / {screen.history.maxScore} 点</p>
              </div>
              <div className="mini-card">
                <strong>正解数</strong>
                <p>{screen.history.correctCount} / {screen.history.totalQuestions} 問</p>
              </div>
              <div className="mini-card">
                <strong>正解率</strong>
                <p>{screen.history.correctRate}%</p>
              </div>
            </div>
            <p>挑戦日時 {new Date(screen.history.playedAt).toLocaleString("ja-JP")}</p>
            {screen.rankUpFrom && screen.rankUpTo ? (
              <div className="rankup-box">
                <strong>ランクアップ！</strong>
                <p>{screen.rankUpFrom} → {screen.rankUpTo}</p>
              </div>
            ) : null}
            <h3>今回の表彰</h3>
            <div className="badge-list">
              {screen.earnedAwards.length === 0 ? <span className="badge">新規表彰はありません</span> : screen.earnedAwards.map((award) => <span className="badge" key={award}>{award}</span>)}
            </div>
            <h3>回答詳細</h3>
            <div className="result-list">
              {screen.history.answers.map((answer) => (
                <article className="result-item" key={answer.questionId}>
                  <strong>{answer.question}</strong>
                  <p>美南の回答: {answer.selectedAnswer} {answer.selectedText}</p>
                  <p>正解: {answer.correctAnswer} {answer.correctText}</p>
                  <p className={answer.isCorrect ? "answer-good" : "answer-bad"}>{answer.isCorrect ? "正解" : "不正解"}</p>
                  <p>{answer.explanation}</p>
                </article>
              ))}
            </div>
            <div className="button-row">
              <button className="primary-button" onClick={() => startCourse(screen.history.courseLevel)}>
                もう一度挑戦
              </button>
              <button className="secondary-button" onClick={() => setScreen({ name: "home" })}>
                トップへ戻る
              </button>
            </div>
          </section>
        </main>
      ) : null}

      {screen.name === "history" ? (
        <main className="stack">
          <section className="card">
            <h2>回答履歴</h2>
            {history.length === 0 ? <p>まだ履歴がありません。</p> : history.map((item) => (
              <details className="history-item" key={item.id}>
                <summary>
                  {new Date(item.playedAt).toLocaleString("ja-JP")} / {item.courseName} / {item.score}点 / {item.correctRate}%
                </summary>
                <p>ランク: {item.rankAfterPlay}</p>
                <p>表彰: {item.awards.join("、") || "なし"}</p>
                {item.answers.map((answer) => (
                  <div className="history-answer" key={answer.questionId}>
                    <p>{answer.question}</p>
                    <p>選択: {answer.selectedAnswer} / 正解: {answer.correctAnswer} / {answer.isCorrect ? "正解" : "不正解"}</p>
                    <p>{answer.explanation}</p>
                  </div>
                ))}
              </details>
            ))}
          </section>
        </main>
      ) : null}

      {screen.name === "growth" ? (
        <main className="stack">
          <section className="card">
            <h2>成長記録</h2>
            <p>現在のランク: {currentRank.name}</p>
            <p>累計挑戦回数: {stats.totalPlays}</p>
            <p>累計回答数: {stats.totalAnswers}</p>
            <p>累計正解数: {stats.totalCorrect}</p>
            <p>総合正解率: {stats.totalAnswers === 0 ? 0 : Math.round((stats.totalCorrect / stats.totalAnswers) * 100)}%</p>
            <div className="course-growth">
              {([1, 2, 3] as const).map((level) => (
                <article key={level} className="mini-card">
                  <h3>{COURSE_META[level].name}</h3>
                  <p>自己ベスト {stats.courseStats[level].bestScore}点</p>
                  <p>挑戦回数 {stats.courseStats[level].attempts}回</p>
                </article>
              ))}
            </div>
            <h3>取得済み表彰</h3>
            <div className="badge-list">
              {stats.unlockedAwards.length === 0 ? <span className="badge">まだありません</span> : stats.unlockedAwards.map((award) => <span className="badge" key={award}>{award}</span>)}
            </div>
            <h3>苦手な問題</h3>
            <div className="result-list">
              {Object.entries(stats.questionStats).filter(([, stat]) => stat.attempts >= 2 && stat.correct / stat.attempts < 0.5).map(([questionId, stat]) => (
                <div className="result-item" key={questionId}>
                  <p>{questionId}</p>
                  <p>{stat.correct} / {stat.attempts} 正解</p>
                </div>
              ))}
            </div>
            <h3>克服した問題</h3>
            <div className="result-list">
              {Object.entries(stats.questionStats).filter(([, stat]) => stat.attempts > stat.correct && stat.lastResult === "correct").map(([questionId, stat]) => (
                <div className="result-item" key={questionId}>
                  <p>{questionId}</p>
                  <p>直近で克服しました。正解 {stat.correct} / 挑戦 {stat.attempts}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      ) : null}

      {screen.name === "settings" ? (
        <main className="stack">
          <section className="card">
            <h2>設定</h2>
            <label className="toggle-row">
              <span>効果音</span>
              <input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
            </label>
            <p>データベース問題数: {questions.length}問</p>
            <p>ビルド日時: {buildDate}</p>
            <button
              className="danger-button"
              onClick={() => {
                if (window.confirm("データをすべて消去しますか？")) {
                  resetData();
                }
              }}
            >
              データをすべて消去する
            </button>
          </section>
        </main>
      ) : null}
    </div>
  );
}
