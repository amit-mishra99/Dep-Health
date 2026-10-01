import {
  ArrowRight,
  CircleAlert,
  ExternalLink,
  FileJson2,
  GitBranch,
  Info,
  LoaderCircle,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { exampleManifest } from "../constants/exampleManifest.js";

export default function ScanSourcePanel({
  sourceType,
  setSourceType,
  manifestText,
  setManifestText,
  repoUrl,
  setRepoUrl,
  isScanning,
  scanMessage,
  error,
  onErrorDismiss,
  onScan,
  onUpload,
  uploadRef,
}) {
  return (
    <form className="source-panel" onSubmit={onScan}>
      <div className="panel-heading">
        <div>
          <span className="section-index">01</span>
          <h2>Choose a source</h2>
        </div>
        <span className="secure-label">
          <ShieldCheck size={14} /> Private by default
        </span>
      </div>
      <div className="source-tabs" role="tablist" aria-label="Scan source">
        <button
          type="button"
          role="tab"
          aria-selected={sourceType === "manifest"}
          className={sourceType === "manifest" ? "selected" : ""}
          onClick={() => setSourceType("manifest")}
        >
          <FileJson2 size={16} /> package.json
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sourceType === "repository"}
          className={sourceType === "repository" ? "selected" : ""}
          onClick={() => setSourceType("repository")}
        >
          <GitBranch size={16} /> GitHub repo
        </button>
      </div>

      {sourceType === "manifest" ? (
        <div className="manifest-input-wrap">
          <div className="editor-bar">
            <span className="editor-dot" />
            <span>Package file</span>
            <span className="editor-language">JSON</span>
          </div>
          <textarea
            className="manifest-input"
            aria-label="package.json or package-lock.json contents"
            spellCheck="false"
            value={manifestText}
            onChange={(event) => setManifestText(event.target.value)}
            placeholder="Paste raw JSON from package.json or package-lock.json..."
          />
          <p className="paste-guidance">
            Paste raw JSON only. JavaScript, markdown, and other files are
            rejected.
          </p>
          <div className="input-actions">
            <input
              ref={uploadRef}
              type="file"
              accept="package.json,package-lock.json,.json,application/json"
              className="visually-hidden"
              onChange={onUpload}
            />
            <button
              className="text-action"
              type="button"
              onClick={() => uploadRef.current?.click()}
            >
              <Upload size={14} /> Upload package file
            </button>
            <button
              className="text-action"
              type="button"
              onClick={() => setManifestText(exampleManifest)}
            >
              Load example
            </button>
          </div>
        </div>
      ) : (
        <div className="repo-input-wrap">
          <label htmlFor="repo-url">Public GitHub repository</label>
          <div className="repo-field">
            <GitBranch size={17} />
            <input
              id="repo-url"
              type="url"
              placeholder="https://github.com/owner/repository"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              required
            />
            <ExternalLink size={15} />
          </div>
          <p>
            We’ll read the root <code>package.json</code> from the repository’s
            default branch.
          </p>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <CircleAlert size={16} />
          {error}
          <button
            type="button"
            className="dismiss-error"
            aria-label="Dismiss error"
            onClick={onErrorDismiss}
          >
            ×
          </button>
        </div>
      )}
      <div className="submit-row">
        <span className="submit-hint">
          <Info size={14} /> No files are stored on a server
        </span>
        <button
          className="scan-button"
          type="submit"
          disabled={
            isScanning || (sourceType === "repository" && !repoUrl.trim())
          }
        >
          {isScanning ? (
            <>
              <LoaderCircle className="spin" size={16} /> Scanning
            </>
          ) : (
            <>
              Scan dependencies <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
      {isScanning && (
        <div className="scan-progress" role="status">
          <span className="progress-track">
            <span />
          </span>
          {scanMessage}
        </div>
      )}
    </form>
  );
}
