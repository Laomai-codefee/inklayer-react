/**
 * PDF Annotator Custom Demo (InkLayer Core 直通模式)
 * ==============================================
 *
 * initialAnnotations / onSave / getAnnotations 全部走 Core 格式。
 * 组件内部自动转换，调用方零适配成本。
 */

import React, { useCallback } from 'react'
import { PdfAnnotator } from '@/features/annotator'
import type { Annotation } from '@/core/annotation.core'
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
                    "x": 114.21988950276352,
                    "y": 36.83954058623022,
                    "width": 407.7093922651926,
                    "height": 45.67810206565918
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
                    "name": "InkLayer"
                },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"BzGHwy94HKi2Okm7ViT4a\",\"draggable\":true,\"x\":-740.6292037573312,\"y\":13.564867326616417,\"scaleX\":3.943030872970916,\"scaleY\":0.6223174668345937},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":217.80000000000004,\"y\":38.400000000000006,\"width\":101.4,\"height\":71.4,\"strokeScaleEnabled\":false,\"stroke\":\"#da3324\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 114.21988950276352,
                    "y": 36.83954058623022,
                    "width": 407.7093922651926,
                    "height": 45.67810206565918
                }
            },
            "pdfjs": {
                "type": "SQUARE",
                "subtype": "Square"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": ""
                },
                "comments": [
                    {
                        "id": "yC7Jee40rC8KbgcphjwCN",
                        "title": "InkLayer",
                        "date": "D:20251217153543+08'00'",
                        "content": "Reply"
                    }
                ]
            }
        }
    },
    {
        "id": "PBo08272eddFxgo0-Us2g",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 68.296875,
                            "y": 148.20000000000002
                        },
                        "p2": {
                            "x": 516.73125,
                            "y": 148.20000000000002
                        },
                        "p3": {
                            "x": 68.296875,
                            "y": 177.253125
                        },
                        "p4": {
                            "x": 516.73125,
                            "y": 177.253125
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
            "createdAt": "D:20260611165820+08'00'",
            "updatedAt": "D:20260611165820+08'00'",
                "authorId": {
                    "id": "9527",
                    "name": "InkLayer"
                },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"PBo08272eddFxgo0-Us2g\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":93.50625000000001,\"y\":148.20000000000002,\"width\":423.225,\"height\":15.000000000000002,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":68.296875,\"y\":161.18437500000002,\"width\":143.4,\"height\":15.000000000000002,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":214.50000000000003,\"y\":162.253125,\"width\":63.139233398437504,\"height\":15.000000000000002,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 68.296875,
                    "y": 148.20000000000002,
                    "width": 448.43437500000005,
                    "height": 29.053124999999994
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "Mohammad R. Haghighat$, Blake ...n∗, Edwin Smith#, Rick Reitmai"
                },
                "comments": []
            }
        }
    }
]

const PdfAnnotatorCustom: React.FC = () => {
    const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'

    const onSave = useCallback((core: Annotation[]) => {
        console.log('Saved:', core)
    }, [])

    return (
        <div style={{ height: '100%' }}>
            <PdfAnnotator
                theme="violet"
                enableRange={false}
                title={<strong>PDF ANNOTATOR CUSTOM</strong>}
                url={pdfUrl}
                defaultShowAnnotationsSidebar={true}
                user={{ id: '9527', name: 'InkLayer' }}
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
                locale="en-US"
                layoutStyle={{ width: '100%', height: 'calc(100vh - 45px)' }}
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
