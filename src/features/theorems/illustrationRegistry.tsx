import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import type { TheoremId } from "@/data/theoremCurriculum";
import type {
  ContextIllustrationId,
  CorollaryIllustrationId,
} from "@/data/theoremIllustrationIds";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

export type TheoremIllustrationComponentProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type LazyTheoremIllustration = LazyExoticComponent<
  ComponentType<TheoremIllustrationComponentProps>
>;

type LazyStaticIllustration = LazyExoticComponent<ComponentType>;

export const theoremIllustrationRegistry = {
  "aas-congruence": lazy(() =>
    import("./illustrations/AASCongruenceIllustration").then(
      ({ AASCongruenceIllustration }) => ({ default: AASCongruenceIllustration }),
    ),
  ),
  "alternate-interior-angles": lazy(() =>
    import("./illustrations/AlternateInteriorAnglesIllustration").then(
      ({ AlternateInteriorAnglesIllustration }) => ({
        default: AlternateInteriorAnglesIllustration,
      }),
    ),
  ),
  "alternate-interior-converse": lazy(() =>
    import("./illustrations/AlternateInteriorConverseIllustration").then(
      ({ AlternateInteriorConverseIllustration }) => ({
        default: AlternateInteriorConverseIllustration,
      }),
    ),
  ),
  "angle-addition": lazy(() =>
    import("./illustrations/AngleAdditionIllustration").then(
      ({ AngleAdditionIllustration }) => ({ default: AngleAdditionIllustration }),
    ),
  ),
  "angle-bisector-existence": lazy(() =>
    import("./illustrations/AngleBisectorExistenceIllustration").then(
      ({ AngleBisectorExistenceIllustration }) => ({
        default: AngleBisectorExistenceIllustration,
      }),
    ),
  ),
  "angles-around-point": lazy(() =>
    import("./illustrations/AnglesAroundPointIllustration").then(
      ({ AnglesAroundPointIllustration }) => ({
        default: AnglesAroundPointIllustration,
      }),
    ),
  ),
  "asa-congruence": lazy(() =>
    import("./illustrations/ASACongruenceIllustration").then(
      ({ ASACongruenceIllustration }) => ({ default: ASACongruenceIllustration }),
    ),
  ),
  "corresponding-angles": lazy(() =>
    import("./illustrations/CorrespondingAnglesIllustration").then(
      ({ CorrespondingAnglesIllustration }) => ({
        default: CorrespondingAnglesIllustration,
      }),
    ),
  ),
  "convex-polygon-angle-sum": lazy(() =>
    import("./illustrations/ConvexPolygonAngleSumIllustration").then(
      ({ ConvexPolygonAngleSumIllustration }) => ({
        default: ConvexPolygonAngleSumIllustration,
      }),
    ),
  ),
  crossbar: lazy(() =>
    import("./illustrations/CrossbarIllustration").then(
      ({ CrossbarIllustration }) => ({ default: CrossbarIllustration }),
    ),
  ),
  "exterior-angle-inequality": lazy(() =>
    import("./illustrations/ExteriorAngleInequalityIllustration").then(
      ({ ExteriorAngleInequalityIllustration }) => ({
        default: ExteriorAngleInequalityIllustration,
      }),
    ),
  ),
  "hinge-theorem": lazy(() =>
    import("./illustrations/HingeTheoremIllustration").then(
      ({ HingeTheoremIllustration }) => ({ default: HingeTheoremIllustration }),
    ),
  ),
  "isosceles-base-angles": lazy(() =>
    import("./illustrations/IsoscelesBaseAnglesIllustration").then(
      ({ IsoscelesBaseAnglesIllustration }) => ({
        default: IsoscelesBaseAnglesIllustration,
      }),
    ),
  ),
  "isosceles-point-construction": lazy(() =>
    import("./illustrations/IsoscelesPointConstructionIllustration").then(
      ({ IsoscelesPointConstructionIllustration }) => ({
        default: IsoscelesPointConstructionIllustration,
      }),
    ),
  ),
  "linear-pair": lazy(() =>
    import("./illustrations/LinearPairIllustration").then(
      ({ LinearPairIllustration }) => ({ default: LinearPairIllustration }),
    ),
  ),
  "midpoint-existence": lazy(() =>
    import("./illustrations/MidpointExistenceIllustration").then(
      ({ MidpointExistenceIllustration }) => ({
        default: MidpointExistenceIllustration,
      }),
    ),
  ),
  "rhs-congruence": lazy(() =>
    import("./illustrations/RHSCongruenceIllustration").then(
      ({ RHSCongruenceIllustration }) => ({ default: RHSCongruenceIllustration }),
    ),
  ),
  "same-side-interior-supplementary": lazy(() =>
    import("./illustrations/SameSideInteriorSupplementaryIllustration").then(
      ({ SameSideInteriorSupplementaryIllustration }) => ({
        default: SameSideInteriorSupplementaryIllustration,
      }),
    ),
  ),
  "segment-angle-comparison": lazy(() =>
    import("./illustrations/SegmentAngleComparisonIllustration").then(
      ({ SegmentAngleComparisonIllustration }) => ({
        default: SegmentAngleComparisonIllustration,
      }),
    ),
  ),
  "sss-congruence": lazy(() =>
    import("./illustrations/SSSCongruenceIllustration").then(
      ({ SSSCongruenceIllustration }) => ({ default: SSSCongruenceIllustration }),
    ),
  ),
  "triangle-angle-sum": lazy(() =>
    import("./illustrations/TriangleAngleSumIllustration").then(
      ({ TriangleAngleSumIllustration }) => ({
        default: TriangleAngleSumIllustration,
      }),
    ),
  ),
  "triangle-inequality": lazy(() =>
    import("./illustrations/TriangleInequalityIllustration").then(
      ({ TriangleInequalityIllustration }) => ({
        default: TriangleInequalityIllustration,
      }),
    ),
  ),
  "triangle-side-angle-order": lazy(() =>
    import("./illustrations/TriangleSideAngleOrderIllustration").then(
      ({ TriangleSideAngleOrderIllustration }) => ({
        default: TriangleSideAngleOrderIllustration,
      }),
    ),
  ),
  "vertical-angles": lazy(() =>
    import("./illustrations/VerticalAnglesIllustration").then(
      ({ VerticalAnglesIllustration }) => ({ default: VerticalAnglesIllustration }),
    ),
  ),
} satisfies Record<TheoremId, LazyTheoremIllustration>;

