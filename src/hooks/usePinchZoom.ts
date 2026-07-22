/**
 * usePinchZoom — PDF.js v4 官方 Pinch Zoom 算法迁移
 *
 * 核心算法来源：pdfjs-dist/web/app.js / pdf_viewer.js
 *   - _accumulateFactor()    → 因子累积，平滑小幅度缩放
 *   - _centerAtPos()         → 锚点滚动补偿
 *   - webViewerWheel()       → Trackpad / Ctrl+Wheel 缩放
 *   - webViewerTouchStart/Move/End → Touch 双指缩放 + 几何判别
 *
 * 关键设计：
 *   1. 不使用 CSS transform: scale——直接修改 pdfViewer.currentScale
 *   2. 使用 PDF viewport scale，保证 PDF Layer / Text Layer / Annotation Layer 坐标一致
 *   3. 不依赖第三方 pinch zoom 库
 */

import { useCallback, useEffect, useRef } from 'react'
import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'

// ── 类型定义 ──
interface UsePinchZoomOptions {
    /** PDFViewer 实例（usePdfViewer 返回） */
    pdfViewer: PDFViewer | null
    /** 滚动容器 ref（即传给 PDFViewer 的 container） */
    containerRef: React.RefObject<HTMLElement>
    /** 最小缩放比例，默认 0.1 */
    minScale?: number
    /** 最大缩放比例，默认 10 */
    maxScale?: number
}

/** Touch 手势记录，与 PDF.js _touchInfo 结构一致 */
interface TouchInfo {
    touch0X: number
    touch0Y: number
    touch1X: number
    touch1Y: number
}

// ═══════════════════════════════════════════════════════════
//  核心算法 1: _accumulateFactor
//  来源: pdf.js-4.2.67/web/app.js L2086-2101
// ═══════════════════════════════════════════════════════════
/**
 * 累加缩放因子，避免每帧都触发缩放。
 *
 * 原理：
 *  - 将不足 0.01 精度的缩放量暂存到 ref 中
 *  - 当累积量足以触发 scale * 100 整数位变化时，返回有效 factor
 *  - 方向反转（放大→缩小 / 缩小→放大）时重置暂存
 *
 * @param previousScale  缩放前的 currentScale
 * @param factor         本次事件的原始缩放比率
 * @param accumulationRef 暂存器 ref（wheelFactorRef 或 touchFactorRef）
 * @returns 经累积处理后的缩放因子；返回 1 表示无需缩放
 */
const accumulateFactor = (
    previousScale: number,
    factor: number,
    accumulationRef: React.MutableRefObject<number>,
): number => {
    if (factor === 1) return 1

    const stored = accumulationRef.current
    if ((stored > 1 && factor < 1) || (stored < 1 && factor > 1)) {
        accumulationRef.current = 1
    }

    const newFactor =
        Math.floor(previousScale * factor * accumulationRef.current * 100) /
        (100 * previousScale)
    accumulationRef.current = factor / newFactor
    return newFactor
}

