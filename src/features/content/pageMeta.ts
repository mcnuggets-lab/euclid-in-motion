import type { ResolvedPage } from "@/features/content/routeResolver";

export const siteName = "Euclid in Motion";

export const siteDescription =
  "Explore Euclidean axioms and discover geometry theorems through interactive figures.";

type MetaEntry = {
  summary?: string;
  title: string;
};

export type PageMetaEntries = {
  axiomById: Map<string, MetaEntry>;
  axiomExplorationByPath: Map<string, MetaEntry>;
  guideById: Map<string, MetaEntry>;
  theoremById: Map<string, MetaEntry>;
};

export type PageMeta = {
  description: string;
  title: string;
};

const indexPageDescriptions = {
  "axiom-index":
    "The five Hilbert-style axiom groups and a Birkhoff-inspired degrees supplement that ground every proof on this site.",
  "theorem-index":
    "Browse Euclidean geometry theorems by learning stage, from angle basics through triangle congruence.",
  "not-found":
    "The page you requested could not be found on Euclid in Motion.",
} as const;

function metaFor(entry: MetaEntry | undefined): PageMeta {
  if (!entry) {
    return { description: siteDescription, title: siteName };
  }

  return {
    description: entry.summary || siteDescription,
    title: entry.title,
  };
}

/**
 * Pure mapping from a resolved route to page metadata. Kept free of React,
 * the DOM, and JSON-backed catalog imports so it can run under `node --test`.
 */
export function getPageMeta(
  page: ResolvedPage,
  entries: PageMetaEntries,
): PageMeta {
  switch (page.kind) {
    case "home":
      return { description: siteDescription, title: siteName };
    case "axiom-index":
      return {
        description: indexPageDescriptions["axiom-index"],
        title: "Axiom groups",
      };
    case "axiom-page":
      return metaFor(entries.axiomById.get(page.axiomId));
    case "axiom-exploration-page":
      return metaFor(entries.axiomExplorationByPath.get(page.explorationPath));
    case "guide-page":
      return metaFor(entries.guideById.get(page.guideId));
    case "theorem-index":
      return {
        description: indexPageDescriptions["theorem-index"],
        title: "Theorem explorations",
      };
    case "theorem-page":
      return metaFor(entries.theoremById.get(page.theoremId));
    case "not-found":
      return {
        description: indexPageDescriptions["not-found"],
        title: "Page not found",
      };
  }
}

export function formatDocumentTitle(meta: PageMeta): string {
  if (meta.title === siteName) {
    return siteName;
  }

  return `${meta.title} | ${siteName}`;
}
