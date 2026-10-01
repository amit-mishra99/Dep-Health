export function severityFor(dependency) {
  const severities =
    dependency.vulnerabilities?.map(({ severity }) => severity) || [];
  return (
    ["critical", "high", "moderate", "low"].find((severity) =>
      severities.includes(severity),
    ) || null
  );
}

export function updateLabel(type) {
  if (type === "none") return "Up to date";
  if (type === "unknown") return "Unknown";
  return `${type} update`;
}

export function filterAndSortDependencies(
  dependencies,
  { filter, search, sortBy, sortDirection },
) {
  const query = search.trim().toLowerCase();
  const filtered = dependencies.filter((dependency) => {
    const matchesQuery =
      !query || dependency.name.toLowerCase().includes(query);
    const matchesFilter =
      filter === "all" ||
      (filter === "vulnerable" && dependency.vulnerabilities?.length > 0) ||
      (filter === "outdated" &&
        ["major", "minor", "patch"].includes(dependency.updateType)) ||
      (filter === "attention" &&
        (dependency.vulnerabilities?.length > 0 ||
          dependency.vulnerabilities === null ||
          dependency.vulnerabilities?.some(
            ({ detailsUnavailable, severity }) =>
              detailsUnavailable || severity === "unknown",
          ) ||
          dependency.deprecated ||
          dependency.maintenanceStatus === "abandoned" ||
          dependency.updateType === "major" ||
          dependency.lookupError));
    return matchesQuery && matchesFilter;
  });

  return filtered.sort((first, second) => {
    const firstValue =
      sortBy === "risk"
        ? ["critical", "high", "moderate", "low", null].indexOf(
            severityFor(first),
          )
        : sortBy === "current"
          ? first.currentVersion || ""
          : sortBy === "latest"
            ? first.latest || ""
            : first.name.toLowerCase();
    const secondValue =
      sortBy === "risk"
        ? ["critical", "high", "moderate", "low", null].indexOf(
            severityFor(second),
          )
        : sortBy === "current"
          ? second.currentVersion || ""
          : sortBy === "latest"
            ? second.latest || ""
            : second.name.toLowerCase();
    const comparison =
      typeof firstValue === "number"
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), undefined, {
            numeric: true,
          });
    return comparison * (sortDirection === "asc" ? 1 : -1);
  });
}
