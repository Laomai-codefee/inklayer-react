<p align="center">
  <img src="https://raw.githubusercontent.com/Laomai-codefee/inklayer-react/main/public/logo.svg" alt="InkLayer" width="80" />
</p>

<h1 align="center">InkLayer React</h1>

<p align="center">
  基于 PDF.js 构建的 React PDF 批注 SDK
  <br/>用于快速构建文档审阅、批注与评论系统
</p>

---
简体中文 | [English](./README-en-US.md) 
---
[![NPM](https://img.shields.io/npm/v/inklayer-react.svg)](https://www.npmjs.com/package/inklayer-react) [![License](https://img.shields.io/npm/l/inklayer-react)](./LICENSE)

[>> 在线演示](https://laomai-codefee.github.io/inklayer-react/)


---

## 为什么选择 InkLayer

直接用 PDF.js 构建 PDF 批注功能需要处理以下问题：

- 坐标系统映射
- 批注渲染一致性
- 跨页面的状态同步
- 导出和持久化逻辑

InkLayer 提供了一个结构化的抽象层来降低这些复杂度。

---

## 特性

- 批注系统（文本标记、墨迹、图形、印章、签名）
- 基于 PDF.js 的渲染抽象
- 批注编辑与持久化模型
- 评论与审阅工作流
- 导出支持（PDF / Excel）
- 可自定义的 UI（工具栏 / 侧边栏）

---

## 安装

```bash
npm install inklayer-react
# or
yarn add inklayer-react
```

---

## 快速开始

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

## 组件 API

### 基础属性

| 属性 | 类型 | 默认值 | 说明 |
|:-----|:-----|:--------|:------------|
| `appearance` | `auto \| dark \| light` | `auto` | 亮色 / 暗色主题 |
| `theme` | Radix Theme Color | `violet` | UI 主题色 |
| `title` | `React.ReactNode` | — | 页面标题 |
| `url` | `string \| URL` | — | PDF 文件 URL |
| `data` | `string \| number[] \| ArrayBuffer \| TypedArray` | — | PDF 原始二进制数据 |
| `locale` | `'zh-CN' \| 'en-US'` | `zh-CN` | 界面语言 |
| `initialScale` | `PdfScale` | `auto` | 初始缩放级别 |
| `layoutStyle` | `React.CSSProperties` | `{ width: '100vw', height: '100vh' }` | 查看器容器样式 |
| `isSidebarCollapsed` | `boolean` | `false` | 默认是否收起侧边栏 |
| `enableRange` | `boolean \| 'auto'` | `auto` | 是否启用 HTTP Range 加载 |

---

### PdfAnnotator

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|:-----|:-----|:--------|:------------|
| （所有基础属性） | | | 继承所有[基础属性](#基础属性) |
| `user` | `User` | `{ id: 'null', name: 'unknown' }` | 当前用户信息 |
| `enableNativeAnnotations` | `boolean` | `false` | 是否编辑 PDF 原生批注 |
| `defaultShowAnnotationsSidebar` | `boolean` | `false` | 默认显示批注侧边栏 |
| `defaultOptions` | `DeepPartial` | — | 部分配置，与默认值深度合并 |
| `initialAnnotations` | `Annotation[]` | — | 挂载时加载已有批注 |

#### 事件

| 事件 | 负载 | 说明 |
|:------|:--------|:------------|
| `onSave` | `(annotations: Annotation[]) => void` | 保存批注 |
| `onLoad` | `() => void` | PDF 加载完成 |
| `onAnnotationAdded` | `(annotation: Annotation) => void` | 新建批注 |
| `onAnnotationDeleted` | `(id: string) => void` | 删除批注 |
| `onAnnotationSelected` | `(annotation: Annotation \| null, isClick: boolean) => void` | 选中批注 |
| `onAnnotationUpdated` | `(annotation: Annotation) => void` | 修改批注 |

#### 自定义 Actions

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

| 属性 | 类型 | 默认值 | 说明 |
|:-----|:-----|:--------|:------------|
| （所有基础属性） | | | 继承所有[基础属性](#基础属性) |
| `showTextLayer` | `boolean` | `true` | 是否渲染文本层 |
| `showAnnotations` | `boolean` | `false` | 是否渲染 PDF 批注层 |
| `defaultActiveSidebarKey` | `string` | null | 默认打开的侧边栏 |
| `toolbar` | `ReactNode \| (ctx) => ReactNode` | — | 自定义工具栏 |
| `sidebar` | `SidebarPanel[]` | — | 自定义侧边栏 |
| `actions` | `ReactNode \| (ctx) => ReactNode` | — | 自定义操作按钮 |

#### 事件

| 事件 | 负载 | 说明 |
|:------|:--------|:------------|
| `onDocumentLoaded` | `(pdfViewer: PDFViewer \| null) => void` | PDF 加载完成 |
| `onEventBusReady` | `(eventBus: EventBus \| null) => void` | 事件总线就绪 |

#### 自定义工具栏

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

#### 自定义侧边栏

```jsx
<PdfViewer
  url={pdfUrl}
  sidebar={[{ key: 'my-panel', title: 'My Panel', render: (ctx) => <div>Content</div> }]}
/>
```

---

## 浏览器支持

Chrome、Firefox、Safari、Edge 最新版本。

---

## 相关项目

- [InkLayer Vue](https://github.com/Laomai-codefee/inklayer-vue) — Vue 3 版本
- [PDF.js](https://github.com/mozilla/pdf.js) — 底层 PDF 渲染引擎

---

## 许可证

MIT © InkLayer
