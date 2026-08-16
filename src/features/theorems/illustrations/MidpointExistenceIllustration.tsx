import { useEffect, useId, useState } from "react";
import "./styles/midpoint-existence.css";

import {
  angleFrom,
  classNames,
  clamp,
  formatDisplayNumber,
  getSvgCoordinates,
  pointAlong,
  polarPointRadians as polarPoint,
  svgHeight,
  svgWidth,
  type Point,
} from "@/features/geometry/illustrationUtils";
import { SvgCanvas, StaticPoint, DraggablePoint } from "@/features/geometry/components";
import type { TheoremDiscovery } from "@/features/theorems/discovery";

type MidpointExistenceIllustrationProps = {
  activeStep: number | null;
  onDiscoveryChange: (discovery: TheoremDiscovery) => void;
};

type DragTarget = "apex" | "base" | "candidate" | null;

type MidpointStep = TheoremDiscovery & {
  focus: "apex" | "bisector" | "crossbar" | "sas" | "midpoint";
};

const minimumBaseLength = 100;
const maximumBaseLength = 190;
const initialBaseLength = 160;
const minimumApexHeight = 70;
const maximumApexHeight = 135;
const initialApexHeight = 110;
const minimumCandidatePosition = 8;
const maximumCandidatePosition = 92;
const initialCandidatePosition = 50;
const proofBaseY = 180;
const explorationBaseY = 112;
const explorationScale = 1.28;
const handleRadius = 22;

function measurement(value: number) {
  return formatDisplayNumber(value, Number.isInteger(value) ? 0 : 1);
}

