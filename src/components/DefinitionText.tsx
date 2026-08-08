import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { findDefinitionMatches } from "@/components/definitionMatching";
import type { Definition } from "@/data/catalog";


type PopoverPosition = {
  left: number;
  top: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function DefinitionPopover({
  children,
  definition,
}: {
  children: string;
  definition: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const popoverId = useId();
  const popoverRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = wrapperRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const viewportMargin = 12;
      const gap = 7;
      const halfWidth = popoverRect.width / 2;
      const left = clamp(
        triggerRect.left + triggerRect.width / 2,
        viewportMargin + halfWidth,
        window.innerWidth - viewportMargin - halfWidth,
      );
      const belowTop = triggerRect.bottom + gap;
      const hasRoomBelow =
        belowTop + popoverRect.height <= window.innerHeight - viewportMargin;
      const top = hasRoomBelow
        ? belowTop
        : Math.max(
            viewportMargin,
            triggerRect.top - gap - popoverRect.height,
          );

      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <span
      className="definition-term"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!wrapperRef.current?.contains(document.activeElement)) {
          setIsOpen(false);
        }
      }}
      ref={wrapperRef}
    >
      <button
        aria-describedby={isOpen ? popoverId : undefined}
        aria-expanded={isOpen}
        className="definition-term__trigger"
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        type="button"
      >
        {children}
      </button>
      {isOpen
        ? createPortal(
            <span
              className="definition-term__popover"
              id={popoverId}
              ref={popoverRef}
              role="tooltip"
              style={{
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                visibility: position ? "visible" : "hidden",
              }}
            >
              {definition}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

export function DefinitionText({
  definitions,
  text,
}: {
  definitions: Definition[];
  text: string;
}) {
  const matches = findDefinitionMatches(definitions, text);

  if (matches.length === 0) {
    return text;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start > cursor) {
      parts.push(text.slice(cursor, match.start));
    }
    parts.push(
      <DefinitionPopover
        definition={match.definition}
        key={`${match.id}-${match.start}`}
      >
        {text.slice(match.start, match.end)}
      </DefinitionPopover>,
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}
