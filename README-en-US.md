<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-react/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer React</h1>

<p align="center">
  A PDF annotation SDK built on PDF.js for React.
  <br/>Simplifies building document review, annotation, and commenting systems.
</p>

---
[简体中文](./README.md) | English 
---
[![NPM](https://img.shields.io/npm/v/inklayer-react.svg)](https://www.npmjs.com/package/inklayer-react)   [![License](https://img.shields.io/npm/l/inklayer-react)](./LICENSE)

[>> Online Demo](https://laomai-codefee.github.io/inklayer-react/)


---

## Why InkLayer

Building PDF annotation features with PDF.js requires handling:

- coordinate system mapping
- annotation rendering consistency
- state synchronization across pages
- export and persistence logic

InkLayer provides a structured layer to reduce this complexity.

---

## Features

- Annotation system (text markup, ink, shapes, stamps, signatures)
- PDF.js rendering abstraction
- Comment and review workflows
- Annotation editing and persistence model
- Export support (PDF / Excel)
- Customizable UI (toolbar / sidebar)

---

## Installation

```bash
npm install inklayer-react
# or
yarn add inklayer-react
```

---

## Quick Start

### PdfAnnotator

```jsx
import { PdfAnnotator } from 'inklayer-react'
import 'inklayer-react/style'

export default function App() {
  return (
    <PdfAnnotator
      title="PDF Annotator"
      url="https://example.com/sample.pdf"
      user={{ id: 'u1', name: 'Alice' }}
      onSave={(annotations) => {
        console.log('Saved annotations:', annotations)
      }}
    />
  )
}
```

### PdfViewer

```jsx
import { PdfViewer } from 'inklayer-react'
import 'inklayer-react/style'

export default function App() {
  return (
    <PdfViewer
      title="PDF Viewer"
      url="https://example.com/sample.pdf"
      layoutStyle={{ width: '100vw', height: '100vh' }}
    />
  )
}
```

---

## Component API

### Base Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `appearance` | `auto \| dark \| light` | `auto` | Dark or light theme |
| `theme` | Radix Theme Color | `violet` | UI theme color |
| `title` | `React.ReactNode` | — | Page title |
| `url` | `string \| URL` | — | PDF file URL |
| `data` | `string \| number[] \| ArrayBuffer \| TypedArray` | — | Raw PDF binary data |
| `locale` | `'zh-CN' \| 'en-US'` | `zh-CN` | UI language |
| `initialScale` | `PdfScale` | `auto` | Initial zoom level |
| `layoutStyle` | `React.CSSProperties` | `{ width: '100vw', height: '100vh' }` | Viewer container styles |
| `isSidebarCollapsed` | `boolean` | `false` | Sidebar collapsed by default |
| `enableRange` | `boolean \| 'auto'` | `auto` | Enable HTTP Range loading |

---

### PdfAnnotator

#### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| (All base props) | | | Inherits all [Base Props](#base-props) |
| `user` | `User` | `{ id: 'null', name: 'unknown' }` | Current user info |
| `enableNativeAnnotations` | `boolean` | `false` | Edit PDF-native annotations |
| `defaultShowAnnotationsSidebar` | `boolean` | `false` | Show annotation sidebar by default |
| `defaultOptions` | `DeepPartial` | — | Partial config merged with defaults |
| `initialAnnotations` | `Annotation[]` | — | Preload existing annotations |

#### Events

| Event | Payload | Description |
|:------|:--------|:------------|
| `onSave` | `(annotations: Annotation[]) => void` | Save annotations |
| `onLoad` | `() => void` | PDF loaded |
| `onAnnotationAdded` | `(annotation: Annotation) => void` | Annotation created |
| `onAnnotationDeleted` | `(id: string) => void` | Annotation deleted |
| `onAnnotationSelected` | `(annotation: Annotation \| null, isClick: boolean) => void` | Annotation selected |
| `onAnnotationUpdated` | `(annotation: Annotation) => void` | Annotation modified |

#### Custom Actions

```jsx
<PdfAnnotator
  url={pdfUrl}
  actions={({ save, exportToPdf, exportToExcel }) => (
    <>
      <button onClick={save}>Save</button>
      <button onClick={() => exportToPdf('annotations')}>Export PDF</button>
      <button onClick={() => exportToExcel('annotations')}>Export Excel</button>
    </>
  )}
/>
```

---

### PdfViewer

#### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| (All base props) | | | Inherits all [Base Props](#base-props) |
| `showTextLayer` | `boolean` | `true` | Render text layer |
| `showAnnotations` | `boolean` | `false` | Render PDF annotation layer |
| `defaultActiveSidebarKey` | `string` | null | Default active sidebar |
| `toolbar` | `ReactNode \| (ctx) => ReactNode` | — | Custom toolbar |
| `sidebar` | `SidebarPanel[]` | — | Custom sidebar panels |
| `actions` | `ReactNode \| (ctx) => ReactNode` | — | Custom action buttons |

#### Events

| Event | Payload | Description |
|:------|:--------|:------------|
| `onDocumentLoaded` | `(pdfViewer: PDFViewer \| null) => void` | PDF loaded |
| `onEventBusReady` | `(eventBus: EventBus \| null) => void` | Event bus ready |

#### Custom Toolbar

```jsx
<PdfViewer
  url={pdfUrl}
  toolbar={(ctx) => (
    <>
      <button onClick={ctx.toggleSidebar}>Toggle Sidebar</button>
    </>
  )}
/>
```

#### Custom Sidebar

```jsx
<PdfViewer
  url={pdfUrl}
  sidebar={[{ key: 'my-panel', title: 'My Panel', render: (ctx) => <div>Content</div> }]}
/>
```

---

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge latest).

---

## Related Projects

- [InkLayer Vue](https://github.com/Laomai-codefee/inklayer-vue) — Vue 3 binding
- [PDF.js](https://github.com/mozilla/pdf.js) — Underlying PDF rendering engine

---

## License

MIT © InkLayer
