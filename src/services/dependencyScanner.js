import semver from "semver";

const NPM_REGISTRY = "https://registry.npmjs.org";
const OSV_API = "https://api.osv.dev/v1/querybatch";
const CONCURRENCY = 8;
const MAX_ADVISORY_DETAILS = 40;
const advisoryDetailCache = new Map();

async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await callback(items[index]);
      }
    }),
  );

  return results;
}

function packageUrl(name) {
  return `${NPM_REGISTRY}/${name.split("/").map(encodeURIComponent).join("/")}`;
}

function getUpdateType(current, latest) {
  if (!semver.valid(current) || !semver.valid(latest)) return "unknown";
  if (semver.eq(current, latest)) return "none";

  const difference = semver.diff(current, latest);
  if (!difference) return "none";
  if (difference.includes("major")) return "major";
  if (difference.includes("minor")) return "minor";
  return "patch";
}

function getCurrentVersion(range) {
  const cleanRange = String(range).trim().replace(/^npm:/, "");
  return (
    semver.valid(cleanRange) || semver.minVersion(cleanRange)?.version || null
  );
}

function getSeverity(vulnerability) {
  const fallback = vulnerability.database_specific?.severity?.toLowerCase();
  if (["critical", "high", "moderate", "medium", "low"].includes(fallback)) {
    return fallback === "medium" ? "moderate" : fallback;
  }

  const score = Number(vulnerability.severity?.[0]?.score);
  if (Number.isFinite(score)) {
    if (score >= 9) return "critical";
    if (score >= 7) return "high";
    if (score >= 4) return "moderate";
    return "low";
  }
  return "unknown";
}

function getFixedVersion(vulnerability) {
  const affected = vulnerability.affected?.find(
    ({ package: affectedPackage }) => affectedPackage?.ecosystem === "npm",
  );
  const range = affected?.ranges?.find(({ events = [] }) =>
    events.some((event) => event.fixed),
  );
  const fixed = range?.events?.find((event) => event.fixed)?.fixed;
  return fixed || null;
}

function getMaintenanceStatus(publishDate) {
  if (!publishDate) return "unknown";
  const monthsSincePublish =
    (Date.now() - new Date(publishDate).getTime()) / 2_592_000_000;
  if (monthsSincePublish >= 24) return "abandoned";
  if (monthsSincePublish >= 12) return "stale";
  return "active";
}

export function calculateHealthScore(dependencies, severityCounts, summary) {
  const deductions =
    Math.min(severityCounts.critical * 15, 40) +
    Math.min(severityCounts.high * 8, 25) +
    severityCounts.moderate * 3 +
    severityCounts.low +
    summary.deprecated * 5 +
    summary.unmaintained * 4 +
    dependencies.filter(({ updateType }) => updateType === "major").length *
      2 +
    dependencies.filter(({ license }) => /\b(AGPL|GPL)\b/i.test(license))
      .length *
      3;

  return Math.max(0, 100 - deductions);
}

function getAdvisoryDetail(id) {
  if (!advisoryDetailCache.has(id)) {
    const detailRequest = fetch(
      `https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`,
      {
        signal: AbortSignal.timeout(8000),
      },
    )
      .then((response) => {
        if (!response.ok) throw new Error(`OSV returned ${response.status}`);
        return response.json();
      })
      .catch(() => ({ id, detailsUnavailable: true }));
    advisoryDetailCache.set(id, detailRequest);
  }
  return advisoryDetailCache.get(id);
}

export async function fetchGitHubManifest(repoUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(repoUrl);
  } catch {
    throw new Error("Enter a valid public GitHub repository URL.");
  }

  if (parsedUrl.hostname !== "github.com") {
    throw new Error("Only public github.com repository URLs are supported.");
  }

  const [owner, repository] = parsedUrl.pathname.split("/").filter(Boolean);
  if (!owner || !repository)
    throw new Error("That URL does not look like a repository.");

  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repository}`,
  );
  if (!repoResponse.ok) {
    throw new Error(
      repoResponse.status === 404
        ? "Repository not found, or it is not public."
        : `GitHub could not be reached (${repoResponse.status}).`,
    );
  }
  const repo = await repoResponse.json();
  const manifestResponse = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repository}/${encodeURIComponent(repo.default_branch)}/package.json`,
  );
  if (!manifestResponse.ok) {
    throw new Error(
      "No package.json was found at the root of this repository.",
    );
  }

  return { manifest: await manifestResponse.json(), repoName: repo.full_name };
}

