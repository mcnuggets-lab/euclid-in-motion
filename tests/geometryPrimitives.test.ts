import assert from "node:assert/strict";
import test from "node:test";

import {
  angleBetweenPoints,
  constrainLineSeparation,
  constrainApexToBounds,
  intersectRays,
  minorArcPath,
  projectPointOntoLine,
} from "../src/features/geometry/geometryPrimitives.ts";

test("intersects two forward rays and reports both scales", () => {
  assert.deepEqual(
    intersectRays(
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 10, y: 0 },
      { x: -1, y: 1 },
    ),
    {
      firstScale: 5,
      point: { x: 5, y: 5 },
      secondScale: 5,
    },
  );
});

test("rejects parallel rays and intersections behind an origin", () => {
  assert.equal(
    intersectRays(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ),
    null,
  );
  assert.equal(
    intersectRays(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 1 },
    ),
    null,
  );
});

test("calculates the smaller angle between three points", () => {
  assert.ok(
    Math.abs(
      angleBetweenPoints(
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 4 },
      ) - 90,
    ) < 1e-10,
  );
});

test("renders the minor SVG arc in either direction", () => {
  const clockwisePath = minorArcPath(
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 0, y: 10 },
    5,
  );
  const counterclockwisePath = minorArcPath(
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 0, y: -10 },
    5,
  );

  assert.match(clockwisePath, /^M 5 0 A 5 5 0 0 1 /);
  assert.match(counterclockwisePath, /^M 5 0 A 5 5 0 0 0 /);

  const [clockwiseX, clockwiseY] = clockwisePath.split(" ").slice(-2).map(Number);
  const [counterclockwiseX, counterclockwiseY] = counterclockwisePath
    .split(" ")
    .slice(-2)
    .map(Number);
  assert.ok(Math.abs(clockwiseX) < 1e-10);
  assert.equal(clockwiseY, 5);
  assert.ok(Math.abs(counterclockwiseX) < 1e-10);
  assert.equal(counterclockwiseY, -5);
});

test("rounds and constrains draggable apex coordinates", () => {
  const bounds = {
    maximumHeight: 108,
    maximumX: 148,
    minimumHeight: 54,
    minimumX: 16,
  };

  assert.deepEqual(constrainApexToBounds({ x: 82.4, y: 67.6 }, 156, bounds), {
    height: 88,
    x: 82,
  });
  assert.deepEqual(constrainApexToBounds({ x: 200, y: 300 }, 156, bounds), {
    height: 54,
    x: 148,
  });
});

test("keeps draggable lines separated without flipping to the opposite branch", () => {
  assert.equal(constrainLineSeparation(22, 30, 20, 8), 28);
  assert.equal(constrainLineSeparation(20, 28, 20, 8), 28);
  assert.equal(constrainLineSeparation(201, 208, 20, 8), 208);
  assert.equal(constrainLineSeparation(60, 30, 20, 8), 60);
});

test("projects a point onto an infinite line", () => {
  const projected = projectPointOntoLine(
    { x: 6, y: 4 },
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  );

  assert.deepEqual(projected, { x: 6, y: 0 });
  assert.deepEqual(
    projectPointOntoLine(
      { x: 8, y: 3 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ),
    { x: 5, y: 5 },
  );
});
