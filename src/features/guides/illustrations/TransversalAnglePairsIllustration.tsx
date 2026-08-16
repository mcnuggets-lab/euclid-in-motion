import { useState } from "react";

import { StaticPoint, SvgCanvas } from "@/features/geometry/components";


type Point = {
  x: number;
  y: number;
};

type AngleNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type PairRelationship = "alternate" | "corresponding" | "same-side";
type ExerciseMode = "alternate" | "corresponding" | "mixed" | "regions" | "same-side";
type RegionKind = "exterior" | "interior";

type Arrangement = {
  lowerAngle: number;
  p: Point;
  q: Point;
  upperAngle: number;
};

type PairChallenge = {
  relationship: PairRelationship;
  start: AngleNumber;
};

type Feedback = {
  correct: boolean;
  message: string;
};

const viewWidth = 760;
const viewHeight = 380;
const fullTurn = Math.PI * 2;
const interiorAngles = [3, 4, 5, 6] as const satisfies readonly AngleNumber[];
const exteriorAngles = [1, 2, 7, 8] as const satisfies readonly AngleNumber[];
const angleNumbers = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const transversalAngleRelationships: Record<
  PairRelationship,
  Partial<Record<AngleNumber, AngleNumber>>
> = {
  corresponding: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 1, 6: 2, 7: 3, 8: 4 },
  alternate: { 3: 5, 4: 6, 5: 3, 6: 4 },
  "same-side": { 3: 6, 4: 5, 5: 4, 6: 3 },
};

const arrangements: readonly Arrangement[] = [
  {
    lowerAngle: -0.08,
    p: { x: 292, y: 96 },
    q: { x: 420, y: 282 },
    upperAngle: 0,
  },
  {
    lowerAngle: 0.14,
    p: { x: 390, y: 92 },
    q: { x: 338, y: 286 },
    upperAngle: -0.13,
  },
  {
    lowerAngle: -0.16,
    p: { x: 270, y: 106 },
    q: { x: 410, y: 276 },
    upperAngle: -0.02,
  },
];

const relationshipLabels: Record<PairRelationship, string> = {
  alternate: "alternate interior",
  corresponding: "corresponding",
  "same-side": "same-side interior",
};

const modeOptions: Array<{ label: string; mode: ExerciseMode }> = [
  { label: "Regions", mode: "regions" },
  { label: "Corresponding", mode: "corresponding" },
  { label: "Alternate interior", mode: "alternate" },
  { label: "Same-side interior", mode: "same-side" },
  { label: "Mixed check", mode: "mixed" },
];

const challenges: Record<Exclude<ExerciseMode, "regions">, readonly PairChallenge[]> = {
  corresponding: angleNumbers.map((start) => ({ relationship: "corresponding", start })),
  alternate: interiorAngles.map((start) => ({ relationship: "alternate", start })),
  "same-side": interiorAngles.map((start) => ({ relationship: "same-side", start })),
  mixed: [
    { relationship: "corresponding", start: 7 },
    { relationship: "alternate", start: 3 },
    { relationship: "same-side", start: 4 },
    { relationship: "corresponding", start: 2 },
    { relationship: "alternate", start: 6 },
    { relationship: "same-side", start: 5 },
  ],
};

