import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownAZ,
  Check,
  ChevronDown,
  CircleAlert,
  Info,
  Search,
} from "lucide-react";
import { dependencyFilters } from "../constants/dependencyFilters.js";
import {
  filterAndSortDependencies,
  severityFor,
  updateLabel,
} from "../utils/dependencies.js";
import { formatDate, shortVersion } from "../utils/report.js";

export default function DependencyTable({ report }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const searchRef = useRef(null);

  useEffect(() => {
    const focusSearch = (event) => {
      const target = event.target;
      if (
        event.key !== "/" ||
        (target instanceof HTMLElement && target.isContentEditable) ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )
        return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const visibleDependencies = useMemo(
    () =>
      filterAndSortDependencies(report.dependencies, {
        filter,
        search,
        sortBy,
        sortDirection,
      }),
    [filter, report.dependencies, search, sortBy, sortDirection],
  );

  function toggleSort(column) {
    if (sortBy === column)
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortDirection("asc");
    }
  }

  return (
    <>
      <div className="dependency-toolbar">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            DEPENDENCY INVENTORY
          </div>
          <h3>
            Packages
            <span>{report.summary.total}</span>
          </h3>
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a package"
            aria-label="Search dependencies"
          />
          <kbd>/</kbd>
        </label>
      </div>
      <div className="table-controls">
        <div
          className="filter-tabs"
          role="tablist"
          aria-label="Filter dependencies"
        >
          {dependencyFilters.map((option) => (
            <button
              type="button"
              role="tab"
              aria-selected={filter === option.id}
              className={filter === option.id ? "active" : ""}
              key={option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
              {option.id === "vulnerable" && (
                <span>{report.summary.vulnerable}</span>
              )}
            </button>
          ))}
        </div>
        <div className="sort-note">
          <ArrowDownAZ size={15} /> Select a column to sort
        </div>
      </div>
      <div className="table-scroll">
        <table className="dependency-table">
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => toggleSort("name")}>
                  PACKAGE{" "}
                  <ChevronDown
                    className={sortBy === "name" ? "sort-active" : ""}
                    size={13}
                  />
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort("current")}>
                  DECLARED{" "}
                  <ChevronDown
                    className={sortBy === "current" ? "sort-active" : ""}
                    size={13}
                  />
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort("latest")}>
                  LATEST{" "}
                  <ChevronDown
                    className={sortBy === "latest" ? "sort-active" : ""}
                    size={13}
                  />
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort("risk")}>
                  HEALTH SIGNALS{" "}
                  <ChevronDown
                    className={sortBy === "risk" ? "sort-active" : ""}
                    size={13}
                  />
                </button>
              </th>
              <th>LAST PUBLISHED</th>
              <th>LICENSE</th>
            </tr>
          </thead>
          <tbody>
            {visibleDependencies.map((dependency) => {
              const severity = severityFor(dependency);
              const unknownAdvisoryCount =
                dependency.vulnerabilities?.filter(
                  ({ severity: itemSeverity }) => itemSeverity === "unknown",
                ).length || 0;
              return (
                <tr key={dependency.name}>
                  <td>
                    <div className="package-name">
                      <span
                        className={`package-icon ${dependency.name.startsWith("@") ? "scoped" : ""}`}
                      >
                        {dependency.name.startsWith("@")
                          ? "@"
                          : dependency.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <strong>{dependency.name}</strong>
                        <small>{dependency.group}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="version-code">{dependency.range}</span>
                    {dependency.currentVersion &&
                      dependency.currentVersion !== dependency.range && (
                        <small className="resolved-version">
                          {report.versionSource === "package-lock.json"
                            ? "locked"
                            : "estimated"}{" "}
                          {shortVersion(dependency.currentVersion)}
                        </small>
                      )}
                  </td>
                  <td>
                    <span className="version-code latest-version">
                      {shortVersion(dependency.latest)}
                    </span>
                    {dependency.updateType !== "none" &&
                      dependency.updateType !== "unknown" && (
                        <small
                          className={`update-label ${dependency.updateType}`}
                        >
                          {updateLabel(dependency.updateType)}
                        </small>
                      )}
                  </td>
                  <td>
                    <div className="health-signals">
                      {dependency.lookupError && (
                        <span
                          className="signal-chip unknown-chip"
                          title={dependency.lookupError}
                        >
                          <Info size={12} /> Lookup failed
                        </span>
                      )}
                      {dependency.vulnerabilities === null &&
                        !dependency.lookupError && (
                          <span className="signal-chip unknown-chip">
                            <Info size={12} /> Advisory check unavailable
                          </span>
                        )}
                      {severity && (
                        <span className={`signal-chip severity-${severity}`}>
                          <CircleAlert size={12} />{" "}
                          {dependency.vulnerabilities.length} {severity}
                        </span>
                      )}
                      {unknownAdvisoryCount > 0 && (
                        <span className="signal-chip unknown-chip">
                          <Info size={12} /> {unknownAdvisoryCount} advisory{" "}
                          {unknownAdvisoryCount === 1
                            ? "severity"
                            : "severities"}{" "}
                          unknown
                        </span>
                      )}
                      {dependency.vulnerabilities
                        ?.slice(0, 2)
                        .map((vulnerability) => (
                          <span
                            className="vuln-detail"
                            key={vulnerability.id}
                            title={vulnerability.summary}
                          >
                            {vulnerability.id}
                            {vulnerability.fixedIn && (
                              <span>fix {vulnerability.fixedIn}</span>
                            )}
                          </span>
                        ))}
                      {dependency.vulnerabilities?.length > 2 && (
                        <span className="vuln-detail">
                          +{dependency.vulnerabilities.length - 2} more
                        </span>
                      )}
                      {dependency.deprecated && (
                        <span className="signal-chip deprecated-chip">
                          Deprecated
                        </span>
                      )}
                      {dependency.maintenanceStatus === "abandoned" && (
                        <span className="signal-chip abandoned-chip">
                          Abandoned
                        </span>
                      )}
                      {dependency.maintenanceStatus === "stale" && (
                        <span className="signal-chip stale-chip">Stale</span>
                      )}
                      {dependency.updateType === "major" && (
                        <span className="signal-chip major-chip">
                          Major behind
                        </span>
                      )}
                      {!severity &&
                        !unknownAdvisoryCount &&
                        dependency.vulnerabilities?.length === 0 &&
                        !dependency.lookupError &&
                        !dependency.deprecated &&
                        dependency.maintenanceStatus !== "abandoned" &&
                        dependency.updateType !== "major" && (
                          <span className="signal-clean">
                            <Check size={13} /> No critical flags
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="publish-date">
                    {formatDate(dependency.lastPublish)}
                  </td>
                  <td>
                    <span
                      className={`license-label ${/\b(AGPL|GPL)\b/i.test(dependency.license) 
                        ? "license-copyleft" : ""}`}
                    >
                      {dependency.license}
                    </span>
                  </td>
                </tr>
              );
            })}
            {visibleDependencies.length === 0 && (
              <tr>
                <td className="empty-table" colSpan="6">
                  No packages match this view. Try another filter or search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          Showing {visibleDependencies.length} of {report.summary.total}{" "}
          dependencies
        </span>
        <span>
          Sources: npm registry <i /> OSV.dev
        </span>
      </div>
    </>
  );
}
