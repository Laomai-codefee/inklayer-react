import { useEffect, useRef } from 'react'
import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'

interface UseSmoothZoomOptions {
    pdfViewer: PDFViewer | null
    containerRef: React.RefObject<HTMLElement>
    minScale?: number
    maxScale?: number
}

export function useSmoothZoom({ pdfViewer, containerRef, minScale = 0.1, maxScale = 4 }: UseSmoothZoomOptions) {
    const baseScaleRef = useRef(1)
    const visualScaleRef = useRef(1)
    const commitTimerRef = useRef<number | null>(null)

    const clamp = (v: number) => Math.min(maxScale, Math.max(minScale, v))

    // 提交缩放到 PDF.js
    const commitScale = (viewerEl: HTMLElement) => {
        if (!pdfViewer) return

        // 计算最终缩放值
        const finalScale = clamp(baseScaleRef.current * visualScaleRef.current)

        // 清除视觉变换
        viewerEl.style.transform = ''
        viewerEl.style.transformOrigin = ''

        // 应用实际缩放
        pdfViewer.currentScale = finalScale
        baseScaleRef.current = finalScale
        visualScaleRef.current = 1
    }

    // 安排提交缩放
    const scheduleCommit = (viewerEl: HTMLElement) => {
        if (commitTimerRef.current) {
            clearTimeout(commitTimerRef.current)
        }
        commitTimerRef.current = window.setTimeout(() => {
            commitScale(viewerEl)
        }, 100)
    }

    useEffect(() => {
        const container = containerRef.current
        if (!pdfViewer || !container) return

        const viewerEl = container.querySelector('.pdfViewer') as HTMLElement
        if (!viewerEl) return

        // 初始化当前缩放值
        baseScaleRef.current = pdfViewer.currentScale
        visualScaleRef.current = 1

        // 处理鼠标滚轮缩放（Ctrl+wheel / trackpad pinch）
        const handleWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return

            e.preventDefault()
            e.stopPropagation()

            const rect = container.getBoundingClientRect()
            const containerX = e.clientX - rect.left
            const containerY = e.clientY - rect.top

            const isTrackpad = Math.abs(e.deltaY) < 50
            const step = isTrackpad ? 0.01 : 0.1
            const scaleFactor = e.deltaY < 0 ? 1 + step : 1 - step

            const newVisualScale = visualScaleRef.current * scaleFactor
            visualScaleRef.current = newVisualScale

            viewerEl.style.transformOrigin = '0 0'
            viewerEl.style.transform = `scale(${newVisualScale})`

            const anchorX = (container.scrollLeft + containerX) / (baseScaleRef.current * visualScaleRef.current / scaleFactor)
            const anchorY = (container.scrollTop + containerY) / (baseScaleRef.current * visualScaleRef.current / scaleFactor)
            container.scrollLeft = anchorX * baseScaleRef.current * newVisualScale - containerX
            container.scrollTop = anchorY * baseScaleRef.current * newVisualScale - containerY

            scheduleCommit(viewerEl)
        }

        // 处理触摸缩放（双指pinch）
        let initialDistance = 0

        const getDistance = (touch1: Touch, touch2: Touch) => {
            return Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            )
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                initialDistance = getDistance(e.touches[0], e.touches[1])
                e.preventDefault()
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 2 || initialDistance <= 0) return

            const currentDistance = getDistance(e.touches[0], e.touches[1])
            const scaleFactor = currentDistance / initialDistance

            const containerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - container.getBoundingClientRect().left
            const containerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - container.getBoundingClientRect().top

            const currentVisualScale = visualScaleRef.current * scaleFactor
            visualScaleRef.current = currentVisualScale

            viewerEl.style.transformOrigin = '0 0'
            viewerEl.style.transform = `scale(${currentVisualScale})`

            const anchorX = (container.scrollLeft + containerX) / (baseScaleRef.current * visualScaleRef.current / scaleFactor)
            const anchorY = (container.scrollTop + containerY) / (baseScaleRef.current * visualScaleRef.current / scaleFactor)
            container.scrollLeft = anchorX * baseScaleRef.current * currentVisualScale - containerX
            container.scrollTop = anchorY * baseScaleRef.current * currentVisualScale - containerY

            initialDistance = currentDistance
            e.preventDefault()
        }

        const handleTouchEnd = () => {
            initialDistance = 0
            if (visualScaleRef.current !== 1) {
                setTimeout(() => {
                    if (viewerEl) {
                        commitScale(viewerEl)
                    }
                }, 50)
            }
        }

        // 添加事件监听器
        container.addEventListener('wheel', handleWheel, { passive: false })
        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd)
        container.addEventListener('touchcancel', handleTouchEnd)

        return () => {
            container.removeEventListener('wheel', handleWheel)
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
            container.removeEventListener('touchcancel', handleTouchEnd)

            if (commitTimerRef.current) {
                clearTimeout(commitTimerRef.current)
            }
        }
    }, [pdfViewer, containerRef, minScale, maxScale])

    // 提供手动更新基础缩放的方法
    const updateBaseScale = () => {
        if (pdfViewer) {
            baseScaleRef.current = pdfViewer.currentScale
            visualScaleRef.current = 1
        }
    }

    return { updateBaseScale }
}
