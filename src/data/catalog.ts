import congruenceAxiom from "./axioms/congruence.json";
import continuityAxiom from "./axioms/continuity.json";
import incidenceAxiom from "./axioms/incidence.json";
import orderAxiom from "./axioms/order.json";
import parallelsAxiom from "./axioms/parallels.json";
import protractorAxiom from "./axioms/protractor.json";
import sasExploration from "./axiom-explorations/sas.json";
import definitionsContent from "./definitions.json";
import transversalAnglePairsGuide from "./guides/transversal-angle-pairs.json";
import triangleCorrespondenceGuide from "./guides/triangle-correspondence.json";
import { validateCatalog } from "./catalogValidation";
import {
  theoremIds,
  theoremLearningStageDefinitions,
  type TheoremId,
} from "./theoremCurriculum";
import {
  contextIllustrationIds,
  corollaryIllustrationIds,
} from "./theoremIllustrationIds";


export type AxiomCategory = "geometry" | "measurement";

export type Definition = {
  aliases?: string[];
  definition: string;
  id: string;
  term: string;
};

export type HistoricalContext = {
  illustrationId?: string;
  paragraphs: string[];
  title: string;
};

export type GuideSection = {
  id: string;
  paragraphs: string[];
  title: string;
};

export type GuidePage = {
  definitions: Definition[];
  guideType: "Notation";
  id: string;
  illustrationId: string;
  introductionLabel: string;
  learningObjectives: string[];
  parentAxiomId: string;
  sections: GuideSection[];
  statementLatex: string;
  statusText: string;
  supplementalSections?: GuideSection[];
  summary: string;
  title: string;
  wideActivity?: boolean;
};

export type AxiomPage = {
  category: AxiomCategory;
  definitions: Definition[];
  historicalContext?: HistoricalContext;
  id: string;
  title: string;
  summary: string;
  statements: string[];
  whatItEnables: string;
};

export type AxiomExplorationPage = {
  definitions: Definition[];
  explorationPrompt: string;
  historicalContext?: HistoricalContext;
  id: string;
  parentAxiomId: string;
  readingGuideIds?: string[];
  statementLatex: string;
  summary: string;
  title: string;
  whatItEnables: string;
  whatItShows: string;
};

export type TheoremCorollary = {
  illustrationId?: string;
  proof: string;
  proofLatex?: string;
  statement: string;
  theoremLatex?: string;
  title: string;
};

export type TheoremPage = {
  corollaries?: TheoremCorollary[];
  id: string;
  title: string;
  family: string;
  historicalContext?: HistoricalContext;
  statement?: string;
  theoremLatex?: string;
  summary: string;
  proofIdea: string;
  readingGuideIds?: string[];
  dependsOn: string[];
  definitions: Definition[];
  explorationPrompt: string;
  proofSteps: Array<{
    title: string;
    detail: string;
  }>;
  relatedResults: string[];
};

export type TheoremLearningStage = {
  id: string;
  title: string;
  theorems: TheoremPage[];
};

type AxiomContent = Omit<AxiomPage, "category" | "definitions"> & {
  category: string;
  definitionIds: string[];
};

type AxiomExplorationContent = Omit<AxiomExplorationPage, "definitions"> & {
  definitionIds: string[];
};

type GuideContent = Omit<GuidePage, "definitions" | "guideType"> & {
  definitionIds: string[];
  guideType: string;
};

type TheoremContent = Omit<TheoremPage, "definitions"> & {
  definitionIds: string[];
};

const theoremModules = import.meta.glob<TheoremContent>("./theorems/*.json", {
  eager: true,
  import: "default",
});
const theoremContents = Object.values(theoremModules);

export const definitions = definitionsContent satisfies Definition[];

const definitionById = new Map(
  definitions.map((definition) => [definition.id, definition]),
);

function resolveDefinitions(definitionIds: string[]) {
  return definitionIds.map((definitionId) => {
    const definition = definitionById.get(definitionId);
    if (!definition) {
      throw new Error(`Unknown definition: ${definitionId}`);
    }
    return definition;
  });
}

function defineAxiom(axiom: AxiomContent): AxiomPage {
  if (axiom.category !== "geometry" && axiom.category !== "measurement") {
    throw new Error(`Unknown axiom category: ${axiom.category}`);
  }

  const { definitionIds, ...page } = axiom;
  return {
    ...page,
    category: axiom.category,
    definitions: resolveDefinitions(definitionIds),
  };
}

function defineAxiomExploration(
  exploration: AxiomExplorationContent,
): AxiomExplorationPage {
  const { definitionIds, ...page } = exploration;
  return { ...page, definitions: resolveDefinitions(definitionIds) };
}

