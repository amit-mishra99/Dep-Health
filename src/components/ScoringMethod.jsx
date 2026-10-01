export default function ScoringMethod() {
  return (
    <section id="method" className="method-section">
      <div className="method-heading">
        <div className="eyebrow">
          <span className="eyebrow-line" />A SCORE YOU CAN EXPLAIN
        </div>
        <h2>
          Clear signals.
          <br />
          <span>No mystery math.</span>
        </h2>
      </div>
      <div className="method-content">
        <p>
          Every report starts at 100. We deduct for known risk and avoidable
          maintenance friction. A clean package does not earn extra points just
          for being popular.
        </p>
        <div className="deduction-list">
          <div>
            <span>Critical vulnerability</span>
            <strong>
              −15 <small>each, max −40</small>
            </strong>
          </div>
          <div>
            <span>High vulnerability</span>
            <strong>
              −8 <small>each, max −25</small>
            </strong>
          </div>
          <div>
            <span>Moderate / low vulnerability</span>
            <strong>−3 / −1</strong>
          </div>
          <div>
            <span>Deprecated / abandoned</span>
            <strong>
              −5 / −4 <small>each</small>
            </strong>
          </div>
          <div>
            <span>Major update / GPL license</span>
            <strong>
              −2 / −3 <small>each</small>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
