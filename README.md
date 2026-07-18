
<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-react/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer React</h1>

<p align="center">
  <a href="./README.md">简体中文</a> <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="./README-en-US.md">English</a>
</p>

<p align="center">
  🖊️ 基于 PDF.js 构建的 React PDF 查看与批注 SDK<br/>
  用于快速构建文档审阅、批注与评论系统
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
  <a href="https://laomai-codefee.github.io/inklayer-react/" target="_blank"><b>🔥 在线体验</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://inklayer.dev/docs" target="_blank"><b>📚 文档</b></a>
  <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
  <a href="https://github.com/Laomai-codefee/inklayer-react" target="_blank"><b>⭐ GitHub</b></a>
</div>

---
<p align="center">
  <img src="./screenshot.png" alt="InkLayer React Screenshot" width="80%" />
</p>


## ⭐ 快速开始（推荐）

最快体验 InkLayer React 的方式：直接使用 [官方 Starter 🚀 ](https://github.com/Laomai-codefee/inklayer-react-starter)

```bash
git clone https://github.com/Laomai-codefee/inklayer-react-starter.git
cd inklayer-react-starter
npm install
npm run dev
```

打开：

http://localhost:5173

> 💡 Starter 已内置完整 PDF 批注能力示例，无需额外配置即可体验 SDK 全功能。

---

## ✨ 特性

- 🚀 PDF 查看器（缩放 / 搜索 / 主题）
- 🖍️ PDF 批注系统（高亮 / 笔迹 / 图形 / 印章 / 签名）
- 💬 评论与审阅流程
- 💾 批注数据模型（可持久化）
- 📤 导出能力（PDF / Excel）
- 🎨 可自定义 UI（工具栏 / 侧边栏）

---

## 📦 安装

```bash
npm install inklayer-react
```

---

## 🚀 基础用法

### PdfAnnotator（批注）

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

### PdfViewer（查看器）

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

## 📖 API 文档

👉 https://inklayer.dev/docs/react

---

## 🔐 协作批注权限

`user` 代表当前用户，不需要额外传入 `role`。使用 `owner-only` 后，登录用户可新建批注和回复，但只有批注拥有者可移动、缩放、编辑、改状态或删除该批注；回复也只能由其作者编辑或删除。

```tsx
<PdfAnnotator
  user={{ id: currentUser.id, name: currentUser.name }}
  annotationPermissions={{
    mode: 'owner-only',
    can: ({ currentUser }) =>
      currentUser?.id === 'admin' ? true : undefined
  }}
/>
```

`can(request)` 是可选的同步覆盖函数。返回 `true` 强制允许，`false` 强制拒绝，`undefined` 保留 `mode` 的默认结果。`request` 包含 `action`、`currentUser`、`annotation`、`comment` 和 `defaultAllowed`，因此可以接入应用自己的管理员、审批状态或文档级规则。

如果需要整个批注器只读，传入 `annotationPermissions={{ can: () => false }}`。用户仍可选中和查看批注，但所有写操作都会被禁止。

> 这是浏览器交互权限，用于控制 InkLayer UI 和本地写入。后端 API 仍必须独立验证读写权限，不能把客户端结果当作安全边界。

---

## 🔗 相关项目

- InkLayer Vue：https://github.com/Laomai-codefee/inklayer-vue
- Vue Starter：https://github.com/Laomai-codefee/inklayer-vue-starter
- React Starter：https://github.com/Laomai-codefee/inklayer-react-starter

---

## 💬 反馈

有问题？想提建议？欢迎来 [GitHub Discussions](https://github.com/Laomai-codefee/inklayer-react/discussions) 聊聊，或者直接发邮件：[codefee@foxmail.com](mailto:codefee@foxmail.com)

Bug 报告请走 [GitHub Issues](https://github.com/Laomai-codefee/inklayer-react/issues)

---

## 🌐 运行环境

InkLayer React 仅支持浏览器环境，不支持服务端渲染（SSR）。组件依赖 DOM、Canvas 和 Web Worker，请只在客户端代码中导入和渲染。

- 支持 React 18 和 React 19
- 支持 Vite 和 Webpack 5
- 同时提供 ESM 和 CommonJS 入口，推荐优先使用 ESM
- 在 Next.js、Remix 等同构框架中使用时，需要将组件放在客户端边界内，并关闭该组件的 SSR

---

## 📄 License

MIT © InkLayer
