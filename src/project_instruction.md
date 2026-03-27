# Codex Component Implementation Guide

Use this checklist before adding or refactoring any component in the project.

## 1. Analyze Component Structure

- Identify whether the component is:
  - a page-level container
  - a shared layout component
  - a form/table workflow component
  - a small presentational component
- Prefer keeping page orchestration in page files and reusable UI patterns in shared components.
- Avoid duplicating navigation labels, page ids, or status strings across files.

## 2. Identify Required Dependencies

- Confirm whether the component needs:
  - `react` hooks such as `useState`, `useEffect`, `useMemo`, `useRef`
  - `react-dom` utilities such as `createPortal`
  - shared page metadata from `src/config/appPages.js`
  - project icons from `lucide-react`
- Do not introduce a second icon system unless there is a strong requirement.
- Do not add a new package if the same behavior can be achieved with existing React and CSS.

## 3. Review Component Arguments and State

For each component, document:

- incoming props
- derived values
- local UI state
- event handlers
- side effects

Keep these rules:

- props should describe external data or actions
- derived values should use memoization only when it improves clarity or avoids repeated expensive work
- local state should stay close to the UI that owns it
- page-level navigation state should stay in `App.jsx`

## 4. Check Context Providers or Hooks

Before implementation, ask:

- Does the component need global app state, or can props handle it?
- Does it need a portal for overlays or modals?
- Does it depend on browser APIs such as fullscreen, file upload, or body scroll locking?
- Does it need cleanup for object URLs, timers, or document listeners?

Current project guidance:

- Keep global shell state in `App.jsx`
- Prefer prop passing over adding new context providers unless multiple distant branches need the same live state
- For overlays and preview dialogs, use `createPortal` when layout stacking can break inside the page tree

## 5. Questions to Ask Before Building

- What data or props will be passed to this component?
- Are there any specific state management requirements?
- Are there any required assets such as images, icons, or seed data?
- What is the expected responsive behavior on mobile, tablet, laptop, and desktop?
- What is the best place to use this component in the app?

## 6. Responsive Behavior Expectations

Every new component should be checked at these breakpoints:

- mobile: 0-767px
- tablet: 768-1023px
- desktop: 1024-1439px
- wide desktop: 1440px and above

Expected behavior:

- layouts should stack before they feel cramped
- tables should preserve readability with overflow handling or row restructuring
- dialogs should fit within the viewport without clipping against the navbar or sidebar
- collapsed sidebar states should not break page-level overlays

## 7. Placement Rules for This App

- `App.jsx` owns active page selection, shell state, theme, and top-level transitions
- `src/config/appPages.js` owns shared page ids and sidebar navigation metadata
- `src/components/` owns reusable shell components such as navbar and sidebar
- `src/pages/` owns workflow-heavy screens and page-specific state
- `src/App.css` and `src/index.css` own the visual system and responsive layout rules

## 8. Final Verification

Before shipping a component:

- verify imports are actually used
- verify no duplicated page ids or route labels were introduced
- verify dark mode and light mode contrast
- verify keyboard focus visibility
- verify modal layering and scroll behavior
- verify `npm run build` passes
