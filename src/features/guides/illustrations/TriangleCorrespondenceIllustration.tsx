import { useState } from "react";

import { StaticPoint, Segment, SvgCanvas } from "@/features/geometry/components";

import {
  midpoint,
  type Point,
} from "@/features/geometry/illustrationUtils";

const firstVertices = ["A", "B", "C"] as const;
const secondVertices = ["D", "E", "F"] as const;

type FirstVertex = (typeof firstVertices)[number];
type SecondVertex = (typeof secondVertices)[number];
type VertexOrder = readonly [SecondVertex, SecondVertex, SecondVertex];

const targetOrder: VertexOrder = ["E", "F", "D"];
const candidateOrders = [
  ["D", "E", "F"],
  ["D", "F", "E"],
  ["E", "D", "F"],
  ["E", "F", "D"],
  ["F", "D", "E"],
  ["F", "E", "D"],
] as const satisfies readonly VertexOrder[];
const sideIndices = [
  [0, 1],
  [1, 2],
  [2, 0],
] as const;

const vertexColors: Record<FirstVertex | SecondVertex, string> = {
  A: "#1f5fbf",
  B: "#c25b2a",
  C: "#2f7d4a",
  D: "#2f7d4a",
  E: "#1f5fbf",
  F: "#c25b2a",
};

function buildFirstPoints(
  baseLength: number,
  apexOffset: number,
): Record<FirstVertex, Point> {
  return {
    A: { x: 90 - baseLength / 2, y: 195 },
    B: { x: 90 + baseLength / 2, y: 195 },
    C: { x: 90 + apexOffset, y: 55 },
  };
}

function buildSecondOffsets(
  baseLength: number,
  apexOffset: number,
): Record<SecondVertex, Point> {
  const firstShape = {
    A: { x: -baseLength / 2, y: 60 },
    B: { x: baseLength / 2, y: 60 },
    C: { x: apexOffset, y: -80 },
  };
  return {
    D: firstShape.C,
    E: firstShape.A,
    F: firstShape.B,
  };
}

function transformSecondPoint(
  point: Point,
  rotation: number,
  reflected: boolean,
): Point {
  const radians = (rotation * Math.PI) / 180;
  const reflectedX = reflected ? -point.x : point.x;
  return {
    x: 290 + reflectedX * Math.cos(radians) - point.y * Math.sin(radians),
    y: 135 + reflectedX * Math.sin(radians) + point.y * Math.cos(radians),
  };
}

export function deriveCorrespondence(order: VertexOrder) {
  const vertexPairs = firstVertices.map(
    (vertex, index) => `${vertex} ↔ ${order[index]}`,
  );
  const sidePairs = sideIndices.map(
    ([firstIndex, secondIndex]) =>
      `${firstVertices[firstIndex]}${firstVertices[secondIndex]} ↔ ${order[firstIndex]}${order[secondIndex]}`,
  );
  const anglePairs = firstVertices.map(
    (vertex, index) => `∠${vertex} ↔ ∠${order[index]}`,
  );

  return { anglePairs, sidePairs, vertexPairs };
}

function getFeedback(order: VertexOrder) {
  const mismatchIndex = order.findIndex(
    (vertex, index) => vertex !== targetOrder[index],
  );
  if (mismatchIndex === -1) {
    return {
      correct: true,
      message: "Correct. The marked correspondence is △ABC ≅ △EFD.",
    };
  }

  return {
    correct: false,
    message: `${firstVertices[mismatchIndex]} corresponds to ${targetOrder[mismatchIndex]}, so position ${mismatchIndex + 1} must be ${targetOrder[mismatchIndex]}, not ${order[mismatchIndex]}.`,
  };
}

function SideMarker({
  first,
  label,
  second,
}: {
  first: Point;
  label: string;
  second: Point;
}) {
  const center = midpoint(first, second);
  return (
    <text className="guide-figure__side-marker" x={center.x} y={center.y}>
      {label}
    </text>
  );
}

