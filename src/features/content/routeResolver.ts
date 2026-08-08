type IdLookup = {
  has(id: string): boolean;
};

export type RouteCatalog = {
  axiomExplorationPaths: IdLookup;
  axiomIds: IdLookup;
  guideIds: IdLookup;
  theoremIds: IdLookup;
};

export type ResolvedPage =
  | { kind: "home" }
  | { kind: "axiom-index" }
  | { axiomId: string; kind: "axiom-page" }
  | { explorationPath: string; kind: "axiom-exploration-page" }
  | { guideId: string; kind: "guide-page" }
  | { kind: "theorem-index" }
  | { kind: "theorem-page"; theoremId: string }
  | { kind: "not-found" };

export function resolveRoute(
  path: string,
  catalog: RouteCatalog,
): ResolvedPage {
  if (path === "/") {
    return { kind: "home" };
  }

  if (path === "/axioms") {
    return { kind: "axiom-index" };
  }

  if (path.startsWith("/axioms/")) {
    const axiomPath = path.slice("/axioms/".length);
    const pathParts = axiomPath.split("/");

    if (pathParts.length === 1 && catalog.axiomIds.has(axiomPath)) {
      return { axiomId: axiomPath, kind: "axiom-page" };
    }

    if (
      pathParts.length === 2 &&
      catalog.axiomExplorationPaths.has(axiomPath)
    ) {
      return { explorationPath: axiomPath, kind: "axiom-exploration-page" };
    }

    return { kind: "not-found" };
  }

  if (path === "/theorems") {
    return { kind: "theorem-index" };
  }

  if (path.startsWith("/guides/")) {
    const guideId = path.slice("/guides/".length);
    return catalog.guideIds.has(guideId)
      ? { guideId, kind: "guide-page" }
      : { kind: "not-found" };
  }

  if (path.startsWith("/theorems/")) {
    const theoremId = path.slice("/theorems/".length);
    return catalog.theoremIds.has(theoremId)
      ? { kind: "theorem-page", theoremId }
      : { kind: "not-found" };
  }

  return { kind: "not-found" };
}
