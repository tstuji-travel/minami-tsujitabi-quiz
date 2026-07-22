type ProgressBarProps = {
  value: number;
  max: number;
  label?: string;
};

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress-wrap" aria-label={label}>
      {label ? <div className="progress-label">{label}</div> : null}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
