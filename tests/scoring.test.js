import test from "node:test";
import assert from "node:assert/strict";
import { calculateHealthScore } from "../src/services/dependencyScanner.js";

test("clean dependency reports receive a full score", () => {
  const dependencies = [{ updateType: "none" }, { updateType: "none" }];

  assert.equal(
    calculateHealthScore(dependencies, {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    }),
    100,
  );
});

test("risk deductions produce intermediate package-normalized scores", () => {
  const dependencies = [
    { updateType: "major" },
    { updateType: "none" },
    { updateType: "none" },
    { updateType: "none" },
  ];

  assert.equal(
    calculateHealthScore(dependencies, {
      critical: 0,
      high: 1,
      moderate: 0,
      low: 0,
    }),
    97.5,
  );
});

test("severe risk deductions cannot lower the score below zero", () => {
  const dependencies = [{ updateType: "major", deprecated: "yes" }];

  assert.equal(
    calculateHealthScore(dependencies, {
      critical: 20,
      high: 20,
      moderate: 20,
      low: 20,
    }),
    0,
  );
});
