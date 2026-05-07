/**
 * InkLayer Annotation Core v0.1 — Freeze Version
 * ===============================================
 * 
 * 核心批注数据模型，作为 InkLayer SDK 的标准定义。
 * 
 * 设计原则：
 * - 与 UI / 渲染框架无关（Konva / PDF.js / React）
 * - 坐标统一使用 PDF 用户空间（左下角为原点，1pt = 1/72 inch）
 * - 持久化存储的唯一事实来源（Source of Truth）
 * - 可被 Adapter 转换为任意渲染引擎
 * 
 * 文档约定：
 * - pageIndex: PDF 逻辑页，从 0 开始
 * - coordinateSystem: 当前固定为 'pdf-user-space'
 * - 所有颜色使用 CSS 颜色字符串（如 '#FF0000', 'rgba(0,0,0,0.5)'）
 * 
 * @author InkLayer
 * @version 0.1.0
 */

/* ============================================================================
 * 基础几何类型
 * PDF 坐标空间定义
 * ========================================================================= */

/** PDF 空间中的点 */
export interface PdfPoint {
  /** X 坐标（从左向右） */
  x: number
  /** Y 坐标（从下向上） */
  y: number
}

/** PDF 空间中的矩形 */
export interface PdfRect {
  /** 左下角 X 坐标 */
  x: number
  /** 左下角 Y 坐标 */
  y: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
}

/** 四边形点，用于文本高亮等多段区域
 * 
 * 顺序：p1→p2→p3→p4（顺时针或逆时针）
 * 常用于选中一段文本后的 QuadPoints
 */
export interface PdfQuad {
  p1: PdfPoint
  p2: PdfPoint
  p3: PdfPoint
  p4: PdfPoint
}

/* ============================================================================
 * 批注几何类型
 * 定义批注在 PDF 页面上的几何形状
 * ========================================================================= */

/** 批注几何类型联合 */
export type Geometry =
  | RectGeometry
  | QuadGeometry
  | PathGeometry
  | LineGeometry
  | PolyGeometry

/** 矩形几何
 * 
 * 适用场景：印章、形状（矩形）、文本批注图标、边界框
 */
export interface RectGeometry {
  type: 'rect'
  rect: PdfRect
}

/** 四边形几何（文本标注）
 * 
 * 适用场景：文本高亮、下划线、删除线、波浪线
 * PDF 中 TextMarkup annotation 使用 QuadPoints
 */
export interface QuadGeometry {
  type: 'quad'
  /** 多组四边形，用于选中文本跨越多行的情况 */
  quads: PdfQuad[]
}

/** 路径几何（自由绘制）
 * 
 * 适用场景：自由手绘（Ink）、云线、任意形状
 * 
 * @property points - 路径点序列
 * @property closed - 是否闭合路径（默认 false）
 */
export interface PathGeometry {
  type: 'path'
  /** 路径点序列 */
  points: PdfPoint[]
  /** 是否闭合，默认 false */
  closed?: boolean
}

/** 直线/箭头几何
 * 
 * 适用场景：直线、箭头、测量线
 * 
 * @property start - 起点
 * @property end - 终点
 */
export interface LineGeometry {
  type: 'line'
  start: PdfPoint
  end: PdfPoint
}

/** 多边形/折线几何
 * 
 * 适用场景：多边形、折线、不规则形状
 * 
 * @property points - 顶点序列
 * @property closed - 是否闭合（多边形 true，折线 false）
 */
export interface PolyGeometry {
  type: 'poly'
  points: PdfPoint[]
  /** 是否闭合：多边形=true，折线=false */
  closed: boolean
}

/* ============================================================================
 * 批注语义类型
 * 产品层面的高层分类，不依赖 PDF.js / pdf-lib 实现
 * ========================================================================= */

/** 批注类型（产品语义）
 * 
 * 注意：这是 InkLayer 的语义分类，不是 PDF 的 Subtype
 * PDF Subtype → InkLayer Kind 的映射由 Adapter 处理
 */
export type AnnotationKind =
  | 'text-markup'  // 高亮、下划线、波浪线、删除线
  | 'note'        // 文本批注、Popup
  | 'ink'         // 自由手绘
  | 'shape'       // 矩形、椭圆、云形、多边形
  | 'line'        // 直线、箭头
  | 'stamp'       // 印章
  | 'file'        // 文件附件

/* ============================================================================
 * 批注目标（锚点）
 * 定义批注在文档中的位置
 * ========================================================================= */

/** 批注锚点
 * 
 * 定义批注在哪个文档的哪一页的什么位置
 */
export interface AnnotationTarget {
  /** PDF 页索引（从 0 开始）
   * 
   * 注意：这是 PDF 逻辑页顺序，与打印页码、Viewer 显示页码可能不同
   */
  pageIndex: number

  /** 几何信息（PDF 用户空间坐标） */
  geometry: Geometry

  /** 坐标系标识，当前固定为此值
   * 
   * 约束：所有几何必须基于 PDF User Space
   * 未来可能扩展：'viewport'（屏幕坐标）
   */
  coordinateSystem: 'pdf-user-space'

