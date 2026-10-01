import { useState } from "react";
import { createShareUrl } from "../utils/report.js";

export function useReportActions(report, setError) {
  const [copied, setCopied] = useState(false);

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dephealth-${report.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function shareReport() {
    if (!report) return;
    const shareUrl = createShareUrl(report);
    if (!shareUrl) {
      setError(
        "This report is too large for a share link. Export the JSON report instead.",
      );
      return;
    }

    window.history.replaceState(
      null,
      "",
      shareUrl.slice(window.location.origin.length),
    );
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(
        "The report link is ready in your address bar, but clipboard access was blocked.",
      );
    }
  }

  return { copied, downloadReport, shareReport };
}
