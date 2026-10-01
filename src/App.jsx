import { useRef } from "react";
import AppFooter from "./components/AppFooter.jsx";
import AppHeader from "./components/AppHeader.jsx";
import EmptyReport from "./components/EmptyReport.jsx";
import HealthSignals from "./components/HealthSignals.jsx";
import IntroSection from "./components/IntroSection.jsx";
import ReportSection from "./components/ReportSection.jsx";
import ScanSourcePanel from "./components/ScanSourcePanel.jsx";
import ScoringMethod from "./components/ScoringMethod.jsx";
import { useDependencyScan } from "./hooks/useDependencyScan.js";
import { useReportActions } from "./hooks/useReportActions.js";
import "./App.css";

function App() {
  const uploadRef = useRef(null);
  const scanSession = useDependencyScan();
  const reportActions = useReportActions(
    scanSession.report,
    scanSession.setError,
  );

  return (
    <div className="app-shell">
      <AppHeader />
      <main id="top" className="main-content">
        <IntroSection />
        <section className="scan-layout" aria-label="Start a dependency scan">
          <ScanSourcePanel
            sourceType={scanSession.sourceType}
            setSourceType={scanSession.setSourceType}
            manifestText={scanSession.manifestText}
            setManifestText={scanSession.setManifestText}
            repoUrl={scanSession.repoUrl}
            setRepoUrl={scanSession.setRepoUrl}
            isScanning={scanSession.isScanning}
            scanMessage={scanSession.scanMessage}
            error={scanSession.error}
            onErrorDismiss={() => scanSession.setError("")}
            onScan={scanSession.scan}
            onUpload={scanSession.uploadManifest}
            uploadRef={uploadRef}
          />
          <HealthSignals />
        </section>
        {scanSession.report ? (
          <ReportSection report={scanSession.report} {...reportActions} />
        ) : (
          <EmptyReport />
        )}
        <ScoringMethod />
        <AppFooter />
      </main>
    </div>
  );
}

export default App;
