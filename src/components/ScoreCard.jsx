import { ArrowUpRight } from "lucide-react";

export default function ScoreCard({ report }) {
  const scoreTone =
    report.score >= 80 ? "good" : report.score >= 60 ? "watch" : "poor";

  return (
    <div className={`score-panel ${scoreTone}`}>
      <div className="score-copy">
        <span className="score-label">
          {report.summary.unknown > 0 ? "PARTIAL SCORE" : "PROJECT HEALTH"}
        </span>
        <div className="score-number">
          {report.score}
          <span>/100</span>
        </div>
        <span className="score-verdict">
          {report.summary.unknown > 0
            ? "Some checks unresolved"
            : report.score >= 80
              ? "Looking healthy"
              : report.score >= 60
                ? "Room to improve"
                : "Needs attention"}
        </span>
      </div>
      <div
        className="score-dial"
        style={{ "--score-angle": `${report.score}%` }}
      >
        <div>
          <span>{report.score}</span>
          <small>HEALTH</small>
        </div>
      </div>
      <div className="score-foot">
        <span>Score details</span>
        <a href="#method" aria-label="Read the score formula">
          <ArrowUpRight size={15} />
        </a>
      </div>
    </div>
  );
}
