import test from "node:test";
import assert from "node:assert/strict";
import { calculateHealthScore } from "../src/services/dependencyScanner.js";

const noSeverities = { critical: 0, high: 0, moderate: 0, low: 0 };
const noOtherDeductions = { deprecated: 0, unmaintained: 0 };

test("clean reports receive a full score", () => {
  assert.equal(calculateHealthScore([], noSeverities, noOtherDeductions), 100);
});

test("risk deductions are additive and are not averaged across packages", () => {
  const dependencies = [
    { updateType: "major", license: "MIT" },
    { updateType: "none", license: "MIT" },
    { updateType: "none", license: "MIT" },
    { updateType: "none", license: "MIT" },
  ];

  assert.equal(
    calculateHealthScore(
      dependencies,
      { ...noSeverities, high: 1 },
      noOtherDeductions,
    ),
    90,
  );
});

test("severity caps and maintenance deductions match the report formula", () => {
  const dependencies = [{ updateType: "none", license: "GPL-3.0" }];

  assert.equal(
    calculateHealthScore(
      dependencies,
      { critical: 3, high: 4, moderate: 2, low: 1 },
      { deprecated: 1, unmaintained: 1 },
    ),
    16,
  );
});

test("the score cannot fall below zero", () => {
  assert.equal(
    calculateHealthScore(
      [{ updateType: "major", license: "AGPL-3.0" }],
      { critical: 10, high: 10, moderate: 10, low: 10 },
      { deprecated: 10, unmaintained: 10 },
    ),
    0,
  );
});
