export const corollaryIllustrationIds = [
  "convex-polygon-exterior-angle-sum",
  "hinge-converse",
  "corresponding-angles-converse",
  "same-side-interior-converse",
  "triangle-exterior-angle-sum",
  "triangle-third-angle",
  "congruent-linear-pair",
  "linear-pair-partition",
  "median-existence",
  "isosceles-base-angles-converse",
] as const;

export const contextIllustrationIds = ["rhs-ssa-ambiguity"] as const;

export type CorollaryIllustrationId =
  (typeof corollaryIllustrationIds)[number];
export type ContextIllustrationId = (typeof contextIllustrationIds)[number];

function requireIllustrationId<IllustrationId extends string>(
  id: string,
  registeredIds: readonly IllustrationId[],
  kind: string,
): IllustrationId {
  if (!new Set<string>(registeredIds).has(id)) {
    throw new Error(`Unknown ${kind} illustration: ${id}`);
  }

  return id as IllustrationId;
}

export function requireCorollaryIllustrationId(
  id: string,
): CorollaryIllustrationId {
  return requireIllustrationId(id, corollaryIllustrationIds, "corollary");
}

export function requireContextIllustrationId(
  id: string,
): ContextIllustrationId {
  return requireIllustrationId(id, contextIllustrationIds, "context");
}
