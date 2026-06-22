/**
 * PDF Annotator Basic Demo (InkLayer Core)
 * ========================================
 */

import React, { useCallback } from 'react'
import { PdfAnnotator } from '@/features/annotator'
import type { Annotation } from '@/core/annotation.core'

const PdfAnnotatorBasic: React.FC = () => {
    const pdfUrl = './compressed.tracemonkey-pldi-09.pdf'

    const INITIAL_STORES: Annotation[] = [
    {
        "id": "Cq6X4NWviBzR7E8zL8IkI",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 177.63995361328128,
                            "y": 73.49062500000001
                        },
                        "p2": {
                            "x": 274.4880615234375,
                            "y": 73.49062500000001
                        },
                        "p3": {
                            "x": 177.63995361328128,
                            "y": 98.69062500000001
                        },
                        "p4": {
                            "x": 274.4880615234375,
                            "y": 98.69062500000001
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
            "createdAt": "D:20260622173250+08'00'",
            "updatedAt": "D:20260622173250+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"Cq6X4NWviBzR7E8zL8IkI\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":177.63995361328128,\"y\":73.49062500000001,\"width\":96.84810791015626,\"height\":25.200000000000003,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 177.63995361328128,
                    "y": 73.49062500000001,
                    "width": 96.84810791015624,
                    "height": 25.200000000000003
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": " Just-in-Tim"
                },
                "comments": []
            }
        }
    },
    {
        "id": "hG0p_JQhI_2MDG71iPtZA",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 266.15625,
                            "y": 189.32500000000002
                        },
                        "p2": {
                            "x": 343.2562500000001,
                            "y": 189.32500000000002
                        },
                        "p3": {
                            "x": 266.15625,
                            "y": 190.82500000000002
                        },
                        "p4": {
                            "x": 343.2562500000001,
                            "y": 190.82500000000002
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "underline",
            "color": "#1272e8"
        },
        "appearance": {
            "strokeColor": "#1272e8",
            "fillColor": "rgba(18, 114, 232, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622173253+08'00'",
            "updatedAt": "D:20260622173253+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"hG0p_JQhI_2MDG71iPtZA\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":266.15625,\"y\":189.32500000000002,\"width\":77.10000000000008,\"fill\":\"#1272e8\",\"hitStrokeWidth\":10,\"height\":1.5},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 266.15625,
                    "y": 189.32500000000002,
                    "width": 77.10000000000008,
                    "height": 1.5
                }
            },
            "pdfjs": {
                "type": "UNDERLINE",
                "subtype": "Underline"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": "Mozilla Corporation∗"
                },
                "comments": []
            }
        }
    },
    {
        "id": "avMOdRWwzeynsvrPOAqbg",
        "kind": "stamp",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 234.60000000000002,
                    "y": 270.90393700787405,
                    "width": 120,
                    "height": 62.99212598425197
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "stamp",
            "name": "Alice",
            "label": "Alice",
            "source": "custom"
        },
        "appearance": {
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622173308+08'00'",
            "updatedAt": "D:20260622173308+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"avMOdRWwzeynsvrPOAqbg\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":234.60000000000002,\"y\":270.90393700787405,\"width\":120,\"height\":62.99212598425197,\"base64\":\"data:image/png;base64,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\"},\"className\":\"Image\"}]}",
                "clientRect": {
                    "x": 234.60000000000002,
                    "y": 270.90393700787405,
                    "width": 120,
                    "height": 62.99212598425197
                }
            },
            "pdfjs": {
                "type": "STAMP",
                "subtype": "Caret"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": "",
                    "image": "data:image/png;base64,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"
                },
                "comments": []
            }
        }
    },
    {
        "id": "rYhkNXGFIhODFeqTaZCAM",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 28.71115096452055,
                        "y": 306.05
                    },
                    {
                        "x": 128.66833968951047,
                        "y": 306.05
                    },
                    {
                        "x": 128.66833968951047,
                        "y": 382.30692082227773
                    },
                    {
                        "x": 28.71115096452055,
                        "y": 382.30692082227773
                    }
                ],
                "closed": true
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "polygon"
        },
        "appearance": {
            "strokeColor": "#9c36b5",
            "fillColor": "rgba(156, 54, 181, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622173318+08'00'",
            "updatedAt": "D:20260622173318+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"rYhkNXGFIhODFeqTaZCAM\",\"x\":-2.4000000000000004,\"y\":4.800000000000001},\"className\":\"Group\",\"children\":[{\"attrs\":{\"data\":\"M 57.60000000000001 322.20000000000005 Q 67.95000000000002 305.55000000000007 78.30000000000001 318.90000000000003 Q 88.65 302.25 99.00000000000001 315.6 Q 116.26833968951048 311.36037214278457 112.80000000000001 328.80000000000007 Q 130.06833968951048 324.5603721427846 126.60000000000002 342.00000000000006 Q 121.26713788517182 360.10692082227763 105.20000000000002 350.20000000000005 Q 99.86713788517181 368.3069208222777 83.80000000000001 358.4000000000001 Q 78.46713788517181 376.5069208222777 62.400000000000006 366.6000000000001 Q 44.711150964520556 369.01187060183963 49.800000000000004 351.9000000000001 Q 32.11115096452055 354.3118706018396 37.2 337.20000000000005 Q 34.125817249306486 321.02712454709007 48.300000000000004 329.40000000000003 Q 45.225817249306495 313.22712454709 59.400000000000006 321.6 Q 54.20658350974727 307.51975052924234 58.50000000000001 321.90000000000003 Q 53.30658350974728 307.8197505292424 57.60000000000001 322.20000000000005 \",\"stroke\":\"#9c36b5\",\"fillEnabled\":false,\"lineJoin\":\"round\",\"lineCap\":\"round\",\"hitStrokeWidth\":20,\"strokeScaleEnabled\":false},\"className\":\"Path\"}]}",
                "clientRect": {
                    "x": 28.71115096452055,
                    "y": 306.05,
                    "width": 99.95718872498992,
                    "height": 76.25692082227772
                }
            },
            "pdfjs": {
                "type": "POLYLINE",
                "subtype": "PolyLine"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": ""
                },
                "comments": [
                    {
                        "id": "pTCYBr29Tpj2a_oIptPv3",
                        "title": "Alice",
                        "date": "D:20260622173333+08'00'",
                        "content": "Yes!"
                    }
                ]
            }
        }
    },
    {
        "id": "9MVqFLmWHn0ZnZJobdIvu",
        "kind": "note",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 466.00000000000006,
                    "y": 256.6,
                    "width": 27.799999999999955,
                    "height": 30.799999999999955
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "note",
            "text": "Alice"
        },
        "appearance": {
            "strokeColor": "rgb(255, 221, 31)",
            "fillColor": "rgb(255, 221, 31)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260622173342+08'00'",
            "updatedAt": "D:20260622173342+08'00'",
            "authorId": {
                "id": "u1",
                "name": "Alice"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"9MVqFLmWHn0ZnZJobdIvu\",\"x\":17.400000000000002,\"y\":23.4},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":453.00000000000006,\"y\":237.60000000000002,\"width\":18,\"height\":20,\"cornerRadius\":4,\"fillLinearGradientEndPointY\":20,\"fillLinearGradientColorStops\":[0,\"rgb(255, 221, 31)\",1,\"#FFFFFF\"],\"shadowColor\":\"rgba(0,0,0,0.25)\",\"shadowBlur\":4,\"shadowOffsetX\":1,\"shadowOffsetY\":2,\"shadowOpacity\":0.5,\"stroke\":\"#C0A042\",\"strokeWidth\":0.8},\"className\":\"Rect\"},{\"attrs\":{\"points\":[466.00000000000006,237.60000000000002,471.00000000000006,242.60000000000002,466.00000000000006,242.60000000000002],\"fill\":\"rgba(255,255,255,0.85)\",\"closed\":true,\"stroke\":\"rgba(0,0,0,0.12)\",\"strokeWidth\":0.6},\"className\":\"Line\"},{\"attrs\":{\"points\":[466.00000000000006,242.60000000000002,471.00000000000006,242.60000000000002,466.00000000000006,237.60000000000002],\"stroke\":\"rgba(0,0,0,0.10)\",\"strokeWidth\":0.4},\"className\":\"Line\"},{\"attrs\":{\"points\":[456.00000000000006,244.00000000000003,464.00000000000006,244.00000000000003],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"},{\"attrs\":{\"points\":[456.00000000000006,246.40000000000003,467.00000000000006,246.40000000000003],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"},{\"attrs\":{\"points\":[456.00000000000006,248.8,467.00000000000006,248.8],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"},{\"attrs\":{\"points\":[456.00000000000006,251.20000000000002,467.00000000000006,251.20000000000002],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"}]}",
                "clientRect": {
                    "x": 466.00000000000006,
                    "y": 256.6,
                    "width": 27.799999999999955,
                    "height": 30.799999999999955
                }
            },
            "pdfjs": {
                "type": "TEXT",
                "subtype": "Text"
            },
            "legacy": {
                "title": "Alice",
                "contentsObj": {
                    "text": ""
                },
                "comments": [
                    {
                        "id": "iEh6T7Vil3H_Gh1Jro8UU",
                        "title": "Alice",
                        "date": "D:20260622173358+08'00'",
                        "content": "InkLayer"
                    },
                    {
                        "id": "r1215Dd3aWhUvR7XRGVAQ",
                        "title": "Alice",
                        "date": "D:20260622173401+08'00'",
                        "content": "Set Status: Accepted",
                        "status": "Accepted"
                    }
                ]
            }
        }
    }
]

    const onSave = useCallback((core: Annotation[]) => {
        console.log('Saved:', core)
    }, [])

    return (
        <PdfAnnotator
            title="PDF ANNOTATOR"
            layoutStyle={{ height: '96vh' }}
            defaultShowAnnotationsSidebar={true}
            url={pdfUrl}
            appearance="light"
            user={{ id: 'u1', name: 'Alice' }}
            initialAnnotations={INITIAL_STORES}
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
