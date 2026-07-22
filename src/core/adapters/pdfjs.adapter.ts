/**
 * PDF.js Annotation Adapter
 * ========================
 * 
 * 实现 PDF.js Annotation 与 InkLayer Annotation Core 之间的双向转换。
 * 
 * 功能：
 * - PDF.js 原生批注 → InkLayer Annotation（导入）
 * - InkLayer Annotation → PDF.js 原生批注（导出）
 * - 坐标系统转换（PDF User Space）
 * 
 * PDF.js Annotation 参考：
 * - https://mozilla.github.io/pdf.js/web/viewer.html
 * - PDF 1.7 规范 Chapter 12.5.6
 * 
 * @version 0.1.0
 */

import type { Annotation, AnnotationKind, Geometry, AnnotationTarget, AnnotationPayload, AnnotationAppearance, AnnotationMeta, AnnotationRelations, PdfRect, PdfQuad } from '../annotation.core'
import { type PdfjsAnnotationSubtype, PdfjsAnnotationType } from '@/extensions/annotator/const/definitions'

/* ============================================================================
 * 常量映射表
 * ========================================================================= */

/** PDF.js Subtype → InkLayer Kind 映射 */
export const PDFJS_SUBTYPE_TO_KIND: Record<PdfjsAnnotationSubtype, AnnotationKind> = {
  'Highlight': 'text-markup',
  'Underline': 'text-markup',
  'Squiggly': 'text-markup',
  'StrikeOut': 'text-markup',
  'Text': 'note',
  'FreeText': 'note',
  'Popup': 'note',
  'Ink': 'ink',
  'Square': 'shape',
  'Circle': 'shape',
  'Polygon': 'shape',
  'PolyLine': 'shape',
  'Line': 'line',
  'Arrow': 'line',
  'Stamp': 'stamp',
  'FileAttachment': 'file',
  'Note': 'note',
  // 不支持的类型映射到 note
  'None': 'note',
  'Link': 'note',
  'Widget': 'note',
  'Caret': 'note'
}

/** InkLayer Kind → PDF.js Subtype 映射（默认） */
export const KIND_TO_PDFJS_SUBTYPE: Record<AnnotationKind, PdfjsAnnotationSubtype> = {
  'text-markup': 'Highlight',
  'note': 'Text',
  'ink': 'Ink',
  'shape': 'Square',
  'line': 'Line',
  'stamp': 'Stamp',
  'file': 'FileAttachment',
}

/* ============================================================================
 * PDF.js 批注数据接口
 * ========================================================================= */

/** PDF.js 批注对象结构（来自 PDF.js） */
export interface PdfJsAnnotation {
  /** 批注类型 */
  subtype: PdfjsAnnotationSubtype

  /** 批注类型编号 */
  type: PdfjsAnnotationType

  /** 唯一 ID */
  id: string

  /** 几何信息 */
  rect?: number[]  // [x, y, width, height] 或 [x1, y1, x2, y2]
  quadPoints?: number[]  // [x1, y1, x2, y2, x3, y3, x4, y4, ...]

  /** 颜色 */
  color?: number[] | string

  /** 内容 */
  contents?: string
  richText?: string

  /** 样式 */
  borderStyle?: {
    width: number
    style: number
    dashArray: number[]
  }

  /** 自由文本样式 */
  textStyle?: {
    fontName?: string
    fontSize?: number
    color?: number[]
  }

  /** 线条终点 */
  lineEndings?: ['None' | 'Square' | 'Circle' | 'Diamond' | 'OpenArrow' | 'ClosedArrow', 'None' | 'Square' | 'Circle' | 'Diamond' | 'OpenArrow' | 'ClosedArrow']

  /** 创建者 */
  creator?: string

  /** 创建日期 */
  creationDate?: string

  /** 注释日期 */
  modDate?: string

  /** 父批注（用于回复） */
  parentId?: string

  /** 弹出框 */
  popup?: {
    open: boolean
    rect: number[]
  }
}

/* ============================================================================
 * 转换函数：PDF.js → InkLayer
 * ========================================================================= */

/**
 * 将 PDF.js 批注转换为 InkLayer Annotation
 * 
 * @param pdfAnnotation PDF.js 批注对象
 * @param options 选项
 * @returns InkLayer Annotation 对象
 */
