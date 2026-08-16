import { useEffect, useId, useState } from "react";
import "./styles/angle-bisector.css";

import { DraggablePoint, StaticPoint, SvgCanvas } from "@/features/geometry/components";
import {
  classNames,
  clamp,
  getSvgCoordinates,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import type { TheoremDiscovery } from "@/features/theorems/discovery";


type AngleBisectorExistenceIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type Focus = "coordinates" | "halfway" | "equal-parts" | "uniqueness";

type AngleBisectorStep = TheoremDiscovery & {
  focus: Focus;
};

type DragTarget = "boundary" | "divider" | null;

const center = { x: 160, y: 174 };
const outerRadius = 122;
const rayLength = 116;
const handleRadius = 22;
const minimumOpening = 36;
const maximumOpening = 154;
const minimumDividerPercent = 10;
const maximumDividerPercent = 90;

function degreeLabel(value: number) {
  return `${Math.round(value)}°`;
}

function polarPoint(origin: Point, radius: number, angleDegrees: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: origin.x + Math.cos(radians) * radius,
    y: origin.y - Math.sin(radians) * radius,
  };
}

function arcPath(
  origin: Point,
  radius: number,
  startDegrees: number,
  endDegrees: number,
) {
  const start = polarPoint(origin, radius, startDegrees);
  const end = polarPoint(origin, radius, endDegrees);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function coordinateFromPointer(point: Point) {
  const raw = (Math.atan2(center.y - point.y, point.x - center.x) * 180) / Math.PI;
  return clamp(raw, minimumOpening, maximumOpening);
}

export function AngleBisectorExistenceIllustration({
  activeStep,
  onDiscoveryChange,
}: AngleBisectorExistenceIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [opening, setOpening] = useState(112);
  const [dividerPercent, setDividerPercent] = useState(34);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);

  const isExploring = activeStep === null;
  const bisectorAngle = opening / 2;
  const candidateAngle = (opening * dividerPercent) / 100;
  const candidateRightPart = opening - candidateAngle;
  const isBisector = dividerPercent === 50;
  const boundaryEnd = polarPoint(center, rayLength, opening);
  const bisectorEnd = polarPoint(center, rayLength, bisectorAngle);
  const candidateEnd = polarPoint(center, rayLength, candidateAngle);

  const explorationStep: AngleBisectorStep = {
    focus: "equal-parts",
    insight: isBisector
      ? `The divider makes two ${degreeLabel(bisectorAngle)} angles, so it is an angle bisector.`
      : `The divider makes ${degreeLabel(candidateAngle)} and ${degreeLabel(candidateRightPart)} angles. Move it to find the one position where the parts match.`,
    prompt: "Change the opening or move the divider. The two parts are equal only when the divider is halfway through the opening.",
    title: "Explore an angle split",
  };
  const proofSteps: AngleBisectorStep[] = [
    {
      focus: "coordinates",
      insight: `Use one Protractor scale: BA is 0° and BC is ${degreeLabel(opening)}. The whole angle ∠ABC is therefore ${degreeLabel(opening)}.`,
      prompt: "The proof starts by putting both boundary rays on one degree scale, rather than relying on the picture's apparent symmetry.",
      title: "Set one degree scale",
    },
    {
      focus: "halfway",
      insight: `The unique ray at ${degreeLabel(bisectorAngle)}, exactly halfway between 0° and ${degreeLabel(opening)}, lies inside ∠ABC. Call it BD.`,
      prompt: "The protractor's unique-ray clause gives this one ray; the coordinate order 0° < θ / 2 < θ° places it inside the angle.",
      title: "Choose the halfway ray",
    },
    {
      focus: "equal-parts",
      insight: `∠ABD and ∠DBC are both ${degreeLabel(bisectorAngle)}. Their adjacent sizes add to the whole ${degreeLabel(opening)} angle, so the two parts are congruent.`,
      prompt: "Read each part from the same scale. The two equal values together account for the whole opening.",
      title: "Show that the parts are congruent",
    },
    {
      focus: "uniqueness",
      insight: isBisector
        ? `The comparison ray now matches BD. Any bisector must make two ${degreeLabel(bisectorAngle)} parts, so Protractor uniqueness makes it this same ray.`
        : `The orange comparison ray makes ${degreeLabel(candidateAngle)} and ${degreeLabel(candidateRightPart)} parts, so it is not a bisector. Only the ${degreeLabel(bisectorAngle)} coordinate works.`,
      prompt: "Move the orange comparison ray. Every position away from halfway makes unequal parts; any true bisector must share BD's coordinate.",
      title: "Show that no other bisector exists",
    },
  ];
  const currentStep = isExploring ? explorationStep : proofSteps[activeStep ?? 0];
  const showCoordinates = isExploring || currentStep.focus === "coordinates" || currentStep.focus === "halfway";
  const showConstructedBisector = !isExploring && currentStep.focus !== "coordinates";
  const showComparison = !isExploring && currentStep.focus === "uniqueness";
  const showCandidate = isExploring || showComparison;
  const showEqualParts =
    (isExploring && isBisector) ||
    (!isExploring && (currentStep.focus === "equal-parts" || currentStep.focus === "uniqueness"));
  const shownLeftPart = isExploring ? candidateAngle : bisectorAngle;
  const shownRightPart = isExploring ? candidateRightPart : bisectorAngle;
  const wholeLabelPoint = polarPoint(center, 82, opening / 2);
  const leftLabelPoint = polarPoint(center, 34, shownLeftPart / 2);
  const rightLabelPoint = polarPoint(center, 42, shownLeftPart + shownRightPart / 2);
  const halfwayPoint = polarPoint(center, outerRadius, bisectorAngle);
  const coordinateLabel = polarPoint(center, outerRadius + 18, opening);
  const figureDescription = showComparison
    ? `Angle ABC is ${degreeLabel(opening)}. Blue ray BD is its bisector, making two ${degreeLabel(bisectorAngle)} angles. Orange comparison ray BE makes ${degreeLabel(candidateAngle)} and ${degreeLabel(candidateRightPart)} angles.`
    : `Angle ABC is ${degreeLabel(opening)}. ${showConstructedBisector ? `Blue ray BD makes two ${degreeLabel(bisectorAngle)} angles.` : "The boundary rays BA and BC are shown on one degree scale."}`;
  const statusText = showEqualParts
    ? `The two parts are equal: ${degreeLabel(bisectorAngle)} + ${degreeLabel(bisectorAngle)} = ${degreeLabel(opening)}.`
    : showCandidate
      ? `The two parts are not equal: ${degreeLabel(candidateAngle)} + ${degreeLabel(candidateRightPart)} = ${degreeLabel(opening)}.`
      : showConstructedBisector
        ? `BD is at the halfway coordinate ${degreeLabel(bisectorAngle)}. The next step reads the two part sizes.`
        : `The boundary-ray coordinates run from 0° to θ° = ${degreeLabel(opening)}.`;

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [currentStep.insight, currentStep.prompt, currentStep.title, onDiscoveryChange]);

  return (
    <div className="theorem-figure angle-bisector">
      <SvgCanvas
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className="theorem-figure__svg angle-bisector__svg"
        description={figureDescription}
        descriptionId={descriptionId}
        onPointerCancel={() => setDragTarget(null)}
        onPointerLeave={(event) => {
          if (event.buttons === 0) {
            setDragTarget(null);
          }
        }}
        onPointerMove={(event) => {
          if (!dragTarget) {
            return;
          }

          const point = getSvgCoordinates(event.currentTarget, event);
          if (dragTarget === "boundary") {
            setOpening(Math.round(coordinateFromPointer(point)));
            return;
          }

          const coordinate = coordinateFromPointer(point);
          setDividerPercent(
            Math.round(
              clamp(
                (coordinate / opening) * 100,
                minimumDividerPercent,
                maximumDividerPercent,
              ),
            ),
          );
        }}
        onPointerUp={() => setDragTarget(null)}
        title="Angle bisector existence interactive figure"
        titleId={titleId}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >

        <path
          className={classNames(
            "angle-bisector__protractor",
            showCoordinates && "angle-bisector__protractor--visible",
          )}
          d={arcPath(center, outerRadius, 0, 180)}
        />
        <path className="angle-bisector__whole-arc" d={arcPath(center, 66, 0, opening)} />

        {showEqualParts ? (
          <>
            <path className="angle-bisector__equal-arc" d={arcPath(center, 26, 0, bisectorAngle)} />
            <path className="angle-bisector__equal-arc" d={arcPath(center, 38, bisectorAngle, opening)} />
          </>
        ) : null}

        {showComparison && !isBisector ? (
          <>
            <path className="angle-bisector__comparison-arc" d={arcPath(center, 54, 0, candidateAngle)} />
            <path className="angle-bisector__comparison-arc" d={arcPath(center, 64, candidateAngle, opening)} />
          </>
        ) : null}

        <line
          className="angle-bisector__ray angle-bisector__ray--base"
          x1={center.x}
          x2={center.x + rayLength + 18}
          y1={center.y}
          y2={center.y}
        />
        <line
          className="angle-bisector__ray angle-bisector__ray--boundary"
          x1={center.x}
          x2={boundaryEnd.x}
          y1={center.y}
          y2={boundaryEnd.y}
        />

        {showConstructedBisector ? (
          <line
            className="angle-bisector__ray angle-bisector__ray--bisector"
            x1={center.x}
            x2={bisectorEnd.x}
            y1={center.y}
            y2={bisectorEnd.y}
          />
        ) : null}
        {showCandidate ? (
          <line
            className={classNames(
              "angle-bisector__ray",
              isExploring
                ? "angle-bisector__ray--candidate"
                : "angle-bisector__ray--comparison",
            )}
            x1={center.x}
            x2={candidateEnd.x}
            y1={center.y}
            y2={candidateEnd.y}
          />
        ) : null}

        {showCoordinates ? (
          <>
            <text className="angle-bisector__coordinate-label" x={center.x + rayLength + 23} y={center.y + 5}>
              0°
            </text>
            <text className="angle-bisector__coordinate-label" x={coordinateLabel.x} y={coordinateLabel.y - 4}>
              θ°
            </text>
          </>
        ) : null}
        {showConstructedBisector && (currentStep.focus === "halfway" || showCoordinates) ? (
          <>
            <circle className="angle-bisector__halfway-point" cx={halfwayPoint.x} cy={halfwayPoint.y} r="4" />
            <text className="angle-bisector__halfway-label" x={halfwayPoint.x} y={halfwayPoint.y - 10}>
              θ / 2
            </text>
          </>
        ) : null}
        {currentStep.focus === "coordinates" ? (
          <text className="angle-bisector__whole-label" x={wholeLabelPoint.x} y={wholeLabelPoint.y}>
            θ = {degreeLabel(opening)}
          </text>
        ) : null}
        {showEqualParts || isExploring ? (
          <>
            <text
              className={classNames(
                "angle-bisector__measure-label",
                showEqualParts && "angle-bisector__measure-label--equal",
              )}
              x={leftLabelPoint.x}
              y={leftLabelPoint.y}
            >
              {degreeLabel(shownLeftPart)}
            </text>
            <text
              className={classNames(
                "angle-bisector__measure-label",
                showEqualParts && "angle-bisector__measure-label--equal",
              )}
              x={rightLabelPoint.x}
              y={rightLabelPoint.y}
            >
              {degreeLabel(shownRightPart)}
            </text>
          </>
        ) : null}

        <StaticPoint className="angle-bisector__vertex" label="B" labelOffset={{ x: -10, y: 17 }} point={center} radius={5} />
        <StaticPoint label="A" labelOffset={{ x: 24, y: -10 }} point={{ x: center.x + rayLength, y: center.y }} showLabel={true} radius={0} />
        <StaticPoint label="C" labelOffset={{ x: 10, y: -9 }} point={boundaryEnd} showLabel={true} radius={0} />
        {showConstructedBisector ? (
          <StaticPoint className="angle-bisector__ray-label angle-bisector__ray-label--bisector" label="D" labelOffset={{ x: -10, y: 14 }} point={bisectorEnd} radius={0} />
        ) : null}
        {showComparison ? (
          <StaticPoint className="angle-bisector__ray-label angle-bisector__ray-label--comparison" label="E" labelOffset={{ x: 9, y: -7 }} point={candidateEnd} radius={0} />
        ) : null}
        {isExploring ? (
          <StaticPoint className="angle-bisector__ray-label angle-bisector__ray-label--bisector" label="D" labelOffset={{ x: 9, y: -7 }} point={candidateEnd} radius={0} />
        ) : null}

        <DraggablePoint
          hitRadius={handleRadius}
          label="Boundary"
          onDrag={() => {}}
          onDragEnd={() => setDragTarget(null)}
          onDragStart={() => setDragTarget("boundary")}
          point={boundaryEnd}
          radius={7}
          showLabel={false}
        />
        {showCandidate ? (
          <DraggablePoint
            hitRadius={handleRadius}
            label="Divider"
            onDrag={() => {}}
            onDragEnd={() => setDragTarget(null)}
            onDragStart={() => setDragTarget("divider")}
            point={candidateEnd}
            radius={7}
            showLabel={false}
          />
        ) : null}
      </SvgCanvas>

      <div className="angle-bisector__summary theorem-figure__summary">
        <div className="theorem-measure">
          <strong>∠ABC</strong>
          <span>= {degreeLabel(opening)}</span>
        </div>
        {showConstructedBisector || isExploring ? (
          <>
            <div className={classNames("theorem-measure", showEqualParts && "angle-bisector__measure--equal")}>
              <strong>∠ABD</strong>
              <span>= {degreeLabel(shownLeftPart)}</span>
            </div>
            <div className={classNames("theorem-measure", showEqualParts && "angle-bisector__measure--equal")}>
              <strong>∠DBC</strong>
              <span>= {degreeLabel(shownRightPart)}</span>
            </div>
          </>
        ) : (
          <div className="theorem-measure">
            <strong>Scale</strong>
            <span>0° to θ°</span>
          </div>
        )}
      </div>

      {showComparison ? (
        <div className="angle-bisector__comparison-card">
          <strong>Comparison ray BE</strong>
          <span>
            ∠ABE = {degreeLabel(candidateAngle)} and ∠EBC = {degreeLabel(candidateRightPart)}
          </span>
        </div>
      ) : null}

      <div className="angle-bisector__controls">
        <label className="angle-bisector__control" htmlFor="angle-bisector-opening">
          <span>
            <strong>Angle opening</strong>
            <span>{degreeLabel(opening)}</span>
          </span>
          <input
            id="angle-bisector-opening"
            max={maximumOpening}
            min={minimumOpening}
            onChange={(event) => setOpening(Number(event.target.value))}
            type="range"
            value={opening}
          />
        </label>
        {showCandidate ? (
          <label className="angle-bisector__control" htmlFor="angle-bisector-divider">
            <span>
              <strong>{showComparison ? "Comparison-ray position" : "Divider position"}</strong>
              <span>{dividerPercent}% of the opening</span>
            </span>
            <input
              id="angle-bisector-divider"
              max={maximumDividerPercent}
              min={minimumDividerPercent}
              onChange={(event) => setDividerPercent(Number(event.target.value))}
              type="range"
              value={dividerPercent}
            />
          </label>
        ) : null}
      </div>

      <p className={classNames("angle-bisector__status", showEqualParts && "angle-bisector__status--equal")}>
        {statusText}
      </p>
    </div>
  );
}
