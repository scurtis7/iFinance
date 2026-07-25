# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` / `ng serve` — run the dev server at `http://localhost:4200/` with live reload.
- `npm run build` / `ng build` — production build, output to `dist/fin-client`.
- `npm run watch` / `ng build --watch --configuration development` — dev-mode build with watch.
- `npm test` / `ng test` — run unit tests via Karma/Jasmine (opens Chrome). To run a single spec, use `ng test --include='**/footer.component.spec.ts'` (path relative to `src`).
- `ng generate component components/<name>` — scaffold a new standalone component (defaults to SCSS styling per `angular.json` schematics config).

No e2e test runner or linter is currently configured in this repo.

**Never run `npm start` / `ng serve`.** The user runs the dev server themselves; do not start it on their behalf.

## Architecture

This is an Angular 18 standalone-component app (no NgModules) using PrimeNG 18 for UI components.

- **Bootstrap/config**: `src/app/app.config.ts` wires up router, zone change detection, async animations, and PrimeNG theming via `providePrimeNG`.
- **Theming**: `src/app/color-presets.ts` defines a custom PrimeNG theme (`ColorPresets`) built with `definePreset(Aura, ...)`, overriding the `primary` and `surface` semantic color scales for light/dark. Dark mode is toggled by adding/removing the `my-app-dark` class on `<html>` (see `HeaderComponent.toggleDarkMode()`), matching the `darkModeSelector: '.my-app-dark'` set in `app.config.ts`.
- **Routing**: `src/app/app.routes.ts` is minimal — everything redirects to `home` (`BudgetComponent`). Add new routes here as pages are built out.
- **Layout shell**: `AppComponent` renders a fixed three-region shell (`app.component.html`): `app-header` on top, `app-side-menu` + `router-outlet` (`main-content`) side by side, `app-footer` at the bottom. New pages are added as routed components rendered inside `main-content`; the header/side-menu/footer persist across navigation.
- **Components**: standalone components live under `src/app/components/<name>/`, each with its own `.ts`/`.html`/`.scss`. They import PrimeNG modules directly (e.g. `Menubar`, `ToggleButton`, `Card`, `Button`) rather than through a shared shell module.
- **Global styles**: `src/styles.scss` imports PrimeIcons and sets the base font; component-level styling is otherwise scoped per-component via `styleUrl`.
