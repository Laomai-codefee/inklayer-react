/**
 * InkLayer Konva Adapter
 * ======================
 *
 * 实现 InkLayer Annotation Core 与 Konva 之间的双向转换。
 *
 * 功能：
 * - Annotation → Konva Node（渲染）
 * - Konva Node → Annotation（提取几何）
 * - 视口坐标 ↔ PDF 坐标转换
 *
 * @version 0.1.0
 */

import Konva from 'konva'
import type {
    Annotation,
    Geometry,
    AnnotationAppearance,
    PdfPoint,
    PdfRect,
    PathGeometry,
    QuadGeometry,
    RectGeometry,
    LineGeometry,
    PolyGeometry,
    TextMarkupPayload,
    NotePayload,
    InkPayload,
    ShapePayload,
    LinePayload,
    StampPayload
} from '../annotation.core'
import { ViewportContext, ExtractResult, pdfToCanvasPoint, canvasToPdfPoint } from './adapter.interface'

/* ============================================================================
 * 常量配置
 * ========================================================================= */

/** 默认样式配置 */
const DEFAULT_STYLES = {
    strokeColor: '#ff6b6b',
    fillColor: 'transparent',
    strokeWidth: 2,
    opacity: 1,
    fontSize: 14,
    fontFamily: 'Arial'
}

/** 文本标注变体到颜色的默认映射 */
const TEXT_MARKUP_COLORS = {
    highlight: '#ffeb3b',
    underline: '#2196f3',
    squiggly: '#9c27b0',
    strikeout: '#f44336'
}

/* ============================================================================
 * 类型定义
 * ========================================================================= */

/** Konva 渲染上下文 */
export interface KonvaRenderContext extends ViewportContext {
    /** Konva Stage */
    stage: Konva.Stage
    /** Konva Layer */
    layer: Konva.Layer
    /** 容器尺寸 */
    containerSize: {
        width: number
        height: number
    }
}

/** 批注渲染选项 */
export interface RenderOptions {
    /** 是否可交互（可选） */
    interactive?: boolean
    /** 是否选中 */
    selected?: boolean
    /** 点击回调 */
    onClick?: (annotation: Annotation) => void
    /** 双击回调 */
    onDblClick?: (annotation: Annotation) => void
}

/* ============================================================================
 * 核心实现
 * ========================================================================= */

/**
 * Konva Annotation Renderer
 */
export class KonvaAnnotationRenderer {
    private context: KonvaRenderContext

    constructor(context: KonvaRenderContext, _options: RenderOptions = {}) {
        this.context = context
    }

    /**
     * 从 Annotation 渲染 Konva 节点
     */
    render(annotation: Annotation): Konva.Node {
        const { kind, target, appearance, payload } = annotation

        // 获取外观样式
        const style = this.getAppearanceStyle(appearance)

        // 创建节点
        switch (kind) {
            case 'text-markup':
                return this.renderTextMarkup(target.geometry as QuadGeometry, style, payload as TextMarkupPayload)
            case 'note':
                return this.renderNote(target.geometry as RectGeometry, style, payload as NotePayload)
            case 'ink':
                return this.renderInk(target.geometry as PathGeometry, style, payload as InkPayload)
            case 'shape':
                return this.renderShape(target.geometry as Geometry, style, payload as ShapePayload)
            case 'line':
                return this.renderLine(target.geometry as LineGeometry, style, payload as LinePayload)
            case 'stamp':
                return this.renderStamp(target.geometry as RectGeometry, style, payload as StampPayload)
            default:
                return this.renderDefault(target.geometry as RectGeometry, style)
        }
    }

    /**
     * 从 Konva 节点提取 Annotation（几何信息）
     */
    extract(node: Konva.Node, _annotationId: string): ExtractResult {
        const result: ExtractResult = {
            geometry: this.extractGeometry(node),
            appearance: this.extractAppearance(node)
        }
        return result
    }

    /* =========================================================================
     * 私有方法：渲染
     * ========================================================================= */

