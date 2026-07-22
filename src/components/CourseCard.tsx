import type { CSSProperties } from "react";
import { COURSE_META } from "../data/courses";
import type { CourseLevel, StoredStats } from "../types";

type CourseCardProps = {
  level: CourseLevel;
  questionCount: number;
  stats: StoredStats["courseStats"][CourseLevel];
  onOpen: (level: CourseLevel) => void;
};

export function CourseCard({ level, questionCount, stats, onOpen }: CourseCardProps) {
  const course = COURSE_META[level];
  return (
    <article className="card course-card" style={{ "--accent": course.accent } as CSSProperties}>
      <div className="course-pill">{course.imageLabel}</div>
      <h3>{course.name}</h3>
      <p className="course-description">{course.description}</p>
      <dl className="course-stats">
        <div>
          <dt>問題数</dt>
          <dd>{questionCount}問</dd>
        </div>
        <div>
          <dt>自己ベスト</dt>
          <dd>{stats.attempts === 0 ? "まだ挑戦していません" : `${stats.bestScore}点`}</dd>
        </div>
        <div>
          <dt>最高正解率</dt>
          <dd>{stats.attempts === 0 ? "-" : `${stats.bestRate}%`}</dd>
        </div>
        <div>
          <dt>挑戦回数</dt>
          <dd>{stats.attempts}回</dd>
        </div>
      </dl>
      <div className="course-card-footer">
        <button className="primary-button" onClick={() => onOpen(level)}>
          挑戦する
        </button>
      </div>
    </article>
  );
}
