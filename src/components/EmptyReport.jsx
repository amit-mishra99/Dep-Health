import { ArrowDownToLine, Clipboard } from "lucide-react";

export default function EmptyReport() {
  return (
    <section className="empty-report" aria-label="Scan report preview">
      <div className="empty-report-icon">
        <Clipboard size={21} />
      </div>
      <div>
        <span className="eyebrow">
          <span className="eyebrow-line" />
          YOUR REPORT WILL APPEAR HERE
        </span>
        <p>
          Start with the example manifest or drop in your own to see a
          dependency-by-dependency health check.
        </p>
      </div>
      <span className="empty-report-arrow">
        <ArrowDownToLine size={19} />
      </span>
    </section>
  );
}
