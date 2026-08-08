import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

import {
  geometricAxiomCatalog,
  getAxiomExplorations,
  getGuides,
  measurementAxiomCatalog,
  theoremCatalog,
  theoremLearningStages,
  type TheoremLearningStage,
} from "@/data/catalog";
import { toHref } from "@/utils/baseUrl";


type SidebarNavProps = {
  currentPath: string;
  hidden: boolean;
  onNavigate: (path: string) => void;
};

type BrowseToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
};

function BookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="nav-link__icon"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M2.5 3.5h4A3.5 3.5 0 0 1 10 7v10a3.5 3.5 0 0 0-3.5-3.5h-4v-10Zm15 0h-4A3.5 3.5 0 0 0 10 7v10a3.5 3.5 0 0 1 3.5-3.5h4v-10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function BrowseToggle({ isOpen, onToggle }: BrowseToggleProps) {
  return (
    <button
      aria-controls="browse-navigation"
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close browse menu" : "Open browse menu"}
      className="browse-toggle browse-toggle--menu"
      onClick={onToggle}
      title={isOpen ? "Close browse menu" : "Open browse menu"}
      type="button"
    >
      <span aria-hidden="true" className="browse-toggle__icon">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

function LinkButton({
  currentPath,
  descendantPaths = [],
  icon,
  label,
  matchDescendants = false,
  nested = false,
  onNavigate,
  path,
}: {
  currentPath: string;
  descendantPaths?: string[];
  icon?: "book";
  label: ReactNode;
  matchDescendants?: boolean;
  nested?: boolean;
  onNavigate: (path: string) => void;
  path: string;
}) {
  const isActive = currentPath === path;
  const isAncestor =
    !isActive &&
    (matchDescendants && currentPath.startsWith(`${path}/`) ||
      descendantPaths.some(
        (descendantPath) =>
          currentPath === descendantPath || currentPath.startsWith(`${descendantPath}/`),
      ));
  const className = [
    "nav-link",
    nested ? "nav-link--nested" : "",
    icon ? "nav-link--with-icon" : "",
    isAncestor ? "nav-link--ancestor" : "",
    isActive ? "nav-link--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
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
  };

  return (
    <a
      aria-current={isActive ? "page" : isAncestor ? "location" : undefined}
      className={className}
      href={toHref(path)}
      onClick={handleClick}
    >
      {icon === "book" ? <BookIcon /> : null}
      {label}
    </a>
  );
}

function TheoremStageGroup({
  currentPath,
  defaultOpen,
  onNavigate,
  stage,
}: {
  currentPath: string;
  defaultOpen: boolean;
  onNavigate: (path: string) => void;
  stage: TheoremLearningStage;
}) {
  const isActive = stage.theorems.some(
    (theorem) => currentPath === `/theorems/${theorem.id}`,
  );
  const [isOpen, setIsOpen] = useState(defaultOpen || isActive);

  useEffect(() => {
    if (currentPath.startsWith("/theorems/")) {
      setIsOpen(isActive);
    }
  }, [currentPath, isActive]);

  return (
    <section className="theorem-stage">
      <button
        aria-controls={`${stage.id}-theorems`}
        aria-expanded={isOpen}
        className="theorem-stage__toggle"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span>{stage.title}</span>
        <span aria-hidden="true" className="theorem-stage__chevron">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div
        className="nav-list theorem-stage__list"
        hidden={!isOpen}
        id={`${stage.id}-theorems`}
      >
        {stage.theorems.map((theorem) => {
          const sequence = theoremCatalog.indexOf(theorem) + 1;

          return (
            <LinkButton
              currentPath={currentPath}
              key={theorem.id}
              label={
                <span className="theorem-nav-label">
                  <span className="theorem-nav-label__number">{sequence}</span>
                  <span className="theorem-nav-label__copy">
                    <span className="theorem-nav-label__title">{theorem.title}</span>
                    <span className="theorem-nav-label__topic">{theorem.family}</span>
                  </span>
                </span>
              }
              onNavigate={onNavigate}
              path={`/theorems/${theorem.id}`}
            />
          );
        })}
      </div>
    </section>
  );
}

export function SidebarNav({ currentPath, hidden, onNavigate }: SidebarNavProps) {
  return (
    <aside className="panel sidebar" hidden={hidden} id="browse-navigation">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Browse</span>
          <h2>Contents</h2>
        </div>
      </div>

      <div className="sidebar__body">
        <div className="nav-section">
          <strong className="nav-section__title">Overview</strong>
          <div className="nav-list">
            <LinkButton
              currentPath={currentPath}
              label="Start here"
              onNavigate={onNavigate}
              path="/"
            />
            <LinkButton
              currentPath={currentPath}
              label="All axioms"
              onNavigate={onNavigate}
              path="/axioms"
            />
            <LinkButton
              currentPath={currentPath}
              label="All theorems"
              onNavigate={onNavigate}
              path="/theorems"
            />
          </div>
        </div>

        <div className="nav-section">
          <strong className="nav-section__title">Hilbert-style axioms</strong>
          <div className="nav-list">
            {geometricAxiomCatalog.map((axiom) => {
              const explorations = getAxiomExplorations(axiom.id);
              const guides = getGuides(axiom.id);

              return (
                <div className="nav-tree-item" key={axiom.id}>
                  <LinkButton
                    currentPath={currentPath}
                    descendantPaths={guides.map((guide) => `/guides/${guide.id}`)}
                    label={axiom.title}
                    matchDescendants
                    onNavigate={onNavigate}
                    path={`/axioms/${axiom.id}`}
                  />
                  {guides.length > 0 || explorations.length > 0 ? (
                    <div className="nav-list nav-list--nested">
                      {guides.map((guide) => (
                        <LinkButton
                          currentPath={currentPath}
                          icon="book"
                          key={guide.id}
                          label={guide.title}
                          nested
                          onNavigate={onNavigate}
                          path={`/guides/${guide.id}`}
                        />
                      ))}
                      {explorations.map((exploration) => (
                        <LinkButton
                          currentPath={currentPath}
                          key={exploration.id}
                          label={exploration.title}
                          nested
                          onNavigate={onNavigate}
                          path={`/axioms/${exploration.parentAxiomId}/${exploration.id}`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="nav-section">
          <strong className="nav-section__title">Degrees supplement</strong>
          <div className="nav-list">
            {measurementAxiomCatalog.map((axiom) => (
              <LinkButton
                currentPath={currentPath}
                key={axiom.id}
                label={axiom.title}
                onNavigate={onNavigate}
                path={`/axioms/${axiom.id}`}
              />
            ))}
          </div>
        </div>

        <div className="nav-section">
          <strong className="nav-section__title">Theorems</strong>
          <div className="nav-list theorem-stages">
            {theoremLearningStages.map((stage, index) => (
              <TheoremStageGroup
                currentPath={currentPath}
                defaultOpen={index === 0}
                key={stage.id}
                onNavigate={onNavigate}
                stage={stage}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
