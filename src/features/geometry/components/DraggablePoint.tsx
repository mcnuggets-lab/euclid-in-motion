import type { ReactNode } from "react";

import {
  useSvgDrag,
  type DragBounds,
} from "@/features/geometry/hooks/useSvgDrag";
import { classNames, type Point } from "@/features/geometry/illustrationUtils";

export type DraggablePointTone = "accent" | "secondary" | "neutral" | "constructed";

export type DraggablePointProps = {
  ariaLabel?: string;
  ariaValueText?: string;
  bounds?: DragBounds;
  className?: string;
  constrain?: (proposed: Point) => Point;
  disabled?: boolean;
  hitRadius?: number;
  label?: ReactNode;
  labelOffset?: Point;
  onDrag: (point: Point) => void;
  onDragEnd?: () => void;
  onDragStart?: () => void;
  point: Point;
  radius?: number;
  shiftStep?: number;
  showLabel?: boolean;
  step?: number;
  tone?: DraggablePointTone;
};

const defaultLabelOffset: Point = { x: 0, y: -11 };

export function DraggablePoint({
  ariaLabel,
  ariaValueText,
  bounds,
  className,
  constrain,
  disabled = false,
  hitRadius = 22,
  label,
  labelOffset = defaultLabelOffset,
  onDrag,
  onDragEnd,
  onDragStart,
  point,
  radius = 7,
  shiftStep = 10,
  showLabel = true,
  step = 1,
  tone = "accent",
}: DraggablePointProps) {
  const {
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
  } = useSvgDrag({
    bounds,
    constrain,
    disabled,
    onDrag,
    onDragEnd,
    onDragStart,
    point,
    shiftStep,
    step,
  });

  const accessibleName =
    ariaLabel ??
    (typeof label === "string" ? `Control point ${label}` : "Control point");

  const handleClass = classNames(
    "axiom-figure__handle",
    tone === "accent" && "axiom-figure__handle--accent",
    tone === "secondary" && "axiom-figure__handle--secondary",
    tone === "constructed" && "axiom-figure__handle--constructed",
    isDragging && "axiom-figure__handle--active",
    className,
  );

  return (
    <g
      aria-label={accessibleName}
      aria-valuetext={ariaValueText ?? `(${Math.round(point.x)}, ${Math.round(point.y)})`}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="slider"
      style={{ cursor: isDragging ? "grabbing" : "grab", outline: "none", touchAction: "none" }}
      tabIndex={disabled ? -1 : 0}
    >
      {/* 44x44px minimum touch target hit area (radius 22) */}
      <circle
        cx={point.x}
        cy={point.y}
        fill="transparent"
        pointerEvents="all"
        r={hitRadius}
        style={{ touchAction: "none" }}
      />

      {/* Visible handle dot */}
      <circle
        className={handleClass}
        cx={point.x}
        cy={point.y}
        pointerEvents="none"
        r={isDragging ? radius + 1.5 : radius}
      />

      {/* Optional point label */}
      {showLabel && label !== undefined && label !== null ? (
        <text
          className="axiom-figure__label theorem-figure__point-label"
          pointerEvents="none"
          textAnchor="middle"
          x={point.x + labelOffset.x}
          y={point.y + labelOffset.y}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
