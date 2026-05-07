/**
 * PDF Annotator Basic Demo (InkLayer Core)
 * ========================================
 */

import React, { useCallback } from 'react'
import { PdfAnnotator } from '../features/annotator'
import type { Annotation } from '../core/annotation.core'

const PdfAnnotatorBasic: React.FC = () => {
    const pdfUrl = './compressed.tracemonkey-pldi-09.pdf'

    const onSave = useCallback((core: Annotation[]) => {
        console.log('Saved:', core)
    }, [])

    return (
        <PdfAnnotator
            title="PDF Annotator"
            layoutStyle={{ height: '96vh' }}
            url={pdfUrl}
            appearance="light"
            user={{ id: 'u1', name: 'Alice' }}
            locale="en-US"
            onSave={onSave}
            onLoad={() => console.log('🎉 PDF Loaded')}
            onAnnotationAdded={(a) => console.log('➕', a)}
            onAnnotationDeleted={(id) => console.log('➖', id)}
            onAnnotationUpdated={(a) => console.log('✏️', a.id)}
        />
    )
}

export default PdfAnnotatorBasic
