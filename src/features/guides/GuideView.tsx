import type { MouseEvent } from "react";

import { DefinitionText } from "@/components/DefinitionText";
import { MathBlock } from "@/components/MathBlock";
import { axiomById, type GuidePage } from "@/data/catalog";
import { GuideIllustration } from "@/features/guides/GuideIllustration";
import { toHref } from "@/utils/baseUrl";


function handleGuideLink(
  event: MouseEvent<HTMLAnchorElement>,
  path: string,
  onNavigate: (path: string) => void,
) {
  if (
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }

  event.preventDefault();
  onNavigate(path);
}

export function GuideView({
  guide,
  onNavigate,
}: {
  guide: GuidePage;
  onNavigate: (path: string) => void;
}) {
  const parentAxiom = axiomById.get(guide.parentAxiomId);
  const layoutClassName = guide.wideActivity
    ? "content-body guide-page__layout guide-page__layout--wide-activity"
    : "content-body guide-page__layout";

  return (
    <section className="panel content-panel">
      <div className="panel__header">
        <div>
          <nav aria-label="Breadcrumb" className="breadcrumbs">
            <a
              href={toHref(`/axioms/${guide.parentAxiomId}`)}
              onClick={(event) =>
                handleGuideLink(
                  event,
                  `/axioms/${guide.parentAxiomId}`,
                  onNavigate,
                )
              }
            >
              {parentAxiom?.title ?? "Axiom"}
            </a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{guide.title}</span>
          </nav>
          <span className="eyebrow">{guide.guideType} guide</span>
          <h1 data-page-heading tabIndex={-1}>
            {guide.title}
          </h1>
        </div>
      </div>

      <div className={layoutClassName}>
        <div className="content-block guide-page__introduction">
          <div>
            <span className="eyebrow">{guide.introductionLabel}</span>
            <p className="lead">
              <DefinitionText definitions={guide.definitions} text={guide.summary} />
            </p>
          </div>
          <MathBlock expression={guide.statementLatex} />
          <p className="guide-page__status">
            <strong>Reading skill:</strong> {guide.statusText}
          </p>
        </div>

        <div className="guide-page__secondary">
          <GuideIllustration illustrationId={guide.illustrationId} />
        </div>

        <div className="guide-page__primary">
          <section className="content-block">
            <span className="eyebrow">Learning objectives</span>
            <strong>After this guide, you can</strong>
            <ol className="number-list">
              {guide.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ol>
          </section>

          {guide.sections.map((section) => (
            <section className="content-block guide-section" id={section.id} key={section.id}>
              <span className="eyebrow">Reading guide</span>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>
                  <DefinitionText definitions={guide.definitions} text={paragraph} />
                </p>
              ))}
            </section>
          ))}

          {guide.supplementalSections?.map((section) => (
            <section
              className="content-block guide-section guide-section--future"
              id={section.id}
              key={section.id}
            >
              <span className="eyebrow">Later extension</span>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>
                  <DefinitionText definitions={guide.definitions} text={paragraph} />
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