// ── Hook 主体 ──
export function usePinchZoom({
    pdfViewer,
    containerRef,
    minScale = 0.1,
    maxScale = 10,
}: UsePinchZoomOptions) {
    // ── 跨渲染持久化状态（ref）──
    const wheelFactorRef = useRef(1)       // _wheelUnusedFactor
    const touchFactorRef = useRef(1)       // _touchUnusedFactor
    const isCtrlKeyDownRef = useRef(false) // 物理 Ctrl/Meta 键是否按下
    const touchInfoRef = useRef<TouchInfo | null>(null)

    // ═══════════════════════════════════════════════════════════
    //  核心算法 2: _centerAtPos
    //  来源: pdf.js-4.2.67/web/app.js L2103-2111
    // ═══════════════════════════════════════════════════════════
    /**
     * 锚点滚动补偿：缩放后调整 scrollLeft/scrollTop，
     * 使指定屏幕坐标下的文档内容在缩放后仍位于相同屏幕位置。
     *
     * 数学推导：
     *  设 scaleDiff = newScale / oldScale - 1
     *  缩放前，鼠标所在文档位置到容器左上角偏移 = (clientX - containerLeft) / oldScale
     *  缩放后，同样的文档位置到容器左上角偏移 = (clientX - containerLeft) / newScale
     *  偏移差 = (clientX - containerLeft) * (1/oldScale - 1/newScale)
     *        = (clientX - containerLeft) * (newScale - oldScale) / (oldScale * newScale)
     *
     *  但由于 scrollLeft 是在 oldScale 下的像素坐标系中，
     *  最简单公式: scrollLeft' += (clientX - containerLeft) * scaleDiff
     *
     * @param previousScale  缩放前的 currentScale
     * @param clientX        锚点的 viewport x 坐标
     * @param clientY        锚点的 viewport y 坐标
     */
    const centerAtPos = useCallback((
        previousScale: number,
        clientX: number,
        clientY: number,
    ) => {
        const container = containerRef.current
        if (!container || !pdfViewer) return

        const currentScale = pdfViewer.currentScale
        const scaleDiff = currentScale / previousScale - 1
        if (scaleDiff === 0) return

        const { left, top } = container.getBoundingClientRect()
        container.scrollLeft += (clientX - left) * scaleDiff
        container.scrollTop += (clientY - top) * scaleDiff
    }, [containerRef, pdfViewer])

    // ── 辅助：缩放并补偿 ──
    const applyZoom = useCallback((
        previousScale: number,
        newFactor: number,
        clientX: number,
        clientY: number,
        accumulationRef: React.MutableRefObject<number>,
    ) => {
        const factor = accumulateFactor(previousScale, newFactor, accumulationRef)
        if (factor === 1) return

        let newScale = Math.round(previousScale * factor * 100) / 100
        newScale = Math.min(maxScale, Math.max(minScale, newScale))

        if (!pdfViewer || !pdfViewer.pdfDocument) return
        pdfViewer.currentScale = newScale
        centerAtPos(previousScale, clientX, clientY)
    }, [centerAtPos, maxScale, minScale, pdfViewer])

    // ═══════════════════════════════════════════════════════════
    //  Wheel / Trackpad Pinch Zoom
    //  来源: pdf.js-4.2.67/web/app.js webViewerWheel (L2578-2695)
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        const container = containerRef.current
        if (!container || !pdfViewer) return

        const handleWheel = (e: WheelEvent) => {
            // 仅响应 Ctrl/Meta+Wheel（包括 trackpad pinch 映射的 ctrlKey wheel 事件）
            if (!e.ctrlKey && !e.metaKey) return
            e.preventDefault()

            // PDF.js 缩放因子公式：Math.exp(-deltaY / 100)
            // 源自 Firefox 源码: InputData.cpp#L618-626
            const rawFactor = Math.exp(-e.deltaY / 100)
            const previousScale = pdfViewer.currentScale

            applyZoom(
                previousScale,
                rawFactor,
                e.clientX,
                e.clientY,
                wheelFactorRef,
            )
        }

        // 追踪物理 Ctrl/Meta 键状态（用于区分物理按键与 trackpad pinch）
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                isCtrlKeyDownRef.current = true
            }
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                isCtrlKeyDownRef.current = false
            }
        }

        container.addEventListener('wheel', handleWheel, { passive: false })
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            container.removeEventListener('wheel', handleWheel)
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [pdfViewer, containerRef, applyZoom])

    // ═══════════════════════════════════════════════════════════
    //  Touch Pinch Zoom (iOS / Android)
    //  来源: pdf.js-4.2.67/web/app.js
    //    webViewerTouchStart  (L2697-2721)
    //    webViewerTouchMove   (L2723-2829)
    //    webViewerTouchEnd    (L2831-2840)
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        const container = containerRef.current
        if (!container || !pdfViewer) return

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 2) {
                touchInfoRef.current = null
                return
            }
            e.preventDefault()

            // 保证 touch0.identifier < touch1.identifier
            let [t0, t1] = [e.touches[0], e.touches[1]]
            if (t0.identifier > t1.identifier) {
                [t0, t1] = [t1, t0]
            }
            touchInfoRef.current = {
                touch0X: t0.pageX,
                touch0Y: t0.pageY,
                touch1X: t1.pageX,
                touch1Y: t1.pageY,
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            const info = touchInfoRef.current
            if (!info || e.touches.length !== 2) return

            let [t0, t1] = [e.touches[0], e.touches[1]]
            if (t0.identifier > t1.identifier) {
                [t0, t1] = [t1, t0]
            }

            const { pageX: p0x, pageY: p0y } = t0
            const { pageX: p1x, pageY: p1y } = t1
            const {
                touch0X: pp0x,
                touch0Y: pp0y,
                touch1X: pp1x,
                touch1Y: pp1y,
            } = info

            // ── 判别是否为 Pinch 手势（排除双指平移滚动）──
            // 几乎没动 → 跳过
            if (
                Math.abs(pp0x - p0x) <= 1 &&
                Math.abs(pp0y - p0y) <= 1 &&
                Math.abs(pp1x - p1x) <= 1 &&
                Math.abs(pp1y - p1y) <= 1
            ) {
                return
            }

            // 更新存储的触摸位置
            info.touch0X = p0x
            info.touch0Y = p0y
            info.touch1X = p1x
            info.touch1Y = p1y

            // 几何判别：共线性 / 点积检查
            if (pp0x === p0x && pp0y === p0y) {
                // Touch0 固定：检查 touch1 移动向量与 touch0→touch1 向量是否共线
                const v1x = pp1x - p0x
                const v1y = pp1y - p0y
                const v2x = p1x - p0x
                const v2y = p1y - p0y
                const det = v1x * v2y - v1y * v2x
                // 交叉积 > 0.02 * |v1| * |v2| 说明不共线（是旋转手势）
                if (
                    Math.abs(det) >
                    0.02 * Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y)
                ) {
                    return
                }
            } else if (pp1x === p1x && pp1y === p1y) {
                // Touch1 固定
                const v1x = pp0x - p1x
                const v1y = pp0y - p1y
                const v2x = p0x - p1x
                const v2y = p0y - p1y
                const det = v1x * v2y - v1y * v2x
                if (
                    Math.abs(det) >
                    0.02 * Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y)
                ) {
                    return
                }
            } else {
                // 两根手指都在移动：点积 >=0 说明朝同方向（平移），<0 才可能是捏合
                const d0x = p0x - pp0x
                const d1x = p1x - pp1x
                const d0y = p0y - pp0y
                const d1y = p1y - pp1y
                const dotProduct = d0x * d1x + d0y * d1y
                if (dotProduct >= 0) return
            }

            e.preventDefault()

            // 计算帧间距离比
            const distance = Math.hypot(p0x - p1x, p0y - p1y) || 1
            const pDistance = Math.hypot(pp0x - pp1x, pp0y - pp1y) || 1
            const previousScale = pdfViewer.currentScale

            // 缩放中心：两根手指的中点（client 坐标）
            const midClientX = (t0.clientX + t1.clientX) / 2
            const midClientY = (t0.clientY + t1.clientY) / 2

            applyZoom(
                previousScale,
                distance / pDistance,
                midClientX,
                midClientY,
                touchFactorRef,
            )
        }

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchInfoRef.current) return
            e.preventDefault()
            touchInfoRef.current = null
            touchFactorRef.current = 1
        }

        container.addEventListener('touchstart', handleTouchStart, {
            passive: false,
        })
        container.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        })
        container.addEventListener('touchend', handleTouchEnd, {
            passive: false,
        })
        container.addEventListener('touchcancel', handleTouchEnd)

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
            container.removeEventListener('touchcancel', handleTouchEnd)
        }
    }, [pdfViewer, containerRef, applyZoom])
}
