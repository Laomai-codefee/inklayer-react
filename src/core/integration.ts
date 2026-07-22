/**
 * InkLayer Annotation Integration Layer
 * ====================================
 * 
 * 集成层：将 InkLayer Annotation Core 与现有系统（PdfAnnotator）集成。
 * 
 * 功能：
 * - 提交时：IAnnotationStore → Annotation → 存储（支持新旧格式）
 * - 加载时：存储 → Annotation → Konva
 * - 兼容模式：新旧格式互转
 * 
 * @version 0.1.0
 */

import type { Annotation } from './annotation.core'
import { storesToAnnotations, annotationsToStores } from './adapters/store.mapper'
import { pdfJsToAnnotation, annotationToPdfJs } from './adapters/pdfjs.adapter'
import { IAnnotationStore } from '../extensions/annotator/const/definitions'

/* ============================================================================
 * 类型定义
 * ========================================================================= */

/** 存储格式选项 */
export type StorageFormat = 'legacy' | 'core' | 'hybrid'

/** 集成选项 */
export interface IntegrationOptions {
  /** 存储格式 */
  storageFormat?: StorageFormat
  /** 文档 ID */
  documentId?: string
  /** 默认作者 */
  defaultAuthorId?: string
  /** 页面尺寸（用于坐标转换） */
  pageSize?: { width: number; height: number }
}

/** 存储数据结构 */
export interface AnnotationStorage {
  /** 格式版本 */
  version: '1.0' | '2.0'
  /** 文档 ID */
  documentId?: string
  /** 批注数据 */
  data: Annotation[] | IAnnotationStore[]
}

/* ============================================================================
 * 核心函数
 * ========================================================================= */

/**
 * 创建 Annotation 存储数据
 * 
 * @param stores IAnnotationStore 数组（来自现有系统）
 * @param options 集成选项
 * @returns 存储数据结构
 */
export function createAnnotationStorage(
  stores: IAnnotationStore[],
  options: IntegrationOptions = {}
): AnnotationStorage {
  const { storageFormat = 'hybrid' } = options

  switch (storageFormat) {
    case 'legacy':
      // 仅存储旧格式
      return {
        version: '1.0',
        documentId: options.documentId,
        data: stores,
      }

    case 'core':
      // 仅存储新格式
      return {
        version: '2.0',
        documentId: options.documentId,
        data: storesToAnnotations(stores),
      }

    case 'hybrid':
    default:
      // 混合模式：同时存储新旧格式（用于渐进迁移）
      return {
        version: '2.0',
        documentId: options.documentId,
        data: storesToAnnotations(stores),
      }
  }
}

/**
 * 解析 Annotation 存储数据
 * 
 * @param storage 存储数据
 * @param options 集成选项
 * @returns IAnnotationStore 数组（供现有系统使用）
 */
export function parseAnnotationStorage(
  storage: AnnotationStorage,
  _options: IntegrationOptions = {}
): IAnnotationStore[] {
  if (!storage.data) {
    return []
  }

  const { version } = storage

  if (version === '1.0') {
    // 旧格式：直接返回
    return storage.data as IAnnotationStore[]
  }

  if (version === '2.0') {
    // 新格式：转换回旧格式
    const annotations = storage.data as Annotation[]
    return annotationsToStores(annotations)
  }

  // 未知版本，尝试自动检测
  const firstItem = storage.data[0]
  if (isLegacyStore(firstItem)) {
    return storage.data as IAnnotationStore[]
  }

  // 尝试当作新格式处理
  try {
    return annotationsToStores(storage.data as Annotation[])
  } catch {
    console.warn('Failed to parse annotation storage, returning empty array')
    return []
  }
}

/**
 * 提交批注（用户保存时调用）
 * 
 * @param stores 当前批注数据
 * @param options 选项
 * @returns 标准化的 Annotation 数组
 */
export function commitAnnotations(
  stores: IAnnotationStore[],
  _options?: IntegrationOptions
): Annotation[] {
  return storesToAnnotations(stores)
}

