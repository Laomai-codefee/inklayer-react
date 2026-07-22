/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import { usePinchZoom } from '../usePinchZoom'

const createViewer = () => ({
    currentScale: 1,
    pdfDocument: {}
}) as unknown as PDFViewer

describe('usePinchZoom', () => {
    it('clamps Ctrl+wheel zoom and keeps the pointer position anchored', () => {
        const container = document.createElement('div')
        container.getBoundingClientRect = jest.fn(() => ({
            left: 10,
            top: 20,
            right: 210,
            bottom: 220,
            width: 200,
            height: 200,
            x: 10,
            y: 20,
            toJSON: () => undefined
        }))
        const viewer = createViewer()

        renderHook(() => usePinchZoom({
            pdfViewer: viewer,
            containerRef: { current: container },
            maxScale: 2
        }))

        act(() => {
            container.dispatchEvent(new WheelEvent('wheel', {
                ctrlKey: true,
                deltaY: -100,
                clientX: 60,
                clientY: 70,
                cancelable: true
            }))
        })

        expect(viewer.currentScale).toBe(2)
        expect(container.scrollLeft).toBe(50)
        expect(container.scrollTop).toBe(50)
    })

    it('keeps listeners stable for equivalent renders and refreshes them when limits change', () => {
        const container = document.createElement('div')
        const viewer = createViewer()
        const containerRef = { current: container }
        const addEventListener = jest.spyOn(container, 'addEventListener')
        const removeEventListener = jest.spyOn(container, 'removeEventListener')

        const { rerender, unmount } = renderHook(
            ({ maxScale }) => usePinchZoom({ pdfViewer: viewer, containerRef, maxScale }),
            { initialProps: { maxScale: 2 } }
        )

        const wheelAdds = () => addEventListener.mock.calls.filter(([name]) => name === 'wheel').length
        const wheelRemovals = () => removeEventListener.mock.calls.filter(([name]) => name === 'wheel').length

        expect(wheelAdds()).toBe(1)
        rerender({ maxScale: 2 })
        expect(wheelAdds()).toBe(1)
        expect(wheelRemovals()).toBe(0)

        rerender({ maxScale: 3 })
        expect(wheelAdds()).toBe(2)
        expect(wheelRemovals()).toBe(1)

        unmount()
        expect(wheelRemovals()).toBe(2)
    })
})
