import assert from "node:assert/strict";
import test from "node:test";

import { normalizePath, toAppPath, toHref } from "../src/utils/baseUrl.ts";

test("normalizePath cleans up trailing slashes and empty paths", () => {
  assert.equal(normalizePath(""), "/");
  assert.equal(normalizePath("/"), "/");
  assert.equal(normalizePath("/axioms/"), "/axioms");
  assert.equal(normalizePath("/axioms"), "/axioms");
});

test("toAppPath converts browser pathname to app route when base is /euclid-in-motion/", () => {
  const base = "/euclid-in-motion/";

  assert.equal(toAppPath("/euclid-in-motion", base), "/");
  assert.equal(toAppPath("/euclid-in-motion/", base), "/");
  assert.equal(toAppPath("/euclid-in-motion/axioms", base), "/axioms");
  assert.equal(toAppPath("/euclid-in-motion/axioms/", base), "/axioms");
  assert.equal(
    toAppPath("/euclid-in-motion/theorems/linear-pair", base),
    "/theorems/linear-pair",
  );
  assert.equal(toAppPath("/axioms", base), "/axioms");
});

test("toAppPath converts browser pathname to app route when base is /", () => {
  const base = "/";

  assert.equal(toAppPath("", base), "/");
  assert.equal(toAppPath("/", base), "/");
  assert.equal(toAppPath("/axioms", base), "/axioms");
  assert.equal(toAppPath("/theorems/linear-pair", base), "/theorems/linear-pair");
});

test("toHref converts app route to browser pathname when base is /euclid-in-motion/", () => {
  const base = "/euclid-in-motion/";

  assert.equal(toHref("/", base), "/euclid-in-motion/");
  assert.equal(toHref("/axioms", base), "/euclid-in-motion/axioms");
  assert.equal(
    toHref("/theorems/linear-pair", base),
    "/euclid-in-motion/theorems/linear-pair",
  );
  assert.equal(
    toHref("/axioms#about-axiom-system", base),
    "/euclid-in-motion/axioms#about-axiom-system",
  );
  assert.equal(toHref("#section", base), "/euclid-in-motion/#section");
  assert.equal(toHref("/euclid-in-motion/axioms", base), "/euclid-in-motion/axioms");
});

test("toHref converts app route to browser pathname when base is /", () => {
  const base = "/";

  assert.equal(toHref("/", base), "/");
  assert.equal(toHref("/axioms", base), "/axioms");
  assert.equal(toHref("/theorems/linear-pair", base), "/theorems/linear-pair");
});
