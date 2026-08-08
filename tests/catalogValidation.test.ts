import assert from "node:assert/strict";
import test from "node:test";

import { validateCatalog } from "../src/data/catalogValidation.ts";

const validCatalog = {
  axioms: [{ id: "incidence" }],
  corollaryIllustrationIds: ["sample-corollary"],
  contextIllustrationIds: ["sample-context"],
  expectedTheoremIds: ["sample-theorem"],
  explorations: [{ id: "sas" }],
  theorems: [
    {
      corollaries: [{ illustrationId: "sample-corollary", title: "Corollary" }],
      dependsOn: ["incidence", "sas"],
      historicalContext: { illustrationId: "sample-context" },
      id: "sample-theorem",
      proofSteps: [{ title: "Use the earlier result" }],
    },
  ],
};

test("accepts a catalog whose references and illustrations resolve", () => {
  assert.doesNotThrow(() => validateCatalog(validCatalog));
});

test("rejects duplicate theorem ids", () => {
  assert.throws(
    () =>
      validateCatalog({
        ...validCatalog,
        theorems: [...validCatalog.theorems, validCatalog.theorems[0]],
      }),
    /Duplicate theorem id: sample-theorem/,
  );
});

test("rejects unknown theorem dependencies", () => {
  assert.throws(
    () =>
      validateCatalog({
        ...validCatalog,
        theorems: [{ ...validCatalog.theorems[0], dependsOn: ["missing"] }],
      }),
    /Unknown dependency for sample-theorem: missing/,
  );
});

test("rejects unregistered illustration ids", () => {
  assert.throws(
    () =>
      validateCatalog({
        ...validCatalog,
        theorems: [
          {
            ...validCatalog.theorems[0],
            corollaries: [{ illustrationId: "missing-corollary", title: "Corollary" }],
            historicalContext: { illustrationId: "missing-context" },
          },
        ],
      }),
    /Unknown corollary illustration for sample-theorem\/Corollary: missing-corollary[\s\S]*Unknown context illustration for sample-theorem: missing-context/,
  );
});

test("rejects theorem content missing from the curriculum manifest", () => {
  assert.throws(
    () =>
      validateCatalog({
        ...validCatalog,
        theorems: [...validCatalog.theorems, { dependsOn: [], id: "unlisted" }],
      }),
    /Theorem is not in the curriculum manifest: unlisted/,
  );
});

test("rejects LaTeX markup in proof-step titles", () => {
  assert.throws(
    () =>
      validateCatalog({
        ...validCatalog,
        theorems: [
          {
            ...validCatalog.theorems[0],
            proofSteps: [{ title: "Construct \\(AB\\)" }],
          },
        ],
      }),
    /Proof-step title must be plain text for sample-theorem/,
  );
});
