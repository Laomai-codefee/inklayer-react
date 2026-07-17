# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.13](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.12...v1.0.13) (2026-07-17)


### Bug Fixes

* cancel stale annotator initialization ([01dd779](https://github.com/Laomai-codefee/inklayer-react/commit/01dd7799461e775968bc648ea8bc32cc84326fb9))
* clean up text selection listeners ([214061b](https://github.com/Laomai-codefee/inklayer-react/commit/214061bd00ab0aa30150ea584ff58458f459408a))
* improve consumer compatibility ([fedbfa8](https://github.com/Laomai-codefee/inklayer-react/commit/fedbfa8f834b7718c64234e26ee528fa93b14f0d))
* prevent stale PDF async updates ([508507c](https://github.com/Laomai-codefee/inklayer-react/commit/508507cd533b3cf279ab93f6a628c77bf094f266))
* strengthen runtime stability and quality checks ([f8edc2f](https://github.com/Laomai-codefee/inklayer-react/commit/f8edc2f63ffa2f1d696e18043f021ca5e0bddb1c))

### [1.0.12](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.11...v1.0.12) (2026-07-06)

### [1.0.11](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.10...v1.0.11) (2026-07-06)


### Features

* sidebar overlay on narrow screens (≤840px) ([b126c49](https://github.com/Laomai-codefee/inklayer-react/commit/b126c494d48d945f0e5294e8bb14a61cf4cf8fcd))

### [1.0.10](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.9...v1.0.10) (2026-07-02)

### [1.0.9](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.8...v1.0.9) (2026-07-02)


### Bug Fixes

* add type declaration for ./style export to resolve TS2882 error ([61bd0b6](https://github.com/Laomai-codefee/inklayer-react/commit/61bd0b68a892a1af5da5e8cb101a53a1b7bea9c8))

### [1.0.8](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.7...v1.0.8) (2026-07-02)

### [1.0.7](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.6...v1.0.7) (2026-07-01)

### [1.0.6](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.5...v1.0.6) (2026-07-01)


### Bug Fixes

* incorrect arrow head coordinates in PDF export (groupX/groupY not scaled by viewport.scale) ([cc6123d](https://github.com/Laomai-codefee/inklayer-react/commit/cc6123d4e7f4bad4111bc5b6cbe9efbc54063bec))

### [1.0.5](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.4...v1.0.5) (2026-07-01)


### Bug Fixes

* clamp progress bar value to prevent exceeding max=100 ([db0a210](https://github.com/Laomai-codefee/inklayer-react/commit/db0a210df637e7f95ac94be873fda7dcf73c141b))

### [1.0.4](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.3...v1.0.4) (2026-06-29)


### Bug Fixes

* remove flex center from viewer container to fix horizontal overflow clipping ([0ee4447](https://github.com/Laomai-codefee/inklayer-react/commit/0ee444731109a304a8d686086f3590ea5de63191))

### [1.0.3](https://github.com/Laomai-codefee/inklayer-react/compare/v1.0.2...v1.0.3) (2026-06-28)

## [1.0.2] - 2026-06-26

### Fix

- SquareParser fallback to first child attrs for non-Rect shapes

## [1.0.1]

### Feat

- demo headless mode, annotator tabs first

### Fix

- annotator demo
- headless mode

### Docs

- rewrite README — concise, bilingual, aligned with Vue

### Chore

- bump version to 1.0.1
- rebuild demo

## [1.0.0]

### Fix

- CSS export case, ?url worker import, move peer deps to deps

### Chore

- swap default README to zh-CN, rename English to README-en-US.md
- 更新README和demo构建产出
- bump version to 1.0.0

## [0.4.1]

### Refactor

- restructure demo and build config

### Fix

- import logo as module for proper build path
- use relative logo path
- package name must be lowercase (npm restriction)

### Docs

- update README

## [0.4.0]

### Refactor

- rebrand: rename project from pdfjs-annotation-extension-for-react to inklayer-react

### Chore

- lint

## [0.3.0]

### Feat

- introduce InkLayer Annotation Core v0.1 and migrate PdfAnnotator public API

### Fix

- improve text highlight rendering clarity

### Chore

- update readme

## [0.2.6]

### Fix

- annotation export misalignment caused by pdfPageRotate

## [0.2.5]

### Feat

- add support for loading PDF from data source

### Docs

- update README

## [0.2.4]

### Feat

- add Dark/Light mode support

## [0.2.3]

### Feat

- viewer add showAnnotations prop to control native annotation rendering
- viewer add download and print support

### Fix

- Adjust spacing and alignment of toolbar buttons
- prevent arrow head from being lost during export
- resolve mismatch issue when exporting cloud annotations
- resolve annotations not visible in chrome print preview

### Chore

- update readme

## [0.2.2]

### Fix

- clearSearch

## [0.2.1]

### Fix

- clearSearch

## [0.2.0]

### Feat

- optimize sidebar handling and add search feature

### Chore

- remove icon

## [0.1.5]

### Feat

- Add PageIndicator
- Add Page Tool

## [0.1.4]

### Feat

- add enableRange option with auto fallback for PDF loading
- optimize PDF.js bundle size by externalizing worker
- load ExcelJS dynamically to reduce bundle size

### Chore

- update description
- update README.md

## [0.1.3]

### Chore

- fix name

## [0.1.2]

### Chore

- rename package to pdfjs-annotation-extension-for-react

## [0.1.1]

### Fix

- defaultSignature

### Chore

- update README.md

### Other

- update license to MIT and adjust related configs
