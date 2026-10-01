import { ArrowDownToLine, Check, ExternalLink } from "lucide-react";

export default function ReportActions({ copied, onDownload, onShare }) {
  return (
    <div className="report-actions">
      <button className="secondary-button" type="button" onClick={onDownload}>
        <ArrowDownToLine size={15} /> Export JSON
      </button>
      <button
        className="secondary-button share-button"
        type="button"
        onClick={onShare}
      >
        {copied ? <Check size={15} /> : <ExternalLink size={15} />}
        {copied ? "Link copied" : "Share report"}
      </button>
    </div>
  );
}
