import test from "node:test";
import assert from "node:assert/strict";
import { parseDependencyInput } from "../src/services/manifestParser.js";

test("parses package.json dependency ranges", () => {
  const parsed = parseDependencyInput(
    JSON.stringify({
      name: "sample-app",
      dependencies: { react: "^18.2.0" },
      devDependencies: { vite: "^5.4.0" },
    }),
  );

  assert.equal(parsed.fileType, "package.json");
  assert.equal(parsed.manifest.name, "sample-app");
  assert.equal(parsed.manifest.dependencies.react, "^18.2.0");
  assert.deepEqual(parsed.resolvedVersions, {});
});

test("uses exact resolved versions from npm lockfile v3", () => {
  const parsed = parseDependencyInput(
    JSON.stringify({
      name: "sample-app",
      lockfileVersion: 3,
      packages: {
        "": { name: "sample-app", dependencies: { react: "^18.2.0" } },
        "node_modules/react": { version: "18.3.1" },
      },
    }),
    "package-lock.json",
  );

  assert.equal(parsed.fileType, "package-lock.json");
  assert.equal(parsed.resolvedVersions.react, "18.3.1");
  assert.equal(parsed.manifest.dependencies.react, "^18.2.0");
});

test("supports legacy npm lockfile dependencies", () => {
  const parsed = parseDependencyInput(
    JSON.stringify({
      lockfileVersion: 1,
      dependencies: { lodash: { version: "4.17.21" } },
    }),
    "package-lock.json",
  );

  assert.equal(parsed.resolvedVersions.lodash, "4.17.21");
  assert.equal(parsed.manifest.dependencies.lodash, "4.17.21");
});

test("resolves workspace link versions from the linked package entry", () => {
  const parsed = parseDependencyInput(
    JSON.stringify({
      lockfileVersion: 3,
      packages: {
        "": { dependencies: { "local-package": "workspace:*" } },
        "node_modules/local-package": {
          resolved: "packages/local-package",
          link: true,
        },
        "packages/local-package": { version: "2.1.0" },
      },
    }),
    "package-lock.json",
  );

  assert.equal(parsed.resolvedVersions["local-package"], "2.1.0");
});

test("rejects source code, prose, and unrelated JSON", () => {
  assert.throws(
    () => parseDependencyInput("const packageData = {};"),
    /Paste only the raw JSON/,
  );
  assert.throws(
    () => parseDependencyInput("Here is my package file"),
    /Paste only the raw JSON/,
  );
  assert.throws(
    () => parseDependencyInput(JSON.stringify({ name: "unrelated" })),
    /not a supported dependency file/,
  );
});

test("rejects malformed or incomplete dependency files", () => {
  assert.throws(
    () => parseDependencyInput(JSON.stringify({ dependencies: { react: 18 } })),
    /version string/,
  );
  assert.throws(
    () =>
      parseDependencyInput(
        JSON.stringify({
          lockfileVersion: 3,
          packages: { "": { dependencies: { react: "^18.2.0" } } },
        }),
        "package-lock.json",
      ),
    /does not contain a resolved version/,
  );
});