export function pdfJsToAnnotation(
  pdfAnnotation: PdfJsAnnotation,
  options?: {
    /** 文档 ID（可选） */
    documentId?: string
    /** PDF 页面尺寸（用于坐标转换） */
    pageSize?: { width: number; height: number }
    /** 默认用户 ID */
    defaultAuthorId?: string
  }
): Annotation {
  const { documentId, defaultAuthorId = 'unknown' } = options || {}

  // 1. 确定 Kind
  const kind = PDFJS_SUBTYPE_TO_KIND[pdfAnnotation.subtype] || 'note'

  // 2. 构建 Geometry
  const geometry = extractGeometryFromPdfJs(pdfAnnotation)

  // 3. 构建 Target
  const target: AnnotationTarget = {
    pageIndex: 0,  // PDF.js 不直接提供页码，需要从外部传入
    geometry,
    coordinateSystem: 'pdf-user-space',
    documentId,
  }

  // 4. 构建 Payload
  const payload = extractPayloadFromPdfJs(pdfAnnotation, kind)

  // 5. 构建 Appearance
  const appearance = extractAppearanceFromPdfJs(pdfAnnotation)

  // 6. 构建 Relations
  const relations: AnnotationRelations = {
    parentId: pdfAnnotation.parentId,
  }

  // 7. 构建 Meta
  const meta: AnnotationMeta = {
    createdAt: parsePdfDate(pdfAnnotation.creationDate),
    updatedAt: parsePdfDate(pdfAnnotation.modDate),
    authorId: pdfAnnotation.creator || defaultAuthorId,
    isNative: true,
    source: 'pdfjs',
  }

  return {
    id: pdfAnnotation.id,
    kind,
    target,
    payload,
    appearance,
    relations,
    meta,
    extensions: {
      pdfjs: {
        subtype: pdfAnnotation.subtype,
        type: pdfAnnotation.type,
        rawData: pdfAnnotation,
      },
    },
  }
}

/**
 * 从 PDF.js 批注提取几何信息
 */
function extractGeometryFromPdfJs(pdf: PdfJsAnnotation): Geometry {
  const rect = pdf.rect
  const quadPoints = pdf.quadPoints

  // 优先使用 QuadPoints（文本标注）
  if (quadPoints && quadPoints.length >= 8) {
    const quads: PdfQuad[] = []
    for (let i = 0; i < quadPoints.length; i += 8) {
      quads.push({
        p1: { x: quadPoints[i], y: quadPoints[i + 1] },
        p2: { x: quadPoints[i + 2], y: quadPoints[i + 3] },
        p3: { x: quadPoints[i + 4], y: quadPoints[i + 5] },
        p4: { x: quadPoints[i + 6], y: quadPoints[i + 7] },
      })
    }
    return { type: 'quad', quads }
  }

  // 使用 Rect
  if (rect && rect.length >= 4) {
    // 判断是否为线条（宽或高接近 0）
    const width = Math.abs(rect[2] - rect[0])
    const height = Math.abs(rect[3] - rect[1])
    const isLineLike = width < 1 || height < 1

    if (isLineLike) {
      // 线条
      return {
        type: 'line',
        start: { x: rect[0], y: rect[1] },
        end: { x: rect[2], y: rect[3] },
      }
    }

    // 多点路径（Ink 等）
    if (pdf.subtype === 'Ink' || pdf.subtype === 'PolyLine' || pdf.subtype === 'Polygon') {
      // 简化处理：使用矩形表示
      return {
        type: 'rect',
        rect: {
          x: Math.min(rect[0], rect[2]),
          y: Math.min(rect[1], rect[3]),
          width,
          height,
        },
      }
    }

    // 默认使用矩形
    return {
      type: 'rect',
      rect: {
        x: Math.min(rect[0], rect[2]),
        y: Math.min(rect[1], rect[3]),
        width,
        height,
      },
    }
  }

  // 默认返回空矩形
  return {
    type: 'rect',
    rect: { x: 0, y: 0, width: 0, height: 0 },
  }
}

/**
 * 从 PDF.js 批注提取 Payload
 */
