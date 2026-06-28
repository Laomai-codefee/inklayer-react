<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-react/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer React</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span> <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ 基于 PDF.js 构建的 React PDF 批注 SDK
  <br/>用于快速构建文档审阅、批注与评论系统
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
  <a href="https://laomai-codefee.github.io/inklayer-react/" target="_blank"><b>🔥 在线体验</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://inklayer.dev/docs" target="_blank"><b>📚 文档</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://github.com/Laomai-codefee/inklayer-react" target="_blank"><b>⭐ GitHub</b></a>
</div>

---

<p align="center">
  <img src="./screenshot.png" alt="InkLayer React 截图" width="80%" />
</p>

---

## ✨ 特性

- 🚀 **PDF查看器** — 搜索、缩放、主题系统
- 🖍️ **PDF批注系统** — 文本标记、墨迹、图形、印章、签名
- 💬 **评论与审阅工作流**
- 💾 **批注编辑与持久化模型**
- 📤 **导出支持** — PDF / Excel
- 🎨 **可自定义 UI** — 工具栏 / 侧边栏

---

## 📦 安装

```bash
npm install inklayer-react
# or
yarn add inklayer-react
```

---

## 🚀 快速开始

### PdfAnnotator 批注

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

### PdfViewer 查看

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

## 📖 组件 API

查看完整组件 API → [📚 文档](https://inklayer.dev/docs/react)

---

## 🔗 相关项目

- [InkLayer Vue](https://github.com/Laomai-codefee/inklayer-vue) — Vue 3 版本

---

## 📄 许可证

MIT © InkLayer
