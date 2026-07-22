import Konva from 'konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { AnnotationType, IAnnotationStore, IAnnotationStyle } from '../../const/definitions'
import { Editor, IEditorOptions } from './editor'
import { generateCloudPathData } from '../cloud_path'

export class EditorCloud extends Editor {
    private cloudPath: Konva.Path | null = null
    private points: { x: number; y: number }[] = []
    private startRect: Konva.Rect | null = null
    private readonly startRectSize = 12

    constructor(options: IEditorOptions) {
        super({ ...options, editorType: AnnotationType.CLOUD })
        this.konvaStage.on('dblclick', this.handleDoubleClick)
        window.addEventListener('keyup', this.handleKeyUp)
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.isPainting) {
            this.cancelDrawing()
        }
    }

    private cancelDrawing() {
        this.isPainting = false
        this.points = []

        if (this.cloudPath) {
            this.cloudPath.destroy()
            this.cloudPath = null
        }

        if (this.startRect) {
            this.startRect.destroy()
            this.startRect = null
        }

        if (this.currentShapeGroup) {
            this.delShapeGroup(this.currentShapeGroup.konvaGroup.id())
            this.currentShapeGroup = null
        }

        this.getBgLayer().batchDraw()
    }

    protected mouseDownHandler(_e: KonvaEventObject<MouseEvent | TouchEvent>) {
        const pos = this.konvaStage.getRelativePointerPosition()
        if (!pos) {
            return
        }
        this.points.push(pos)

        if (!this.isPainting) {
            this.isPainting = true
            this.currentShapeGroup = this.createShapeGroup()
            this.getBgLayer().add(this.currentShapeGroup.konvaGroup)

            this.cloudPath = new Konva.Path({
                data: '',
                stroke: this.currentAnnotation!.style!.color,
                strokeWidth: this.currentAnnotation!.style!.strokeWidth,
                fillEnabled: false,
                lineJoin: 'round',
                lineCap: 'round',
                hitStrokeWidth: 20, // 设置点击检测的宽度
                opacity: this.currentAnnotation!.style!.opacity,
                strokeScaleEnabled: false
            })

            this.currentShapeGroup.konvaGroup.add(this.cloudPath)

            // 添加起点提示矩形
            this.drawStartRect(pos)
        }

        this.updateCloudPreview()
    }

    protected mouseMoveHandler(_e: KonvaEventObject<MouseEvent | TouchEvent>) {
        if (!this.isPainting || !this.cloudPath) return
        const pos = this.konvaStage.getRelativePointerPosition()
        if (!pos) {
            return
        }
        this.updateCloudPreview(pos)
    }

    protected mouseUpHandler(_e?: KonvaEventObject<MouseEvent | TouchEvent>) {
        // 空实现以符合抽象基类要求
    }

    /**
     * @description 处理双击事件，完成云朵绘制
     * @returns
     */
    /**
     * @description 处理双击事件，完成云朵绘制
     * @returns
     */
    private handleDoubleClick = () => {
        // 检查是否处于绘制状态且至少有3个点
        if (!this.isPainting || this.points.length < 3) return
        this.isPainting = false

        // 检查云朵路径是否存在
        if (!this.cloudPath) return

        try {
            // 闭合路径点（添加起始点作为结束点）
            const closedPoints = [...this.points, this.points[0]]
            const pathData = generateCloudPathData(closedPoints)
            this.cloudPath.data(pathData)

            // 检查当前形状组是否存在
            if (!this.currentShapeGroup) {
                throw new Error('Current shape group is null')
            }

            // 设置形状组为完成状态
            this.setShapeGroupDone({
                id: this.currentShapeGroup.konvaGroup.id(),
                color: this.currentAnnotation!.style!.color,
                contentsObj: { text: '' }
            })

            // 刷新图层绘制
            this.getBgLayer().batchDraw()
        } catch (error) {
            console.error('Error completing cloud annotation:', error)
        } finally {
            // 清理状态
            this.cloudPath = null
            this.points = []

            if (this.startRect) {
                this.startRect.destroy()
                this.startRect = null
            }
        }
    }

    /**
     * @description 更新云朵预览路径
     * @param cursorPos
     * @returns
     */
    private updateCloudPreview(cursorPos?: { x: number; y: number }) {
        if (!this.cloudPath) return

        const pathPoints = [...this.points]
        if (cursorPos) pathPoints.push(cursorPos)

        const pathData = generateCloudPathData(pathPoints)
        this.cloudPath.data(pathData)
    }

    /**
     * @description 绘制起点提示矩形
     * @param pos 起点位置
     */
    private drawStartRect(pos: { x: number; y: number }) {
        this.startRect = new Konva.Rect({
            x: pos.x - this.startRectSize / 2,
            y: pos.y - this.startRectSize / 2,
            width: this.startRectSize,
            height: this.startRectSize,
            stroke: '#666',
            strokeWidth: 2,
            cornerRadius: 2,
            hitStrokeWidth: 10, // 增加点击检测区域
            draggable: false,
            dash: [4, 2],
            name: 'startRect'
        })

        this.getBgLayer().add(this.startRect)
        this.startRect.moveToTop()
        this.startRect.on('mouseup', (_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            this.handleDoubleClick()
        })
        this.startRect.on('mousemove', (_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            this.startRect?.stroke('#000')
            this.startRect?.getLayer()?.batchDraw()
        })
        this.startRect.on('mouseout', (_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            this.startRect?.stroke('#666')
            this.startRect?.getLayer()?.batchDraw()
        })
    }

    /**
     * @description 更改注释样式
     * @param annotationStore
     * @param styles
     */
    protected changeStyle(annotationStore: IAnnotationStore, styles: IAnnotationStyle): void {
        const id = annotationStore.id
        const group = this.getShapeGroupById(id)
        if (group) {
            group.getChildren().forEach((shape) => {
                if (shape instanceof Konva.Path) {
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