function extractPayloadFromPdfJs(pdf: PdfJsAnnotation, kind: AnnotationKind): AnnotationPayload | undefined {
  switch (kind) {
    case 'text-markup': {
      const variant = pdf.subtype.toLowerCase() as 'highlight' | 'underline' | 'squiggly' | 'strikeout'
      return {
        kind: 'text-markup',
        variant,
        color: pdf.color ? rgbToHex(pdf.color) : undefined,
      }
    }

    case 'note': {
      return {
        kind: 'note',
        text: pdf.contents || '',
      }
    }

    case 'ink': {
      return {
        kind: 'ink',
        color: pdf.color ? rgbToHex(pdf.color) : undefined,
        width: pdf.borderStyle?.width,
      }
    }

    case 'shape': {
      let shape: 'rect' | 'ellipse' | 'cloud' | 'polygon' = 'rect'
      if (pdf.subtype === 'Circle') shape = 'ellipse'
      else if (pdf.subtype === 'Polygon' || pdf.subtype === 'PolyLine') shape = 'polygon'
      
      return {
        kind: 'shape',
        shape,
      }
    }

    case 'line': {
      const lineEndings = pdf.lineEndings
      return {
        kind: 'line',
        arrowStart: lineEndings?.[0] !== 'None',
        arrowEnd: lineEndings?.[1] !== 'None',
      }
    }

    case 'stamp': {
      return {
        kind: 'stamp',
        name: pdf.contents || 'Stamp',
        label: pdf.contents || undefined,
        source: 'standard',
      }
    }

    case 'file': {
      return {
        kind: 'file',
        fileName: pdf.contents || 'attachment',
        fileUrl: '',  // 需要从其他字段获取
      }
    }

    default:
      return undefined
  }
}

/**
 * 从 PDF.js 批注提取 Appearance
 */
function extractAppearanceFromPdfJs(pdf: PdfJsAnnotation): AnnotationAppearance {
  const appearance: AnnotationAppearance = {}

  if (pdf.color) {
    appearance.fillColor = rgbToHex(pdf.color)
  }

  if (pdf.borderStyle) {
    appearance.strokeWidth = pdf.borderStyle.width
    if (pdf.borderStyle.dashArray?.length) {
      appearance.dashArray = pdf.borderStyle.dashArray
    }
  }

  if (pdf.textStyle?.fontSize) {
    appearance.fontSize = pdf.textStyle.fontSize
  }

  return appearance
}

/* ============================================================================
 * 转换函数：InkLayer → PDF.js
 * ========================================================================= */

/**
 * 将 InkLayer Annotation 转换为 PDF.js 批注对象
 * 
 * @param annotation InkLayer Annotation
 * @param options 选项
 * @returns PDF.js 批注对象
 */
export function annotationToPdfJs(
  annotation: Annotation,
  _options?: {
    /** 页面索引 */
    pageIndex?: number
  }
): PdfJsAnnotation {
  // 1. 基本信息
  const pdfAnnotation: PdfJsAnnotation = {
    subtype: KIND_TO_PDFJS_SUBTYPE[annotation.kind],
    type: getPdfJsTypeFromKind(annotation.kind),
    id: annotation.id,
  }

  // 2. 几何信息
  const pdfRect = geometryToPdfRect(annotation.target.geometry)
  pdfAnnotation.rect = [pdfRect.x, pdfRect.y, pdfRect.x + pdfRect.width, pdfRect.y + pdfRect.height]

  // 3. QuadPoints（文本标注）
  if (annotation.target.geometry.type === 'quad') {
    pdfAnnotation.quadPoints = quadsToPdfQuadPoints(annotation.target.geometry.quads)
  }

  // 4. Payload
  if (annotation.payload) {
    applyPayloadToPdfJs(annotation.payload, pdfAnnotation)
  }

  // 5. Appearance
  if (annotation.appearance) {
    applyAppearanceToPdfJs(annotation.appearance, pdfAnnotation)
  }

  // 6. Meta
  if (annotation.meta) {
    pdfAnnotation.creator = typeof annotation.meta.authorId === 'string' 
      ? annotation.meta.authorId 
      : annotation.meta.authorId?.name
    pdfAnnotation.creationDate = annotation.meta.createdAt 
      ? toPdfDate(annotation.meta.createdAt) 
      : undefined
    pdfAnnotation.modDate = annotation.meta.updatedAt 
      ? toPdfDate(annotation.meta.updatedAt) 
      : undefined
  }

  return pdfAnnotation
}

/**
 * 将几何转换为 PDF Rect
 */