export function TriangleCorrespondenceIllustration() {
  const [order, setOrder] = useState<VertexOrder | null>(null);
  const [selectedFirstVertex, setSelectedFirstVertex] = useState<FirstVertex>("A");
  const [selectedSideIndex, setSelectedSideIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [reflected, setReflected] = useState(false);
  const [baseLength, setBaseLength] = useState(90);
  const [apexOffset, setApexOffset] = useState(20);
  const [feedback, setFeedback] = useState<ReturnType<typeof getFeedback> | null>(
    null,
  );
  const correspondence = order ? deriveCorrespondence(order) : null;
  const firstPoints = buildFirstPoints(baseLength, apexOffset);
  const secondOffsets = buildSecondOffsets(baseLength, apexOffset);
  const selectedFirstIndex = firstVertices.indexOf(selectedFirstVertex);
  const selectedSecondVertex = order?.[selectedFirstIndex] ?? null;
  const secondPoints = Object.fromEntries(
    secondVertices.map((vertex) => [
      vertex,
      transformSecondPoint(secondOffsets[vertex], rotation, reflected),
    ]),
  ) as Record<SecondVertex, Point>;

  const selectedSide =
    order && selectedSideIndex !== null ? sideIndices[selectedSideIndex] : null;
  const selectedSecondSide =
    order && selectedSide
      ? [order[selectedSide[0]], order[selectedSide[1]]]
      : null;

  return (
    <section aria-labelledby="correspondence-exercise-title" className="guide-activity">
      <div>
        <span className="eyebrow">Interactive exercise</span>
        <h2 id="correspondence-exercise-title">
          Exercise: find the congruent order
        </h2>
        <p>
          <strong>Given:</strong> the two displayed triangles are congruent. They
          are generated as exact copies of one shared shape. Use the labels and
          numbered sides to state their correspondence in the correct order.
        </p>
      </div>

      <SvgCanvas
        aria-label={`Congruent scalene triangles ABC and DEF are exact copies. Triangle ABC has AB marked 1, BC marked 2, and CA marked 3. Triangle DEF has EF marked 1, FD marked 2, and DE marked 3. The second triangle is ${reflected ? "reflected and " : ""}rotated ${rotation} degrees.`}
        className="guide-figure"
        viewBox="0 0 400 255"
      >
        <polygon
          className="guide-figure__triangle"
          points={`${firstPoints.A.x},${firstPoints.A.y} ${firstPoints.B.x},${firstPoints.B.y} ${firstPoints.C.x},${firstPoints.C.y}`}
        />
        <polygon
          className="guide-figure__triangle guide-figure__triangle--second"
          points={`${secondPoints.D.x},${secondPoints.D.y} ${secondPoints.E.x},${secondPoints.E.y} ${secondPoints.F.x},${secondPoints.F.y}`}
        />

        {selectedSide && selectedSecondSide ? (
          <>
            <Segment
              className="guide-figure__selected-side"
              end={firstPoints[firstVertices[selectedSide[1]]]}
              start={firstPoints[firstVertices[selectedSide[0]]]}
            />
            <Segment
              className="guide-figure__selected-side"
              end={secondPoints[selectedSecondSide[1]]}
              start={secondPoints[selectedSecondSide[0]]}
            />
          </>
        ) : null}

        <SideMarker first={firstPoints.A} label="1" second={firstPoints.B} />
        <SideMarker first={firstPoints.B} label="2" second={firstPoints.C} />
        <SideMarker first={firstPoints.C} label="3" second={firstPoints.A} />
        <SideMarker first={secondPoints.E} label="1" second={secondPoints.F} />
        <SideMarker first={secondPoints.F} label="2" second={secondPoints.D} />
        <SideMarker first={secondPoints.D} label="3" second={secondPoints.E} />

        {Object.entries(firstPoints).map(([vertex, point]) => (
          <g key={vertex}>
            {order && vertex === selectedFirstVertex ? (
              <circle
                className="guide-figure__selection-ring"
                cx={point.x}
                cy={point.y}
                r="11"
              />
            ) : null}
            <StaticPoint
              className="guide-figure__vertex"
              fill={vertexColors[vertex as FirstVertex]}
              label={vertex}
              labelOffset={{ x: 0, y: -13 }}
              point={point}
              radius={7}
            />
          </g>
        ))}
        {Object.entries(secondPoints).map(([vertex, point]) => (
          <g key={vertex}>
            {vertex === selectedSecondVertex ? (
              <circle
                className="guide-figure__selection-ring"
                cx={point.x}
                cy={point.y}
                r="11"
              />
            ) : null}
            <StaticPoint
              className="guide-figure__vertex"
              fill={vertexColors[vertex as SecondVertex]}
              label={vertex}
              labelOffset={{ x: 0, y: -13 }}
              point={point}
              radius={7}
            />
          </g>
        ))}
      </SvgCanvas>

      <fieldset className="guide-shape-controls">
        <legend>Change the shared scalene shape</legend>
        <label>
          <span>Base width</span>
          <input
            max="100"
            min="72"
            onChange={(event) => setBaseLength(Number(event.target.value))}
            type="range"
            value={baseLength}
          />
        </label>
        <label>
          <span>Apex position</span>
          <input
            max="32"
            min="12"
            onChange={(event) => setApexOffset(Number(event.target.value))}
            type="range"
            value={apexOffset}
          />
        </label>
        <p>
          Both triangles change together. These ranges keep all three side
          lengths different, so the congruent correspondence remains unique.
        </p>
      </fieldset>

      <div aria-label="Change the second triangle's appearance" className="guide-controls">
        <button onClick={() => setRotation((value) => (value + 60) % 360)} type="button">
          Rotate second triangle
        </button>
        <button
          onClick={() => setReflected((value) => !value)}
          type="button"
        >
          Reflect second triangle
        </button>
      </div>

      <fieldset className="guide-order-picker">
        <legend>Choose the congruence statement that matches the markings</legend>
        <div className="guide-statement-options">
          {candidateOrders.map((candidateOrder) => {
            const isSelected = order?.every(
              (vertex, index) => vertex === candidateOrder[index],
            ) ?? false;

            return (
              <button
                aria-pressed={isSelected}
                className={
                  isSelected
                    ? "guide-order-button guide-order-button--selected"
                    : "guide-order-button"
                }
                key={candidateOrder.join("")}
                onClick={() => {
                  setOrder(candidateOrder);
                  setSelectedFirstVertex("A");
                  setSelectedSideIndex(null);
                  setFeedback(null);
                }}
                type="button"
              >
                △ABC ≅ △{candidateOrder.join("")}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite" className="guide-current-statement">
        <strong>Your choice</strong>
        <span>{order ? `△ABC ≅ △${order.join("")}` : "No statement selected"}</span>
      </div>

      {correspondence ? (
        <div className="guide-correspondence-grid">
          <div>
            <strong>Vertices</strong>
            {correspondence.vertexPairs.map((pair, index) => (
              <button
                aria-pressed={firstVertices[index] === selectedFirstVertex && selectedSideIndex === null}
                className="guide-inspect-button"
                key={pair}
                onClick={() => {
                  setSelectedFirstVertex(firstVertices[index]);
                  setSelectedSideIndex(null);
                }}
                type="button"
              >
                {pair}
              </button>
            ))}
          </div>
          <div>
            <strong>Sides</strong>
            {correspondence.sidePairs.map((pair, index) => (
              <button
                aria-pressed={index === selectedSideIndex}
                className="guide-inspect-button"
                key={pair}
                onClick={() => setSelectedSideIndex(index)}
                type="button"
              >
                {pair}
              </button>
            ))}
          </div>
          <div>
            <strong>Angles</strong>
            {correspondence.anglePairs.map((pair, index) => (
              <button
                aria-pressed={firstVertices[index] === selectedFirstVertex && selectedSideIndex === null}
                className="guide-inspect-button"
                key={pair}
                onClick={() => {
                  setSelectedFirstVertex(firstVertices[index]);
                  setSelectedSideIndex(null);
                }}
                type="button"
              >
                {pair}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="guide-check">
        <button
          className="guide-check__button"
          disabled={!order}
          onClick={() => {
            if (order) {
              setFeedback(getFeedback(order));
            }
          }}
          type="button"
        >
          Check against the markings
        </button>
        {feedback ? (
          <p
            className={feedback.correct ? "guide-feedback guide-feedback--correct" : "guide-feedback"}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
