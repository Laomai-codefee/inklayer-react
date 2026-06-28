# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