  /** 可选文档标识
   * 
   * 用于跨文档系统（如文档管理平台）
   * InkLayer Core 不强制要求，由应用层决定
   */
  documentId?: string
}

/* ============================================================================
 * 批注内容（Payload）
 * 批注的语义内容，表达"这是什么"而非"怎么画"
 * ========================================================================= */

/** 批注内容联合类型 */
export type AnnotationPayload =
  | TextMarkupPayload
  | NotePayload
  | InkPayload
  | ShapePayload
  | LinePayload
  | StampPayload
  | FilePayload

/** 文本标记（Text Markup）
 * 
 * PDF 原生类型：Highlight, Underline, Squiggly, StrikeOut
 */
export interface TextMarkupPayload {
  kind: 'text-markup'
  
  /** 文本标记变体 */
  variant: 'highlight' | 'underline' | 'squiggly' | 'strikeout'
  
  /** 语义颜色（可选，用于显示优先级）
   * 
   * 注意：这是语义提示，不是最终渲染颜色
   * 实际渲染由 AnnotationAppearance 决定
   */
  color?: string
  
  /** 透明度（0-1） */
  opacity?: number
}

/** 文本批注（Note / Popup）
 * 
 * PDF 原生类型：FreeText, Popup
 */
export interface NotePayload {
  kind: 'note'
  
  /** 批注内容文本 */
  text: string
}

/** 自由手绘（Ink）
 * 
 * PDF 原生类型：Ink
 */
export interface InkPayload {
  kind: 'ink'
  
  /** 笔画颜色 */
  color?: string
  
  /** 笔画粗细（pt） */
  width?: number
}

/** 形状（Shape）
 * 
 * PDF 原生类型：Square, Circle, Polygon, Cloud
 */
export interface ShapePayload {
  kind: 'shape'
  
  /** 形状类型 */
  shape: 'rect' | 'ellipse' | 'cloud' | 'polygon'
}

/** 直线/箭头（Line）
 * 
 * PDF 原生类型：Line
 */
export interface LinePayload {
  kind: 'line'
  
  /** 起点是否有箭头 */
  arrowStart?: boolean
  
  /** 终点是否有箭头 */
  arrowEnd?: boolean
}

/** 印章（Stamp）
 * 
 * PDF 原生类型：Stamp
 * 
 * 设计说明：Stamp 的语义是"这是什么章"，不是"怎么画出来"
 * 外观渲染由 AnnotationAppearance 和 Adapter 处理
 */
export interface StampPayload {
  kind: 'stamp'

  /**
   * 印章逻辑标识符
   * 
   * - 标准 PDF 印章使用规范名称：'Approved', 'Rejected', 'Draft', 'Final' 等
   * - 自定义印章使用应用定义的标识符：'company-seal', 'personal-mark' 等
   * 
   * 用途：PDF 导出映射、多端协作一致性
   */
  name: string

  /**
   * 可选显示标签
   * 
   * 用于 UI 展示、tooltip、可访问性
   * 例如：'APPROVED' / '已批准' / 'Secret'
   */
  label?: string

  /**
   * 印章来源类型
   * 
   * - 'standard': PDF 标准印章
   * - 'custom': 应用自定义印章
   * - 'image': 图片印章
   */
  source?: 'standard' | 'custom' | 'image'

  /**
   * 预定义外观资源引用
   * 
   * 用于企业章/图片章的复用场景
   * 值可以是：asset id / URL / hash key
   * 
   * 注意：不直接存储 base64/SVG，保持 Core 纯净
   */
  appearanceRef?: string

  /** 可选旋转角度（度） */
  rotation?: number

  /** 可选缩放比例 */
  scale?: number
}

/** 文件附件（File Attachment）
 * 
 * PDF 原生类型：FileAttachment
 */
export interface FilePayload {
  kind: 'file'
  
  /** 文件名 */
  fileName: string
  
  /** 文件 URL 或路径 */
  fileUrl: string
  
  /** 文件大小（字节） */
  size?: number
  
  /** MIME 类型 */
  mimeType?: string
}

/* ============================================================================
 * 外观信息（Appearance）
 * 视觉渲染提示，与 Geometry 分离
 * 
 * 设计说明：Appearance 是"怎么画"的提示，不是语义
 * 不同 Adapter 可能忽略部分字段或有自己的默认值
 * ========================================================================= */

/** 批注外观 */
export interface AnnotationAppearance {
  /** 描边颜色 */
  strokeColor?: string
  
  /** 填充颜色 */
  fillColor?: string
  
  /** 描边粗细（pt） */
  strokeWidth?: number
  
  /** 透明度（0-1） */
  opacity?: number
  
  /** 虚线样式 */
  dashArray?: number[]
  
  /** 文字大小（用于 note / text-markup） */
  fontSize?: number
  
  /** 文字字体 */
  fontFamily?: string
  
  /** 文字对齐 */
  textAlign?: 'left' | 'center' | 'right'
  
  /** 渲染顺序（图层） */
  zIndex?: number
}

