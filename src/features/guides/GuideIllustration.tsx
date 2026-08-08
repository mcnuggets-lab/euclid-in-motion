import { TriangleCorrespondenceIllustration } from "@/features/guides/illustrations/TriangleCorrespondenceIllustration";
import { TransversalAnglePairsIllustration } from "@/features/guides/illustrations/TransversalAnglePairsIllustration";


export function GuideIllustration({ illustrationId }: { illustrationId: string }) {
  switch (illustrationId) {
    case "transversal-angle-pairs":
      return <TransversalAnglePairsIllustration />;
    case "triangle-correspondence":
      return <TriangleCorrespondenceIllustration />;
    default:
      return null;
  }
}
