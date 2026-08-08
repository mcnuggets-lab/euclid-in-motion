import {
  axiomById,
  axiomExplorationByPath,
  guideById,
  theoremById,
} from "@/data/catalog";
import {
  resolveRoute,
  type ResolvedPage,
} from "@/features/content/routeResolver";

export type { ResolvedPage } from "@/features/content/routeResolver";

export function resolvePage(path: string): ResolvedPage {
  return resolveRoute(path, {
    axiomExplorationPaths: axiomExplorationByPath,
    axiomIds: axiomById,
    guideIds: guideById,
    theoremIds: theoremById,
  });
}
