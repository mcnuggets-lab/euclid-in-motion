import "./styles/triangle-apex-controls.css";

import type { ApexBounds } from "@/features/geometry/geometryPrimitives";

type TriangleApexControlsProps = {
  apexX: number;
  bounds: ApexBounds;
  height: number;
  heightControlId: string;
  horizontalControlId: string;
  onApexXChange: (value: number) => void;
  onHeightChange: (value: number) => void;
};

export function TriangleApexControls({
  apexX,
  bounds,
  height,
  heightControlId,
  horizontalControlId,
  onApexXChange,
  onHeightChange,
}: TriangleApexControlsProps) {
  return (
    <div className="triangle-apex-controls">
      <label className="triangle-apex-controls__control" htmlFor={horizontalControlId}>
        <span>
          <strong>Move A left or right</strong>
          <span>{apexX}</span>
        </span>
        <input
          aria-valuetext={`horizontal position ${apexX}`}
          id={horizontalControlId}
          max={bounds.maximumX}
          min={bounds.minimumX}
          onChange={(event) => onApexXChange(Number(event.target.value))}
          type="range"
          value={apexX}
        />
      </label>
      <label className="triangle-apex-controls__control" htmlFor={heightControlId}>
        <span>
          <strong>Move A toward or away from BC</strong>
          <span>{height}</span>
        </span>
        <input
          aria-valuetext={`height ${height}`}
          id={heightControlId}
          max={bounds.maximumHeight}
          min={bounds.minimumHeight}
          onChange={(event) => onHeightChange(Number(event.target.value))}
          type="range"
          value={height}
        />
      </label>
    </div>
  );
}
