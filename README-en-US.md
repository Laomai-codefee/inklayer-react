
<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-react/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer React</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ A React PDF viewer & annotation SDK built on PDF.js<br/>
  For building document review, annotation, and commenting systems
</p>

<div align="center">
  <a href="https://www.npmjs.com/package/inklayer-react" target="_blank">
    <img src="https://img.shields.io/npm/v/inklayer-react.svg" />
  </a>
  <a href="./LICENSE" target="_blank">
    <img src="https://img.shields.io/npm/l/inklayer-react" />
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

## ⭐ Quick Start (Recommended)

The fastest way to try InkLayer React: use the [official starter 🚀 ](https://github.com/Laomai-codefee/inklayer-react-starter).

```bash
git clone https://github.com/Laomai-codefee/inklayer-react-starter.git
cd inklayer-react-starter
npm install
npm run dev
```

Open:

http://localhost:5173

> 💡 The starter comes with a complete PDF annotation example pre-configured — no extra setup needed to experience the full SDK.

---

## ✨ Features

- 🚀 PDF Viewer (zoom / search / theming)
- 🖍️ PDF Annotation System (highlight / ink / shapes / stamps / signatures)
- 💬 Comment & review workflow
- 💾 Annotation data model (persistable)
- 📤 Export support (PDF / Excel)
- 🎨 Customizable UI (toolbar / sidebar)

---

## 📦 Installation

```bash
npm install inklayer-react
```

---

## 🚀 Basic Usage

### PdfAnnotator (annotation)

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

---

### PdfViewer (viewer)

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

## 📖 API Docs

👉 https://inklayer.dev/docs/react

---

## 🔗 Related Projects

- InkLayer Vue: https://github.com/Laomai-codefee/inklayer-vue
- Vue Starter: https://github.com/Laomai-codefee/inklayer-vue-starter
- React Starter: https://github.com/Laomai-codefee/inklayer-react-starter

---

## 💬 Feedback

Questions? Feature requests? Drop by [GitHub Discussions](https://github.com/Laomai-codefee/inklayer-react/discussions) or email us: [codefee@foxmail.com](mailto:codefee@foxmail.com)

Bug reports → [GitHub Issues](https://github.com/Laomai-codefee/inklayer-react/issues)

---

## 📄 License

MIT © InkLayer