function geometryToPdfRect(geometry: Geometry): PdfRect {
  switch (geometry.type) {
    case 'rect':
      return geometry.rect

    case 'quad': {
      // 从 quads 计算包围盒
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const quad of geometry.quads) {
        for (const p of [quad.p1, quad.p2, quad.p3, quad.p4]) {
          minX = Math.min(minX, p.x)
          minY = Math.min(minY, p.y)
          maxX = Math.max(maxX, p.x)
          maxY = Math.max(maxY, p.y)
        }
      }
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    }

    case 'path': {
      // 从 path points 计算包围盒
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const p of geometry.points) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    }

    case 'line': {
      return {
        x: Math.min(geometry.start.x, geometry.end.x),
        y: Math.min(geometry.start.y, geometry.end.y),
        width: Math.abs(geometry.end.x - geometry.start.x),
        height: Math.abs(geometry.end.y - geometry.start.y),
      }
    }

    case 'poly': {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const p of geometry.points) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    }

    default:
      return { x: 0, y: 0, width: 0, height: 0 }
  }
}

/**
 * 将 quads 转换为 PDF.js quadPoints 数组
 */
function quadsToPdfQuadPoints(quads: PdfQuad[]): number[] {
  const points: number[] = []
  for (const quad of quads) {
    // PDF quadPoints 顺序：BL, BR, TR, TL（逆时针）
    points.push(
      quad.p1.x, quad.p1.y,  // BL
      quad.p2.x, quad.p2.y,  // BR
      quad.p3.x, quad.p3.y,  // TR
      quad.p4.x, quad.p4.y   // TL
    )
  }
  return points
}

/**
 * 应用 Payload 到 PDF.js 批注
 */
function applyPayloadToPdfJs(payload: AnnotationPayload, pdf: PdfJsAnnotation): void {
  switch (payload.kind) {
    case 'text-markup':
      pdf.contents = ''
      break
    case 'note':
      pdf.contents = payload.text
      break
    case 'ink':
      if (payload.color) {
        pdf.color = hexToRgb(payload.color)
      }
      break
    case 'stamp':
      pdf.contents = payload.label || payload.name
      break
    case 'line':
      if (payload.arrowStart || payload.arrowEnd) {
        pdf.lineEndings = [
          payload.arrowStart ? 'ClosedArrow' : 'None',
          payload.arrowEnd ? 'ClosedArrow' : 'None',
        ]
      }
      break
  }
}

/**
 * 应用 Appearance 到 PDF.js 批注
 */
function applyAppearanceToPdfJs(appearance: AnnotationAppearance, pdf: PdfJsAnnotation): void {
  if (appearance.strokeColor) {
    pdf.color = hexToRgb(appearance.strokeColor)
  }
  if (appearance.strokeWidth !== undefined) {
    pdf.borderStyle = {
      width: appearance.strokeWidth,
      style: 0,  // Solid
      dashArray: appearance.dashArray || [],
    }
  }
  if (appearance.fontSize) {
    pdf.textStyle = {
      fontSize: appearance.fontSize,
    }
  }
}

/* ============================================================================
 * 工具函数
 * ========================================================================= */

/**
 * RGB 数组转 Hex 颜色
 */
function rgbToHex(rgb: number[] | string): string {
  if (typeof rgb === 'string') return rgb
  
  if (rgb.length >= 3) {
    const r = rgb[0]
    const g = rgb[1]
    const b = rgb[2]
    const a = rgb.length >= 4 ? rgb[3] : 1
    
    if (a === 1) {
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    }
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return '#000000'
}

/**
 * Hex 颜色转 RGB 数组
 */
function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ]
  }
  return [0, 0, 0]
}

/**
 * 解析 PDF 日期字符串
 */
function parsePdfDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined
  
  // PDF 日期格式: D:YYYYMMDDHHmmSS
  const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute, second] = match
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
  }
  return undefined
}

/**
 * 转换为 PDF 日期字符串
 */
function toPdfDate(isoDate: string): string {
  const date = new Date(isoDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `D:${year}${month}${day}${hour}${minute}${second}`
}

/**
 * 从 Kind 获取 PDF.js Type
 */
function getPdfJsTypeFromKind(kind: AnnotationKind): PdfjsAnnotationType {
  const map: Record<AnnotationKind, PdfjsAnnotationType> = {
    'text-markup': PdfjsAnnotationType.HIGHLIGHT,
    'note': PdfjsAnnotationType.TEXT,
    'ink': PdfjsAnnotationType.INK,
    'shape': PdfjsAnnotationType.SQUARE,
    'line': PdfjsAnnotationType.LINE,
    'stamp': PdfjsAnnotationType.STAMP,
    'file': PdfjsAnnotationType.FILEATTACHMENT,
  }
  return map[kind] || PdfjsAnnotationType.TEXT
}
