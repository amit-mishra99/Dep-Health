import DependencyTable from "./DependencyTable.jsx";
import ReportOverview from "./ReportOverview.jsx";

export default function ReportSection({ report, copied, onDownload, onShare }) {
  return (
    <section className="report-section" aria-label="Dependency scan report">
      <ReportOverview
        report={report}
        copied={copied}
        onDownload={onDownload}
        onShare={onShare}
      />
      <DependencyTable key={report.id} report={report} />
    </section>
  );
}
