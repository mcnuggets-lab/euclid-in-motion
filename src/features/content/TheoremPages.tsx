import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DefinitionText } from "@/components/DefinitionText";
import { InlineMathText } from "@/components/InlineMathText";
import { MathBlock } from "@/components/MathBlock";
import {
  axiomById,
  axiomExplorationById,
  theoremById,
  theoremCatalog,
  theoremLearningStages,
} from "@/data/catalog";
import {
  CatalogCard,
  handleInternalLink,
  PageSequenceNavigation,
  ReadingGuideCards,
  type Navigate,
} from "@/features/content/ContentPrimitives";
import { toHref } from "@/utils/baseUrl";
import type { TheoremDiscovery } from "@/features/theorems/discovery";
import {
  TheoremCorollaryIllustration,
  TheoremContextIllustration,
  TheoremIllustration,
  TheoremStepNavigation,
} from "@/features/theorems/TheoremIllustration";

function resolveDependency(dependencyId: string) {
  const axiom = axiomById.get(dependencyId);
  if (axiom) {
    return { path: `/axioms/${axiom.id}`, title: axiom.title };
  }

  const axiomExploration = axiomExplorationById.get(dependencyId);
  if (axiomExploration) {
    return {
      path: `/axioms/${axiomExploration.parentAxiomId}/${axiomExploration.id}`,
      title: axiomExploration.title,
    };
  }

  const theorem = theoremById.get(dependencyId);
  if (theorem) {
    return { path: `/theorems/${theorem.id}`, title: theorem.title };
  }

  throw new Error(`Unknown theorem dependency: ${dependencyId}`);
}

export function TheoremIndexPage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="panel content-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Theorems</span>
          <h1 data-page-heading tabIndex={-1}>
            Theorem explorations
          </h1>
        </div>
      </div>

      <div className="content-body catalog-groups">
        {theoremLearningStages.map((stage) => (
          <section className="catalog-group" id={stage.id} key={stage.id}>
            <div className="catalog-group__header">
              <span className="eyebrow">Topic</span>
              <h2>{stage.title}</h2>
            </div>
            <div className="content-grid">
              {stage.theorems.map((theorem) => (
                <CatalogCard
                  key={theorem.id}
                  onNavigate={onNavigate}
                  path={`/theorems/${theorem.id}`}
                  summary={theorem.summary}
                  title={theorem.title}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function TheoremPage({
  activeStep,
  discovery,
  onDiscoveryChange,
  onNavigate,
  onStepChange,
  theoremId,
}: {
  activeStep: number | null;
  discovery: TheoremDiscovery | null;
  onDiscoveryChange: (discovery: TheoremDiscovery | null) => void;
  onNavigate: Navigate;
  onStepChange: (step: number | null) => void;
  theoremId: string;
}) {
  const theorem = theoremById.get(theoremId);
  if (!theorem) {
    return null;
  }

  const dependencies = theorem.dependsOn.map(resolveDependency);
  const theoremIndex = theoremCatalog.findIndex(({ id }) => id === theorem.id);
  const previousTheorem = theoremCatalog[theoremIndex - 1];
  const nextTheorem = theoremCatalog[theoremIndex + 1];

  return (
    <section className="panel content-panel">
      <div className="panel__header">
        <div>
          <nav aria-label="Breadcrumb" className="breadcrumbs">
            <a
              href={toHref("/theorems")}
              onClick={(event) =>
                handleInternalLink(event, "/theorems", onNavigate)
              }
            >
              Theorems
            </a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{theorem.title}</span>
          </nav>
          <span className="eyebrow">Theorem</span>
          <h1 data-page-heading tabIndex={-1}>
            {theorem.title}
          </h1>
        </div>
      </div>

      <div className="content-body theorem-page__layout">
        <div className="content-block theorem-statement">
          <div className="theorem-statement__main">
            <span className="eyebrow">Theorem statement</span>
            <strong>{theorem.title}</strong>
            <p className="lead">
              <DefinitionText
                definitions={theorem.definitions}
                text={theorem.summary}
              />
            </p>
            {theorem.statement ? (
              <div className="theorem-statement__inline">
                {theorem.statement.split("\n\n").map((line) => (
                  <p key={line}>
                    <InlineMathText definitions={theorem.definitions} text={line} />
                  </p>
                ))}
              </div>
            ) : null}
            {theorem.theoremLatex ? (
              <MathBlock expression={theorem.theoremLatex} />
            ) : null}
          </div>

          <aside className="theorem-statement__dependencies">
            <span className="eyebrow">Built from</span>
            <div className="dependency-list">
              {dependencies.map((dependency) => (
                <a
                  className="dependency-link"
                  href={toHref(dependency.path)}
                  key={dependency.path}
                  onClick={(event) =>
                    handleInternalLink(event, dependency.path, onNavigate)
                  }
                >
                  {dependency.title}
                </a>
              ))}
            </div>
          </aside>
        </div>

        <div className="theorem-page__secondary">
          <div className="content-block">
            <TheoremIllustration
              activeStep={activeStep}
              onDiscoveryChange={onDiscoveryChange}
              theorem={theorem}
            />
          </div>
        </div>

        <div className="theorem-page__primary">
          <ReadingGuideCards
            guideIds={theorem.readingGuideIds}
            onNavigate={onNavigate}
          />
          <TheoremStepNavigation
            activeStep={activeStep}
            discovery={discovery}
            onStepChange={onStepChange}
            theorem={theorem}
          />

          <CollapsibleSection title="Proof idea">
            <p>
              <InlineMathText
                definitions={theorem.definitions}
                text={theorem.proofIdea}
              />
            </p>
          </CollapsibleSection>

          <CollapsibleSection title="Proof outline">
            <ol className="number-list">
              {theorem.proofSteps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <p>
                    <InlineMathText
                      definitions={theorem.definitions}
                      text={step.detail}
                    />
                  </p>
                </li>
              ))}
            </ol>
          </CollapsibleSection>

          {theorem.corollaries?.map((corollary) => (
            <CollapsibleSection
              defaultOpen={false}
              key={corollary.title}
              title={corollary.title}
            >
              <p>
                <InlineMathText
                  definitions={theorem.definitions}
                  text={corollary.statement}
                />
              </p>
              <TheoremCorollaryIllustration
                illustrationId={corollary.illustrationId}
              />
              {corollary.theoremLatex ? (
                <MathBlock expression={corollary.theoremLatex} />
              ) : null}
              <strong>Proof</strong>
              <p>
                <InlineMathText
                  definitions={theorem.definitions}
                  text={corollary.proof}
                />
              </p>
              {corollary.proofLatex ? (
                <MathBlock expression={corollary.proofLatex} />
              ) : null}
            </CollapsibleSection>
          ))}

          {theorem.historicalContext ? (
            <CollapsibleSection
              defaultOpen={false}
              title={theorem.historicalContext.title}
            >
              <TheoremContextIllustration
                illustrationId={theorem.historicalContext.illustrationId}
              />
              {theorem.historicalContext.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </CollapsibleSection>
          ) : null}
        </div>
      </div>

      <PageSequenceNavigation
        collection={{ path: "/theorems", title: "all theorems" }}
        itemLabel="Theorem"
        next={
          nextTheorem
            ? { path: `/theorems/${nextTheorem.id}`, title: nextTheorem.title }
            : undefined
        }
        onNavigate={onNavigate}
        previous={
          previousTheorem
            ? {
                path: `/theorems/${previousTheorem.id}`,
                title: previousTheorem.title,
              }
            : undefined
        }
      />
    </section>
  );
}
