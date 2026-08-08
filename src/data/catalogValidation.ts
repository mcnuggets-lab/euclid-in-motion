type CatalogEntry = {
  id: string;
};

type TheoremEntry = CatalogEntry & {
  corollaries?: readonly {
    illustrationId?: string;
    title: string;
  }[];
  dependsOn: readonly string[];
  historicalContext?: {
    illustrationId?: string;
  };
  proofSteps?: readonly {
    title: string;
  }[];
};

export type CatalogValidationInput = {
  axioms: readonly CatalogEntry[];
  corollaryIllustrationIds: readonly string[];
  contextIllustrationIds: readonly string[];
  expectedTheoremIds: readonly string[];
  explorations: readonly CatalogEntry[];
  theorems: readonly TheoremEntry[];
};

function duplicateIds(ids: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  ids.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  });

  return duplicates;
}

export function validateCatalog({
  axioms,
  corollaryIllustrationIds,
  contextIllustrationIds,
  expectedTheoremIds,
  explorations,
  theorems,
}: CatalogValidationInput) {
  const errors: string[] = [];
  const theoremIds = theorems.map((theorem) => theorem.id);

  duplicateIds(theoremIds).forEach((id) => {
    errors.push(`Duplicate theorem id: ${id}`);
  });
  duplicateIds(expectedTheoremIds).forEach((id) => {
    errors.push(`Duplicate theorem id in curriculum manifest: ${id}`);
  });

  const expectedTheoremIdSet = new Set(expectedTheoremIds);
  const theoremIdSet = new Set(theoremIds);
  theoremIds.forEach((id) => {
    if (!expectedTheoremIdSet.has(id)) {
      errors.push(`Theorem is not in the curriculum manifest: ${id}`);
    }
  });
  expectedTheoremIds.forEach((id) => {
    if (!theoremIdSet.has(id)) {
      errors.push(`Curriculum theorem has no content: ${id}`);
    }
  });

  const dependencyIds = [
    ...axioms.map((axiom) => axiom.id),
    ...explorations.map((exploration) => exploration.id),
    ...theoremIds,
  ];
  duplicateIds(dependencyIds).forEach((id) => {
    errors.push(`Ambiguous dependency target id: ${id}`);
  });
  const dependencyIdSet = new Set(dependencyIds);
  const corollaryIllustrationIdSet = new Set(corollaryIllustrationIds);
  const contextIllustrationIdSet = new Set(contextIllustrationIds);

  theorems.forEach((theorem) => {
    theorem.proofSteps?.forEach((step) => {
      if (step.title.includes("\\")) {
        errors.push(
          `Proof-step title must be plain text for ${theorem.id}: ${step.title}`,
        );
      }
    });

    theorem.dependsOn.forEach((dependencyId) => {
      if (!dependencyIdSet.has(dependencyId)) {
        errors.push(`Unknown dependency for ${theorem.id}: ${dependencyId}`);
      }
    });

    theorem.corollaries?.forEach((corollary) => {
      if (
        corollary.illustrationId &&
        !corollaryIllustrationIdSet.has(corollary.illustrationId)
      ) {
        errors.push(
          `Unknown corollary illustration for ${theorem.id}/${corollary.title}: ${corollary.illustrationId}`,
        );
      }
    });

    const contextIllustrationId = theorem.historicalContext?.illustrationId;
    if (
      contextIllustrationId &&
      !contextIllustrationIdSet.has(contextIllustrationId)
    ) {
      errors.push(
        `Unknown context illustration for ${theorem.id}: ${contextIllustrationId}`,
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(`Invalid catalog:\n- ${errors.join("\n- ")}`);
  }
}
