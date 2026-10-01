export default function SummaryMetric({
  className,
  label,
  value,
  detail,
  icon: Icon,
}) {
  return (
    <div className={`metric-card ${className}`}>
      <span className="metric-label">{label}</span>
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{detail}</span>
      <span className="metric-mark">
        <Icon size={17} />
      </span>
    </div>
  );
}