function normalizeAngle(angle: number) {
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function pointAt(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

function lineEndpoints(center: Point, angle: number, radius = 520) {
  return {
    first: pointAt(center, radius, angle + Math.PI),
    second: pointAt(center, radius, angle),
  };
}

function clockwiseDelta(start: number, end: number) {
  return normalizeAngle(end - start);
}

function sectorPath(center: Point, start: number, end: number, radius = 38) {
  const normalizedStart = normalizeAngle(start);
  const delta = clockwiseDelta(normalizedStart, end);
  const first = pointAt(center, radius, normalizedStart);
  const second = pointAt(center, radius, normalizedStart + delta);
  const largeArc = delta > Math.PI ? 1 : 0;

  return `M ${center.x} ${center.y} L ${first.x} ${first.y} A ${radius} ${radius} 0 ${largeArc} 1 ${second.x} ${second.y} Z`;
}

function sectorLabelPoint(center: Point, start: number, end: number, radius = 25) {
  const delta = clockwiseDelta(start, end);
  return pointAt(center, radius, normalizeAngle(start) + delta / 2);
}

function reflectArrangement(arrangement: Arrangement): Arrangement {
  return {
    lowerAngle: -arrangement.lowerAngle,
    p: { x: viewWidth - arrangement.p.x, y: arrangement.p.y },
    q: { x: viewWidth - arrangement.q.x, y: arrangement.q.y },
    upperAngle: -arrangement.upperAngle,
  };
}

function sameMembers(selected: readonly AngleNumber[], target: readonly AngleNumber[]) {
  return (
    selected.length === target.length &&
    selected.every((angle) => target.includes(angle))
  );
}

function isInterior(angle: AngleNumber) {
  return interiorAngles.includes(angle as (typeof interiorAngles)[number]);
}

function pairFeedback(
  challenge: PairChallenge,
  selected: AngleNumber | undefined,
): Feedback {
  const target = transversalAngleRelationships[challenge.relationship][challenge.start];
  const relationship = relationshipLabels[challenge.relationship];

  if (selected === undefined || target === undefined) {
    return { correct: false, message: "Choose one partner angle before checking." };
  }

  if (selected === target) {
    return {
      correct: true,
      message: `Correct. Angles ${challenge.start} and ${target} form a ${relationship} pair.`,
    };
  }

  if (challenge.relationship !== "corresponding" && !isInterior(selected)) {
    return {
      correct: false,
      message: `Angle ${selected} is exterior. Both angles in a ${relationship} pair must be interior.`,
    };
  }

  if (challenge.relationship === "alternate") {
    return {
      correct: false,
      message: `Angle ${selected} is not across the transversal from angle ${challenge.start}. Look at the other interior angle at that intersection.`,
    };
  }

  if (challenge.relationship === "same-side") {
    return {
      correct: false,
      message: `Angle ${selected} is not on the same side of the transversal as angle ${challenge.start}. Keep both angles interior and on one side.`,
    };
  }

  return {
    correct: false,
    message: `Angle ${selected} is at the other intersection, but it does not occupy the matching corner for angle ${challenge.start}.`,
  };
}

function relationshipChallenge(
  mode: Exclude<ExerciseMode, "regions">,
  challengeIndex: number,
) {
  const modeChallenges = challenges[mode];
  return modeChallenges[challengeIndex % modeChallenges.length];
}

export function TransversalAnglePairsIllustration() {
  const [mode, setMode] = useState<ExerciseMode>("regions");
  const [regionKind, setRegionKind] = useState<RegionKind>("interior");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedAngles, setSelectedAngles] = useState<AngleNumber[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [arrangementIndex, setArrangementIndex] = useState(0);
  const [reflected, setReflected] = useState(false);

  const baseArrangement = arrangements[arrangementIndex];
  const arrangement = reflected ? reflectArrangement(baseArrangement) : baseArrangement;
  const transversalDown = Math.atan2(
    arrangement.q.y - arrangement.p.y,
    arrangement.q.x - arrangement.p.x,
  );
  const transversalUp = normalizeAngle(transversalDown + Math.PI);
  const upperRight = normalizeAngle(arrangement.upperAngle);
  const upperLeft = normalizeAngle(upperRight + Math.PI);
  const lowerRight = normalizeAngle(arrangement.lowerAngle);
  const lowerLeft = normalizeAngle(lowerRight + Math.PI);
  const upperLine = lineEndpoints(arrangement.p, upperRight);
  const lowerLine = lineEndpoints(arrangement.q, lowerRight);
  const transversalCenter = {
    x: (arrangement.p.x + arrangement.q.x) / 2,
    y: (arrangement.p.y + arrangement.q.y) / 2,
  };
  const transversalLine = lineEndpoints(transversalCenter, transversalDown);
  const upperLineLabel = pointAt(arrangement.p, 290, upperLeft);
  const lowerLineLabel = pointAt(arrangement.q, 290, lowerLeft);
  const transversalLabel = pointAt(transversalCenter, 220, transversalUp);
  const pLabel = sectorLabelPoint(arrangement.p, transversalUp, upperRight, 71);
  const qLabel = sectorLabelPoint(arrangement.q, lowerRight, transversalDown, 71);
  const pairChallenge = mode === "regions" ? null : relationshipChallenge(mode, challengeIndex);
  const startAngle = pairChallenge?.start;
  const targetAngle = pairChallenge
    ? transversalAngleRelationships[pairChallenge.relationship][pairChallenge.start]
    : undefined;
  const selectedPartner = selectedAngles[0];

  const sectors: Array<{
    angle: AngleNumber;
    center: Point;
    end: number;
    start: number;
  }> = [
    { angle: 1, center: arrangement.p, start: upperLeft, end: transversalUp },
    { angle: 2, center: arrangement.p, start: transversalUp, end: upperRight },
    { angle: 3, center: arrangement.p, start: upperRight, end: transversalDown },
    { angle: 4, center: arrangement.p, start: transversalDown, end: upperLeft },
    { angle: 5, center: arrangement.q, start: lowerLeft, end: transversalUp },
    { angle: 6, center: arrangement.q, start: transversalUp, end: lowerRight },
    { angle: 7, center: arrangement.q, start: lowerRight, end: transversalDown },
    { angle: 8, center: arrangement.q, start: transversalDown, end: lowerLeft },
  ];

  const resetAnswer = () => {
    setSelectedAngles([]);
    setFeedback(null);
  };

  const chooseMode = (nextMode: ExerciseMode) => {
    setMode(nextMode);
    setChallengeIndex(0);
    setRegionKind("interior");
    resetAnswer();
  };

  const chooseAngle = (angle: AngleNumber) => {
    if (angle === startAngle || feedback?.correct) {
      return;
    }

    setFeedback(null);
    if (mode === "regions") {
      setSelectedAngles((current) =>
        current.includes(angle)
          ? current.filter((selected) => selected !== angle)
          : [...current, angle],
      );
      return;
    }

    setSelectedAngles([angle]);
  };

  const checkAnswer = () => {
    if (mode === "regions") {
      const target = regionKind === "interior" ? interiorAngles : exteriorAngles;
      const correct = sameMembers(selectedAngles, target);
      setFeedback({
        correct,
        message: correct
          ? `Correct. Angles ${target.join(", ")} are the ${regionKind} angles.`
          : `Not yet. Select every angle that faces ${regionKind === "interior" ? "the segment from P to Q" : "away from the segment from P to Q"}, and no others.`,
      });
      return;
    }

    if (pairChallenge) {
      setFeedback(pairFeedback(pairChallenge, selectedPartner));
    }
  };

  const nextPrompt = () => {
    if (mode === "regions") {
      setRegionKind((current) => (current === "interior" ? "exterior" : "interior"));
    } else {
      setChallengeIndex((current) => current + 1);
    }
    resetAnswer();
  };

  const angleStateClass = (angle: AngleNumber) => {
    const classes = ["transversal-guide__sector"];
    if (angle === startAngle) {
      classes.push("transversal-guide__sector--start");
    }
    if (selectedAngles.includes(angle)) {
      classes.push("transversal-guide__sector--selected");
      if (feedback) {
        classes.push(
          feedback.correct
            ? "transversal-guide__sector--correct"
            : "transversal-guide__sector--incorrect",
        );
      }
    }
    if (feedback?.correct && angle === targetAngle) {
      classes.push("transversal-guide__sector--correct");
    }
    return classes.join(" ");
  };

  const prompt = mode === "regions"
    ? `Select all four ${regionKind} angles.`
    : `Select the angle that forms a ${relationshipLabels[pairChallenge!.relationship]} pair with angle ${pairChallenge!.start}.`;

  return (
    <section aria-labelledby="transversal-exercise-title" className="guide-activity transversal-guide">
      <div>
        <span className="eyebrow">Interactive exercise</span>
        <h2 id="transversal-exercise-title">Exercise: read the eight positions</h2>
        <p>
          Use the same diagram for every task. The two crossed lines are deliberately
          not marked parallel; classify the angles from their positions alone.
        </p>
      </div>

      <div aria-label="Choose an angle-pair task" className="transversal-guide__modes">
        {modeOptions.map((option) => (
          <button
            aria-pressed={mode === option.mode}
            className="transversal-guide__mode-button"
            key={option.mode}
            onClick={() => chooseMode(option.mode)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="transversal-guide__prompt" role="status">
        <strong>{prompt}</strong>
        {startAngle ? <span>Angle {startAngle} is the starting angle.</span> : null}
      </div>

      <p className="visually-hidden">
        Lines l and m are crossed by transversal t at P and Q, forming angles 1
        through 8. Use the numbered buttons after the diagram to choose angles.
      </p>
      <SvgCanvas
        aria-hidden="true"
        className="guide-figure transversal-guide__figure"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      >
        <line
          className="transversal-guide__between"
          x1={arrangement.p.x}
          x2={arrangement.q.x}
          y1={arrangement.p.y}
          y2={arrangement.q.y}
        />
        <line
          className="transversal-guide__line"
          x1={upperLine.first.x}
          x2={upperLine.second.x}
          y1={upperLine.first.y}
          y2={upperLine.second.y}
        />
        <line
          className="transversal-guide__line"
          x1={lowerLine.first.x}
          x2={lowerLine.second.x}
          y1={lowerLine.first.y}
          y2={lowerLine.second.y}
        />
        <line
          className="transversal-guide__line transversal-guide__line--transversal"
          x1={transversalLine.first.x}
          x2={transversalLine.second.x}
          y1={transversalLine.first.y}
          y2={transversalLine.second.y}
        />

        {sectors.map((sector) => {
          const label = sectorLabelPoint(sector.center, sector.start, sector.end);

          return (
            <g
              className="transversal-guide__angle-target"
              key={sector.angle}
              onClick={() => chooseAngle(sector.angle)}
            >
              <path
                className={angleStateClass(sector.angle)}
                d={sectorPath(sector.center, sector.start, sector.end)}
              />
              <text
                className="transversal-guide__angle-label"
                x={label.x}
                y={label.y}
              >
                {sector.angle}
              </text>
            </g>
          );
        })}

        <StaticPoint
          className="transversal-guide__intersection"
          label="P"
          labelOffset={{ x: pLabel.x - arrangement.p.x, y: pLabel.y - arrangement.p.y + 10 }}
          point={arrangement.p}
          radius={4}
        />
        <StaticPoint
          className="transversal-guide__intersection"
          label="Q"
          labelOffset={{ x: qLabel.x - arrangement.q.x, y: qLabel.y - arrangement.q.y + 10 }}
          point={arrangement.q}
          radius={4}
        />
        <text className="transversal-guide__line-label" x={upperLineLabel.x} y={upperLineLabel.y - 9}>ℓ</text>
        <text className="transversal-guide__line-label" x={lowerLineLabel.x} y={lowerLineLabel.y - 9}>m</text>
        <text className="transversal-guide__line-label" x={transversalLabel.x + 10} y={transversalLabel.y}>t</text>
      </SvgCanvas>

      <div aria-label="Choose angles" className="transversal-guide__angle-buttons">
        {angleNumbers.map((angle) => (
          <button
            aria-pressed={selectedAngles.includes(angle)}
            className={angle === startAngle
              ? "transversal-guide__angle-button transversal-guide__angle-button--start"
              : "transversal-guide__angle-button"}
            disabled={angle === startAngle || feedback?.correct}
            key={angle}
            onClick={() => chooseAngle(angle)}
            type="button"
          >
            <span>Angle</span> {angle}
          </button>
        ))}
      </div>

      <div className="guide-check transversal-guide__check">
        <button
          className="guide-check__button"
          disabled={selectedAngles.length === 0 || feedback?.correct}
          onClick={checkAnswer}
          type="button"
        >
          Check selection
        </button>
        {feedback ? (
          <p
            className={feedback.correct ? "guide-feedback guide-feedback--correct" : "guide-feedback"}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}
        {feedback?.correct ? (
          <button className="guide-check__button" onClick={nextPrompt} type="button">
            Next prompt
          </button>
        ) : null}
      </div>

      <div className="transversal-guide__arrangement">
        <div>
          <strong>Change the appearance</strong>
          <p>The angle numbers and their positional relationships stay attached.</p>
        </div>
        <div className="guide-controls">
          <button
            onClick={() => setArrangementIndex((current) => (current + 1) % arrangements.length)}
            type="button"
          >
            Change arrangement
          </button>
          <button
            onClick={() => setReflected((current) => !current)}
            type="button"
          >
            Reflect arrangement
          </button>
        </div>
      </div>
    </section>
  );
}