    /** 渲染文本标注（高亮、下划线等） */
    private renderTextMarkup(geometry: QuadGeometry, _style: ReturnType<typeof this.getAppearanceStyle>, payload?: TextMarkupPayload): Konva.Node {
        const group = new Konva.Group({
            name: 'annotation-group',
            id: ''
        })

        if (!geometry?.quads || geometry.quads.length === 0) {
            return group
        }

        const color = payload?.color || TEXT_MARKUP_COLORS[payload?.variant || 'highlight'] || TEXT_MARKUP_COLORS.highlight
        const opacity = payload?.opacity ?? 0.4

        for (const quad of geometry.quads) {
            // 转换 PDF 坐标到 Canvas 坐标
            const p1 = pdfToCanvasPoint(quad.p1, this.context)
            const p2 = pdfToCanvasPoint(quad.p2, this.context)
            const p3 = pdfToCanvasPoint(quad.p3, this.context)
            const p4 = pdfToCanvasPoint(quad.p4, this.context)

            const points = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]

            const line = new Konva.Line({
                points,
                fill: color,
                opacity,
                closed: true,
                stroke: color,
                strokeWidth: 0,
                name: 'annotation-shape'
            })

            group.add(line)
        }

        return group
    }

    /** 渲染文本批注（Note） */
    private renderNote(geometry: RectGeometry, style: ReturnType<typeof this.getAppearanceStyle>, payload?: NotePayload): Konva.Node {
        const rect = geometry?.rect || { x: 0, y: 0, width: 24, height: 24 }
        const canvasRect = this.pdfRectToCanvas(rect)

        const group = new Konva.Group({
            name: 'annotation-group'
        })

        // 绘制图标
        const iconSize = Math.min(canvasRect.width, canvasRect.height, 24)

        // 背景圆形
        group.add(
            new Konva.Circle({
                x: canvasRect.x + iconSize / 2,
                y: canvasRect.y + iconSize / 2,
                radius: iconSize / 2,
                fill: style.fillColor || DEFAULT_STYLES.fillColor,
                stroke: style.strokeColor || DEFAULT_STYLES.strokeColor,
                strokeWidth: style.strokeWidth || DEFAULT_STYLES.strokeWidth
            })
        )

        // 文字/图标
        const text = payload?.text || ''
        if (text) {
            group.add(
                new Konva.Text({
                    x: canvasRect.x + iconSize + 4,
                    y: canvasRect.y,
                    text: text.slice(0, 50),
                    fontSize: style.fontSize || DEFAULT_STYLES.fontSize,
                    fontFamily: style.fontFamily || DEFAULT_STYLES.fontFamily,
                    fill: style.strokeColor || DEFAULT_STYLES.strokeColor,
                    name: 'annotation-text'
                })
            )
        }

        return group
    }

    /** 渲染自由手绘（Ink） */
    private renderInk(geometry: PathGeometry, style: ReturnType<typeof this.getAppearanceStyle>, payload?: InkPayload): Konva.Node {
        const group = new Konva.Group({
            name: 'annotation-group'
        })

        if (!geometry?.points || geometry.points.length === 0) {
            return group
        }

        // 转换所有点
        const canvasPoints: number[] = []
        for (const point of geometry.points) {
            const canvasPoint = pdfToCanvasPoint(point, this.context)
            canvasPoints.push(canvasPoint.x, canvasPoint.y)
        }

        const line = new Konva.Line({
            points: canvasPoints,
            stroke: style.strokeColor || DEFAULT_STYLES.strokeColor,
            strokeWidth: payload?.width || style.strokeWidth || DEFAULT_STYLES.strokeWidth,
            opacity: style.opacity || DEFAULT_STYLES.opacity,
            lineCap: 'round',
            lineJoin: 'round',
            closed: geometry.closed || false,
            name: 'annotation-shape'
        })

        group.add(line)
        return group
    }

    /** 渲染形状（矩形、椭圆、云形等） */
    private renderShape(geometry: Geometry, style: ReturnType<typeof this.getAppearanceStyle>, payload?: ShapePayload): Konva.Node {
        const shape = payload?.shape || 'rect'

        switch (shape) {
            case 'ellipse':
                return this.renderEllipse(geometry as RectGeometry, style)
            case 'cloud':
                return this.renderCloud(geometry as RectGeometry, style)
            case 'polygon':
                return this.renderPolygon(geometry as PolyGeometry, style)
            default:
                return this.renderRect(geometry as RectGeometry, style)
        }
    }

    /** 渲染矩形 */
    private renderRect(geometry: RectGeometry, style: ReturnType<typeof this.getAppearanceStyle>): Konva.Node {
        const rect = geometry?.rect || { x: 0, y: 0, width: 100, height: 50 }
        const canvasRect = this.pdfRectToCanvas(rect)

        return new Konva.Rect({
            x: canvasRect.x,
            y: canvasRect.y,
            width: canvasRect.width,
            height: canvasRect.height,
            fill: style.fillColor || DEFAULT_STYLES.fillColor,
            stroke: style.strokeColor || DEFAULT_STYLES.strokeColor,
            strokeWidth: style.strokeWidth || DEFAULT_STYLES.strokeWidth,
            opacity: style.opacity || DEFAULT_STYLES.opacity,
            dash: style.dashArray,
            name: 'annotation-shape'
        })
    }

    /** 渲染椭圆 */
    private renderEllipse(geometry: RectGeometry, style: ReturnType<typeof this.getAppearanceStyle>): Konva.Node {
        const rect = geometry?.rect || { x: 0, y: 0, width: 100, height: 50 }
        const canvasRect = this.pdfRectToCanvas(rect)

        return new Konva.Ellipse({
            x: canvasRect.x + canvasRect.width / 2,
            y: canvasRect.y + canvasRect.height / 2,
            radiusX: canvasRect.width / 2,
            radiusY: canvasRect.height / 2,
            fill: style.fillColor || DEFAULT_STYLES.fillColor,
            stroke: style.strokeColor || DEFAULT_STYLES.strokeColor,
            strokeWidth: style.strokeWidth || DEFAULT_STYLES.strokeWidth,
            opacity: style.opacity || DEFAULT_STYLES.opacity,
            name: 'annotation-shape'
        })
    }

    /** 渲染云形 */
    private renderCloud(geometry: RectGeometry, style: ReturnType<typeof this.getAppearanceStyle>): Konva.Node {
        const rect = geometry?.rect || { x: 0, y: 0, width: 100, height: 50 }
        const canvasRect = this.pdfRectToCanvas(rect)

        // 简化的云形实现（使用多个圆角矩形模拟）
        const group = new Konva.Group({
            name: 'annotation-group'
        })

        const cx = canvasRect.x + canvasRect.width / 2
        const cy = canvasRect.y + canvasRect.height / 2
        const rx = canvasRect.width / 4
        const ry = canvasRect.height / 4

        // 中心椭圆
        group.add(
            new Konva.Ellipse({
                x: cx,
                y: cy,
                radiusX: rx,
                radiusY: ry,
                fill: style.fillColor || DEFAULT_STYLES.fillColor,
                stroke: style.strokeColor || DEFAULT_STYLES.strokeColor,
                strokeWidth: style.strokeWidth || DEFAULT_STYLES.strokeWidth,
                opacity: style.opacity || DEFAULT_STYLES.opacity,
                name: 'annotation-shape'
            })
        )

        return group
    }

    /** 渲染多边形 */
    private renderPolygon(geometry: PolyGeometry, style: ReturnType<typeof this.getAppearanceStyle>): Konva.Node {
        const points = geometry?.points || []

        const canvasPoints: number[] = []
        for (const point of points) {
            const canvasPoint = pdfToCanvasPoint(point, this.context)
            canvasPoints.push(canvasPoint.x, canvasPoint.y)
        }

        return new Konva.Line({
            points: canvasPoints,
            fill: style.fillColor || DEFAULT_STYLES.fillColor,
            stroke: style.strokeColor || DEFAULT_STYLES.strokeColor,
            strokeWidth: style.strokeWidth || DEFAULT_STYLES.strokeWidth,
            opacity: style.opacity || DEFAULT_STYLES.opacity,
            closed: geometry.closed || false,
            lineJoin: 'round',
            name: 'annotation-shape'
        })
    }

    /** 渲染线条/箭头 */
    private renderLine(geometry: LineGeometry, style: ReturnType<typeof this.getAppearanceStyle>, payload?: LinePayload): Konva.Node {
        const start = geometry?.start || { x: 0, y: 0 }
        const end = geometry?.end || { x: 100, y: 100 }

        const canvasStart = pdfToCanvasPoint(start, this.context)
        const canvasEnd = pdfToCanvasPoint(end, this.context)

        const group = new Konva.Group({
            name: 'annotation-group'
        })

        const line = new Konva.Arrow({
            points: [canvasStart.x, canvasStart.y, canvasEnd.x, canvasEnd.y],
            stroke: style.strokeColor || DEFAULT_STYLES.strokeColor,
            strokeWidth: style.strokeWidth || DEFAULT_STYLES.strokeWidth,
            opacity: style.opacity || DEFAULT_STYLES.opacity,
            pointerLength: 10,
            pointerWidth: 10,
            fill: style.strokeColor || DEFAULT_STYLES.strokeColor,
            pointerAtBeginning: payload?.arrowStart || false,
            pointerAtEnding: payload?.arrowEnd || true,
            name: 'annotation-shape'
        })

        group.add(line)
        return group
    }

    /** 渲染印章 */
    private renderStamp(geometry: RectGeometry, style: ReturnType<typeof this.getAppearanceStyle>, payload?: StampPayload): Konva.Node {
        const rect = geometry?.rect || { x: 0, y: 0, width: 100, height: 50 }
        const canvasRect = this.pdfRectToCanvas(rect)

        const group = new Konva.Group({
            name: 'annotation-group'
        })

        const label = payload?.label || payload?.name || 'STAMP'
        const color = style.strokeColor || DEFAULT_STYLES.strokeColor

        // 印章外框
        group.add(
            new Konva.Rect({
                x: canvasRect.x,
                y: canvasRect.y,
                width: canvasRect.width,
                height: canvasRect.height,
                stroke: color,
                strokeWidth: 2,
                cornerRadius: 4,
                name: 'annotation-shape'
            })
        )

        // 印章文字
        group.add(
            new Konva.Text({
                x: canvasRect.x,
                y: canvasRect.y,
                width: canvasRect.width,
                height: canvasRect.height,
                text: label,
                fontSize: Math.min(canvasRect.height * 0.4, 16),
                fontFamily: style.fontFamily || DEFAULT_STYLES.fontFamily,
                fill: color,
                align: 'center',
                verticalAlign: 'middle',
                name: 'annotation-text'
            })
        )

        return group
    }

    /** 默认渲染 */
    private renderDefault(geometry: RectGeometry, style: ReturnType<typeof this.getAppearanceStyle>): Konva.Node {
        return this.renderRect(geometry, style)
    }

    /* =========================================================================
     * 私有方法：提取
     * ========================================================================= */

    /** 从 Konva 节点提取几何信息 */
    private extractGeometry(node: Konva.Node): Geometry {
        const name = node.name()

        if (name === 'annotation-shape') {
            // 根据具体类型提取
            if (node instanceof Konva.Rect) {
                const canvasRect = {
                    x: node.x(),
                    y: node.y(),
                    width: node.width(),
                    height: node.height()
                }
                const pdfRect = this.canvasRectToPdf(canvasRect)
                return {
                    type: 'rect',
                    rect: pdfRect
                }
            }

            if (node instanceof Konva.Line) {
                const points = node.points()
                const pdfPoints: PdfPoint[] = []

                for (let i = 0; i < points.length; i += 2) {
                    const canvasPoint = { x: points[i], y: points[i + 1] }
                    const pdfPoint = canvasToPdfPoint(canvasPoint, this.context)
                    pdfPoints.push(pdfPoint)
                }

                return {
                    type: 'path',
                    points: pdfPoints,
                    closed: node.closed()
                }
            }

            if (node instanceof Konva.Ellipse) {
                const ellipse = node as Konva.Ellipse
                const centerX = ellipse.x()
                const centerY = ellipse.y()

                // 简化为矩形包围盒
                const canvasRect = {
                    x: centerX - ellipse.radiusX(),
                    y: centerY - ellipse.radiusY(),
                    width: ellipse.radiusX() * 2,
                    height: ellipse.radiusY() * 2
                }
                const pdfRect = this.canvasRectToPdf(canvasRect)
                return {
                    type: 'rect',
                    rect: pdfRect
                }
            }
        }

        // 默认返回空矩形
        return {
            type: 'rect',
            rect: { x: 0, y: 0, width: 0, height: 0 }
        }
    }

    /** 从 Konva 节点提取外观信息 */
    private extractAppearance(node: Konva.Node): ExtractResult['appearance'] {
        const appearance: ExtractResult['appearance'] = {}

        if (node instanceof Konva.Rect) {
            const fillColor = node.fill()
            const strokeColor = node.stroke()
            appearance.strokeColor = typeof strokeColor === 'string' ? strokeColor : undefined
            appearance.fillColor = typeof fillColor === 'string' ? fillColor : undefined
            appearance.strokeWidth = node.strokeWidth()
            appearance.opacity = node.opacity()
        } else if (node instanceof Konva.Line) {
            const strokeColor = node.stroke()
            appearance.strokeColor = typeof strokeColor === 'string' ? strokeColor : undefined
            appearance.strokeWidth = node.strokeWidth()
            appearance.opacity = node.opacity()
        }

        return appearance
    }

    /* =========================================================================
     * 私有方法：工具
     * ========================================================================= */

    /** 获取外观样式 */
    private getAppearanceStyle(appearance?: AnnotationAppearance): {
        strokeColor?: string
        fillColor?: string
        strokeWidth?: number
        opacity?: number
        dashArray?: number[]
        fontSize?: number
        fontFamily?: string
    } {
        if (!appearance) {
            return { ...DEFAULT_STYLES }
        }

        return {
            strokeColor: appearance.strokeColor || DEFAULT_STYLES.strokeColor,
            fillColor: appearance.fillColor || DEFAULT_STYLES.fillColor,
            strokeWidth: appearance.strokeWidth || DEFAULT_STYLES.strokeWidth,
            opacity: appearance.opacity || DEFAULT_STYLES.opacity,
            dashArray: appearance.dashArray,
            fontSize: appearance.fontSize || DEFAULT_STYLES.fontSize,
            fontFamily: appearance.fontFamily || DEFAULT_STYLES.fontFamily
        }
    }

    /** PDF Rect → Canvas Rect */
    private pdfRectToCanvas(rect: PdfRect): { x: number; y: number; width: number; height: number } {
        const topLeft = pdfToCanvasPoint({ x: rect.x, y: rect.y }, this.context)
        const bottomRight = pdfToCanvasPoint(
            {
                x: rect.x + rect.width,
                y: rect.y + rect.height
            },
            this.context
        )

        return {
            x: topLeft.x,
            y: topLeft.y,
            width: Math.abs(bottomRight.x - topLeft.x),
            height: Math.abs(bottomRight.y - topLeft.y)
        }
    }

    /** Canvas Rect → PDF Rect */
    private canvasRectToPdf(rect: { x: number; y: number; width: number; height: number }): PdfRect {
        const topLeft = canvasToPdfPoint({ x: rect.x, y: rect.y }, this.context)
        const bottomRight = canvasToPdfPoint(
            {
                x: rect.x + rect.width,
                y: rect.y + rect.height
            },
            this.context
        )

        return {
            x: topLeft.x,
            y: topLeft.y,
            width: Math.abs(bottomRight.x - topLeft.x),
            height: Math.abs(bottomRight.y - topLeft.y)
        }
    }
}

