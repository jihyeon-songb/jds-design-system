# JDS Design System Design

## Summary

JDS (jh design system) is a public React design system distributed through npm. It provides 20 general-purpose components with shared behavior and accessibility while allowing products to change their visual identity through CSS-variable token overrides.

The first release contains two public packages:

- `@jds/tokens`
- `@jds/components`

Storybook is developed in the same repository but is not published as an npm package. Additional theme packages are created only when a real product needs one.

## Goals

- Give all components consistent APIs, states, keyboard behavior, focus management, and accessibility semantics.
- Let designers change or add tokens without editing component implementation.
- Let products create distinct themes by overriding semantic tokens rather than copying components.
- Meet WCAG 2.2 AA as the baseline.
- Publish independently consumable React packages to npm.

## Non-goals

- Commerce-specific components are not part of the first 20.
- JDS will not build a custom Figma plugin.
- JDS will not include a JavaScript theme provider.
- Automated npm publishing is deferred until releases become frequent.
- Visual-regression infrastructure is deferred until the component library has stable reference designs.

## Repository

JDS uses a pnpm workspace monorepo:

```text
jh-design-system/
├── packages/
│   ├── tokens/       # @jds/tokens
│   └── components/   # @jds/components
└── apps/
    └── storybook/    # documentation and component verification
```

Packages build and publish independently. Workspace development keeps token, component, documentation, and test changes synchronized.

## Package Architecture

### `@jds/tokens`

The tokens package owns token source files and generates:

- CSS custom properties
- JavaScript token exports
- TypeScript declarations

Token source files use the stable DTCG 2025.10 JSON format so they can be exchanged with compatible design tools.

### `@jds/components`

The components package owns React APIs, states, accessibility behavior, and JDS styling. Components consume semantic CSS variables and contain no hard-coded product colors, spacing, typography, shadows, or border radii.

Native HTML behavior is used wherever it is sufficient. Complex widgets use Radix UI primitives for WAI-ARIA semantics, keyboard navigation, and focus management. JDS adds its own API, tokens, default styles, documentation, and tests. shadcn/ui is a reference for composable component APIs and documentation, not a runtime dependency or distribution model.

React and Radix UI are peer dependencies so consuming applications do not receive duplicate runtime copies.

## Token Model

Tokens have three layers:

1. Primitive tokens store raw design values such as `blue.600`, `space.4`, and `radius.2`.
2. Semantic tokens describe intent such as `color.action.primary`, `color.surface.default`, and `radius.control`.
3. Component tokens describe exceptional component-specific needs such as `button.background`.

Components primarily consume semantic tokens. A theme overrides semantic values while inheriting all unspecified values from the default theme. Component tokens are added only when one component genuinely needs an independent value.

Token changes flow through the system as follows:

```text
Figma or token editor
        ↓
DTCG *.tokens.json
        ↓ validation and build
@jds/tokens
        ↓
@jds/components
        ↓
product theme CSS overrides
```

The token build rejects invalid token types, missing aliases, circular references, and duplicate output names. A partial theme safely falls back to the default semantic values.

Products activate themes through CSS imports or a `data-theme` attribute. No runtime JavaScript is required, so theming also works during server rendering.

## Components

The first release contains 20 general-purpose components:

### Input

1. Input
2. Textarea
3. Select
4. Checkbox
5. RadioGroup
6. Switch
7. Label
8. FormField

### Action and information

9. Button
10. IconButton
11. Alert
12. Badge
13. Avatar

### Navigation and overlays

14. Tabs
15. Accordion
16. Dialog
17. Drawer
18. Tooltip
19. Toast
20. Pagination

## Component API Rules

- Components forward refs and applicable native HTML attributes.
- Stateful components support controlled and uncontrolled use where both modes are meaningful.
- Visual and interactive states are exposed through stable `data-state` attributes.
- Variants and sizes use a small documented union rather than arbitrary strings.
- Required accessibility information is represented in TypeScript where practical. For example, `IconButton` requires an accessible name.
- Public APIs wrap primitive implementation details so JDS can update its internal dependency without changing consumer code.

## Accessibility Contract

WCAG 2.2 AA is the minimum target. JDS also adopts the applicable WAI-ARIA Authoring Practices interaction patterns.

- Every interactive component is operable with a keyboard and has a visible focus indicator.
- Focus order remains logical and focused elements are not hidden by authored overlays or sticky content.
- The focus indicator is at least 2 CSS pixels thick and maintains a 3:1 visual difference from its unfocused state.
- `FormField` connects labels, descriptions, requirements, and errors to the form control.
- `Dialog` and `Drawer` move focus inside when opened, keep modal focus contained, close with Escape where safe, and return focus to the trigger.
- `Toast` and `Alert` announce relevant status changes without unexpectedly moving focus.
- Tabs, Accordion, RadioGroup, and other composite widgets follow their WAI-ARIA keyboard patterns.
- State and meaning are never communicated by color alone.
- Text, icons, controls, boundaries, and focus indicators meet applicable contrast requirements.
- Interactive targets meet the WCAG 2.2 AA minimum of 24 by 24 CSS pixels. Buttons and icon buttons default to at least 44 by 44 CSS pixels.
- Hover-only information and actions are prohibited; equivalent keyboard and touch behavior is required.
- Components respect browser zoom, `prefers-reduced-motion`, forced-colors mode, and high-contrast settings.
- Native HTML elements are preferred over recreating semantics with ARIA.

## Documentation

Storybook documents each component's:

- purpose and appropriate usage
- API and composition
- default, hover, focus, active, disabled, invalid, and loading states where applicable
- theme behavior
- accessible-name and labeling requirements
- keyboard interaction table
- examples with short, long, and error-state content

Storybook uses its official accessibility addon to run axe against rendered stories. Accessibility violations fail the relevant story test.

## Verification

Each component leaves the smallest useful set of checks:

- Type checking for public props and generated token declarations
- Component behavior tests for state transitions and event handling
- Browser interaction tests for keyboard navigation and focus behavior in complex widgets
- Automated axe checks for every Storybook story
- Manual keyboard review for all interactive components
- Manual screen-reader review for Dialog, Drawer, Tabs, Select, Tooltip, Toast, RadioGroup, and Accordion
- Manual review at browser zoom, reduced-motion, and forced-colors settings

Automated checks do not replace manual accessibility testing. A release must pass type checking, tests, and production builds.

## Publishing and Versioning

Both npm packages are public and share a release cadence. The initial workflow uses an explicit manual publish after verification.

- Adding a token or backward-compatible component capability increments the minor version.
- Changing a token value or fixing behavior without changing the API increments the patch version.
- Removing or renaming a token, changing component API compatibility, or changing established interaction behavior increments the major version.

The npm scope is `@jds`, matching the approved package names. Publishing requires access to that npm scope; if the scope cannot be claimed, only the scope prefix changes while package boundaries and APIs remain the same.

## References

- W3C Web Content Accessibility Guidelines 2.2
- W3C ARIA Authoring Practices Guide
- Design Tokens Community Group Format Module 2025.10
- Radix Primitives accessibility guidance
- shadcn/ui component composition
- Carbon Design System accessibility tests
- GOV.UK Design System accessibility strategy
- Storybook accessibility testing
