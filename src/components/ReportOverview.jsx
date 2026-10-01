import { ArrowUpRight, CircleAlert, Info } from "lucide-react";
import { formatDate } from "../utils/report.js";
import ReportActions from "./ReportActions.jsx";
import ScoreCard from "./ScoreCard.jsx";
import SummaryMetric from "./SummaryMetric.jsx";

export default function ReportOverview({
  report,
  copied,
  onDownload,
  onShare,
}) {
  return (
    <>
      <div className="report-title-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            SCAN REPORT{" "}
            <span className="report-date">{formatDate(report.scannedAt)}</span>
          </div>
          <h2 className="report-project">{report.name}</h2>
          <p className="report-subtitle">
            {report.summary.total} packages analyzed{" "}
            <span className="separator">/</span>{" "}
            {report.versionSource === "package-lock.json"
              ? "exact versions from package-lock.json"
              : "package.json version ranges estimated"}
          </p>
        </div>
        <ReportActions
          copied={copied}
          onDownload={onDownload}
          onShare={onShare}
        />
      </div>

      <div className="overview-grid">
        <ScoreCard report={report} />
        <SummaryMetric
          className="metric-alert"
          label="VULNERABLE"
          value={report.summary.vulnerable}
          detail={
            <>
              {report.severityCounts.critical} critical <i />{" "}
              {report.severityCounts.high} high
            </>
          }
          icon={CircleAlert}
        />
        <SummaryMetric
          className="metric-update"
          label="OUTDATED"
          value={report.summary.outdated}
          detail="packages behind latest"
          icon={ArrowUpRight}
        />
        <SummaryMetric
          className="metric-maint"
          label="UPKEEP FLAGS"
          value={report.summary.deprecated + report.summary.unmaintained}
          detail={
            <>
              {report.summary.deprecated} deprecated <i />{" "}
              {report.summary.unmaintained} abandoned
            </>
          }
          icon={Info}
        />
      </div>

      {report.summary.unknown > 0 && (
        <div className="partial-notice">
          <Info size={15} /> Security or registry details could not be loaded
          for {report.summary.unknown}{" "}
          {report.summary.unknown === 1 ? "package" : "packages"}. Those
          unresolved risks are not included in the score.
        </div>
      )}
    </>
  );
}