/* ============================================================================
 * 批注关系（Relations）
 * 定义批注之间的关联：回复、Popup、引用
 * ========================================================================= */

/** 批注关系 */
export interface AnnotationRelations {
  /** 父批注 ID（如回复的父批注） */
  parentId?: string
  
  /** 直接回复列表 */
  replies?: string[]
  
  /** Popup 所属批注（用于 Note 的 Popup 关联） */
  popupFor?: string
  
  /** 关联/引用批注 */
  linkedAnnotationIds?: string[]
}

/* ============================================================================
 * 批注元信息（Meta）
 * 生命周期、来源、作者等信息
 * 
 * 设计说明：Meta 不参与渲染逻辑，不影响导出几何计算
 * ========================================================================= */

/** 批注元信息 */
export interface AnnotationMeta {
  /** 创建时间（ISO 8601） */
  createdAt?: string
  
  /** 更新时间（ISO 8601） */
  updatedAt?: string
  
  /** 作者标识
   * 
   * 可用形式：
   * - 字符串 ID：'user-123'
   * - 完整对象：{ id: 'user-123', name: 'Alice', avatarUrl: '...' }
   */
  authorId?: string | { id: string; name?: string; avatarUrl?: string }
  
  /** 是否来自 PDF 原生批注
   * 
   * true: 从 PDF 文件中加载的原生批注
   * false: InkLayer 创建的新批注
   */
  isNative?: boolean
  
  /** 来源系统
   * 
   * - 'inklayer': InkLayer 创建
   * - 'pdfjs': 从 PDF.js 导入
   * - 'import': 从外部导入
   */
  source?: 'inklayer' | 'pdfjs' | 'import'

  /** 版本号（用于协作冲突处理） */
  version?: number
}

/* ============================================================================
 * 根 Annotation 对象
 * 整个模型的核心，一等公民
 * ========================================================================= */

/** 批注（Annotation）
 * 
 * 这是 InkLayer 的核心模型，是持久化存储的唯一事实来源。
 * 
 * 数据流：
 * - 写入：Konva Node → Adapter.extract() → Annotation → Storage
 * - 读取：Storage → Annotation → Adapter.render() → Konva Node → Canvas
 * 
 * 约束：
 * - ❌ 禁止在此对象中出现 konva / canvas / viewport 字段
 * - ❌ 禁止序列化 Konva Node 状态
 * - ✅ 所有几何必须基于 PDF 用户空间
 * - ✅ 所有字段都是可选的，便于渐进增强
 */
export interface Annotation {
  /** 全局唯一标识符
   * 
   * 要求：
   * - 稳定：创建后不应改变
   * - 唯一：跨文档/跨会话唯一
   * - 建议使用 UUID / ULID
   */
  id: string

  /** 高层语义类型
   * 
   * 这是产品分类，不是 PDF subtype
   * PDF Subtype → AnnotationKind 的映射由 Adapter 处理
   */
  kind: AnnotationKind

  /** 批注锚点（位置） */
  target: AnnotationTarget

  /** 语义内容（是什么）
   * 
   * 表达批注的业务含义，不包含渲染细节
   * 例如：文本批注的文本内容、印章的名称
   */
  payload?: AnnotationPayload

  /** 外观提示（怎么画）
   * 
   * 这是渲染提示，不是语义
   * 不同渲染器可能有不同解释
   */
  appearance?: AnnotationAppearance

  /** 批注关系（关联）
   * 
   * 用于：回复链、Popup 关联、引用关系
   */
  relations?: AnnotationRelations

  /** 元信息（生命周期）
   * 
   * 不影响渲染，不参与导出计算
   * 但对协作、审计、版本控制很重要
   */
  meta?: AnnotationMeta

  /** 扩展点
   * 
   * 用于：
   * - Adapter 私有数据（如 PDF.js 具体类型）
   * - 业务扩展（如 AI 分析结果）
   * - 调试信息
   * 
   * 约束：
   * - 不能影响 Core 的序列化和兼容性
   * - 不能作为业务逻辑的唯一依赖
   */
  extensions?: Record<string, unknown>
}

/* ============================================================================
 * 工具类型
 * 便于使用时类型推断
 * ========================================================================= */

/** 根据 Kind 获取对应的 Payload 类型 */
export type PayloadFor<K extends AnnotationKind> = 
  K extends 'text-markup' ? TextMarkupPayload :
  K extends 'note' ? NotePayload :
  K extends 'ink' ? InkPayload :
  K extends 'shape' ? ShapePayload :
  K extends 'line' ? LinePayload :
  K extends 'stamp' ? StampPayload :
  K extends 'file' ? FilePayload :
  never

/** 根据 Geometry type 获取对应的几何类型 */
export type GeometryFor<T extends Geometry['type']> = 
  T extends 'rect' ? RectGeometry :
  T extends 'quad' ? QuadGeometry :
  T extends 'path' ? PathGeometry :
  T extends 'line' ? LineGeometry :
  T extends 'poly' ? PolyGeometry :
  never
