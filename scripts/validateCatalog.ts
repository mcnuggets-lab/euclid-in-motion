import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { validateCatalog } from "../src/data/catalogValidation.ts";
import {
  contextIllustrationIds,
  corollaryIllustrationIds,
} from "../src/data/theoremIllustrationIds.ts";
import { theoremIds } from "../src/data/theoremCurriculum.ts";

type CatalogEntry = {
  id: string;
};

type TheoremEntry = CatalogEntry & {
  corollaries?: Array<{
    illustrationId?: string;
    title: string;
  }>;
  dependsOn: string[];
  historicalContext?: {
    illustrationId?: string;
  };
  proofSteps?: Array<{
    title: string;
  }>;
};

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

function readJsonDirectory<Entry>(directory: string): Entry[] {
  const absoluteDirectory = resolve(projectRoot, directory);
  return readdirSync(absoluteDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) =>
      JSON.parse(readFileSync(resolve(absoluteDirectory, fileName), "utf8")),
    );
}

validateCatalog({
  axioms: readJsonDirectory<CatalogEntry>("src/data/axioms"),
  corollaryIllustrationIds,
  contextIllustrationIds,
  expectedTheoremIds: theoremIds,
  explorations: readJsonDirectory<CatalogEntry>("src/data/axiom-explorations"),
  theorems: readJsonDirectory<TheoremEntry>("src/data/theorems"),
});

console.log("Catalog validation passed.");
