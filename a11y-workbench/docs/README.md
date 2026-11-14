# a11y-workbench — documentation index

This is the entry point to the documentation system. It is written for an
engineer who has never seen the project and needs to understand, run, change,
test, deploy, debug and operate it.

Everything here describes the **current implementation** and cites the source
files it refers to. Where a claim could not be verified, it says so.

## Orientation (read in this order)

| # | Document | Why read it |
| --- | --- | --- |
| 1 | [`ARCHITECTURE.md`](ARCHITECTURE.md) | What the system is made of and why. |
| 2 | [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) | Where every file lives and what it does. |
| 3 | [`SETUP.md`](SETUP.md) | Get it running locally. |
| 4 | [`DEVELOPMENT.md`](DEVELOPMENT.md) | Conventions and day-to-day workflow. |
| 5 | [`guides/developer-guide.md`](guides/developer-guide.md) | Task-oriented recipes. |

## Reference

| Document | Contents |
| --- | --- |
| [`CONFIGURATION.md`](CONFIGURATION.md) | Every config value, limit, token and constant. |
| [`ENVIRONMENT.md`](ENVIRONMENT.md) | OS, runtime versions, browser support. |
| [`DEPENDENCIES.md`](DEPENDENCIES.md) | Every direct dependency and why it exists. |
| [`BUILD.md`](BUILD.md) | Build modes, artifacts, failure modes. |
| [`TESTING.md`](TESTING.md) | Strategy, test matrix, how to run, gaps. |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Static hosting, verification, rollback. |
| [`OPERATIONS.md`](OPERATIONS.md) | Start/stop, monitoring, backup, recovery. |
| [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | Symptoms → cause → fix. |
| [`SECURITY.md`](SECURITY.md) | Threat model, controls, limitations. |
| [`PERFORMANCE.md`](PERFORMANCE.md) | Measured engine timings, bundle sizes, optimisations. |
| [`ACCESSIBILITY.md`](ACCESSIBILITY.md) | The app's own WCAG position, with measured ratios. |
| [`CHANGELOG.md`](CHANGELOG.md) | Changes in this work package. |
| [`DOCUMENTATION_COVERAGE.md`](DOCUMENTATION_COVERAGE.md) | Coverage audit matrix. |

## Deep dives

### Architecture

| Document | Contents |
| --- | --- |
| [`architecture/system-overview.md`](architecture/system-overview.md) | Subsystems, responsibilities, boundaries. |
| [`architecture/application-flow.md`](architecture/application-flow.md) | Initialisation, routing, user flows. |
| [`architecture/data-flow.md`](architecture/data-flow.md) | Data movement per workflow, with sequence diagrams. |
| [`architecture/state-management.md`](architecture/state-management.md) | Store shape, update path, derived data. |
| [`architecture/error-handling.md`](architecture/error-handling.md) | Every failure mode and its handling. |
| [`architecture/decisions.md`](architecture/decisions.md) | Engineering decisions with context and consequences. |

### Modules (one per subsystem)

[`modules/audit-engine.md`](modules/audit-engine.md) ·
[`modules/dom-utilities.md`](modules/dom-utilities.md) ·
[`modules/color-and-contrast.md`](modules/color-and-contrast.md) ·
[`modules/storage-repository.md`](modules/storage-repository.md) ·
[`modules/workspace-state.md`](modules/workspace-state.md) ·
[`modules/routing.md`](modules/routing.md) ·
[`modules/exporters.md`](modules/exporters.md) ·
[`modules/design-system.md`](modules/design-system.md) ·
[`modules/samples.md`](modules/samples.md)

### Components

[`components/ui-primitives.md`](components/ui-primitives.md) ·
[`components/app-shell.md`](components/app-shell.md) ·
[`components/screens.md`](components/screens.md)

### API (no network API — internal contracts)

[`api/overview.md`](api/overview.md) ·
[`api/engine-api.md`](api/engine-api.md) ·
[`api/repository-api.md`](api/repository-api.md) ·
[`api/storage-api.md`](api/storage-api.md) ·
[`api/browser-apis.md`](api/browser-apis.md)

### Data

[`database/schema.md`](database/schema.md) ·
[`database/models.md`](database/models.md)

### Testing

[`testing/test-strategy.md`](testing/test-strategy.md) ·
[`testing/test-cases.md`](testing/test-cases.md)

### Guides

[`guides/developer-guide.md`](guides/developer-guide.md) ·
[`guides/debugging-guide.md`](guides/debugging-guide.md) ·
[`guides/extension-guide.md`](guides/extension-guide.md)

### Baseline analysis

[`analysis/existing-implementation.md`](analysis/existing-implementation.md) —
what the repository contained before this work ·
[`analysis/solution-design.md`](analysis/solution-design.md) — the design that
was implemented.

## Conventions used in this documentation

* **Paths are repository-relative** and always start with the topic folder, e.g.
  `src/engine/audit.ts`.
* **Mermaid diagrams** describe real flows; none are decorative.
* **Measurements** are real values produced in this environment, with the method
  stated. Nothing is estimated and presented as measured.
* **"Not verified"** is used where a claim could not be tested here (e.g. real
  browser rendering), instead of asserting it.
