import { useEffect, useId, useState } from "react";
import "./styles/isosceles-base-angles.css";

import {
  angleFrom,
  classNames,
  clamp,
  distance,
  getSvgCoordinates,
  midpoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";


type IsoscelesBaseAnglesIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type Focus = "conclusion" | "correspondence" | "legs" | "sas";

type IllustrationStep = TheoremDiscovery & {
  focus: Focus;
};

type TriangleNames = {
  apex: string;
  left: string;
  right: string;
  title: string;
};

type TriangleDrawingProps = {
  apex: Point;
  baseAngle?: number;
  baseAngleColors?: {
    left: string;
    right: string;
  };
  highlightBaseAngles?: boolean;
  highlightIncludedAngle?: boolean;
  left: Point;
  names: TriangleNames;
  right: Point;
  showSideCorrespondence?: boolean;
  showAngleNames?: boolean;
  showDegreeLabels?: boolean;
  vertexColors?: {
    apex: string;
    left: string;
    right: string;
  };
};

const baseLeft = { x: 50, y: 185 };
const baseRight = { x: 270, y: 185 };
const minimumHeight = 45;
const maximumHeight = 155;
const initialHeight = 120;
const handleRadius = 22;

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function pointOnRay(vertex: Point, angle: number, radius: number) {
  return {
    x: vertex.x + Math.cos(angle) * radius,
    y: vertex.y + Math.sin(angle) * radius,
  };
}

function angleArc(vertex: Point, firstAngle: number, secondAngle: number, radius: number) {
  const start = pointOnRay(vertex, firstAngle, radius);
  const end = pointOnRay(vertex, secondAngle, radius);
  const clockwise = ((secondAngle - firstAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const sweep = clockwise <= Math.PI ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

function angleBisector(firstAngle: number, secondAngle: number) {
  const clockwise = ((secondAngle - firstAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  return clockwise <= Math.PI
    ? firstAngle + clockwise / 2
    : firstAngle - (Math.PI * 2 - clockwise) / 2;
}

function tickEndpoints(first: Point, second: Point, size = 7) {
  const center = midpoint(first, second);
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: (-dy / length) * size, y: (dx / length) * size };

  return {
    x1: center.x - normal.x,
    x2: center.x + normal.x,
    y1: center.y - normal.y,
    y2: center.y + normal.y,
  };
}

function TriangleDrawing({
  apex,
  baseAngle,
  baseAngleColors,
  highlightBaseAngles = false,
  highlightIncludedAngle = false,
  left,
  names,
  right,
  showSideCorrespondence = false,
  showAngleNames = false,
  showDegreeLabels = false,
  vertexColors = { apex: "#c25b2a", left: "#1f5fbf", right: "#1f5fbf" },
}: TriangleDrawingProps) {
  const leftTick = tickEndpoints(apex, left);
  const rightTick = tickEndpoints(apex, right);
  const leftApexAngle = angleFrom(left, apex);
  const leftBaseAngle = angleFrom(left, right);
  const rightBaseAngle = angleFrom(right, left);
  const rightApexAngle = angleFrom(right, apex);
  const leftBaseArc = angleArc(left, leftApexAngle, leftBaseAngle, 19);
  const rightBaseArc = angleArc(right, rightBaseAngle, rightApexAngle, 19);
  const leftDegreeLabelPoint = pointOnRay(left, angleBisector(leftApexAngle, leftBaseAngle), 31);
  const rightDegreeLabelPoint = pointOnRay(right, angleBisector(rightBaseAngle, rightApexAngle), 31);
  const apexArc = angleArc(apex, angleFrom(apex, left), angleFrom(apex, right), 22);
  const apexAngle = baseAngle === undefined ? undefined : 180 - baseAngle * 2;

  return (
    <g>
      <text className="isosceles-base-angles__triangle-title" x={apex.x} y={apex.y - 16}>
        {names.title}
      </text>
      <path
        className={classNames(
          "isosceles-base-angles__side",
          "isosceles-base-angles__side--focused",
          showSideCorrespondence && "isosceles-base-angles__side--correspondence-left",
        )}
        d={`M ${apex.x} ${apex.y} L ${left.x} ${left.y}`}
      />
      <path
        className={classNames(
          "isosceles-base-angles__side",
          "isosceles-base-angles__side--focused",
          showSideCorrespondence && "isosceles-base-angles__side--correspondence-right",
        )}
        d={`M ${apex.x} ${apex.y} L ${right.x} ${right.y}`}
      />
      <path
        className={classNames(
          "isosceles-base-angles__side",
          "isosceles-base-angles__side--base",
        )}
        d={`M ${left.x} ${left.y} L ${right.x} ${right.y}`}
      />
      <line className="isosceles-base-angles__tick" {...leftTick} />
      <line className="isosceles-base-angles__tick" {...rightTick} />
      <path
        className={classNames(
          "isosceles-base-angles__angle-arc",
          highlightBaseAngles && "isosceles-base-angles__angle-arc--conclusion",
        )}
        d={leftBaseArc}
        style={baseAngleColors ? { stroke: baseAngleColors.left } : undefined}
      />
      <path
        className={classNames(
          "isosceles-base-angles__angle-arc",
          highlightBaseAngles && "isosceles-base-angles__angle-arc--conclusion",
        )}
        d={rightBaseArc}
        style={baseAngleColors ? { stroke: baseAngleColors.right } : undefined}
      />
      <path
        className={classNames(
          "isosceles-base-angles__apex-arc",
          highlightIncludedAngle && "isosceles-base-angles__apex-arc--pair",
        )}
        d={apexArc}
      />
      {showDegreeLabels && baseAngle !== undefined && apexAngle !== undefined ? (
        <>
          <text
            className="isosceles-base-angles__angle-label"
            x={leftDegreeLabelPoint.x}
            y={leftDegreeLabelPoint.y}
          >
            {degreeLabel(baseAngle)}
          </text>
          <text
            className="isosceles-base-angles__angle-label"
            x={rightDegreeLabelPoint.x}
            y={rightDegreeLabelPoint.y}
          >
            {degreeLabel(baseAngle)}
          </text>
          <text className="isosceles-base-angles__apex-label" x={apex.x} y={apex.y + 42}>
            {degreeLabel(apexAngle)}
          </text>
        </>
      ) : null}
      {showAngleNames ? (
        <text className="isosceles-base-angles__included-angle" x={apex.x} y={apex.y + 39}>
          ∠{names.left}{names.apex}{names.right}
        </text>
      ) : null}
      <circle className="isosceles-base-angles__point" cx={left.x} cy={left.y} r="4.5" style={{ fill: vertexColors.left }} />
      <circle className="isosceles-base-angles__point" cx={right.x} cy={right.y} r="4.5" style={{ fill: vertexColors.right }} />
      <circle className="isosceles-base-angles__point" cx={apex.x} cy={apex.y} r="5.5" style={{ fill: vertexColors.apex }} />
      <text className="theorem-figure__label" x={apex.x + 10} y={apex.y - 5}>{names.apex}</text>
      <text className="theorem-figure__label" x={left.x - 8} y={left.y + 18}>{names.left}</text>
      <text className="theorem-figure__label" x={right.x + 8} y={right.y + 18}>{names.right}</text>
    </g>
  );
}

export function IsoscelesBaseAnglesIllustration({
  activeStep,
  onDiscoveryChange,
}: IsoscelesBaseAnglesIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const apex = { x: (baseLeft.x + baseRight.x) / 2, y: baseLeft.y - height };
  const legLength = distance(apex, baseLeft);
  const baseAngle = (Math.atan2(height, (baseRight.x - baseLeft.x) / 2) * 180) / Math.PI;
  const apexAngle = 180 - baseAngle * 2;
  const isExploring = activeStep === null;
  const steps: IllustrationStep[] = [
    {
      focus: "legs",
      insight: "The given condition is AB ≅ AC. Those equal sides are the legs; BC is the base.",
      prompt: "Start with the stated isosceles condition. Nothing about the drawing alone proves the base angles equal.",
      title: "Equal legs",
    },
    {
      focus: "correspondence",
      insight: "Compare △ABC with the same triangle named in reverse, △ACB. This pairs A with A, B with C, and C with B.",
      prompt: "The two drawings are synchronized views of the same triangle. Read their vertex names in order to see which parts pair up.",
      title: "Reverse the correspondence",
    },
    {
      focus: "sas",
      insight: "The reversed names give AB ≅ AC, AC ≅ AB, and ∠BAC ≅ ∠CAB. These are two sides and their included angle.",
      prompt: "Use the matching blue and orange legs, then compare the included apex angles before applying the SAS axiom.",
      title: "Establish the SAS inputs",
    },
    {
      focus: "conclusion",
      insight: "SAS gives △ABC ≅ △ACB. Under that correspondence, ∠ABC matches ∠ACB, so the base angles are congruent.",
      prompt: "Return to one triangle: the matching base-angle arcs are the conclusion of the correspondence proof.",
      title: "Read the corresponding base angles",
    },
  ];
  const explorationStep: IllustrationStep = {
    focus: "conclusion",
    insight: `AB and AC stay congruent as A moves. The two base angles both read ${degreeLabel(baseAngle)}; that matching is an illustration of the theorem, not its proof.`,
    prompt:
      "Move A. The triangle changes from an obtuse to an acute apex, but the marked legs and matching base-angle values stay paired.",
    title: "Explore an isosceles triangle",
  };
  const currentStep = isExploring ? explorationStep : steps[activeStep];
  const showPair =
    !isExploring &&
    (currentStep.focus === "correspondence" || currentStep.focus === "sas");
  const showConclusion = isExploring || currentStep.focus === "conclusion";
  const highlightBaseAngles = !isExploring && currentStep.focus === "conclusion";
  const correspondenceScale = 0.6;
  const correspondenceHeight = height * correspondenceScale;
  const correspondenceBaseY = 180;
  const leftTriangle = {
    apex: { x: 75, y: correspondenceBaseY - correspondenceHeight },
    left: { x: 10, y: correspondenceBaseY },
    right: { x: 140, y: correspondenceBaseY },
  };
  const rightTriangle = {
    apex: { x: 245, y: correspondenceBaseY - correspondenceHeight },
    left: { x: 180, y: correspondenceBaseY },
    right: { x: 310, y: correspondenceBaseY },
  };
  const figureDescription = showPair
    ? "Two synchronized views of the same isosceles triangle. The left is named triangle ABC. The right is named triangle ACB, so its base vertices are read in reverse order."
    : `An isosceles triangle ABC has base BC and apex A. AB and AC are both ${Math.round(legLength)} units. The two base angles are both ${degreeLabel(baseAngle)} and the apex angle is ${degreeLabel(apexAngle)}.`;

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [currentStep.insight, currentStep.prompt, currentStep.title, onDiscoveryChange]);

  return (
    <div className="theorem-figure isosceles-base-angles">
      <div className="isosceles-base-angles__badge">
        <strong>Given: AB ≅ AC</strong>
        <span>Move A while the equal-leg condition stays true.</span>
      </div>

      <svg
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg isosceles-base-angles__svg"
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setIsDragging(false);
          }
        }}
        onPointerMove={(event) => {
          if (!isDragging || showPair) {
            return;
          }

          const point = getSvgCoordinates(event.currentTarget, event);
          setHeight(clamp(baseLeft.y - point.y, minimumHeight, maximumHeight));
        }}
        onPointerUp={() => setIsDragging(false)}
        role="img"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <title id={titleId}>Isosceles base angles interactive figure</title>
        <desc id={descriptionId}>{figureDescription}</desc>

        {showPair ? (
          <>
            <TriangleDrawing
              apex={leftTriangle.apex}
              baseAngleColors={{ left: "#c25b2a", right: "#2f7d4a" }}
              highlightIncludedAngle
              left={leftTriangle.left}
              names={{ apex: "A", left: "B", right: "C", title: "△ABC" }}
              right={leftTriangle.right}
              showAngleNames
              showSideCorrespondence
              vertexColors={{ apex: "#1f5fbf", left: "#c25b2a", right: "#2f7d4a" }}
            />
            <TriangleDrawing
              apex={rightTriangle.apex}
              baseAngleColors={{ left: "#c25b2a", right: "#2f7d4a" }}
              highlightIncludedAngle
              left={rightTriangle.left}
              names={{ apex: "A", left: "C", right: "B", title: "△ACB" }}
              right={rightTriangle.right}
              showAngleNames
              showSideCorrespondence
              vertexColors={{ apex: "#1f5fbf", left: "#c25b2a", right: "#2f7d4a" }}
            />
            <text className="isosceles-base-angles__pair-label isosceles-base-angles__pair-label--blue" x="160" y="86">
              AB ↔ AC
            </text>
            <text className="isosceles-base-angles__pair-label isosceles-base-angles__pair-label--orange" x="160" y="110">
              AC ↔ AB
            </text>
            <text className="isosceles-base-angles__pair-label isosceles-base-angles__pair-label--blue" x="160" y="134">
              ∠BAC ↔ ∠CAB
            </text>
            <text className="isosceles-base-angles__pair-note" x="160" y="210">
              Same triangle, read in reverse order
            </text>
          </>
        ) : (
          <>
            <TriangleDrawing
              apex={apex}
              baseAngle={baseAngle}
              highlightBaseAngles={highlightBaseAngles}
              left={baseLeft}
              names={{ apex: "A", left: "B", right: "C", title: "" }}
              right={baseRight}
              showDegreeLabels
            />
            <circle
              className="isosceles-base-angles__handle-target"
              cx={apex.x}
              cy={apex.y}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setIsDragging(true);
              }}
              r={handleRadius}
            />
            <circle
              className={classNames(
                "isosceles-base-angles__drag-handle",
                isDragging && "isosceles-base-angles__drag-handle--active",
              )}
              cx={apex.x}
              cy={apex.y}
              r="8"
            />
          </>
        )}
      </svg>

      <div className="theorem-figure__summary isosceles-base-angles__summary">
        <div className="theorem-measure theorem-measure--accent">
          <strong>Legs</strong>
          <span>AB = AC = {Math.round(legLength)}</span>
        </div>
        <div className="theorem-measure theorem-measure--secondary">
          <strong>Base angles</strong>
          <span>∠ABC = ∠ACB = {degreeLabel(baseAngle)}</span>
        </div>
      </div>

      <div className="isosceles-base-angles__proof-panel">
        <strong>Proof in the figure</strong>
        <div className="isosceles-base-angles__proof-grid">
          <div className={classNames("isosceles-base-angles__proof-card", (isExploring || currentStep.focus === "legs") && "isosceles-base-angles__proof-card--active")}>
            <strong>Given</strong>
            <span>AB ≅ AC</span>
          </div>
          <div className={classNames("isosceles-base-angles__proof-card", currentStep.focus === "correspondence" && "isosceles-base-angles__proof-card--active")}>
            <strong>Correspondence</strong>
            <span>△ABC ↔ △ACB</span>
          </div>
          <div className={classNames("isosceles-base-angles__proof-card", currentStep.focus === "sas" && "isosceles-base-angles__proof-card--active")}>
            <strong>SAS inputs</strong>
            <span>AB ≅ AC, AC ≅ AB, ∠BAC ≅ ∠CAB</span>
          </div>
          <div className={classNames("isosceles-base-angles__proof-card", showConclusion && "isosceles-base-angles__proof-card--active")}>
            <strong>Conclusion</strong>
            <span>∠ABC ≅ ∠ACB</span>
          </div>
        </div>
      </div>

      <label className="isosceles-base-angles__control" htmlFor="isosceles-apex-height">
        <span>
          <strong>Apex height</strong>
          <span>{Math.round(height)} units</span>
        </span>
        <input
          id="isosceles-apex-height"
          max={maximumHeight}
          min={minimumHeight}
          onChange={(event) => setHeight(Number(event.target.value))}
          type="range"
          value={height}
        />
      </label>
      <span aria-atomic="true" aria-live="polite" className="visually-hidden" role="status">
        Base angles are both {degreeLabel(baseAngle)}. The apex angle is {degreeLabel(apexAngle)}.
      </span>
    </div>
  );
}
