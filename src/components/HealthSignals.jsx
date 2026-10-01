import { Sparkles } from "lucide-react";

export default function HealthSignals() {
  return (
    <aside className="signal-panel">
      <div className="signal-top">
        <span className="section-index">02</span>
        <span className="signal-caption">WHAT WE CHECK</span>
      </div>
      <h2>
        Health is more
        <br />
        than a version number.
      </h2>
      <ul className="signal-list">
        <li>
          <span className="signal-number">01</span>
          <span>
            <strong>Known vulnerabilities</strong>
            <small>OSV.dev advisory database</small>
          </span>
          <span className="signal-state security">SECURITY</span>
        </li>
        <li>
          <span className="signal-number">02</span>
          <span>
            <strong>Release freshness</strong>
            <small>npm publish history & latest</small>
          </span>
          <span className="signal-state updates">UPDATES</span>
        </li>
        <li>
          <span className="signal-number">03</span>
          <span>
            <strong>Maintenance & licensing</strong>
            <small>Stale, abandoned, copyleft</small>
          </span>
          <span className="signal-state upkeep">UPKEEP</span>
        </li>
      </ul>
      <p className="signal-footnote">
        <Sparkles size={14} /> Results include a transparent, explainable score.
      </p>
    </aside>
  );
}
