import { ShieldCheck } from "lucide-react";

export default function IntroSection() {
  return (
    <section id="scanner" className="intro-row">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          DEPENDENCY INTELLIGENCE
        </div>
        <h1>
          Know what your
          <br />
          <span>dependencies</span> are doing.
        </h1>
        <p className="intro-copy">
          A clear-eyed check on security, freshness, and package health. No
          account, no setup, just your manifest.
        </p>
      </div>
      <div className="intro-note">
        <span className="note-icon">
          <ShieldCheck size={18} />
        </span>
        <div>
          <strong>Independent by design</strong>
          <span>Scans run in your browser against public registries.</span>
        </div>
      </div>
    </section>
  );
}