export const corollaryIllustrationRegistry = {
  "convex-polygon-exterior-angle-sum": lazy(() =>
    import("./illustrations/ConvexPolygonAngleSumIllustration").then(
      ({ ConvexPolygonExteriorAngleSumCorollaryIllustration }) => ({
        default: ConvexPolygonExteriorAngleSumCorollaryIllustration,
      }),
    ),
  ),
  "congruent-linear-pair": lazy(() =>
    import("./illustrations/CongruentLinearPairCorollaryIllustration").then(
      ({ CongruentLinearPairCorollaryIllustration }) => ({
        default: CongruentLinearPairCorollaryIllustration,
      }),
    ),
  ),
  "corresponding-angles-converse": lazy(() =>
    import("./illustrations/AlternateInteriorConverseCorollaryIllustrations").then(
      ({ CorrespondingAnglesConverseCorollaryIllustration }) => ({
        default: CorrespondingAnglesConverseCorollaryIllustration,
      }),
    ),
  ),
  "hinge-converse": lazy(() =>
    import("./illustrations/HingeTheoremIllustration").then(
      ({ HingeConverseCorollaryIllustration }) => ({
        default: HingeConverseCorollaryIllustration,
      }),
    ),
  ),
  "isosceles-base-angles-converse": lazy(() =>
    import("./illustrations/ASACongruenceIllustration").then(
      ({ IsoscelesBaseAnglesConverseIllustration }) => ({
        default: IsoscelesBaseAnglesConverseIllustration,
      }),
    ),
  ),
  "linear-pair-partition": lazy(() =>
    import("./illustrations/LinearPairCorollaryIllustration").then(
      ({ LinearPairCorollaryIllustration }) => ({
        default: LinearPairCorollaryIllustration,
      }),
    ),
  ),
  "median-existence": lazy(() =>
    import("./illustrations/MedianExistenceCorollaryIllustration").then(
      ({ MedianExistenceCorollaryIllustration }) => ({
        default: MedianExistenceCorollaryIllustration,
      }),
    ),
  ),
  "same-side-interior-converse": lazy(() =>
    import("./illustrations/AlternateInteriorConverseCorollaryIllustrations").then(
      ({ SameSideInteriorConverseCorollaryIllustration }) => ({
        default: SameSideInteriorConverseCorollaryIllustration,
      }),
    ),
  ),
  "triangle-exterior-angle-sum": lazy(() =>
    import("./illustrations/TriangleAngleSumCorollaryIllustrations").then(
      ({ TriangleExteriorAngleSumCorollaryIllustration }) => ({
        default: TriangleExteriorAngleSumCorollaryIllustration,
      }),
    ),
  ),
  "triangle-third-angle": lazy(() =>
    import("./illustrations/TriangleAngleSumCorollaryIllustrations").then(
      ({ TriangleThirdAngleCorollaryIllustration }) => ({
        default: TriangleThirdAngleCorollaryIllustration,
      }),
    ),
  ),
} satisfies Record<CorollaryIllustrationId, LazyStaticIllustration>;

export const contextIllustrationRegistry = {
  "rhs-ssa-ambiguity": lazy(() =>
    import("./illustrations/RHSCongruenceIllustration").then(
      ({ RHSSSAAmbiguityIllustration }) => ({
        default: RHSSSAAmbiguityIllustration,
      }),
    ),
  ),
} satisfies Record<ContextIllustrationId, LazyStaticIllustration>;
