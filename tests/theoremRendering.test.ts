import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("renders detail-page navigation through the production module graph", async () => {
  const server = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const [
      { TheoremPage },
      { AxiomPage },
      {
        ConvexPolygonAngleSumIllustration,
        ConvexPolygonExteriorAngleSumCorollaryIllustration,
      },
    ] = await Promise.all([
      server.ssrLoadModule("/src/features/content/TheoremPages.tsx"),
      server.ssrLoadModule("/src/features/content/AxiomPages.tsx"),
      server.ssrLoadModule(
        "/src/features/theorems/illustrations/ConvexPolygonAngleSumIllustration.tsx",
      ),
    ]);
    const theoremMarkup = renderToStaticMarkup(
      createElement(TheoremPage, {
        activeStep: null,
        discovery: null,
        onDiscoveryChange() {},
        onNavigate() {},
        onStepChange() {},
        theoremId: "angle-addition",
      }),
    );

    assert.match(theoremMarkup, /<h1[^>]*>Angle Addition Theorem<\/h1>/);
    assert.match(theoremMarkup, /aria-label="Breadcrumb"/);
    assert.match(theoremMarkup, /Back to all theorems/);
    assert.match(theoremMarkup, /Previous theorem/);
    assert.match(theoremMarkup, /Next theorem/);
    assert.match(theoremMarkup, /Theorem statement/);
    assert.match(theoremMarkup, /Loading interactive figure…/);

    const polygonTheoremMarkup = renderToStaticMarkup(
      createElement(TheoremPage, {
        activeStep: null,
        discovery: null,
        onDiscoveryChange() {},
        onNavigate() {},
        onStepChange() {},
        theoremId: "convex-polygon-angle-sum",
      }),
    );

    assert.match(
      polygonTheoremMarkup,
      /<h1[^>]*>Convex Polygon Angle Sum Theorem<\/h1>/,
    );
    assert.match(polygonTheoremMarkup, /Corollary: Exterior Angle Sum/);
    assert.match(polygonTheoremMarkup, /Justify the triangular partition/);

    const polygonIllustrationMarkup = renderToStaticMarkup(
      createElement(ConvexPolygonAngleSumIllustration, {
        activeStep: 5,
        onDiscoveryChange() {},
      }),
    );
    assert.match(
      polygonIllustrationMarkup,
      /aria-label="Convex 6-gon divided into 4 fan triangles"/,
    );
    assert.match(polygonIllustrationMarkup, /Interior-angle total/);
    assert.match(polygonIllustrationMarkup, /720°/);

    const exteriorIllustrationMarkup = renderToStaticMarkup(
      createElement(ConvexPolygonExteriorAngleSumCorollaryIllustration),
    );
    assert.match(exteriorIllustrationMarkup, /5 × 72° = 360°/);

    const axiomMarkup = renderToStaticMarkup(
      createElement(AxiomPage, {
        axiomId: "incidence",
        onNavigate() {},
      }),
    );

    assert.match(axiomMarkup, /<h1[^>]*>Incidence Axioms<\/h1>/);
    assert.match(axiomMarkup, /Back to all axioms/);
    assert.doesNotMatch(axiomMarkup, /Previous axiom/);
    assert.match(axiomMarkup, /Next axiom/);
  } finally {
    await server.close();
  }
});
