/** @jest-environment jsdom */

import type Konva from 'konva'

import type { IAnnotationStore } from '../../const/definitions'
import { AnnotationAuthorLabels, isAnnotationAuthorRevealKey } from '../annotation_author_labels'
import { ANNOTATION_AUTHOR_LABEL_CLASS, ANNOTATION_AUTHOR_LABELS_LAYER_CLASS } from '../const'

function createAnnotation(id: string, name: string): IAnnotationStore {
    return {
        id,
        pageNumber: 1,
        title: name,
        user: { id: name.toLowerCase(), name },
        comments: []
    } as unknown as IAnnotationStore
}

function createGroup(rect: { x: number; y: number; width: number; height: number }) {
    let changeHandler: (() => void) | null = null
    return {
        getClientRect: jest.fn(() => rect),
        on: jest.fn((_events: string, handler: () => void) => {
            changeHandler = handler
        }),
        off: jest.fn(),
        emitChange: () => changeHandler?.()
    }
}

describe('AnnotationAuthorLabels', () => {
    it('uses Command on macOS and Alt on other platforms', () => {
        expect(isAnnotationAuthorRevealKey({ key: 'Meta' }, true)).toBe(true)
        expect(isAnnotationAuthorRevealKey({ key: 'Alt' }, true)).toBe(false)
        expect(isAnnotationAuthorRevealKey({ key: 'Alt' }, false)).toBe(true)
        expect(isAnnotationAuthorRevealKey({ key: 'Meta' }, false)).toBe(false)
    })

    it('can show every author label initially', () => {
        const annotation = createAnnotation('annotation-1', 'Alice')
        const group = createGroup({ x: 20, y: 40, width: 50, height: 30 })
        const wrapper = document.createElement('div')
        const stage = {
            width: () => 500,
            height: () => 700
        } as unknown as Konva.Stage
        const labels = new AnnotationAuthorLabels({
            primaryColor: '#6e56cf',
            defaultVisible: true,
            getAnnotationsByPage: () => [annotation],
            getAnnotationGroup: () => group as unknown as Konva.Group,
            canTransform: () => true
        })

        labels.registerPage(1, wrapper, stage)
        const label = wrapper.querySelector(`[data-annotation-id="${annotation.id}"]`) as HTMLDivElement

        expect(labels.areAllVisible()).toBe(true)
        expect(label.style.display).toBe('block')

        labels.destroy()
    })

    it('keeps the selected label visible and reveals every label while the platform key is held', () => {
        const alice = createAnnotation('annotation-alice', 'Alice')
        const bob = createAnnotation('annotation-bob', 'Bob')
        const annotations = [alice, bob]
        const aliceRect = { x: 50, y: 80, width: 100, height: 60 }
        const aliceGroup = createGroup(aliceRect)
        const bobGroup = createGroup({ x: 200, y: 160, width: 80, height: 40 })
        const groups = new Map([
            [alice.id, aliceGroup],
            [bob.id, bobGroup]
        ])
        const wrapper = document.createElement('div')
        const stage = {
            width: () => 500,
            height: () => 700
        } as unknown as Konva.Stage
        const labels = new AnnotationAuthorLabels({
            primaryColor: '#6e56cf',
            getAnnotationsByPage: () => annotations,
            getAnnotationGroup: (annotation) => groups.get(annotation.id) as unknown as Konva.Group,
            canTransform: (annotation) => annotation.id === alice.id
        })

        labels.registerPage(1, wrapper, stage)
        const layer = wrapper.querySelector(`.${ANNOTATION_AUTHOR_LABELS_LAYER_CLASS}`)
        const aliceLabel = wrapper.querySelector(`[data-annotation-id="${alice.id}"]`) as HTMLDivElement
        const bobLabel = wrapper.querySelector(`[data-annotation-id="${bob.id}"]`) as HTMLDivElement

        expect(layer).not.toBeNull()
        expect(layer?.getAttribute('aria-hidden')).toBe('true')
        expect(aliceLabel.classList.contains(ANNOTATION_AUTHOR_LABEL_CLASS)).toBe(true)
        expect(aliceLabel.style.display).toBe('none')
        expect(bobLabel.style.display).toBe('none')

        Object.defineProperties(aliceLabel, {
            offsetWidth: { configurable: true, value: 70 },
            offsetHeight: { configurable: true, value: 24 }
        })
        labels.setSelected(alice.id)

        expect(aliceLabel.style.display).toBe('block')
        expect(aliceLabel.style.opacity).toBe('1')
        expect(aliceLabel.style.transform).toBe('translate3d(82px, 50px, 0)')
        expect(bobLabel.style.display).toBe('none')
        expect(bobLabel.style.opacity).toBe('0.8')

        aliceRect.x = 60
        aliceGroup.emitChange()
        expect(aliceLabel.style.transform).toBe('translate3d(92px, 50px, 0)')

        const isMac = /mac/i.test(navigator.platform || navigator.userAgent)
        const key = isMac ? 'Meta' : 'Alt'
        const code = isMac ? 'MetaLeft' : 'AltLeft'
        window.dispatchEvent(new KeyboardEvent('keydown', { key, code }))
        expect(aliceLabel.style.display).toBe('block')
        expect(bobLabel.style.display).toBe('block')

        window.dispatchEvent(new KeyboardEvent('keyup', { key, code }))
        expect(aliceLabel.style.display).toBe('block')
        expect(bobLabel.style.display).toBe('none')

        labels.setAllVisible(true)
        expect(labels.areAllVisible()).toBe(true)
        expect(bobLabel.style.display).toBe('block')

        window.dispatchEvent(new KeyboardEvent('keydown', { key, code }))
        window.dispatchEvent(new KeyboardEvent('keyup', { key, code }))
        expect(bobLabel.style.display).toBe('block')

        labels.setAllVisible(false)
        expect(labels.areAllVisible()).toBe(false)
        expect(bobLabel.style.display).toBe('none')

        labels.destroy()
        expect(wrapper.querySelector(`.${ANNOTATION_AUTHOR_LABELS_LAYER_CLASS}`)).toBeNull()
        expect(aliceGroup.off).toHaveBeenCalledWith('.annotationAuthorLabels')
        expect(bobGroup.off).toHaveBeenCalledWith('.annotationAuthorLabels')
    })

    it('exits reveal mode when the window loses focus', () => {
        const annotation = createAnnotation('annotation-1', 'Alice')
        const group = createGroup({ x: 20, y: 40, width: 50, height: 30 })
        const wrapper = document.createElement('div')
        const stage = {
            width: () => 500,
            height: () => 700
        } as unknown as Konva.Stage
        const labels = new AnnotationAuthorLabels({
            primaryColor: '#6e56cf',
            getAnnotationsByPage: () => [annotation],
            getAnnotationGroup: () => group as unknown as Konva.Group,
            canTransform: () => true
        })

        labels.registerPage(1, wrapper, stage)
        const label = wrapper.querySelector(`[data-annotation-id="${annotation.id}"]`) as HTMLDivElement
        const isMac = /mac/i.test(navigator.platform || navigator.userAgent)
        window.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: isMac ? 'Meta' : 'Alt',
                code: isMac ? 'MetaLeft' : 'AltLeft'
            })
        )
        expect(label.style.display).toBe('block')

        window.dispatchEvent(new Event('blur'))
        expect(label.style.display).toBe('none')

        labels.destroy()
    })

    it('rebinds labels to the live group when a page stage is replaced', () => {
        const annotation = createAnnotation('annotation-1', 'Alice')
        const oldGroup = createGroup({ x: 0, y: 0, width: 0, height: 0 })
        const liveGroup = createGroup({ x: 180, y: 240, width: 80, height: 40 })
        const oldStage = {
            width: () => 500,
            height: () => 700
        } as unknown as Konva.Stage
        const liveStage = {
            width: () => 500,
            height: () => 700
        } as unknown as Konva.Stage
        const oldWrapper = document.createElement('div')
        const liveWrapper = document.createElement('div')
        const labels = new AnnotationAuthorLabels({
            primaryColor: '#6e56cf',
            getAnnotationsByPage: () => [annotation],
            getAnnotationGroup: (_annotation, stage) => (stage === liveStage ? liveGroup : oldGroup) as unknown as Konva.Group,
            canTransform: () => true
        })

        labels.registerPage(1, oldWrapper, oldStage)
        labels.setSelected(annotation.id)
        labels.registerPage(1, liveWrapper, liveStage)
        const label = liveWrapper.querySelector(`[data-annotation-id="${annotation.id}"]`) as HTMLDivElement
        Object.defineProperties(label, {
            offsetWidth: { configurable: true, value: 70 },
            offsetHeight: { configurable: true, value: 24 }
        })
        labels.refreshPage(1)

        expect(oldGroup.off).toHaveBeenCalledWith('.annotationAuthorLabels')
        expect(label.style.transform).toBe('translate3d(192px, 210px, 0)')

        labels.destroy()
    })
})
