import assert from "node:assert/strict";
import test from "node:test";

import { resolveRoute } from "../src/features/content/routeResolver.ts";

const routeCatalog = {
  axiomExplorationPaths: new Set(["congruence/sas"]),
  axiomIds: new Set(["incidence", "congruence"]),
  guideIds: new Set(["triangle-correspondence"]),
  theoremIds: new Set(["angle-addition"]),
};

test("resolves every supported page shape", () => {
  assert.deepEqual(resolveRoute("/", routeCatalog), { kind: "home" });
  assert.deepEqual(resolveRoute("/axioms", routeCatalog), {
    kind: "axiom-index",
  });
  assert.deepEqual(resolveRoute("/axioms/incidence", routeCatalog), {
    axiomId: "incidence",
    kind: "axiom-page",
  });
  assert.deepEqual(resolveRoute("/axioms/congruence/sas", routeCatalog), {
    explorationPath: "congruence/sas",
    kind: "axiom-exploration-page",
  });
  assert.deepEqual(resolveRoute("/guides/triangle-correspondence", routeCatalog), {
    guideId: "triangle-correspondence",
    kind: "guide-page",
  });
  assert.deepEqual(resolveRoute("/theorems", routeCatalog), {
    kind: "theorem-index",
  });
  assert.deepEqual(resolveRoute("/theorems/angle-addition", routeCatalog), {
    kind: "theorem-page",
    theoremId: "angle-addition",
  });
});

test("rejects unknown and malformed routes", () => {
  for (const path of [
    "/missing",
    "/axioms/missing",
    "/axioms/incidence/extra",
    "/guides/missing",
    "/theorems/missing",
  ]) {
    assert.deepEqual(resolveRoute(path, routeCatalog), { kind: "not-found" });
  }
});