/* ============================================================================
 * 便捷函数
 * ========================================================================= */

/**
 * 创建 Konva 渲染器实例
 */
export function createKonvaRenderer(context: KonvaRenderContext, options?: RenderOptions): KonvaAnnotationRenderer {
    return new KonvaAnnotationRenderer(context, options)
}

/**
 * 渲染单个 Annotation 到 Konva 节点
 */
export function renderAnnotationToKonva(annotation: Annotation, context: KonvaRenderContext, options?: RenderOptions): Konva.Node {
    const renderer = createKonvaRenderer(context, options)
    return renderer.render(annotation)
}

/**
 * 从 Konva 节点提取 Annotation 几何
 */
export function extractGeometryFromKonva(node: Konva.Node, context: KonvaRenderContext): ExtractResult {
    const renderer = createKonvaRenderer(context)
    return renderer.extract(node, '')
}

/**
 * 批量渲染 Annotations 到 Konva Layer
 */
export function renderAnnotationsToLayer(
    annotations: Annotation[],
    context: KonvaRenderContext,
    layer: Konva.Layer,
    options?: RenderOptions
): Konva.Node[] {
    const renderer = createKonvaRenderer(context, options)
    const nodes: Konva.Node[] = []

    for (const annotation of annotations) {
        const node = renderer.render(annotation)
        node.setAttr('annotationId', annotation.id)
        nodes.push(node)
        layer.add(node as Konva.Group | Konva.Shape)
    }

    return nodes
}
