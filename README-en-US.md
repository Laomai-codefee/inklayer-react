<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-react/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer React</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span> <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ A React PDF annotation SDK built on PDF.js
  <br/>For building document review, annotation, and commenting systems
</p>

<div align="center">
  <a href="https://www.npmjs.com/package/inklayer-react" target="_blank">
    <img src="https://img.shields.io/npm/v/inklayer-react.svg" alt="NPM" />
  </a>
  <a href="./LICENSE" target="_blank">
    <img src="https://img.shields.io/npm/l/inklayer-react" alt="License" />
  </a>
</div>

<br/>

<div align="center">
  <a href="https://laomai-codefee.github.io/inklayer-react/" target="_blank"><b>🔥 Live Demo</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://inklayer.dev/docs" target="_blank"><b>📚 Docs</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://github.com/Laomai-codefee/inklayer-react" target="_blank"><b>⭐ GitHub</b></a>
</div>

---

<p align="center">
  <img src="./screenshot.png" alt="InkLayer React Screenshot" width="80%" />
</p>

---

## ✨ Features

- 🚀 **PDF Viewer** — search, zoom, theme system
- 🖍️ **PDF Annotation System** — text markup, ink, shapes, stamps, signatures
- 💬 **Comment & Review Workflow**
- 💾 **Annotation Editing & Persistence Model**
- 📤 **Export Support** — PDF / Excel
- 🎨 **Customizable UI** — toolbar / sidebar

---

## 📦 Installation

```bash
npm install inklayer-react
# or
yarn add inklayer-react
```

---

## 🚀 Quick Start

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

## 📖 Component API

Full component API → [📚 Docs](https://inklayer.dev/docs/react)

---

## 🔗 Related Projects

- [InkLayer Vue](https://github.com/Laomai-codefee/inklayer-vue) — Vue 3 version

---

## 📄 License

MIT © InkLayer