function defineGuide(guide: GuideContent): GuidePage {
  if (guide.guideType !== "Notation") {
    throw new Error(`Unknown guide type: ${guide.guideType}`);
  }

  const { definitionIds, ...page } = guide;
  return {
    ...page,
    guideType: guide.guideType,
    definitions: resolveDefinitions(definitionIds),
  };
}

function defineTheorem(theorem: TheoremContent): TheoremPage {
  const { definitionIds, ...page } = theorem;
  return { ...page, definitions: resolveDefinitions(definitionIds) };
}

export const geometricAxiomCatalog: AxiomPage[] = [
  defineAxiom(incidenceAxiom),
  defineAxiom(orderAxiom),
  defineAxiom(congruenceAxiom),
  defineAxiom(parallelsAxiom),
  defineAxiom(continuityAxiom),
];

export const measurementAxiomCatalog: AxiomPage[] = [defineAxiom(protractorAxiom)];

export const axiomCatalog: AxiomPage[] = [
  ...geometricAxiomCatalog,
  ...measurementAxiomCatalog,
];

export const axiomById = new Map(axiomCatalog.map((axiom) => [axiom.id, axiom]));

export const guideCatalog: GuidePage[] = [
  defineGuide(triangleCorrespondenceGuide),
  defineGuide(transversalAnglePairsGuide),
];

export const guideById = new Map(guideCatalog.map((guide) => [guide.id, guide]));

if (guideById.size !== guideCatalog.length) {
  throw new Error("Guide ids must be unique");
}

guideCatalog.forEach((guide) => {
  if (!axiomById.has(guide.parentAxiomId)) {
    throw new Error(`Unknown parent axiom for guide ${guide.id}: ${guide.parentAxiomId}`);
  }

  const allSections = [...guide.sections, ...(guide.supplementalSections ?? [])];
  const sectionIds = new Set(allSections.map((section) => section.id));
  if (sectionIds.size !== allSections.length) {
    throw new Error(`Guide section ids must be unique within ${guide.id}`);
  }
});

export function getGuides(parentAxiomId: string) {
  return guideCatalog.filter((guide) => guide.parentAxiomId === parentAxiomId);
}

export const axiomExplorationCatalog: AxiomExplorationPage[] = [
  defineAxiomExploration(sasExploration),
];

axiomExplorationCatalog.forEach((exploration) => {
  if (!axiomById.has(exploration.parentAxiomId)) {
    throw new Error(
      `Unknown parent axiom for exploration ${exploration.id}: ${exploration.parentAxiomId}`,
    );
  }
});

export const axiomExplorationById = new Map(
  axiomExplorationCatalog.map((exploration) => [exploration.id, exploration]),
);

export const axiomExplorationByPath = new Map(
  axiomExplorationCatalog.map((exploration) => [
    `${exploration.parentAxiomId}/${exploration.id}`,
    exploration,
  ]),
);

if (
  axiomExplorationById.size !== axiomExplorationCatalog.length ||
  axiomExplorationByPath.size !== axiomExplorationCatalog.length
) {
  throw new Error("Axiom exploration ids and parent/id paths must be unique");
}

export function getAxiomExplorations(parentAxiomId: string) {
  return axiomExplorationCatalog.filter(
    (exploration) => exploration.parentAxiomId === parentAxiomId,
  );
}

function validateReadingGuideIds(ownerId: string, readingGuideIds?: string[]) {
  readingGuideIds?.forEach((guideId) => {
    if (!guideById.has(guideId)) {
      throw new Error(`Unknown reading guide for ${ownerId}: ${guideId}`);
    }
  });
}

axiomExplorationCatalog.forEach((exploration) => {
  validateReadingGuideIds(exploration.id, exploration.readingGuideIds);
});

validateCatalog({
  axioms: axiomCatalog,
  corollaryIllustrationIds,
  contextIllustrationIds,
  expectedTheoremIds: theoremIds,
  explorations: axiomExplorationCatalog,
  theorems: theoremContents,
});

const theoremContentById = new Map(
  theoremContents.map((theorem) => [theorem.id, theorem]),
);

function getTheoremContent(theoremId: TheoremId) {
  const theorem = theoremContentById.get(theoremId);
  if (!theorem) {
    throw new Error(`Missing theorem content: ${theoremId}`);
  }

  return theorem;
}

export const theoremLearningStages: TheoremLearningStage[] =
  theoremLearningStageDefinitions.map((stage) => ({
    id: stage.id,
    theorems: stage.theoremIds.map((theoremId) =>
      defineTheorem(getTheoremContent(theoremId)),
    ),
    title: stage.title,
  }));

export const theoremCatalog: TheoremPage[] = theoremLearningStages.flatMap(
  (stage) => stage.theorems,
);

export const theoremById = new Map(
  theoremCatalog.map((theorem) => [theorem.id, theorem]),
);

theoremCatalog.forEach((theorem) => {
  validateReadingGuideIds(theorem.id, theorem.readingGuideIds);
});
