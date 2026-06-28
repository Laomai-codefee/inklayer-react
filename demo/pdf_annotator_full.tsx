/**
 * PDF Annotator Full Demo (InkLayer Core)
 * =======================================
 *
 * 全功能演示：所有批注类型 + 签名 + 印章 + 导出。
 * initialAnnotations / onSave / getAnnotations 全部走 Core 格式。
 *
 */

import React, { useCallback } from 'react'
import { PdfAnnotator } from '@/features/annotator'
import type { Annotation } from '@/core/annotation.core'
import qiantubifengshouxietiFont from './fonts/qiantubifengshouxieti.ttf'


const PdfAnnotatorFull: React.FC = () => {
    const pdfUrl = './inklayer-demo.pdf'

    const onSave = useCallback((core: Annotation[]) => {
        console.log('Saved:', core)
    }, [])

    return (
        <div>
            <PdfAnnotator
                theme="violet"
                enableRange={true}
                title={<strong>PDF ANNOTATOR FULL</strong>}
                url={pdfUrl}
                defaultShowAnnotationsSidebar={true}
                user={{ id: '9527', name: 'InkLayer' }}
                appearance='dark'
                enableNativeAnnotations={true}
                locale="en-US"
                initialAnnotations={[]}
                defaultOptions={{
                    signature: {
                        defaultSignature: [
                            'data:image/png;base64,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',
                        ],
                        defaultFont: [
                            { label: '楷体', value: 'STKaiti', external: false },
                            { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: true, url: qiantubifengshouxietiFont },
                            { label: '平方长安体', value: 'PingFangChangAnTi-2', external: true, url: 'http://localhost:8080/PingFangChangAnTi-2.ttf' },
                        ]
                    },
                    stamp: { defaultStamp: ['data:image/png;base64,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'] }
                }}
                actions={(props) => (
                    <>
                        <button onClick={() => props.save()}>💾 Save (InkLayer)</button>
                        <button onClick={() => console.log('Core:', props.getAnnotations())}>📦 Get Annotations</button>
                        <button onClick={() => props.exportToExcel('Export Excel')}>📊 Export Excel</button>
                        <button onClick={() => props.exportToPdf('Export PDF')}>📄 Export PDF</button>
                    </>
                )}
                layoutStyle={{ height: '96vh' }}
                onSave={onSave}
                onLoad={() => console.log('🎉 PDF Loaded...')}
                onAnnotationAdded={(a) => console.log('➕', a.id, a.kind)}
                onAnnotationDeleted={(id) => console.log('➖', id)}
                onAnnotationUpdated={(a) => console.log('✏️', a.id)}
                onAnnotationSelected={(a, isClick) => console.log('👉', a?.id, isClick)}
            />
        </div>
    )
}

export default PdfAnnotatorFull