function tickEndpoints(
  first: Point,
  second: Point,
  fraction = 0.5,
  size = 6,
) {
  const center = pointAlong(first, second, fraction);
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

function angleArc(
  vertex: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarPoint(vertex, radius, startAngle);
  const end = polarPoint(vertex, radius, endAngle);
  const sweep = endAngle >= startAngle ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

export function MidpointExistenceIllustration({
  activeStep,
  onDiscoveryChange,
}: MidpointExistenceIllustrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const baseControlId = useId();
  const secondaryControlId = useId();
  const [baseLength, setBaseLength] = useState(initialBaseLength);
  const [apexHeight, setApexHeight] = useState(initialApexHeight);
  const [candidatePosition, setCandidatePosition] = useState(
    initialCandidatePosition,
  );
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);

  const isExploring = activeStep === null;
  const proofStep = activeStep ?? 0;
  const displayedBaseLength = isExploring
    ? baseLength * explorationScale
    : baseLength;
  const baseY = isExploring ? explorationBaseY : proofBaseY;
  const pointA = { x: svgWidth / 2 - displayedBaseLength / 2, y: baseY };
  const pointB = { x: svgWidth / 2 + displayedBaseLength / 2, y: baseY };
  const pointP = { x: svgWidth / 2, y: proofBaseY - apexHeight };
  const proofMidpoint = { x: svgWidth / 2, y: proofBaseY };
  const candidatePoint = pointAlong(
    pointA,
    pointB,
    candidatePosition / 100,
  );
  const pointM = isExploring ? candidatePoint : proofMidpoint;
  const bisectorEndpoint = proofStep === 1
    ? pointAlong(pointP, pointM, 0.72)
    : pointM;
  const leftLength = isExploring
    ? (baseLength * candidatePosition) / 100
    : baseLength / 2;
  const rightLength = baseLength - leftLength;
  const isMidpoint = candidatePosition === 50;

  const leftLegTick = tickEndpoints(pointP, pointA, 0.52);
  const rightLegTick = tickEndpoints(pointP, pointB, 0.52);
  const leftBaseTicks = [
    tickEndpoints(pointA, pointM, 0.46),
    tickEndpoints(pointA, pointM, 0.56),
  ];
  const rightBaseTicks = [
    tickEndpoints(pointM, pointB, 0.44),
    tickEndpoints(pointM, pointB, 0.54),
  ];
  const leftApexAngle = angleFrom(pointP, pointA);
  const bisectorAngle = angleFrom(pointP, pointM);
  const rightApexAngle = angleFrom(pointP, pointB);
  const leftAngleArc = angleArc(
    pointP,
    22,
    leftApexAngle,
    bisectorAngle,
  );
  const rightAngleArc = angleArc(
    pointP,
    22,
    bisectorAngle,
    rightApexAngle,
  );

  const proofSteps: MidpointStep[] = [
    {
      focus: "apex",
      insight: `The construction supplies P off line AB with PA and PB both ${measurement(Math.hypot(baseLength / 2, apexHeight))} units long. Thus PA ≅ PB.`,
      prompt: "The equal legs are established by the preceding isosceles-point construction, not by how symmetric the drawing looks.",
      title: "Construct an isosceles point",
    },
    {
      focus: "bisector",
      insight: "The green ray lies inside ∠APB. The two orange arcs mark the congruent angle halves supplied by the angle bisector.",
      prompt: "At this stage the ray is known to bisect the angle; its intersection with the base still needs the Crossbar Theorem.",
      title: "Bisect the apex angle",
    },
    {
      focus: "crossbar",
      insight: "Crossbar guarantees that the interior bisector ray meets segment AB at M. Therefore M is between A and B.",
      prompt: "The theorem gives more than a visual crossing: it places M on the segment between the two endpoints.",
      title: "Meet the base",
    },
    {
      focus: "sas",
      insight: "For triangles PAM and PBM: the blue legs are congruent, the green side PM is shared, and the orange apex angles are congruent. SAS gives △PAM ≅ △PBM.",
      prompt: "All three SAS inputs appear on this one split triangle. AM and MB are not used as premises.",
      title: "Apply SAS to the two halves",
    },
    {
      focus: "midpoint",
      insight: `Corresponding parts give AM ≅ MB; each is ${measurement(baseLength / 2)} units long. Together with M between A and B, this makes M a midpoint.`,
      prompt: "Congruent base ticks appear only now, after triangle congruence has established the conclusion.",
      title: "Read the midpoint",
    },
  ];
  const explorationStep: MidpointStep = {
    focus: "midpoint",
    insight: isMidpoint
      ? `M is halfway along AB: AM and MB are both ${measurement(leftLength)} units long.`
      : `AM is ${measurement(leftLength)} units and MB is ${measurement(rightLength)} units. Move M to make the two lengths match.`,
    prompt: "This view illustrates the midpoint condition. The guided proof explains how to construct a point that must satisfy it.",
    title: "Explore the midpoint condition",
  };
  const currentStep = isExploring
    ? explorationStep
    : (proofSteps[proofStep] ?? proofSteps[0]);
  const showBisector = !isExploring && proofStep >= 1;
  const showM = !isExploring && proofStep >= 2;
  const showSas = !isExploring && proofStep === 3;
  const showConclusion = !isExploring && proofStep === 4;
  const showApexAngles = !isExploring && proofStep >= 1 && proofStep <= 3;
  const showBaseTicks = (isExploring && isMidpoint) || showConclusion;
  const figureDescription = isExploring
    ? `Segment AB is ${baseLength} units long. Candidate point M makes AM ${measurement(leftLength)} units and MB ${measurement(rightLength)} units.`
    : showConclusion
      ? `In triangle APB, point M lies between A and B and the two base segments AM and MB are marked congruent.`
      : showSas
        ? "Triangle APB is split at M. Equal legs, a shared side, and equal included angles show triangles PAM and PBM congruent by SAS."
        : showM
          ? "The angle-bisector ray from P meets segment AB at M between A and B."
          : showBisector
            ? "The angle at P is divided into two congruent parts by an interior bisector ray."
            : "Triangle APB has congruent legs PA and PB, with P off line AB.";
  const status = isExploring
    ? isMidpoint
      ? "Midpoint condition met: M is between A and B, and AM ≅ MB."
      : "M is between the endpoints, but AM and MB are not yet congruent."
    : showConclusion
      ? "M is a midpoint of AB: M is between A and B, and AM ≅ MB."
      : showSas
        ? "SAS establishes △PAM ≅ △PBM."
        : showM
          ? "Crossbar places M between A and B."
          : showBisector
            ? "The interior ray divides ∠APB into two congruent angles."
            : "The constructed point P satisfies PA ≅ PB.";

  useEffect(() => {
    onDiscoveryChange({
      insight: currentStep.insight,
      prompt: currentStep.prompt,
      title: currentStep.title,
    });
  }, [currentStep.insight, currentStep.prompt, currentStep.title, onDiscoveryChange]);

  const renderSummary = () => {
    if (isExploring || showConclusion) {
      return (
        <>
          <div className={classNames("theorem-measure", showConclusion && "midpoint-existence__measure--result")}>
            <strong>AM</strong>
            <span>{measurement(leftLength)} units</span>
          </div>
          <div className={classNames("theorem-measure", showConclusion && "midpoint-existence__measure--result")}>
            <strong>MB</strong>
            <span>{measurement(rightLength)} units</span>
          </div>
          <div className={classNames("theorem-measure", (isMidpoint || showConclusion) && "midpoint-existence__measure--result")}>
            <strong>Condition</strong>
            <span>{isMidpoint || showConclusion ? "AM ≅ MB" : "AM and MB differ"}</span>
          </div>
        </>
      );
    }

    if (showSas) {
      return (
        <>
          <div className="theorem-measure midpoint-existence__measure--leg">
            <strong>Legs</strong>
            <span>PA ≅ PB</span>
          </div>
          <div className="theorem-measure midpoint-existence__measure--shared">
            <strong>Shared side</strong>
            <span>PM ≅ PM</span>
          </div>
          <div className="theorem-measure midpoint-existence__measure--angle">
            <strong>Included angles</strong>
            <span>∠APM ≅ ∠MPB</span>
          </div>
        </>
      );
    }

    if (showM) {
      return (
        <>
          <div className="theorem-measure">
            <strong>Interior ray</strong>
            <span>PM lies inside ∠APB</span>
          </div>
          <div className="theorem-measure midpoint-existence__measure--shared">
            <strong>Crossbar</strong>
            <span>PM meets segment AB</span>
          </div>
          <div className="theorem-measure">
            <strong>Order</strong>
            <span>M is between A and B</span>
          </div>
        </>
      );
    }

    if (showBisector) {
      return (
        <>
          <div className="theorem-measure midpoint-existence__measure--angle">
            <strong>Left part</strong>
            <span>one half of ∠APB</span>
          </div>
          <div className="theorem-measure midpoint-existence__measure--angle">
            <strong>Right part</strong>
            <span>one half of ∠APB</span>
          </div>
          <div className="theorem-measure midpoint-existence__measure--shared">
            <strong>Bisector</strong>
            <span>the two parts are congruent</span>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="theorem-measure midpoint-existence__measure--leg">
          <strong>PA</strong>
          <span>{measurement(Math.hypot(baseLength / 2, apexHeight))} units</span>
        </div>
        <div className="theorem-measure midpoint-existence__measure--leg">
          <strong>PB</strong>
          <span>{measurement(Math.hypot(baseLength / 2, apexHeight))} units</span>
        </div>
        <div className="theorem-measure">
          <strong>Construction</strong>
          <span>P is off line AB</span>
        </div>
      </>
    );
  };

  return (
    <div className="theorem-figure midpoint-existence">
      <SvgCanvas
        descriptionId={descriptionId}
        description={figureDescription}
        titleId={titleId}
        title={isExploring ? "Midpoint existence interactive figure" : `Midpoint existence: ${currentStep.title}`}
        className="midpoint-existence__svg"
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

          const pointer = getSvgCoordinates(event.currentTarget, event);
          if (dragTarget === "base") {
            const nextBaseLength = isExploring
              ? ((pointer.x - svgWidth / 2) * 2) / explorationScale
              : (pointer.x - svgWidth / 2) * 2;
            setBaseLength(
              Math.round(
                clamp(nextBaseLength, minimumBaseLength, maximumBaseLength),
              ),
            );
          } else if (dragTarget === "candidate") {
            const nextPosition =
              ((pointer.x - pointA.x) / displayedBaseLength) * 100;
            setCandidatePosition(
              Math.round(
                clamp(
                  nextPosition,
                  minimumCandidatePosition,
                  maximumCandidatePosition,
                ),
              ),
            );
          } else {
            setApexHeight(
              Math.round(
                clamp(
                  proofBaseY - pointer.y,
                  minimumApexHeight,
                  maximumApexHeight,
                ),
              ),
            );
          }
        }}
        onPointerUp={() => setDragTarget(null)}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {isExploring ? (
          <>
            <line className="midpoint-existence__base" x1={pointA.x} x2={pointB.x} y1={pointA.y} y2={pointB.y} />
            {showBaseTicks ? (
              <>
                {leftBaseTicks.map((tick, index) => <line className="midpoint-existence__tick" key={`left-${index}`} {...tick} />)}
                {rightBaseTicks.map((tick, index) => <line className="midpoint-existence__tick" key={`right-${index}`} {...tick} />)}
              </>
            ) : null}
          </>
        ) : (
          <>
            <line
              className={classNames(
                "midpoint-existence__side",
                (proofStep === 0 || showSas) && "midpoint-existence__side--leg",
              )}
              x1={pointP.x}
              x2={pointA.x}
              y1={pointP.y}
              y2={pointA.y}
            />
            <line
              className={classNames(
                "midpoint-existence__side",
                (proofStep === 0 || showSas) && "midpoint-existence__side--leg",
              )}
              x1={pointP.x}
              x2={pointB.x}
              y1={pointP.y}
              y2={pointB.y}
            />
            {showConclusion ? (
              <>
                <line className="midpoint-existence__base midpoint-existence__base--result" x1={pointA.x} x2={pointM.x} y1={pointA.y} y2={pointM.y} />
                <line className="midpoint-existence__base midpoint-existence__base--result" x1={pointM.x} x2={pointB.x} y1={pointM.y} y2={pointB.y} />
              </>
            ) : (
              <line className="midpoint-existence__base" x1={pointA.x} x2={pointB.x} y1={pointA.y} y2={pointB.y} />
            )}
            <line className="midpoint-existence__tick" {...leftLegTick} />
            <line className="midpoint-existence__tick" {...rightLegTick} />
            {showBisector ? (
              <line
                className={classNames(
                  "midpoint-existence__bisector",
                  showSas && "midpoint-existence__bisector--sas",
                )}
                x1={pointP.x}
                x2={bisectorEndpoint.x}
                y1={pointP.y}
                y2={bisectorEndpoint.y}
              />
            ) : null}
            {showApexAngles ? (
              <>
                <path className="midpoint-existence__angle-arc" d={leftAngleArc} />
                <path className="midpoint-existence__angle-arc" d={rightAngleArc} />
              </>
            ) : null}
            {showBaseTicks ? (
              <>
                {leftBaseTicks.map((tick, index) => <line className="midpoint-existence__tick midpoint-existence__tick--result" key={`left-${index}`} {...tick} />)}
                {rightBaseTicks.map((tick, index) => <line className="midpoint-existence__tick midpoint-existence__tick--result" key={`right-${index}`} {...tick} />)}
              </>
            ) : null}
          </>
        )}

        <StaticPoint className="midpoint-existence__point" point={pointA} label="A" labelOffset={{ x: -11, y: 19 }} />

        {isExploring ? (
          <DraggablePoint
            hitRadius={handleRadius}
            label="M"
            labelOffset={{ x: 0, y: -13 }}
            onDrag={(p) => {
              const nextPosition =
                ((p.x - pointA.x) / displayedBaseLength) * 100;
              setCandidatePosition(
                Math.round(
                  clamp(
                    nextPosition,
                    minimumCandidatePosition,
                    maximumCandidatePosition,
                  ),
                ),
              );
            }}
            onDragEnd={() => setDragTarget(null)}
            onDragStart={() => setDragTarget("candidate")}
            point={pointM}
            radius={7}
            className={classNames(
              "midpoint-existence__handle",
              "midpoint-existence__handle--candidate",
              isMidpoint && "midpoint-existence__handle--result",
              dragTarget === "candidate" && "midpoint-existence__handle--active",
            )}
            showLabel={true}
          />
        ) : showM ? (
          <StaticPoint
            className={classNames(
              "midpoint-existence__point",
              "midpoint-existence__point--m",
              showConclusion && "midpoint-existence__point--result",
            )}
            point={pointM}
            label="M"
            labelOffset={{ x: 0, y: -13 }}
            radius={5}
          />
        ) : null}

        <DraggablePoint
          hitRadius={handleRadius}
          label="B"
          labelOffset={{ x: 11, y: 19 }}
          onDrag={(p) => {
            const nextBaseLength = isExploring
              ? ((p.x - svgWidth / 2) * 2) / explorationScale
              : (p.x - svgWidth / 2) * 2;
            setBaseLength(
              Math.round(
                clamp(nextBaseLength, minimumBaseLength, maximumBaseLength),
              ),
            );
          }}
          onDragEnd={() => setDragTarget(null)}
          onDragStart={() => setDragTarget("base")}
          point={pointB}
          radius={7}
          className={classNames(
            "midpoint-existence__handle",
            "midpoint-existence__handle--base",
            dragTarget === "base" && "midpoint-existence__handle--active",
          )}
          showLabel={true}
        />

        {!isExploring ? (
          <DraggablePoint
            hitRadius={handleRadius}
            label="P"
            labelOffset={{ x: 0, y: -11 }}
            onDrag={(p) => {
              setApexHeight(
                Math.round(
                  clamp(
                    proofBaseY - p.y,
                    minimumApexHeight,
                    maximumApexHeight,
                  ),
                ),
              );
            }}
            onDragEnd={() => setDragTarget(null)}
            onDragStart={() => setDragTarget("apex")}
            point={pointP}
            radius={7}
            className={classNames(
              "midpoint-existence__handle",
              "midpoint-existence__handle--apex",
              dragTarget === "apex" && "midpoint-existence__handle--active",
            )}
            showLabel={true}
          />
        ) : null}
      </SvgCanvas>

      <div className="midpoint-existence__summary theorem-figure__summary">
        {renderSummary()}
      </div>

      <div className="midpoint-existence__controls">
        <label className="midpoint-existence__control" htmlFor={baseControlId}>
          <span>
            <strong>Base length</strong>
            <span>{baseLength} units</span>
          </span>
          <input
            id={baseControlId}
            max={maximumBaseLength}
            min={minimumBaseLength}
            onChange={(event) => setBaseLength(Number(event.target.value))}
            type="range"
            value={baseLength}
          />
        </label>
        {isExploring ? (
          <label className="midpoint-existence__control" htmlFor={secondaryControlId}>
            <span>
              <strong>Candidate position</strong>
              <span>{candidatePosition}% of the way from A to B</span>
            </span>
            <input
              id={secondaryControlId}
              max={maximumCandidatePosition}
              min={minimumCandidatePosition}
              onChange={(event) => setCandidatePosition(Number(event.target.value))}
              type="range"
              value={candidatePosition}
            />
          </label>
        ) : (
          <label className="midpoint-existence__control" htmlFor={secondaryControlId}>
            <span>
              <strong>Apex height</strong>
              <span>{apexHeight} units</span>
            </span>
            <input
              id={secondaryControlId}
              max={maximumApexHeight}
              min={minimumApexHeight}
              onChange={(event) => setApexHeight(Number(event.target.value))}
              type="range"
              value={apexHeight}
            />
          </label>
        )}
      </div>

      <p className={classNames("midpoint-existence__status", ((isExploring && isMidpoint) || showConclusion) && "midpoint-existence__status--result")}>
        {status}
      </p>
    </div>
  );
}
