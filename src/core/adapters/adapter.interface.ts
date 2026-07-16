/**
 * InkLayer Annotation Adapter Interface
 * =======================================
 * 
 * 定义 Annotation Core 与各渲染引擎之间的转换契约。
 * 
 * 设计原则：
 * - 单向数据流：Annotation → Renderer（读取）
 * - 提取数据：Renderer → Annotation（写入）
 * - 所有渲染器都是"可丢弃的"，Annotation 是唯一 Source of Truth
 * 
 * @version 0.1.0
 */

import type Konva from 'konva'
import type { Annotation, Geometry } from '../annotation.core'

/* ============================================================================
 * 渲染上下文
 * 描述渲染时的视图状态
 * ========================================================================= */

/** 视口上下文
 * 
 * 描述当前渲染环境的瞬时状态。
 * 注意：这是"瞬时状态"，不可存储，不可持久化。
 */
export interface ViewportContext {
  /** PDF 页索引（从 0 开始） */
  pageIndex: number

  /** PDF 页面尺寸（PDF 用户空间单位） */
  pageSize: {
    width: number
    height: number
  }

  /** 缩放比例（PDF 空间 → Canvas 空间） */
  scale: number

  /** 页面旋转角度（0, 90, 180, 270） */
  rotation: 0 | 90 | 180 | 270

  /** 视口偏移（用于滚动） */
  offset?: {
    x: number
    y: number
  }
}

/* ============================================================================
 * 渲染结果
 * ========================================================================= */

/** 渲染结果 */
export interface RenderResult<T = unknown> {
  /** 根节点 */
  node: T

  /** 子节点（复杂图形可能需要多个节点） */
  children?: T[]

  /** 元数据 */
  metadata?: {
    /** 是否使用了缓存 */
    fromCache?: boolean
    /** 渲染耗时（ms） */
    renderTime?: number
  }
}

/* ============================================================================
 * 提取结果
 * 从渲染节点提取出的几何信息
 * ========================================================================= */

/** 提取结果 */
export interface ExtractResult {
  /** 几何信息 */
  geometry: Geometry

  /** 更新的外观信息 */
  appearance?: {
    strokeColor?: string
    fillColor?: string
    strokeWidth?: number
    opacity?: number
  }
}

/* ============================================================================
 * 核心 Adapter 接口
 * ========================================================================= */

/** Annotation Renderer Adapter
 * 
 * 泛型参数：
 * - T: 渲染节点的类型（如 Konva.Node, SVGElement 等）
 * - C: 上下文类型（如 ViewportContext）
 */
export interface AnnotationRendererAdapter<T = unknown, C extends ViewportContext = ViewportContext> {
  /** 渲染器标识 */
  readonly name: string

  /** 渲染器版本 */
  readonly version: string

  /**
   * 从 Annotation 渲染节点
   * 
   * 这是"纯函数"：
   * - 不依赖之前的状态
   * - 相同的输入产生相同的输出
   * - 可以安全缓存
   */
  render(annotation: Annotation, context: C): RenderResult<T>

  /**
   * 更新现有节点（可选，优化性能）
   * 
   * 当 Annotation 或 Viewport 变化时，可以复用现有节点
   * 而不必完全重新创建
   */
  update?(annotation: Annotation, context: C, existing: T): void

  /**
   * 从渲染节点提取几何信息
   * 
   * 这是"从 UI 回写到数据"的唯一合法路径
   * 
   * @param node 渲染节点
   * @param context 视口上下文
   * @returns 提取的几何和外观信息
   */
  extract(node: T, context: C): ExtractResult
}

/* ============================================================================
 * Konva Adapter 特定类型
 * ========================================================================= */

/** Konva 渲染上下文 */
export interface KonvaViewportContext extends ViewportContext {
  /** 父级 Stage */
  stage: Konva.Stage

  /** 所在 Layer */
  layer: Konva.Layer

  /** 容器 DOM 元素尺寸 */
  containerSize: {
    width: number
    height: number
  }
}

/** Konva 渲染结果 */
export interface KonvaRenderResult extends RenderResult<Konva.Node> {
  /** 渲染节点 */
  node: Konva.Node
}

/* ============================================================================
 * 工具函数
 * ========================================================================= */

/** 坐标转换：PDF 空间 → Canvas 空间 */
export function pdfToCanvasPoint(
  pdfPoint: { x: number; y: number },
  context: ViewportContext
): { x: number; y: number } {
  const { scale, rotation, pageSize } = context

  let x = pdfPoint.x * scale
  let y = pdfPoint.y * scale

  // 处理旋转
  if (rotation === 90) {
    const temp = x
    x = y
    y = pageSize.width * scale - temp
  } else if (rotation === 180) {
    x = pageSize.width * scale - x
    y = pageSize.height * scale - y
  } else if (rotation === 270) {
    const temp = x
    x = pageSize.height * scale - y
    y = temp
  }

  return { x, y }
}

/** 坐标转换：Canvas 空间 → PDF 空间 */
export function canvasToPdfPoint(
  canvasPoint: { x: number; y: number },
  context: ViewportContext
): { x: number; y: number } {
  const { scale, rotation, pageSize } = context

  let x = canvasPoint.x
  let y = canvasPoint.y

  // 逆向旋转
  if (rotation === 90) {
    const temp = x
    x = pageSize.width - y / scale
    y = temp / scale
  } else if (rotation === 180) {
    x = (pageSize.width - x / scale)
    y = (pageSize.height - y / scale)
  } else if (rotation === 270) {
    const temp = x
    x = y / scale
    y = pageSize.height - temp / scale
  } else {
    x = x / scale
    y = y / scale
  }

  return { x, y }
}

/* ============================================================================
 * Adapter 注册表
 * ========================================================================= */

/** 全局 Adapter 注册表 */
class AdapterRegistry {
  private adapters: Map<string, AnnotationRendererAdapter> = new Map()

  /** 注册 Adapter */
  register(adapter: AnnotationRendererAdapter): void {
    this.adapters.set(adapter.name, adapter)
  }

  /** 获取 Adapter */
  get(name: string): AnnotationRendererAdapter | undefined {
    return this.adapters.get(name)
  }

  /** 列出所有 Adapter */
  list(): AnnotationRendererAdapter[] {
    return Array.from(this.adapters.values())
  }
}

/** 全局 Adapter 注册表实例 */
export const adapterRegistry = new AdapterRegistry()

/* ============================================================================
 * 类型守卫
 * ========================================================================= */

/** 检查是否为有效的 Annotation */
export function isValidAnnotation(obj: unknown): obj is Annotation {
  if (!obj || typeof obj !== 'object') return false
  const ann = obj as Partial<Annotation>
  return !!(ann.id && ann.kind && ann.target)
}

/** 检查几何类型 */
export function hasGeometry(annotation: Annotation): boolean {
  return !!(annotation.target?.geometry)
}
