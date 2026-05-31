# Changelog

All notable changes to the **Cognify** project are documented in this file.

---

## [1.0.0] - 2026-05-31

This release marks the stable **1.0.0 production baseline** of the Cognify training platform. It includes a completely restructured localization engine, an adaptive cognitive gaming suite, a dynamicHeadspace-style results breakdown, interactive streak dashboards, and robust account management systems.

### Added
- **CSV Localization Engine**: Introduced a centralized, comma-safe localization script (`npm run strings`) to compile 288+ cased keys from `src/constants/strings.csv` into a lightweight, memory-efficient JavaScript key-value database (`stringsData.js`).
- **Complete Suite of 6 Cognitive Training Games**:
  - *Signal Chain (Memory)*: 3x3 node grid sequence recall with real-time response window tracking.
  - *Flash Sort (Speed)*: Centered visual reaction time classification with left/right permanent split-tap regions.
  - *Lighthouse Watch (Attention)*: Sliding vigilance stars with high-frequency false start penalties and sub-perceptual opacity visual pulses.
  - *Context Switch (Executive)*: Alternate classification matrices controlled dynamically by visual switching border rules.
  - *Word Weave (Verbal)*: Structural verbal reasoning puzzle solving stems with time-gated option menus.
  - *Pattern Fold (Spatial)*: 3D-rotated grid alignments with alignment easing animation offsets.
- **Onboarding Assessment Overhaul**: Completely remade the 6 onboarding baseline puzzles from low-fidelity mockups into high-fidelity representations of our full internal game suite, establishing unified baseline scoring.
- **Duolingo-Style Interactive Streak Overlay**: Tappable flame streak badges triggering modal overlays, looping amber light animation effects, local calendar tracking, and streak freeze shields.
- **Settings & Logout System**: Fully integrated a confirmation modal gated account deletion settings option inside `ProfileScreen.js` that purges local async data structures cleanly and updates the reactive route back to onboarding.

### Fixed
- **Title Case Synchronization**: Eliminated all overriding `textTransform: 'lowercase'` stylesheets from screen navigation tabs, headers, buttons, CTAs, and dashboard statistics to resolve previous design discrepancies.
- **Insights Rendering Crashes**: Resolved chart layout overflow failures and null-mapping timeline graph crash states in `InsightsScreen.js` by incorporating self-healing container styles and timezone-safe fallback data hydrators.
- **CSV Quoting Comma Splitting**: Wrapped comma-containing keys (like `"Yes, Log Out"`) inside double quotes in the CSV source to protect string splits during compiler runs.
- **ProcessingScreen Layout Compile**: Restored the missing React functional definition header for `ProcessingScreen` inside `AssessmentScreens.js`, resolving Metro bundling compiler failures.

---

## [0.5.0] - 2026-05-15
### Added
- Initial UI layout shells for Home, Train, Insights, and Profile screens.
- Global styling parameters, design colors, typography scales, and safe area themes.
- Redux-style mock global context hooks (`AppContext.js`) and database configurations.
