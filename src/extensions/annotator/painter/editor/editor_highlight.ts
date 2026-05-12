import Konva from 'konva'

import { AnnotationType, IAnnotationStore, IAnnotationStyle } from '../../const/definitions'
import { Editor, IEditorOptions } from './editor'

/** 内部：span 在 canvas 坐标系中的矩形 */
interface SpanCanvasRect {
    x: number
    y: number
    width: number
    height: number
}

/**
 * EditorHighLight 是继承自 Editor 的高亮编辑器类。
 */
export class EditorHighLight extends Editor {
    /**
     * 创建一个 EditorHighLight 实例。
     * @param EditorOptions 初始化编辑器的选项
     * @param editorType 注释类型
     */
    constructor(EditorOptions: IEditorOptions, editorType: AnnotationType) {
        super({ ...EditorOptions, editorType })
    }

    /**
     * 将网页上选中文字区域转换为图形并绘制在 Canvas 上。
     *
     * 采用「按行分组 → 行内合并去重叠」策略：
     * 1. 收集所有 span 的 canvas 坐标矩形
     * 2. 按 Y 坐标分组（同一行）
     * 3. 行内按 X 排序，合并相邻/重叠矩形
     * 4. 每个合并后的行段只画一个矩形
     *
     * 避免了逐 span 画矩形时因文字间距过近导致的重叠视觉瑕疵。
     *
     * @param elements HTMLSpanElement 数组，表示要绘制的元素
     * @param fixElement 用于修正计算的元素
     */
    public convertTextSelection(elements: HTMLSpanElement[], fixElement: HTMLDivElement) {
        this.currentShapeGroup = this.createShapeGroup()
        this.getBgLayer().add(this.currentShapeGroup.konvaGroup)

        const fixBounding = fixElement.getBoundingClientRect()

        // 1. 收集所有 span 的 canvas 坐标矩形
        const spanRects: SpanCanvasRect[] = elements.map(spanEl => {
            const bounding = spanEl.getBoundingClientRect()
            return this.calculateRelativePosition(bounding, fixBounding)
        })

        // 2. 按行分组 + 行内合并去重叠
        const mergedRects = this.mergeSpanRectsByRow(spanRects)

        // 3. 每个合并行段绘一个形状
        mergedRects.forEach(rect => {
            const shape = this.createShape(rect.x, rect.y, rect.width, rect.height)
            this.currentShapeGroup!.konvaGroup.add(shape)
        })

        this.setShapeGroupDone({
            id: this.currentShapeGroup.id,
            contentsObj: {
                text: this.getElementOuterText(elements)
            },
            color: this.currentAnnotation!.style!.color
        })
    }

    /**
     * 将 span canvas 矩形按行分组 + 行内合并，消除重叠。
     *
     * 分组依据：Y 坐标差 < ROW_TOLERANCE 视为同一行。
     * 合并依据：相邻矩形水平间隙 ≤ MERGE_GAP 则合并。
     *
     * @param rects span 矩形数组
     * @returns 合并后的矩形数组（每行一个或多个不重叠的段）
     */
    private mergeSpanRectsByRow(rects: SpanCanvasRect[]): SpanCanvasRect[] {
        if (rects.length === 0) return []

        const ROW_TOLERANCE = 2   // px，同一行的 Y 容差
        const MERGE_GAP = 1        // px，水平间隙小于此值则合并

        // 按 Y 排序
        const sorted = [...rects].sort((a, b) => a.y - b.y)

        // 分组
        const rows: SpanCanvasRect[][] = []
        let currentRow: SpanCanvasRect[] = [sorted[0]]
        let currentRowY = sorted[0].y

        for (let i = 1; i < sorted.length; i++) {
            if (Math.abs(sorted[i].y - currentRowY) < ROW_TOLERANCE) {
                currentRow.push(sorted[i])
            } else {
                rows.push(currentRow)
                currentRow = [sorted[i]]
                currentRowY = sorted[i].y
            }
        }
        rows.push(currentRow)

        // 每行内按 X 排序 + 合并相邻/重叠矩形
        const merged: SpanCanvasRect[] = []

        for (const rowSpans of rows) {
            rowSpans.sort((a, b) => a.x - b.x)

            let current = { ...rowSpans[0] }
            for (let i = 1; i < rowSpans.length; i++) {
                const next = rowSpans[i]
                const currentRight = current.x + current.width
                const gap = next.x - currentRight

                if (gap <= MERGE_GAP) {
                    // 合并：扩展右边界，取最大高度
                    const nextRight = next.x + next.width
                    current.width = Math.max(currentRight, nextRight) - current.x
                    current.height = Math.max(current.height, next.height)
                    current.y = Math.min(current.y, next.y)
                } else {
                    merged.push({ ...current })
                    current = { ...next }
                }
            }
            merged.push({ ...current })
        }

        return merged
    }

    /**
     * 获取所有 elements 内部文字。
     * @param elements HTMLSpanElement 数组
     * @returns 所有元素内部文字的字符串
     */
    private getElementOuterText(elements: HTMLSpanElement[]): string {
        const fullText = elements.map(el => el.outerText).join('');
        // 如果文本超过60个字符，则保留前30个和后30个，中间用省略号代替
        if (fullText.length > 60) {
            return fullText.substring(0, 30) + '...' + fullText.substring(fullText.length - 30);
        }
        return fullText;
    }

