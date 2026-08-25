import { useCallback, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Pointer capture strategy: On pointer down, capture the pointer on the current target.
 * On pointer up, release it. This prevents pointer loss during fast drags or when
 * the pointer moves quickly out of the element bounds. See DraggablePoint.tsx for usage.
 */

import { clamp, getSvgCoordinates, type Point } from "@/features/geometry/illustrationUtils";

export type DragBounds = {
  maxX?: number;
  maxY?: number;
  minX?: number;
  minY?: number;
};

export type UseSvgDragOptions = {
  bounds?: DragBounds;
  constrain?: (proposed: Point) => Point;
  disabled?: boolean;
  onDrag: (point: Point) => void;
  onDragEnd?: () => void;
  onDragStart?: () => void;
  point: Point;
  shiftStep?: number;
  step?: number;
};

export function useSvgDrag({
  bounds,
  constrain,
  disabled = false,
  onDrag,
  onDragEnd,
  onDragStart,
  point,
  shiftStep = 10,
  step = 1,
}: UseSvgDragOptions) {
  const [isDragging, setIsDragging] = useState(false);

  const applyConstraints = useCallback(
    (target: Point): Point => {
      let constrained = { ...target };

      if (bounds) {
        if (bounds.minX !== undefined || bounds.maxX !== undefined) {
          constrained.x = clamp(
            constrained.x,
            bounds.minX ?? -Infinity,
            bounds.maxX ?? Infinity,
          );
        }
        if (bounds.minY !== undefined || bounds.maxY !== undefined) {
          constrained.y = clamp(
            constrained.y,
            bounds.minY ?? -Infinity,
            bounds.maxY ?? Infinity,
          );
        }
      }

      if (constrain) {
        constrained = constrain(constrained);
      }

      return constrained;
    },
    [bounds, constrain],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<SVGElement>) => {
      if (disabled || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
      onDragStart?.();
    },
    [disabled, onDragStart],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGElement>) => {
      if (!isDragging) {
        return;
      }

      const svg =
        event.currentTarget instanceof SVGSVGElement
          ? event.currentTarget
          : event.currentTarget.ownerSVGElement ??
            (event.currentTarget.closest("svg") as SVGSVGElement | null);

      if (!svg) {
        return;
      }

      const raw = getSvgCoordinates(svg, event);
      const constrained = applyConstraints(raw);
      onDrag(constrained);
    },
    [applyConstraints, isDragging, onDrag],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<SVGElement>) => {
      if (!isDragging) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      setIsDragging(false);
      onDragEnd?.();
    },
    [isDragging, onDragEnd],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<SVGElement>) => {
      if (disabled) {
        return;
      }

      const currentStep = event.shiftKey ? shiftStep : step;
      let dx = 0;
      let dy = 0;

      switch (event.key) {
        case "ArrowLeft":
          dx = -currentStep;
          break;
        case "ArrowRight":
          dx = currentStep;
          break;
        case "ArrowUp":
          dy = -currentStep;
          break;
        case "ArrowDown":
          dy = currentStep;
          break;
        default:
          return;
      }

      event.preventDefault();
      const target = { x: point.x + dx, y: point.y + dy };
      const constrained = applyConstraints(target);
      onDrag(constrained);
    },
    [applyConstraints, disabled, onDrag, point.x, point.y, shiftStep, step],
  );

  return {
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
  };
}