export async function scanManifest(
  manifest,
  sourceName = manifest.name || "package.json",
  resolvedVersions = {},
) {
  const declarations = [
    ...Object.entries(manifest.dependencies || {}).map(([name, range]) => ({
      name,
      range,
      group: "production",
    })),
    ...Object.entries(manifest.devDependencies || {}).map(([name, range]) => ({
      name,
      range,
      group: "development",
    })),
    ...Object.entries(manifest.optionalDependencies || {}).map(
      ([name, range]) => ({ name, range, group: "optional" }),
    ),
  ];
  const uniqueDeclarations = [
    ...new Map(
      declarations.map((dependency) => [dependency.name, dependency]),
    ).values(),
  ];
  if (!uniqueDeclarations.length) {
    throw new Error(
      "No dependencies found. Add dependencies or devDependencies to package.json.",
    );
  }

  const packages = await mapWithConcurrency(
    uniqueDeclarations,
    CONCURRENCY,
    async (dependency) => {
      const currentVersion =
        semver.valid(resolvedVersions[dependency.name]) ||
        getCurrentVersion(dependency.range);
      try {
        const response = await fetch(packageUrl(dependency.name));
        if (!response.ok) throw new Error(`npm returned ${response.status}`);
        const metadata = await response.json();
        const latest = metadata["dist-tags"]?.latest || null;
        const publishDate =
          (latest && metadata.time?.[latest]) ||
          metadata.time?.modified ||
          null;
        return {
          ...dependency,
          currentVersion,
          latest,
          updateType: getUpdateType(currentVersion, latest),
          deprecated:
            metadata.versions?.[currentVersion]?.deprecated ||
            metadata.versions?.[latest]?.deprecated ||
            null,
          lastPublish: publishDate,
          license:
            typeof metadata.versions?.[latest]?.license === "string"
              ? metadata.versions[latest].license
              : metadata.versions?.[latest]?.license?.type ||
                metadata.license ||
                "Unknown",
          maintenanceStatus: getMaintenanceStatus(publishDate),
          lookupError: null,
        };
      } catch (error) {
        return {
          ...dependency,
          currentVersion,
          latest: null,
          updateType: "unknown",
          deprecated: null,
          lastPublish: null,
          license: "Unknown",
          maintenanceStatus: "unknown",
          lookupError: error.message,
        };
      }
    },
  );

  const vulnerabilities = new Map();
  const advisoryDetails = new Map();
  const resolvablePackages = packages.filter(
    ({ currentVersion }) => currentVersion,
  );
  for (let start = 0; start < resolvablePackages.length; start += 100) {
    const batch = resolvablePackages.slice(start, start + 100);
    try {
      const response = await fetch(OSV_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: batch.map(({ name, currentVersion }) => ({
            package: { name, ecosystem: "npm" },
            version: currentVersion,
          })),
        }),
      });
      if (!response.ok) throw new Error(`OSV returned ${response.status}`);
      const data = await response.json();
      const batchVulnerabilities =
        data.results?.map(({ vulns = [] }) => vulns) || [];
      const advisoryIds = [
        ...new Set(
          batchVulnerabilities.flatMap((items) => items.map(({ id }) => id)),
        ),
      ].filter((id) => id && !advisoryDetails.has(id));
      const details = await mapWithConcurrency(
        advisoryIds.slice(0, MAX_ADVISORY_DETAILS),
        CONCURRENCY,
        getAdvisoryDetail,
      );
      details.forEach((vulnerability) =>
        advisoryDetails.set(vulnerability.id, vulnerability),
      );
      advisoryIds.forEach((id) => {
        if (!advisoryDetails.has(id))
          advisoryDetails.set(id, { id, detailsUnavailable: true });
      });
      batch.forEach(({ name }, index) => {
        const results = batchVulnerabilities[index] || [];
        vulnerabilities.set(
          name,
          results.map((vulnerability) => {
            const detail =
              advisoryDetails.get(vulnerability.id) || vulnerability;
            return {
              id: detail.id,
              aliases: detail.aliases || [],
              summary:
                detail.summary ||
                detail.details?.split("\n")[0] ||
                "Advisory details unavailable",
              severity: getSeverity(detail),
              fixedIn: getFixedVersion(detail),
              detailsUnavailable: detail.detailsUnavailable || false,
            };
          }),
        );
      });
    } catch (error) {
      batch.forEach(({ name }) => vulnerabilities.set(name, null));
      console.warn("OSV vulnerability lookup failed:", error);
    }
  }

  const dependencies = packages.map((dependency) => ({
    ...dependency,
    vulnerabilities:
      vulnerabilities.get(dependency.name) ??
      (dependency.currentVersion ? [] : null),
  }));
  const summary = {
    total: dependencies.length,
    outdated: dependencies.filter(({ updateType }) =>
      ["major", "minor", "patch"].includes(updateType),
    ).length,
    vulnerable: dependencies.filter(
      ({ vulnerabilities: items }) => items?.length > 0,
    ).length,
    deprecated: dependencies.filter(({ deprecated }) => Boolean(deprecated))
      .length,
    unmaintained: dependencies.filter(
      ({ maintenanceStatus }) => maintenanceStatus === "abandoned",
    ).length,
    unknown: dependencies.filter(
      ({ lookupError, vulnerabilities: items }) =>
        lookupError ||
        items === null ||
        items?.some(
          ({ detailsUnavailable, severity }) =>
            detailsUnavailable || severity === "unknown",
        ),
    ).length,
  };

  const severityCounts = { critical: 0, high: 0, moderate: 0, low: 0 };
  dependencies.forEach(({ vulnerabilities: items }) => {
    items?.forEach(({ severity }) => {
      if (severity in severityCounts) severityCounts[severity] += 1;
    });
  });
  return {
    id: crypto.randomUUID(),
    name: sourceName,
    scannedAt: new Date().toISOString(),
    versionSource: Object.keys(resolvedVersions).length
      ? "package-lock.json"
      : "package.json",
    score: calculateHealthScore(dependencies, severityCounts, summary),
    summary,
    severityCounts,
    dependencies,
  };
}
