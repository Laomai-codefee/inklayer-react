/** @jest-environment jsdom */

import Konva from 'konva'

import { AnnotationType } from '../../../const/definitions'
import type { IEditorOptions } from '../editor'
import { Editor } from '../editor'
import { EditorSignature } from '../editor_signature'
import { EditorStamp } from '../editor_stamp'

jest.mock('../../../utils/utils', () => ({
    formatTimestamp: jest.fn(() => ''),
    generateUUID: jest.fn(() => 'generated-id'),
    resizeImage: jest.fn((width: number, height: number) => ({
        newWidth: width,
        newHeight: height
    })),
    setCssCustomProperty: jest.fn()
}))

class TestEditor extends Editor {
    constructor(options: IEditorOptions) {
        super({ ...options, editorType: AnnotationType.RECTANGLE })
    }

    protected mouseDownHandler(): void {}
    protected mouseMoveHandler(): void {}
    protected mouseUpHandler(): void {}
    protected changeStyle(): void {}
}

function createStage(): Konva.Stage {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const stage = new Konva.Stage({ container, width: 600, height: 800 })
    stage.add(new Konva.Layer())
    return stage
}

function createEditorOptions(stage: Konva.Stage, type: AnnotationType): IEditorOptions {
    return {
        primaryColor: '#6e56cf',
        defaultOptions: {} as IEditorOptions['defaultOptions'],
        currentUser: { id: 'alice', name: 'Alice' },
        pdfViewerApplication: {} as IEditorOptions['pdfViewerApplication'],
        konvaStage: stage,
        pageNumber: 1,
        annotation: { type } as IEditorOptions['annotation'],
        onAdd: jest.fn(),
        onChange: jest.fn()
    }
}

function createSerializedGroup(id: string, image = false): string {
    const group = new Konva.Group({ id })
    if (image) {
        group.add(
            new Konva.Image({
                image: document.createElement('img'),
                x: 40,
                y: 60,
                width: 120,
                height: 50,
                base64: 'data:image/png;base64,stub'
            })
        )
    } else {
        group.add(new Konva.Rect({ x: 40, y: 60, width: 120, height: 50 }))
    }
    return group.toJSON()
}

describe('Editor serialized group lifecycle', () => {
    afterEach(() => {
        document.body.replaceChildren()
        jest.restoreAllMocks()
    })

    it('reuses a group on the same stage and replaces the stored reference on a new stage', () => {
        const firstStage = createStage()
        const editor = new TestEditor(createEditorOptions(firstStage, AnnotationType.RECTANGLE))
        const serialized = createSerializedGroup('annotation-1')

        editor.addSerializedGroupToLayer(firstStage, serialized)
        const firstGroup = editor.shapeGroupStore.get('annotation-1')?.konvaGroup
        editor.addSerializedGroupToLayer(firstStage, serialized)

        expect(firstStage.find((node: Konva.Node) => node.id() === 'annotation-1')).toHaveLength(1)
        expect(editor.shapeGroupStore.get('annotation-1')?.konvaGroup).toBe(firstGroup)

        const secondStage = createStage()
        editor.addSerializedGroupToLayer(secondStage, serialized)
        const replacementGroup = editor.shapeGroupStore.get('annotation-1')?.konvaGroup

        expect(replacementGroup).not.toBe(firstGroup)
        expect(replacementGroup?.getStage()).toBe(secondStage)

        firstStage.destroy()
        secondStage.destroy()
    })

    it.each([
        ['stamp', AnnotationType.STAMP, EditorStamp],
        ['signature', AnnotationType.SIGNATURE, EditorSignature]
    ])('registers a restored %s group before its image finishes loading', (_name, type, EditorClass) => {
        const stage = createStage()
        jest.spyOn(Konva.Image, 'fromURL').mockImplementation(() => undefined as never)
        const editor = new EditorClass(createEditorOptions(stage, type), null)

        editor.addSerializedGroupToLayer(stage, createSerializedGroup(`annotation-${type}`, true))

        expect(editor.shapeGroupStore.get(`annotation-${type}`)?.konvaGroup.getStage()).toBe(stage)
        stage.destroy()
    })
})
