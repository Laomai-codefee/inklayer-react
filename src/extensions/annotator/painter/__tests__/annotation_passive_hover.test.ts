/** @jest-environment jsdom */

import Konva from 'konva'

import { AnnotationPassiveHover } from '../annotation_passive_hover'
import { SHAPE_GROUP_NAME } from '../const'

function createPointerEvent({
    clientX = 50,
    clientY = 60,
    buttons = 0,
    pointerType = 'mouse'
}: {
    clientX?: number
    clientY?: number
    buttons?: number
    pointerType?: string
} = {}): PointerEvent {
    const event = new MouseEvent('pointermove', {
        bubbles: true,
        clientX,
        clientY,
        buttons
    })
    Object.defineProperty(event, 'pointerType', { value: pointerType })
    return event as PointerEvent
}

describe('AnnotationPassiveHover', () => {
    let frameCallbacks: FrameRequestCallback[]
    let requestFrame: jest.SpyInstance
    let cancelFrame: jest.SpyInstance

    beforeEach(() => {
        frameCallbacks = []
        requestFrame = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            frameCallbacks.push(callback)
            return frameCallbacks.length
        })
        cancelFrame = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation()
    })

    afterEach(() => {
        requestFrame.mockRestore()
        cancelFrame.mockRestore()
        document.body.replaceChildren()
    })

    function flushFrame(): void {
        const callback = frameCallbacks.shift()
        callback?.(0)
    }

    function setup() {
        const pageElement = document.createElement('div')
        const stageContainer = document.createElement('div')
        pageElement.appendChild(stageContainer)
        document.body.appendChild(pageElement)
        jest.spyOn(stageContainer, 'getBoundingClientRect').mockReturnValue({
            x: 10,
            y: 20,
            left: 10,
            top: 20,
            right: 210,
            bottom: 420,
            width: 200,
            height: 400,
            toJSON: () => ({})
        })

        const group = {
            id: () => 'annotation-1',
            name: () => SHAPE_GROUP_NAME
        }
        const shape = {
            findAncestor: jest.fn(() => group)
        }
        const getIntersection = jest.fn(() => shape)
        const stage = {
            container: () => stageContainer,
            width: () => 400,
            height: () => 800,
            getLayers: () => [{}],
            getIntersection
        } as unknown as Konva.Stage
        const onHoverStart = jest.fn()
        const onHoverEnd = jest.fn()
        let suppressed = false
        const hover = new AnnotationPassiveHover({
            shouldSuppress: () => suppressed,
            onHoverStart,
            onHoverEnd
        })
        hover.registerPage(1, pageElement, stage)

        return {
            pageElement,
            stageContainer,
            shape,
            getIntersection,
            onHoverStart,
            onHoverEnd,
            hover,
            setSuppressed: (value: boolean) => {
                suppressed = value
            }
        }
    }

    it('coalesces pointer moves and resolves the topmost Konva group in stage coordinates', () => {
        const {
            pageElement,
            stageContainer,
            shape,
            getIntersection,
            onHoverStart,
            onHoverEnd,
            hover
        } = setup()

        const firstEvent = createPointerEvent({ clientX: 30, clientY: 40 })
        const latestEvent = createPointerEvent({ clientX: 60, clientY: 120 })
        pageElement.dispatchEvent(firstEvent)
        pageElement.dispatchEvent(latestEvent)

        expect(requestFrame).toHaveBeenCalledTimes(1)
        expect(firstEvent.defaultPrevented).toBe(false)
        flushFrame()

        expect(getIntersection).toHaveBeenCalledWith({ x: 100, y: 200 })
        expect(shape.findAncestor).toHaveBeenCalledWith(`.${SHAPE_GROUP_NAME}`)
        expect(onHoverStart).toHaveBeenCalledWith('annotation-1')

        pageElement.dispatchEvent(createPointerEvent({ clientX: 60, clientY: 120 }))
        flushFrame()
        expect(onHoverStart).toHaveBeenCalledTimes(1)

        stageContainer.dispatchEvent(new MouseEvent('pointerleave'))
        expect(onHoverEnd).not.toHaveBeenCalled()

        pageElement.dispatchEvent(new MouseEvent('pointerleave'))
        expect(onHoverEnd).toHaveBeenCalledWith('annotation-1')

        hover.destroy()
    })

    it('clears or suppresses hover for dragging, touch, text selection, and outside points', () => {
        const {
            pageElement,
            getIntersection,
            onHoverStart,
            onHoverEnd,
            hover,
            setSuppressed
        } = setup()

        pageElement.dispatchEvent(createPointerEvent())
        flushFrame()
        expect(onHoverStart).toHaveBeenCalledTimes(1)

        pageElement.dispatchEvent(createPointerEvent({ buttons: 1 }))
        expect(onHoverEnd).toHaveBeenCalledWith('annotation-1')

        pageElement.dispatchEvent(createPointerEvent({ pointerType: 'touch' }))
        expect(onHoverStart).toHaveBeenCalledTimes(1)

        setSuppressed(true)
        pageElement.dispatchEvent(createPointerEvent())
        expect(onHoverStart).toHaveBeenCalledTimes(1)

        setSuppressed(false)
        pageElement.dispatchEvent(createPointerEvent({ clientX: 500, clientY: 500 }))
        flushFrame()
        expect(getIntersection).toHaveBeenCalledTimes(1)

        hover.destroy()
    })

    it('clears blank hits and cancels pending work when a page is unregistered', () => {
        const {
            pageElement,
            getIntersection,
            onHoverStart,
            onHoverEnd,
            hover
        } = setup()

        pageElement.dispatchEvent(createPointerEvent())
        flushFrame()
        expect(onHoverStart).toHaveBeenCalledTimes(1)

        getIntersection.mockReturnValueOnce(null)
        pageElement.dispatchEvent(createPointerEvent())
        flushFrame()
        expect(onHoverEnd).toHaveBeenCalledWith('annotation-1')

        pageElement.dispatchEvent(createPointerEvent())
        hover.unregisterPage(1)
        expect(cancelFrame).toHaveBeenCalled()

        flushFrame()
        expect(onHoverStart).toHaveBeenCalledTimes(1)

        hover.destroy()
    })

    it('uses the topmost annotation returned by the Konva hit graph', () => {
        const pageElement = document.createElement('div')
        const stageContainer = document.createElement('div')
        pageElement.appendChild(stageContainer)
        document.body.appendChild(pageElement)
        jest.spyOn(stageContainer, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 200,
            bottom: 200,
            width: 200,
            height: 200,
            toJSON: () => ({})
        })

        const stage = new Konva.Stage({ container: stageContainer, width: 200, height: 200 })
        const layer = new Konva.Layer()
        const lowerGroup = new Konva.Group({ id: 'annotation-lower', name: SHAPE_GROUP_NAME })
        lowerGroup.add(new Konva.Rect({ x: 20, y: 20, width: 100, height: 100, fill: '#f00' }))
        const upperGroup = new Konva.Group({ id: 'annotation-upper', name: SHAPE_GROUP_NAME })
        const upperShape = new Konva.Rect({ x: 40, y: 40, width: 100, height: 100, fill: '#00f' })
        upperGroup.add(upperShape)
        layer.add(lowerGroup, upperGroup)
        stage.add(layer)
        jest.spyOn(stage, 'getIntersection').mockReturnValue(upperShape)

        const onHoverStart = jest.fn()
        const hover = new AnnotationPassiveHover({
            shouldSuppress: () => false,
            onHoverStart,
            onHoverEnd: jest.fn()
        })
        hover.registerPage(1, pageElement, stage)

        pageElement.dispatchEvent(createPointerEvent({ clientX: 60, clientY: 60 }))
        flushFrame()

        expect(onHoverStart).toHaveBeenCalledWith('annotation-upper')

        hover.destroy()
        stage.destroy()
    })
})
