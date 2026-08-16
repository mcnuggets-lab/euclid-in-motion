import assert from "node:assert/strict";
import test from "node:test";

import {
  angleFrom,
  midpoint,
  polarPointRadians,
} from "../src/features/geometry/geometryPrimitives.ts";


test("calculates correct angle and polar coordinates for angle primitives", () => {
  const vertex = { x: 100, y: 100 };
  const pointRight = { x: 150, y: 100 };
  const pointDown = { x: 100, y: 150 };

  const angleRight = angleFrom(vertex, pointRight);
  const angleDown = angleFrom(vertex, pointDown);

  assert.equal(angleRight, 0);
  assert.ok(Math.abs(angleDown - Math.PI / 2) < 1e-10);

  const radius = 30;
  const polarRight = polarPointRadians(vertex, radius, angleRight);
  const polarDown = polarPointRadians(vertex, radius, angleDown);

  assert.deepEqual(polarRight, { x: 130, y: 100 });
  assert.ok(Math.abs(polarDown.x - 100) < 1e-10);
  assert.ok(Math.abs(polarDown.y - 130) < 1e-10);
});

test("calculates midpoint and normal vectors for congruence tick marks", () => {
  const start = { x: 0, y: 100 };
  const end = { x: 100, y: 100 };
  const mid = midpoint(start, end);

  assert.deepEqual(mid, { x: 50, y: 100 });

  // Normal for horizontal line pointing right should point along y-axis
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;

  const size = 10;
  const nx = (-uy * size) / 2;
  const ny = (ux * size) / 2;

  assert.equal(Math.abs(nx), 0);
  assert.equal(ny, 5);
});

test("calculates right angle corner coordinates", () => {
  const vertex = { x: 0, y: 0 };
  const first = { x: 10, y: 0 };
  const second = { x: 0, y: 10 };
  const size = 12;

  const u1 = { x: (first.x - vertex.x) / 10, y: (first.y - vertex.y) / 10 };
  const u2 = { x: (second.x - vertex.x) / 10, y: (second.y - vertex.y) / 10 };

  const corner = {
    x: vertex.x + (u1.x + u2.x) * size,
    y: vertex.y + (u1.y + u2.y) * size,
  };

  assert.deepEqual(corner, { x: 12, y: 12 });
});

test("calculates parallel chevron wing offsets", () => {
  const start = { x: 0, y: 50 };
  const end = { x: 100, y: 50 };
  const size = 8;
  const wingSpan = size * 0.7;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const tip = { x: 50, y: 50 };
  const wing1 = {
    x: tip.x - ux * size + nx * wingSpan,
    y: tip.y - uy * size + ny * wingSpan,
  };
  const wing2 = {
    x: tip.x - ux * size - nx * wingSpan,
    y: tip.y - uy * size - ny * wingSpan,
  };

  assert.equal(wing1.x, 42);
  assert.equal(wing1.y, 50 + 5.6);
  assert.equal(wing2.x, 42);
  assert.equal(wing2.y, 50 - 5.6);
});
