const DEPENDENCY_GROUPS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateDependencyGroups(source, fileName) {
  const groups = {};
  for (const group of DEPENDENCY_GROUPS) {
    if (source[group] === undefined) continue;
    if (!isRecord(source[group])) {
      throw new Error(
        `${fileName} must have dependency groups as JSON objects.`,
      );
    }

    const entries = Object.entries(source[group]);
    if (
      entries.some(
        ([name, range]) =>
          !name.trim() || typeof range !== "string" || !range.trim(),
      )
    ) {
      throw new Error(
        `${fileName} has an invalid dependency. Each package needs a name and version string.`,
      );
    }
    groups[group] = source[group];
  }
  return groups;
}

function packageLockPaths(name) {
  return [`node_modules/${name}`];
}

function getLockfileVersion(lockfile, name) {
  for (const path of packageLockPaths(name)) {
    const entry = lockfile.packages?.[path];
    const targetPath = entry?.link ? entry.resolved : null;
    const version =
      entry?.version ||
      (targetPath && lockfile.packages?.[targetPath]?.version);
    if (typeof version === "string" && version.trim()) return version;
  }
  const legacyVersion = lockfile.dependencies?.[name]?.version;
  return typeof legacyVersion === "string" && legacyVersion.trim()
    ? legacyVersion
    : null;
}

function parsePackageManifest(source) {
  const groups = validateDependencyGroups(source, "package.json");
  const dependencyCount = Object.values(groups).reduce(
    (total, group) => total + Object.keys(group).length,
    0,
  );
  if (!dependencyCount) {
    throw new Error(
      "This package.json has no dependencies. Add dependencies, devDependencies, or optionalDependencies.",
    );
  }

  return {
    manifest: {
      name:
        typeof source.name === "string" && source.name.trim()
          ? source.name
          : "package.json",
      ...groups,
    },
    resolvedVersions: {},
    fileType: "package.json",
  };
}

function parsePackageLock(source) {
  if (!Number.isInteger(source.lockfileVersion) || source.lockfileVersion < 1) {
    throw new Error(
      "This package-lock.json is missing a valid lockfileVersion.",
    );
  }
  if (!isRecord(source.packages) && !isRecord(source.dependencies)) {
    throw new Error(
      "This package-lock.json has no packages or dependencies section.",
    );
  }

  const rootPackage = isRecord(source.packages?.[""])
    ? source.packages[""]
    : {};
  let groups = validateDependencyGroups(rootPackage, "package-lock.json");
  if (!Object.keys(groups).length && isRecord(source.dependencies)) {
    groups = {
      dependencies: Object.fromEntries(
        Object.entries(source.dependencies).map(([name, entry]) => [
          name,
          entry?.version || "*",
        ]),
      ),
    };
  }
  const dependencyCount = Object.values(groups).reduce(
    (total, group) => total + Object.keys(group).length,
    0,
  );
  if (!dependencyCount) {
    throw new Error("This package-lock.json has no root dependencies to scan.");
  }

  const resolvedVersions = {};
  for (const group of Object.values(groups)) {
    for (const [name, declaredRange] of Object.entries(group)) {
      const resolvedVersion = getLockfileVersion(source, name);
      if (!resolvedVersion) {
        throw new Error(
          `The lockfile does not contain a resolved version for "${name}". Check that this is a complete npm package-lock.json.`,
        );
      }
      resolvedVersions[name] = resolvedVersion;
      if (declaredRange === "*") group[name] = resolvedVersion;
    }
  }

  return {
    manifest: {
      name:
        typeof rootPackage.name === "string" && rootPackage.name.trim()
          ? rootPackage.name
          : typeof source.name === "string" && source.name.trim()
            ? source.name
            : "package-lock.json",
      ...groups,
    },
    resolvedVersions,
    fileType: "package-lock.json",
  };
}

export function parseDependencyInput(text, fileName = "package.json") {
  let source;
  try {
    source = JSON.parse(text);
  } catch {
    throw new Error(
      "Paste only the raw JSON from package.json or package-lock.json. Do not include JavaScript code, markdown fences, or other text.",
    );
  }

  if (!isRecord(source)) {
    throw new Error(
      "The input must be a JSON object from package.json or package-lock.json.",
    );
  }

  const namedAsLockfile = /package-lock\.json$/i.test(fileName);
  const hasLockfileShape =
    Number.isInteger(source.lockfileVersion) &&
    (isRecord(source.packages) || isRecord(source.dependencies));

  if (namedAsLockfile || hasLockfileShape) return parsePackageLock(source);
  if (DEPENDENCY_GROUPS.some((group) => source[group] !== undefined))
    return parsePackageManifest(source);

  throw new Error(
    "This JSON is not a supported dependency file. Paste package.json or package-lock.json only.",
  );
}
