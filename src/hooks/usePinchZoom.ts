import { useEffect, useRef } from 'react'

interface UsePinchZoomOptions {
    pdfViewer: { currentScale: number; currentScaleValue: string | number } | null
    containerRef: React.RefObject<HTMLElement>
    minScale?: number
    maxScale?: number
}

export function usePinchZoom({ pdfViewer, containerRef, minScale = 0.1, maxScale = 10 }: UsePinchZoomOptions) {
    // ── Touch pinch state ──
    const pinchState = useRef<{
        startScale: number      // pdfViewer.currentScale at touchstart
        startDistance: number   // finger distance at touchstart
        lastCenter: [number, number]  // finger center at touchstart
        transformNode: HTMLElement | null
        visualScale: number
    }>({
        startScale: 1,
        startDistance: 0,
        lastCenter: [0, 0],
        transformNode: null,
        visualScale: 1,
    })

    const clamp = (v: number) => Math.max(minScale, Math.min(maxScale, v))

    // ── Wheel zoom (Ctrl+scroll / trackpad) ──
    useEffect(() => {
        const container = containerRef.current
        if (!container || !pdfViewer) return

        const handleWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return
            e.preventDefault()

            const origin: [number, number] = [e.clientX, e.clientY]
            const previousScale = pdfViewer.currentScale

            const isTrackpad = Math.abs(e.deltaY) < 50
            const step = isTrackpad ? 0.01 : 0.1
            const scaleFactor = e.deltaY < 0 ? 1 + step : 1 - step

            const newScale = clamp(previousScale * scaleFactor)
            if (newScale === previousScale) return

            pdfViewer.currentScale = newScale
            const scaleDiff = newScale / previousScale - 1
            const containerRect = container.getBoundingClientRect()
            container.scrollLeft += (origin[0] - containerRect.left) * scaleDiff
            container.scrollTop += (origin[1] - containerRect.top) * scaleDiff
        }

        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [pdfViewer, containerRef, minScale, maxScale])

    // ── Touch pinch zoom (2-phase: visual → commit) ──
    useEffect(() => {
        const container = containerRef.current
        if (!container || !pdfViewer) return

        const getDistance = (t1: Touch, t2: Touch) =>
            Math.sqrt((t2.clientX - t1.clientX) ** 2 + (t2.clientY - t1.clientY) ** 2)

        const getCenter = (t1: Touch, t2: Touch): [number, number] => [
            (t1.clientX + t2.clientX) / 2,
            (t1.clientY + t2.clientY) / 2,
        ]

        let isPinching = false
        let commitTimer: ReturnType<typeof setTimeout> | null = null

        const commitPinch = () => {
            if (!isPinching) return
            isPinching = false

            const viewport = container.querySelector('.pdfViewer') as HTMLElement
            if (!viewport) return

            // Clear visual transform
            viewport.style.transform = ''
            viewport.style.transformOrigin = ''

            // Commit the final scale to pdf.js
            const finalScale = pinchState.current.startScale * pinchState.current.visualScale
            if (Math.abs(finalScale - pdfViewer.currentScale) > 0.001) {
                const previousScale = pdfViewer.currentScale
                pdfViewer.currentScale = finalScale

                // Adjust scroll for anchor (use last center)
                const scaleDiff = finalScale / previousScale - 1
                const containerRect = container.getBoundingClientRect()
                const [cx, cy] = pinchState.current.lastCenter
                container.scrollLeft += (cx - containerRect.left) * scaleDiff
                container.scrollTop += (cy - containerRect.top) * scaleDiff
            }

            pinchState.current.visualScale = 1
            pinchState.current.startDistance = 0
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                isPinching = true

                // Cancel any pending commit
                if (commitTimer) { clearTimeout(commitTimer); commitTimer = null }

                const viewport = container.querySelector('.pdfViewer') as HTMLElement
                pinchState.current = {
                    startScale: pdfViewer.currentScale,
                    startDistance: getDistance(e.touches[0], e.touches[1]),
                    lastCenter: getCenter(e.touches[0], e.touches[1]),
                    transformNode: viewport,
                    visualScale: 1,
                }

                e.preventDefault()
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 2 || !isPinching) return
            e.preventDefault()

            const { startDistance, transformNode } = pinchState.current
            if (startDistance <= 0 || !transformNode) return

            const currentDistance = getDistance(e.touches[0], e.touches[1])
            const pinchScaleFactor = currentDistance / startDistance
            const visualScale = pinchScaleFactor // directly: distance ratio

            pinchState.current.visualScale = visualScale

            // Calculate new center
            const center = getCenter(e.touches[0], e.touches[1])
            pinchState.current.lastCenter = center
            const containerRect = container.getBoundingClientRect()

            // Apply visual scale + anchor via CSS transform
            // Apply visual transform with center at pinch midpoint
            // Using pinch center as transformOrigin avoids needing scroll compensation:
            // the point under the user's fingers stays fixed naturally.
            transformNode.style.transformOrigin = `${center[0] - containerRect.left}px ${center[1] - containerRect.top}px`
            transformNode.style.transform = `scale(${visualScale})`

            // No scroll adjustment needed — transformOrigin handles the anchor
        }

        const handleTouchEnd = () => {
            if (!isPinching) return

            // Debounce commit to avoid triggering during brief finger lifts
            if (commitTimer) clearTimeout(commitTimer)
            commitTimer = setTimeout(commitPinch, 50)
        }

        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd)
        container.addEventListener('touchcancel', handleTouchEnd)

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
            container.removeEventListener('touchcancel', handleTouchEnd)
            if (commitTimer) clearTimeout(commitTimer)
        }
    }, [pdfViewer, containerRef, minScale, maxScale])
}
