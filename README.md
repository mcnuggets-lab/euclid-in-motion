# Euclid in Motion

Explore Euclidean axioms and discover geometry theorems through interactive
figures. The workspace is a Vite + React + TypeScript application.

# Current direction

- The geometry explorer lives at the repository root.
- `src/data/` contains the local axioms, reading guides, theorem lessons, and
  shared geometry vocabulary used by the frontend.

# Setup

Install dependencies and start the development server from the project root:

Node.js 22.18 or newer is required.

```bash
npm install
npm run dev
```

The frontend reads its lesson content directly from `src/data/`.

# Development

Build the frontend for production:

```bash
npm run build
```

The production build validates theorem ids, dependencies, and illustration
registrations before compiling. Run the same quality gate used by CI with:

```bash
npm run check
```

Run individual checks while editing content or code:

```bash
npm run typecheck
npm run validate:catalog
npm test
```

# Repository layout

```text
euclid-in-motion
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── data/
│   │   ├── axioms/              local axiom-group content
│   │   ├── axiom-explorations/  focused postulate explorations
│   │   ├── guides/              notation and reading guides
│   │   ├── theorems/            local theorem lesson content
│   │   └── definitions.json     shared geometry vocabulary
│   ├── features/
│   ├── hooks/
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```
