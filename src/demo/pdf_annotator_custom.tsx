/**
 * PDF Annotator Custom Demo (InkLayer Core 直通模式)
 * ==============================================
 *
 * initialAnnotations / onSave / getAnnotations 全部走 Core 格式。
 * 组件内部自动转换，调用方零适配成本。
 */

import React, { useCallback, useState } from 'react'
import { PdfAnnotator } from '../features/annotator'
import type { Annotation } from '../core/annotation.core'
import { storesToAnnotations } from '../core/adapters/store.mapper'
import qiantubifengshouxietiFont from './fonts/qiantubifengshouxieti.ttf'

const INITIAL_STORES: Annotation[] = [
    {
        "id": "BzGHwy94HKi2Okm7ViT4a",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 105.21,
                    "y": 16.44,
                    "width": 407.7,
                    "height": 45.68
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "rect"
        },
        "appearance": {
            "strokeColor": "#da3324",
            "fillColor": "rgba(218, 51, 36, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20251208201803+08'00'",
            "updatedAt": "D:20251208201803+08'00'",
            "authorId": {
                "id": "9528",
                "name": "codefee"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"PdfjsExtension_Annotator_shape_group\",\"id\":\"BzGHwy94HKi2Okm7ViT4a\",\"draggable\":true,\"x\":-749.6292037573313,\"y\":-6.835132673383586,\"scaleX\":3.943030872970916,\"scaleY\":0.6223174668345937},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":217.80000000000004,\"y\":38.400000000000006,\"width\":101.4,\"height\":71.4,\"strokeScaleEnabled\":false,\"stroke\":\"#da3324\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 105.21,
                    "y": 16.44,
                    "width": 407.7,
                    "height": 45.68
                }
            },
            "pdfjs": {
                "type": "SQUARE",
                "subtype": "Square"
            },
            "legacy": {
                "title": "codefee",
                "contentsObj": {
                    "text": ""
                },
                "comments": [
                    {
                        "id": "yC7Jee40rC8KbgcphjwCN",
                        "title": "Lao Mai",
                        "date": "D:20251217153543+08'00'",
                        "content": "Reply"
                    }
                ]
            }
        }
    },
    {
        "id": "5_nUkaoGZg83BUvownU4X",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 68.3,
                            "y": 135.88
                        },
                        "p2": {
                            "x": 516.73,
                            "y": 135.88
                        },
                        "p3": {
                            "x": 68.3,
                            "y": 177.56
                        },
                        "p4": {
                            "x": 516.73,
                            "y": 177.56
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "highlight",
            "color": "#b4fa56"
        },
        "appearance": {
            "strokeColor": "#b4fa56",
            "fillColor": "rgba(180, 250, 86, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20251231222401+08'00'",
            "updatedAt": "D:20251231222401+08'00'",
            "authorId": {
                "id": "9527",
                "name": "Lao Mai"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"PdfjsExtension_Annotator_shape_group\",\"id\":\"5_nUkaoGZg83BUvownU4X\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":68.29,\"y\":162.25,\"width\":70.93,\"height\":15.3,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":143.94,\"y\":162.25,\"width\":63.04,\"height\":15.3,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 68.3,
                    "y": 135.88,
                    "width": 448.43,
                    "height": 41.68
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "Lao Mai",
                "contentsObj": {
                    "text": "ch*, Mike Shaver*, David Ander... Rick Reitmaier#, Michael Bebe"
                },
                "comments": []
            }
        }
    }
]

const PdfAnnotatorCustom: React.FC = () => {
    const pdfUrl = './compressed.tracemonkey-pldi-09.pdf'

    const onSave = useCallback((core: Annotation[]) => {
        console.log('Saved:', core)
    }, [])

    return (
        <div>
            <PdfAnnotator
                theme="violet"
                enableRange={false}
                title={<strong>PDF ANNOTATOR</strong>}
                url={pdfUrl}
                defaultShowAnnotationsSidebar={true}
                user={{ id: '9527', name: 'Lao Mai' }}
                enableNativeAnnotations={false}
                initialAnnotations={INITIAL_STORES}
                defaultOptions={{
                    signature: {
                        defaultSignature: [],
                        defaultFont: [
                            { label: '楷体', value: 'STKaiti', external: false },
                            { label: '千图笔锋手写体', value: 'qiantubifengshouxieti', external: true, url: qiantubifengshouxietiFont },
                        ]
                    },
                    stamp: { defaultStamp: [] }
                }}
                actions={(props) => (
                    <>
                        <button onClick={() => props.save()}>💾 Save</button>
                        <button onClick={() => console.log('Core:', props.getAnnotations())}>📦 Log Data</button>
                        <button onClick={() => props.exportToExcel('Export Excel')}>📊 Excel</button>
                        <button onClick={() => props.exportToPdf('Export PDF')}>📄 PDF</button>
                    </>
                )}
                layoutStyle={{ height: '96vh' }}
                locale="en-US"
                onSave={onSave}
                onLoad={() => console.log('🎉 PDF Loaded')}
                onAnnotationAdded={(a) => console.log('➕', a.id, a.kind)}
                onAnnotationDeleted={(id) => console.log('➖', id)}
                onAnnotationUpdated={(a) => console.log('✏️', a.id)}
                onAnnotationSelected={(a, isClick) => console.log('👉', a?.id, isClick)}
            />
        </div>
    )
}

export default PdfAnnotatorCustom
