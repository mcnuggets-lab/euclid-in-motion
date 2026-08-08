import assert from "node:assert/strict";
import test from "node:test";

import { findDefinitionMatches } from "../src/components/definitionMatching.ts";

const lineDefinition = {
  definition: "A line extends indefinitely in both directions.",
  id: "line",
  term: "line",
};

test("does not match a definition inside another word", () => {
  assert.deepEqual(findDefinitionMatches([lineDefinition], "baseline"), []);
});

test("prefers the longest definition when terms start together", () => {
  const linearPairDefinition = {
    definition: "Two adjacent angles whose outer sides are opposite rays.",
    id: "linear-pair",
    term: "linear pair",
  };

  const matches = findDefinitionMatches(
    [lineDefinition, linearPairDefinition],
    "Form a linear pair.",
  );

  assert.deepEqual(
    matches.map(({ end, id, start }) => ({ end, id, start })),
    [{ end: 18, id: "linear-pair", start: 7 }],
  );
});

test("continues to a later whole-word occurrence", () => {
  const matches = findDefinitionMatches(
    [lineDefinition],
    "A linear pair contains a line.",
  );

  assert.deepEqual(
    matches.map(({ end, id, start }) => ({ end, id, start })),
    [{ end: 29, id: "line", start: 25 }],
  );
});
