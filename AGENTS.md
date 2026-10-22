<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Taiwan 3D Project Context

Read `CONTEXT.md` and `.cursor/rules/` (`project-context.mdc`, `code-organization.mdc`, `threejs-r3f-conventions.mdc`) for complete project architecture, dataset rules (`/data`), modular folder structure (`components/3d/<feature>/`, `components/ui/<feature>/`, `lib/data/`), 3D coordinate system (`lib/data/coordinates.ts`), React 19 `<WorldHtml>` overlay conventions, and map navigation rules (`components/3d/CameraRig.tsx`). Keep every file small (< 390 lines) with a single responsibility.

