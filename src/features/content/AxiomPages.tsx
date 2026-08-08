import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DefinitionText } from "@/components/DefinitionText";
import { MathBlock } from "@/components/MathBlock";
import {
  axiomCatalog,
  axiomById,
  axiomExplorationByPath,
  geometricAxiomCatalog,
  getAxiomExplorations,
  getGuides,
  measurementAxiomCatalog,
} from "@/data/catalog";
import { AxiomExplorationIllustration } from "@/features/axioms/AxiomExplorationIllustration";
import { AxiomIllustration } from "@/features/axioms/AxiomIllustration";
import {
  CatalogCard,
  handleInternalLink,
  PageSequenceNavigation,
  ReadingGuideCards,
  type Navigate,
} from "@/features/content/ContentPrimitives";
import { toHref } from "@/utils/baseUrl";

export function AxiomIndexPage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="panel content-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Axioms</span>
          <h1 data-page-heading tabIndex={-1}>
            Axiom groups
          </h1>
        </div>
      </div>

      <div className="content-body">
        <div className="content-block">
          <p className="lead">
            Five Hilbert-inspired axiom groups describe incidence, order,
            congruence, parallels, and continuity. A separate Birkhoff-style
            supplement introduces angle sizes in degrees.
          </p>
        </div>

        <CollapsibleSection
          anchorId="about-axiom-system"
          defaultOpen={false}
          title="About this axiom system"
        >
          <p>
            This is a modernized planar system, not a transcription of either
            Hilbert’s or Birkhoff’s full axiomatic system. Its main choices are:
          </p>
          <ul className="bullet-list">
            <li>
              The incidence and congruence groups closely follow Hilbert’s planar
              structure, with equivalence properties stated explicitly.
            </li>
            <li>
              Plane separation is used as a modern order axiom; Hilbert instead
              takes Pasch’s triangle-crossing principle as primitive.
            </li>
            <li>
              Line–circle and circle–circle continuity supply only the intersections
              needed for elementary constructions. They are weaker than Hilbert’s
              Archimedean and completeness axioms.
            </li>
            <li>
              Playfair’s parallel principle is stated directly as existence and
              uniqueness of a parallel through an external point.
            </li>
            <li>
              The degrees supplement borrows Birkhoff’s protractor idea only. The
              rest of the system keeps synthetic segment and angle congruence rather
              than adopting Birkhoff’s full metric foundation.
            </li>
          </ul>
          <p>
            The historical notes on the individual axiom pages explain these
            choices in more detail.
          </p>
        </CollapsibleSection>

        <div className="catalog-groups">
          <section className="catalog-group">
            <div className="catalog-group__header">
              <span className="eyebrow">Geometry</span>
              <h2>Hilbert-style axiom groups</h2>
            </div>
            <div className="content-grid">
              {geometricAxiomCatalog.map((axiom) => (
                <CatalogCard
                  key={axiom.id}
                  onNavigate={onNavigate}
                  path={`/axioms/${axiom.id}`}
                  summary={axiom.summary}
                  title={axiom.title}
                />
              ))}
            </div>
          </section>

          <section className="catalog-group">
            <div className="catalog-group__header">
              <span className="eyebrow">Degrees supplement</span>
              <h2>Birkhoff-style angle sizes</h2>
            </div>
            <div className="content-grid">
              {measurementAxiomCatalog.map((axiom) => (
                <CatalogCard
                  key={axiom.id}
                  onNavigate={onNavigate}
                  path={`/axioms/${axiom.id}`}
                  summary={axiom.summary}
                  title={axiom.title}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export function AxiomPage({
  axiomId,
  onNavigate,
}: {
  axiomId: string;
  onNavigate: Navigate;
}) {
  const axiom = axiomById.get(axiomId);
  if (!axiom) {
    return null;
  }

  const explorations = getAxiomExplorations(axiom.id);
  const guides = getGuides(axiom.id);
  const axiomIndex = axiomCatalog.findIndex(({ id }) => id === axiom.id);
  const previousAxiom = axiomCatalog[axiomIndex - 1];
  const nextAxiom = axiomCatalog[axiomIndex + 1];

  return (
    <section className="panel content-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">
            {axiom.category === "measurement" ? "Degrees supplement" : "Axiom group"}
          </span>
          <h1 data-page-heading tabIndex={-1}>
            {axiom.title}
          </h1>
        </div>
      </div>

      <div className="content-body axiom-page__layout">
        <div className="content-block axiom-statement">
          <span className="eyebrow">Axiom statements</span>
          <strong>{axiom.title}</strong>
          <p className="lead">
            <DefinitionText definitions={axiom.definitions} text={axiom.summary} />
          </p>
          <ol className="number-list">
            {axiom.statements.map((statement) => (
              <li key={statement}>
                <DefinitionText
                  definitions={axiom.definitions}
                  text={statement}
                />
              </li>
            ))}
          </ol>
        </div>

        <div className="axiom-page__secondary">
          <AxiomIllustration axiom={axiom} />
        </div>

        <div className="axiom-page__primary">
          <CollapsibleSection title="What this lets you do">
            <p>
              <DefinitionText
                definitions={axiom.definitions}
                text={axiom.whatItEnables}
              />
            </p>
          </CollapsibleSection>
          {guides.length > 0 ? (
            <div className="content-block reading-guide-links">
              <span className="eyebrow">Reading guides</span>
              <strong>Learn the notation before using it in later results</strong>
              {guides.map((guide) => (
                <CatalogCard
                  key={guide.id}
                  onNavigate={onNavigate}
                  path={`/guides/${guide.id}`}
                  summary={guide.summary}
                  title={guide.title}
                />
              ))}
            </div>
          ) : null}
          {explorations.length > 0 ? (
            <div className="content-block axiom-exploration-links">
              <span className="eyebrow">Axiom explorations</span>
              <strong>Explore one statement in depth</strong>
              {explorations.map((exploration) => (
                <CatalogCard
                  key={exploration.id}
                  onNavigate={onNavigate}
                  path={`/axioms/${exploration.parentAxiomId}/${exploration.id}`}
                  summary={exploration.summary}
                  title={exploration.title}
                />
              ))}
            </div>
          ) : null}
          {axiom.historicalContext ? (
            <CollapsibleSection
              defaultOpen={false}
              title={axiom.historicalContext.title}
            >
              {axiom.historicalContext.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </CollapsibleSection>
          ) : null}
        </div>
      </div>

      <PageSequenceNavigation
        collection={{ path: "/axioms", title: "all axioms" }}
        itemLabel="Axiom"
        next={
          nextAxiom
            ? { path: `/axioms/${nextAxiom.id}`, title: nextAxiom.title }
            : undefined
        }
        onNavigate={onNavigate}
        previous={
          previousAxiom
            ? { path: `/axioms/${previousAxiom.id}`, title: previousAxiom.title }
            : undefined
        }
      />
    </section>
  );
}

export function AxiomExplorationPage({
  explorationPath,
  onNavigate,
}: {
  explorationPath: string;
  onNavigate: Navigate;
}) {
  const exploration = axiomExplorationByPath.get(explorationPath);
  if (!exploration) {
    return null;
  }

  const parentAxiom = axiomById.get(exploration.parentAxiomId);
  if (!parentAxiom) {
    return null;
  }

  return (
    <section className="panel content-panel">
      <div className="panel__header">
        <div>
          <nav aria-label="Breadcrumb" className="breadcrumbs">
            <a
              href={toHref("/axioms")}
              onClick={(event) => handleInternalLink(event, "/axioms", onNavigate)}
            >
              Axioms
            </a>
            <span aria-hidden="true">/</span>
            <a
              href={toHref(`/axioms/${parentAxiom.id}`)}
              onClick={(event) =>
                handleInternalLink(event, `/axioms/${parentAxiom.id}`, onNavigate)
              }
            >
              {parentAxiom.title}
            </a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{exploration.title}</span>
          </nav>
          <span className="eyebrow">Axiom exploration</span>
          <h1 data-page-heading tabIndex={-1}>
            {exploration.title}
          </h1>
        </div>
      </div>

      <div className="content-body axiom-page__layout">
        <div className="content-block axiom-statement">
          <span className="eyebrow">Postulate statement</span>
          <strong>{exploration.title}</strong>
          <p className="lead">
            <DefinitionText
              definitions={exploration.definitions}
              text={exploration.summary}
            />
          </p>
          <MathBlock expression={exploration.statementLatex} />
          <p className="axiom-exploration__status">
            <strong>Logical status:</strong> this statement is assumed as part of the
            congruence axioms. The interactive illustrates its meaning; it does not
            prove the postulate.
          </p>
        </div>

        <div className="axiom-page__secondary">
          <AxiomExplorationIllustration exploration={exploration} />
        </div>

        <div className="axiom-page__primary">
          <ReadingGuideCards
            guideIds={exploration.readingGuideIds}
            onNavigate={onNavigate}
          />
          <CollapsibleSection title="What the figure explores">
            <p>
              <DefinitionText
                definitions={exploration.definitions}
                text={exploration.whatItShows}
              />
            </p>
          </CollapsibleSection>
          <CollapsibleSection title="What this lets you do">
            <p>
              <DefinitionText
                definitions={exploration.definitions}
                text={exploration.whatItEnables}
              />
            </p>
          </CollapsibleSection>
          {exploration.historicalContext ? (
            <CollapsibleSection
              defaultOpen={false}
              title={exploration.historicalContext.title}
            >
              {exploration.historicalContext.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </CollapsibleSection>
          ) : null}
        </div>
      </div>
    </section>
  );
}
