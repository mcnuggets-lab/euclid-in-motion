export const theoremLearningStageDefinitions = [
  {
    id: "phase-1-foundations",
    theoremIds: [
      "linear-pair",
      "angles-around-point",
      "vertical-angles",
      "angle-addition",
      "segment-angle-comparison",
      "crossbar",
    ],
    title: "Foundations",
  },
  {
    id: "phase-1-triangles",
    theoremIds: [
      "isosceles-base-angles",
      "angle-bisector-existence",
      "isosceles-point-construction",
      "midpoint-existence",
      "exterior-angle-inequality",
    ],
    title: "Triangles",
  },
  {
    id: "phase-2-parallel-lines",
    theoremIds: [
      "alternate-interior-converse",
      "alternate-interior-angles",
      "corresponding-angles",
      "same-side-interior-supplementary",
    ],
    title: "Parallel Lines",
  },
  {
    id: "phase-3-angle-sums",
    theoremIds: ["triangle-angle-sum", "convex-polygon-angle-sum"],
    title: "Angle Sums",
  },
  {
    id: "phase-4-triangle-comparison",
    theoremIds: [
      "triangle-side-angle-order",
      "triangle-inequality",
      "hinge-theorem",
    ],
    title: "Triangle Comparison",
  },
  {
    id: "phase-5-triangle-congruence",
    theoremIds: [
      "sss-congruence",
      "asa-congruence",
      "aas-congruence",
      "rhs-congruence",
    ],
    title: "Triangle Congruence",
  },
] as const;

type TheoremLearningStageDefinition =
  (typeof theoremLearningStageDefinitions)[number];

export type TheoremId = TheoremLearningStageDefinition["theoremIds"][number];

export const theoremIds = theoremLearningStageDefinitions.flatMap(
  (stage) => [...stage.theoremIds],
) as TheoremId[];

const theoremIdSet = new Set<string>(theoremIds);

export function requireTheoremId(id: string): TheoremId {
  if (!theoremIdSet.has(id)) {
    throw new Error(`Unknown theorem illustration: ${id}`);
  }

  return id as TheoremId;
}
