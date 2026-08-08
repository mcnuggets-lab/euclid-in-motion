import type { MouseEvent } from "react";

import { guideById } from "@/data/catalog";
import { toHref } from "@/utils/baseUrl";

export type Navigate = (path: string) => void;

type PageNavigationItem = {
  path: string;
  title: string;
};

export function handleInternalLink(
  event: MouseEvent<HTMLAnchorElement>,
  path: string,
  onNavigate: Navigate,
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

function getGuidePath(guide: { id: string; sections: Array<{ id: string }> }) {
  const firstSectionId = guide.sections[0]?.id;
  return `/guides/${guide.id}${firstSectionId ? `#${firstSectionId}` : ""}`;
}

export function CatalogCard({
  onNavigate,
  path,
  summary,
  title,
}: {
  onNavigate: Navigate;
  path: string;
  summary: string;
  title: string;
}) {
  return (
    <a
      className="summary-card summary-card--link"
      href={toHref(path)}
      onClick={(event) => handleInternalLink(event, path, onNavigate)}
    >
      <strong>{title}</strong>
      <p>{summary}</p>
    </a>
  );
}

export function PageSequenceNavigation({
  collection,
  itemLabel,
  next,
  onNavigate,
  previous,
}: {
  collection: PageNavigationItem;
  itemLabel: string;
  next?: PageNavigationItem;
  onNavigate: Navigate;
  previous?: PageNavigationItem;
}) {
  return (
    <nav
      aria-label={`${itemLabel} navigation`}
      className="page-sequence-navigation"
    >
      <div className="page-sequence-navigation__links">
        {previous ? (
          <a
            className="page-sequence-navigation__link"
            href={toHref(previous.path)}
            onClick={(event) =>
              handleInternalLink(event, previous.path, onNavigate)
            }
          >
            <span className="page-sequence-navigation__direction">
              <span aria-hidden="true">←</span> Previous {itemLabel.toLowerCase()}
            </span>
            <strong>{previous.title}</strong>
          </a>
        ) : (
          <span aria-hidden="true" />
        )}

        <a
          className="page-sequence-navigation__link page-sequence-navigation__link--collection"
          href={toHref(collection.path)}
          onClick={(event) =>
            handleInternalLink(event, collection.path, onNavigate)
          }
        >
          <span className="page-sequence-navigation__direction">
            <svg
              aria-hidden="true"
              className="page-sequence-navigation__icon"
              focusable="false"
              viewBox="0 0 16 16"
            >
              <rect height="5" rx="1" width="5" x="2" y="2" />
              <rect height="5" rx="1" width="5" x="9" y="2" />
              <rect height="5" rx="1" width="5" x="2" y="9" />
              <rect height="5" rx="1" width="5" x="9" y="9" />
            </svg>
            Browse
          </span>
          <strong>Back to {collection.title}</strong>
        </a>

        {next ? (
          <a
            className="page-sequence-navigation__link page-sequence-navigation__link--next"
            href={toHref(next.path)}
            onClick={(event) => handleInternalLink(event, next.path, onNavigate)}
          >
            <span className="page-sequence-navigation__direction">
              Next {itemLabel.toLowerCase()} <span aria-hidden="true">→</span>
            </span>
            <strong>{next.title}</strong>
          </a>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}

export function ReadingGuideCards({
  guideIds,
  onNavigate,
}: {
  guideIds?: string[];
  onNavigate: Navigate;
}) {
  const guides = (guideIds ?? []).map((guideId) => guideById.get(guideId));
  if (guides.length === 0) {
    return null;
  }

  return (
    <div className="content-block reading-guide-links">
      <span className="eyebrow">Read first</span>
      <strong>Review the notation used here</strong>
      {guides.map((guide) =>
        guide ? (
          <CatalogCard
            key={guide.id}
            onNavigate={onNavigate}
            path={getGuidePath(guide)}
            summary={guide.summary}
            title={guide.title}
          />
        ) : null,
      )}
    </div>
  );
}