    /**
     * 计算元素的相对位置和尺寸，适配 Canvas 坐标系。
     * @param elementBounding 元素的边界矩形
     * @param fixBounding 基准元素的边界矩形
     * @returns 相对位置和尺寸的对象 { x, y, width, height }
     */
    private calculateRelativePosition(elementBounding: DOMRect, fixBounding: DOMRect) {
        const scale = this.konvaStage.scale()
        const x = (elementBounding.x - fixBounding.x) / scale.x
        const y = (elementBounding.y - fixBounding.y) / scale.y
        const width = elementBounding.width / scale.x
        const height = elementBounding.height / scale.y
        return { x, y, width, height }
    }

    /**
     * 根据当前的注释类型创建对应的形状。
     * @param x 形状的 X 坐标
     * @param y 形状的 Y 坐标
     * @param width 形状的宽度
     * @param height 形状的高度
     * @returns Konva.Shape 具体类型的形状
     */
    private createShape(x: number, y: number, width: number, height: number): Konva.Shape {
        switch (this.currentAnnotation!.type) {
            case AnnotationType.HIGHLIGHT:
                return this.createHighlightShape(x, y, width, height)
            case AnnotationType.UNDERLINE:
                return this.createUnderlineShape(x, y, width, height)
            case AnnotationType.STRIKEOUT:
                return this.createStrikeoutShape(x, y, width, height)
            default:
                throw new Error(`Unsupported annotation type: ${this.currentAnnotation!.type}`)
        }
    }

    /**
     * 创建高亮形状。
     * @param x 形状的 X 坐标
     * @param y 形状的 Y 坐标
     * @param width 形状的宽度
     * @param height 形状的高度
     * @returns Konva.Rect 高亮形状对象
     */
    private createHighlightShape(x: number, y: number, width: number, height: number): Konva.Rect {
        return new Konva.Rect({
            x,
            y,
            width,
            height,
            opacity: 0.5,
            fill: this.currentAnnotation!.style!.color
        })
    }

    /**
     * 创建下划线形状。
     * @param x 形状的 X 坐标
     * @param y 形状的 Y 坐标
     * @param width 形状的宽度
     * @param height 形状的高度
     * @returns Konva.Rect 下划线形状对象
     */
    private createUnderlineShape(x: number, y: number, width: number, height: number): Konva.Rect {
        return new Konva.Rect({
            x,
            y: height + y - 2,
            width,
            fill: this.currentAnnotation!.style!.color,
            opacity: 1,
            hitStrokeWidth: 10,
            height: 1.5
        })
    }

    /**
     * 创建删除线形状。
     * @param x 形状的 X 坐标
     * @param y 形状的 Y 坐标
     * @param width 形状的宽度
     * @param height 形状的高度
     * @returns Konva.Rect 删除线形状对象
     */
    private createStrikeoutShape(x: number, y: number, width: number, height: number): Konva.Rect {
        return new Konva.Rect({
            x,
            y: y + height / 2,
            width,
            fill: this.currentAnnotation!.style!.color,
            opacity: 1,
            hitStrokeWidth: 10,
            height: 2
        })
    }

    /**
     * 处理鼠标按下事件，目前未实现具体逻辑。
     */
    protected mouseDownHandler() {}

    /**
     * 处理鼠标移动事件，目前未实现具体逻辑。
     */
    protected mouseMoveHandler() {}

    /**
     * 处理鼠标抬起事件，目前未实现具体逻辑。
     */
    protected mouseUpHandler() {}

    /**
     * @description 更改注释样式
     * @param annotationStore
     * @param styles
     */
    protected changeStyle(annotationStore: IAnnotationStore, styles: IAnnotationStyle): void {
        const id = annotationStore.id
        const group = this.getShapeGroupById(id)
        if (group) {
            group.getChildren().forEach(shape => {
                if (annotationStore.type === AnnotationType.HIGHLIGHT) {
                    if (shape instanceof Konva.Rect) {
                        if (styles.color !== undefined) {
                            shape.fill(styles.color)
                        }
                        if (styles.strokeWidth !== undefined) {
                            shape.strokeWidth(styles.strokeWidth)
                        }
                        if (styles.opacity !== undefined) {
                            shape.opacity(styles.opacity)
                        }
                    }
                }
                if (annotationStore.type === AnnotationType.UNDERLINE) {
                    if (shape instanceof Konva.Rect) {
                        if (styles.color !== undefined) {
                            shape.fill(styles.color)
                        }
                        if (styles.strokeWidth !== undefined) {
                            shape.strokeWidth(styles.strokeWidth)
                        }
                        if (styles.opacity !== undefined) {
                            shape.opacity(styles.opacity)
                        }
                    }
                }
                if (annotationStore.type === AnnotationType.STRIKEOUT) {
                    if (shape instanceof Konva.Rect) {
                        if (styles.color !== undefined) {
                            shape.stroke(styles.color)
                        }
                        if (styles.strokeWidth !== undefined) {
                            shape.strokeWidth(styles.strokeWidth)
                        }
                        if (styles.opacity !== undefined) {
                            shape.opacity(styles.opacity)
                        }
                    }
                }
            })
            const changedPayload: { konvaString: string; color?: string } = {
                konvaString: group.toJSON()
            }

            if (styles.color !== undefined) {
                changedPayload.color = styles.color
            }

            this.setChanged(id, changedPayload)
        }
    }
}