/**
 * 加载批注（回显时调用）
 * 
 * @param storage 存储数据
 * @param options 选项
 * @returns 供现有系统使用的 IAnnotationStore 数组
 */
export function loadAnnotations(
  storage: AnnotationStorage,
  options?: IntegrationOptions
): IAnnotationStore[] {
  return parseAnnotationStorage(storage, options)
}

/**
 * 从 PDF.js 导入批注
 * 
 * @param pdfAnnotations PDF.js 批注数组
 * @param options 选项
 * @returns InkLayer Annotation 数组
 */
export function importFromPdfJs(
  pdfAnnotations: any[],
  options?: IntegrationOptions
): Annotation[] {
  return pdfAnnotations.map(pdfAnn => 
    pdfJsToAnnotation(pdfAnn, {
      documentId: options?.documentId,
      pageSize: options?.pageSize,
      defaultAuthorId: options?.defaultAuthorId || 'imported',
    })
  )
}

/**
 * 导出到 PDF.js 格式
 * 
 * @param annotations InkLayer Annotation 数组
 * @param options 选项
 * @returns PDF.js 批注数组
 */
export function exportToPdfJs(
  annotations: Annotation[],
  options?: { pageIndex?: number }
): any[] {
  return annotations.map(ann => annotationToPdfJs(ann, options))
}

/* ============================================================================
 * 工具函数
 * ========================================================================= */

/** 检查是否为旧格式存储 */
function isLegacyStore(obj: any): obj is IAnnotationStore {
  return obj && 
    typeof obj === 'object' && 
    'konvaString' in obj && 
    'type' in obj
}

/**
 * 验证 Annotation 是否有效
 */
export function validateAnnotation(annotation: Annotation): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // ID 检查
  if (!annotation.id) {
    errors.push('Missing id')
  }

  // Kind 检查
  if (!annotation.kind) {
    errors.push('Missing kind')
  }

  // Target 检查
  if (!annotation.target) {
    errors.push('Missing target')
  } else {
    if (annotation.target.pageIndex === undefined) {
      errors.push('Missing target.pageIndex')
    }
    if (!annotation.target.geometry) {
      errors.push('Missing target.geometry')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 批量验证 Annotations
 */
export function validateAnnotations(annotations: Annotation[]): {
  valid: boolean
  results: Array<{ id: string; valid: boolean; errors: string[] }>
} {
  const results = annotations.map(ann => ({
    id: ann.id,
    ...validateAnnotation(ann),
  }))

  return {
    valid: results.every(r => r.valid),
    results,
  }
}

/* ============================================================================
 * 便捷 Hook（用于 React 组件）
 * ========================================================================= */

/**
 * 集成 Hook（示例）
 * 
 * 使用方式：
 * ```tsx
 * const { annotations, save, load, exportPdf, importPdf } = useAnnotationIntegration()
 * 
 * // 保存
 * const handleSave = () => {
 *   const storage = createAnnotationStorage(annotations)
 *   saveToStorage(storage)
 * }
 * 
 * // 加载
 * const handleLoad = (storage) => {
 *   const stores = parseAnnotationStorage(storage)
 *   setAnnotations(stores)
 * }
 * ```
 */
export function useAnnotationIntegration(options?: IntegrationOptions) {
  // 这是一个示例 Hook 签名
  // 实际实现需要结合 React 的 useState 和 useCallback
  return {
    commit: (stores: IAnnotationStore[]) => commitAnnotations(stores, options),
    parse: (storage: AnnotationStorage) => parseAnnotationStorage(storage, options),
    createStorage: (stores: IAnnotationStore[]) => createAnnotationStorage(stores, options),
    importPdfJs: (pdfAnnotations: any[]) => importFromPdfJs(pdfAnnotations, options),
    exportPdfJs: (annotations: Annotation[]) => exportToPdfJs(annotations),
  }
}
