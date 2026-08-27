import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDocumentTitle,
  getPageMeta,
  siteDescription,
  siteName,
  type PageMetaEntries,
} from "../src/features/content/pageMeta.ts";

const entries: PageMetaEntries = {
  axiomById: new Map([
    ["incidence", { summary: "Incidence axiom summary.", title: "Incidence" }],
    ["order", { title: "Order" }],
  ]),
  axiomExplorationByPath: new Map([
    [
      "congruence/sas",
      { summary: "SAS exploration summary.", title: "SAS Congruence Postulate" },
    ],
  ]),
  guideById: new Map([
    [
      "triangle-correspondence",
      {
        summary: "Guide summary.",
        title: "Triangle Correspondence",
      },
    ],
  ]),
  theoremById: new Map([
    [
      "vertical-angles",
      {
        summary: "Vertical angles summary.",
        title: "Vertical Angles Theorem",
      },
    ],
  ]),
};

test("home uses the site name and default description", () => {
  assert.deepEqual(getPageMeta({ kind: "home" }, entries), {
    description: siteDescription,
    title: siteName,
  });
});

test("content pages use catalog titles and summaries", () => {
  assert.deepEqual(
    getPageMeta(
      { axiomId: "incidence", kind: "axiom-page" },
      entries,
    ),
    { description: "Incidence axiom summary.", title: "Incidence" },
  );

  assert.deepEqual(
    getPageMeta(
      { explorationPath: "congruence/sas", kind: "axiom-exploration-page" },
      entries,
    ),
    {
      description: "SAS exploration summary.",
      title: "SAS Congruence Postulate",
    },
  );

  assert.deepEqual(
    getPageMeta(
      { guideId: "triangle-correspondence", kind: "guide-page" },
      entries,
    ),
    { description: "Guide summary.", title: "Triangle Correspondence" },
  );

  assert.deepEqual(
    getPageMeta(
      { kind: "theorem-page", theoremId: "vertical-angles" },
      entries,
    ),
    {
      description: "Vertical angles summary.",
      title: "Vertical Angles Theorem",
    },
  );
});

test("index pages get curated descriptions", () => {
  const axiomIndex = getPageMeta({ kind: "axiom-index" }, entries);
  assert.equal(axiomIndex.title, "Axiom groups");
  assert.notEqual(axiomIndex.description, siteDescription);

  const theoremIndex = getPageMeta({ kind: "theorem-index" }, entries);
  assert.equal(theoremIndex.title, "Theorem explorations");
  assert.notEqual(theoremIndex.description, siteDescription);
});

test("missing catalog entries and unknown routes fall back to defaults", () => {
  assert.deepEqual(
    getPageMeta({ axiomId: "order", kind: "axiom-page" }, entries),
    { description: siteDescription, title: "Order" },
  );
  assert.deepEqual(getPageMeta({ kind: "not-found" }, entries).title, "Page not found");
});

test("document titles qualify content pages with the site name", () => {
  assert.equal(formatDocumentTitle({ description: "", title: siteName }), siteName);
  assert.equal(
    formatDocumentTitle({
      description: "",
      title: "Vertical Angles Theorem",
    }),
    "Vertical Angles Theorem | Euclid in Motion",
  );
});
