import { theoremLearningStages } from "@/data/catalog";
import {
  handleInternalLink,
  type Navigate,
} from "@/features/content/ContentPrimitives";
import { toHref } from "@/utils/baseUrl";

const theoremTopicDescriptions: Record<string, string> = {
  "phase-1-foundations": "Angles, equality, and separation",
  "phase-1-triangles": "Constructions and basic triangle results",
  "phase-2-parallel-lines": "Angle relationships across transversals",
  "phase-3-angle-sums": "How triangle sums extend to convex polygons",
  "phase-4-triangle-comparison": "How sides and angles control one another",
  "phase-5-triangle-congruence": "When partial data determine a triangle",
};

export function HomePage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="panel content-panel start-here">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Start here</span>
          <h1 data-page-heading tabIndex={-1}>
            Build geometry from first principles
          </h1>
        </div>
      </div>

      <div className="content-body start-here__layout">
        <div className="content-block start-here__introduction">
          <p className="lead">
            This site develops Euclidean geometry from five Hilbert-inspired axiom
            groups. A separate Birkhoff-style supplement introduces angle sizes in
            degrees. Definitions, axioms, and previously proved results then support
            each new theorem.
          </p>
          <p className="start-here__principle">
            <strong>Keep the roles distinct:</strong> a diagram can suggest a
            relationship, but only the proof establishes it.
          </p>
          <a
            className="start-here__axiom-note-link"
            href={toHref("/axioms#about-axiom-system")}
            onClick={(event) =>
              handleInternalLink(
                event,
                "/axioms#about-axiom-system",
                onNavigate,
              )
            }
          >
            How this axiom system differs from Hilbert’s and Birkhoff’s →
          </a>
        </div>

        <section className="start-here__section" aria-labelledby="start-here-method">
          <div className="start-here__section-heading">
            <span className="eyebrow">How to use the site</span>
            <h2 id="start-here-method">Explore, conjecture, prove</h2>
          </div>
          <ol className="start-here__steps">
            <li>
              <span className="start-here__step-number">1</span>
              <div>
                <strong>Explore</strong>
                <p>Drag the figure and notice what changes and what stays fixed.</p>
              </div>
            </li>
            <li>
              <span className="start-here__step-number">2</span>
              <div>
                <strong>Conjecture</strong>
                <p>Separate the given information from the relationship you expect.</p>
              </div>
            </li>
            <li>
              <span className="start-here__step-number">3</span>
              <div>
                <strong>Prove</strong>
                <p>Follow the guided steps and check every dependency used.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="start-here__section" aria-labelledby="start-here-routes">
          <div className="start-here__section-heading">
            <span className="eyebrow">Choose a route</span>
            <h2 id="start-here-routes">Where would you like to begin?</h2>
          </div>
          <div className="start-here__routes">
            <a
              className="summary-card summary-card--link start-here__route"
              href={toHref("/axioms/incidence")}
              onClick={(event) =>
                handleInternalLink(event, "/axioms/incidence", onNavigate)
              }
            >
              <span className="eyebrow">Formal route</span>
              <strong>Begin with Incidence</strong>
              <p>
                Start from points and lines, then continue through the axiom groups.
              </p>
              <span className="start-here__route-action">Open Incidence →</span>
            </a>
            <a
              className="summary-card summary-card--link start-here__route start-here__route--interactive"
              href={toHref("/theorems/linear-pair")}
              onClick={(event) =>
                handleInternalLink(event, "/theorems/linear-pair", onNavigate)
              }
            >
              <span className="eyebrow">Interactive route</span>
              <strong>Explore Linear Pair</strong>
              <p>
                Begin with a movable figure and see how an invariant becomes a proof.
              </p>
              <span className="start-here__route-action">Open Linear Pair →</span>
            </a>
          </div>
          <nav aria-label="Browse all content" className="start-here__browse-links">
            <a
              href={toHref("/axioms")}
              onClick={(event) => handleInternalLink(event, "/axioms", onNavigate)}
            >
              Browse all axioms
            </a>
            <a
              href={toHref("/theorems")}
              onClick={(event) =>
                handleInternalLink(event, "/theorems", onNavigate)
              }
            >
              Browse all theorems
            </a>
          </nav>
        </section>

        <section className="start-here__section" aria-labelledby="start-here-roadmap">
          <div className="start-here__section-heading">
            <span className="eyebrow">Follow your curiosity</span>
            <h2 id="start-here-roadmap">Choose a topic to explore</h2>
            <p>
              These topics form a useful learning order, but you can enter anywhere.
            </p>
          </div>
          <ol className="start-here__roadmap">
            {theoremLearningStages.map((stage, index) => {
              const topicPath = `/theorems#${stage.id}`;
              return (
                <li key={stage.id}>
                  <a
                    href={toHref(topicPath)}
                    onClick={(event) =>
                      handleInternalLink(event, topicPath, onNavigate)
                    }
                  >
                    <span>{index + 1}</span>
                    <div>
                      <strong>{stage.title}</strong>
                      <p>{theoremTopicDescriptions[stage.id]}</p>
                    </div>
                    <span aria-hidden="true" className="start-here__topic-arrow">
                      →
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </section>
  );
}

export function NotFoundPage() {
  return (
    <section className="panel content-panel">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Missing page</span>
          <h1 data-page-heading tabIndex={-1}>
            Not found
          </h1>
        </div>
      </div>
      <div className="content-body">
        <p className="lead">That route does not exist yet.</p>
      </div>
    </section>
  );
}
