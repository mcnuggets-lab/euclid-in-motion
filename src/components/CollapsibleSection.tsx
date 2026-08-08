import { useState } from "react";


type CollapsibleSectionProps = {
  anchorId?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  title: string;
};

function hashTargets(anchorId?: string) {
  return (
    Boolean(anchorId) &&
    typeof window !== "undefined" &&
    decodeURIComponent(window.location.hash.slice(1)) === anchorId
  );
}

export function CollapsibleSection({
  anchorId,
  children,
  defaultOpen = true,
  title,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(
    () => defaultOpen || hashTargets(anchorId),
  );

  return (
    <section className="content-block collapsible-section" id={anchorId}>
      <button
        aria-expanded={isOpen}
        className="collapsible-section__toggle"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <strong>{title}</strong>
        <span>{isOpen ? "Hide" : "Show"}</span>
      </button>
      {isOpen ? <div className="collapsible-section__body">{children}</div> : null}
    </section>
  );
}
