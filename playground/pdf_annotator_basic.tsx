/**
 * PDF Annotator Basic Demo (InkLayer Core)
 * ========================================
 */

import React, { useCallback } from 'react'
import { PdfAnnotator } from '@/features/annotator'
import type { Annotation } from '@/core/annotation.core'

const PdfAnnotatorBasic: React.FC = () => {
    const pdfUrl = 'https://inklayer.dev/inklayer-demo.pdf'

    const INITIAL_STORES: Annotation[] = [
    {
        "id": "7iTCOVHhhkjSft3sHjGOt",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 233.37656250000003,
                            "y": 107.7515625
                        },
                        "p2": {
                            "x": 361.8986206054688,
                            "y": 107.7515625
                        },
                        "p3": {
                            "x": 233.37656250000003,
                            "y": 155.45156250000002
                        },
                        "p4": {
                            "x": 361.8986206054688,
                            "y": 155.45156250000002
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
            "createdAt": "D:20260629000806+08'00'",
            "updatedAt": "D:20260629000806+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"7iTCOVHhhkjSft3sHjGOt\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":233.37656250000003,\"y\":107.7515625,\"width\":128.52205810546877,\"height\":47.7,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 233.37656250000003,
                    "y": 107.7515625,
                    "width": 128.52205810546877,
                    "height": 47.70000000000002
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "inklayer"
                },
                "comments": []
            }
        }
    },
    {
        "id": "JKkoosA6Dr_RBHOmoz1G8",
        "kind": "stamp",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 442.1327726725096,
                    "y": 60.59896941529989,
                    "width": 120.00000000000006,
                    "height": 45.584415584415595
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "stamp",
            "name": "InkLayer",
            "label": "InkLayer",
            "source": "custom"
        },
        "appearance": {
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260629000818+08'00'",
            "updatedAt": "D:20260629000818+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"JKkoosA6Dr_RBHOmoz1G8\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":442.1327726725096,\"y\":60.59896941529989,\"width\":120,\"height\":45.58441558441559,\"base64\":\"data:image/png;base64,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\"},\"className\":\"Image\"}]}",
                "clientRect": {
                    "x": 442.1327726725096,
                    "y": 60.59896941529989,
                    "width": 120.00000000000006,
                    "height": 45.584415584415595
                }
            },
            "pdfjs": {
                "type": "STAMP",
                "subtype": "Caret"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "",
                    "image": "data:image/png;base64,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"
                },
                "comments": [
                    {
                        "id": "NYGCSZtaKLSytiND6PLJW",
                        "title": "InkLayer",
                        "date": "D:20260629000922+08'00'",
                        "content": "Yes"
                    }
                ]
            }
        }
    },
    {
        "id": "ZEB5X4J-eiaT5Jt9ErG3s",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 55.02161416235326,
                        "y": 284.5681998630313
                    },
                    {
                        "x": 210.56183525131758,
                        "y": 284.5681998630313
                    },
                    {
                        "x": 210.56183525131758,
                        "y": 389.57870022656465
                    },
                    {
                        "x": 55.02161416235326,
                        "y": 389.57870022656465
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
            "createdAt": "D:20260629000833+08'00'",
            "updatedAt": "D:20260629000833+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"ZEB5X4J-eiaT5Jt9ErG3s\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"data\":\"M 76.1897994377643 300.5681998630313 Q 86.18846078130292 285.5681998630313 96.18712212484154 300.5681998630313 Q 106.18578346838015 285.5681998630313 116.18444481191878 300.5681998630313 Q 126.1831061554574 285.5681998630313 136.181767498996 300.5681998630313 Q 146.18042884253464 285.5681998630313 156.17909018607327 300.5681998630313 Q 166.1777515296119 285.5681998630313 176.17641287315053 300.5681998630313 Q 186.17507421668915 285.5681998630313 196.17373556022775 300.5681998630313 Q 209.56183525131758 314.5973372113725 193.17413715716617 324.96561861438846 Q 206.562236848256 338.99475596272964 190.17453875410456 349.3630373657456 Q 203.5626384451944 363.39217471408676 187.17494035104298 373.76045611710276 Q 175.24575817563328 388.57870022656465 163.7780728071626 373.40049420109915 Q 151.8488906317529 388.21873831056104 140.38120526328223 373.0405322850955 Q 128.45202308787253 387.85877639455737 116.98433771940186 372.68057036909187 Q 105.05515554399217 387.4988144785537 93.58747017552149 372.3206084530882 Q 81.65828800011181 387.1388525625501 70.19060263164113 371.9606465370846 Q 56.02161416235326 358.59625115437495 71.79038844660731 347.16327010127895 Q 57.62139997731943 333.7988747185693 73.39017426157348 322.3658936654733 Q 59.221185792285596 309.0014982827637 74.98996007653966 297.5685172296677 Q 61.36271561322035 303.8891631805604 75.58987975715198 299.0683585463495 Q 61.96263529383267 305.3890044972422 76.1897994377643 300.5681998630313 \",\"stroke\":\"#9c36b5\",\"fillEnabled\":false,\"lineJoin\":\"round\",\"lineCap\":\"round\",\"hitStrokeWidth\":20,\"strokeScaleEnabled\":false},\"className\":\"Path\"}]}",
                "clientRect": {
                    "x": 55.02161416235326,
                    "y": 284.5681998630313,
                    "width": 155.5402210889643,
                    "height": 105.01050036353337
                }
            },
            "pdfjs": {
                "type": "POLYLINE",
                "subtype": "PolyLine"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": ""
                },
                "comments": []
            }
        }
    },
    {
        "id": "YlJez5eRUdppZhIPqg4Im",
        "kind": "ink",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 405.345061538825,
                        "y": 310.5666130298492
                    },
                    {
                        "x": 514.9317285204697,
                        "y": 310.5666130298492
                    },
                    {
                        "x": 514.9317285204697,
                        "y": 320.5666130298492
                    },
                    {
                        "x": 405.345061538825,
                        "y": 320.5666130298492
                    }
                ],
                "closed": true
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "ink",
            "color": "#ffe066",
            "width": 10
        },
        "appearance": {
            "strokeColor": "#ffe066",
            "fillColor": "rgba(255, 224, 102, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260629000847+08'00'",
            "updatedAt": "D:20260629000847+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"YlJez5eRUdppZhIPqg4Im\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"strokeScaleEnabled\":false,\"stroke\":\"#ffe066\",\"strokeWidth\":10,\"opacity\":0.5,\"hitStrokeWidth\":10,\"lineCap\":\"round\",\"lineJoin\":\"round\",\"points\":[410.345061538825,315.5666130298492,410.94498121943735,315.5666130298492,410.94498121943735,315.5666130298492,412.7447402612743,315.5666130298492,415.1444189837235,315.5666130298492,418.14401738678515,315.5666130298492,420.54369610923436,315.5666130298492,424.1432141929083,315.5666130298492,428.9425716378068,315.5666130298492,433.7419290827054,315.5666130298492,437.3414471663793,315.5666130298492,440.9409652500532,315.5666130298492,445.1404030143394,315.5666130298492,453.5392785429118,315.5666130298492,457.73871630719805,315.5666130298492,461.33823439087195,315.5666130298492,467.3374311969951,315.5666130298492,469.73710991944444,315.5666130298492,472.13678864189365,315.5666130298492,474.5364673643429,315.5666130298492,476.3362264061799,315.5666130298492,478.73590512862916,315.5666130298492,480.5356641704661,315.5666130298492,482.3354232123031,315.5666130298492,484.13518225414003,315.5666130298492,485.33502161536467,315.5666130298492,486.53486097658924,315.5666130298492,487.7347003378139,315.5666130298492,488.93453969903857,315.5666130298492,490.1343790602632,315.5666130298492,491.33421842148783,315.5666130298492,491.9341381021001,315.5666130298492,493.13397746332475,315.5666130298492,494.3338168245494,315.5666130298492,495.5336561857741,315.5666130298492,496.7334955469987,315.5666130298492,497.9333349082233,315.5666130298492,499.1331742694479,315.5666130298492,499.73309395006027,315.5666130298492,500.33301363067255,315.5666130298492,500.9329333112849,315.5666130298492,500.9329333112849,315.5666130298492,501.5328529918972,315.5666130298492,502.1327726725096,315.5666130298492,502.7326923531219,315.5666130298492,503.33261203373416,315.5666130298492,503.9325317143465,315.5666130298492,504.5324513949588,315.5666130298492,505.13237107557114,315.5666130298492,506.3322104367957,315.5666130298492,506.93213011740806,315.5666130298492,507.53204979802035,315.5666130298492,508.13196947863275,315.5666130298492,508.73188915924504,315.5666130298492,509.3318088398574,315.5666130298492,509.3318088398574,315.5666130298492,509.3318088398574,315.5666130298492,509.3318088398574,315.5666130298492,509.9317285204697,315.5666130298492,509.9317285204697,315.5666130298492,509.9317285204697,315.5666130298492,509.9317285204697,315.5666130298492]},\"className\":\"Line\"}]}",
                "clientRect": {
                    "x": 405.345061538825,
                    "y": 310.5666130298492,
                    "width": 109.58666698164473,
                    "height": 10
                }
            },
            "pdfjs": {
                "type": "INK",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": ""
                },
                "comments": []
            }
        }
    },
    {
        "id": "HJQ5tdmaid9bKQrgQOKbk",
        "kind": "line",
        "target": {
            "pageIndex": 1,
            "geometry": {
                "type": "line",
                "start": {
                    "x": 245.56698873166238,
                    "y": 127.18590892134318
                },
                "end": {
                    "x": 307.55895679289415,
                    "y": 218.37753044214185
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "line",
            "arrowStart": false,
            "arrowEnd": true
        },
        "appearance": {
            "strokeColor": "#ff6b6b",
            "fillColor": "rgba(255, 107, 107, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260629000904+08'00'",
            "updatedAt": "D:20260629000904+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"HJQ5tdmaid9bKQrgQOKbk\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"points\":[306.55895679289415,133.18590892134318,246.56698873166238,212.37753044214185],\"stroke\":\"#ff6b6b\",\"fill\":\"#ff6b6b\",\"hitStrokeWidth\":20,\"lineCap\":\"round\",\"lineJoin\":\"round\",\"strokeScaleEnabled\":false},\"className\":\"Arrow\"}]}",
                "clientRect": {
                    "x": 245.56698873166238,
                    "y": 127.18590892134318,
                    "width": 61.99196806123177,
                    "height": 91.19162152079866
                }
            },
            "pdfjs": {
                "type": "LINE",
                "subtype": "Arrow"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": ""
                },
                "comments": []
            }
        }
    },
    {
        "id": "uqO1sN4MyiYWWQEYFrqyB",
        "kind": "stamp",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 406.7375115163828,
                    "y": 497.9444608386275,
                    "width": 120,
                    "height": 54
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "stamp",
            "name": "InkLayer",
            "label": "InkLayer",
            "source": "custom"
        },
        "appearance": {
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260629001014+08'00'",
            "updatedAt": "D:20260629001014+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"uqO1sN4MyiYWWQEYFrqyB\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":406.7375115163828,\"y\":497.9444608386275,\"width\":120,\"height\":54,\"base64\":\"data:image/png;base64,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\"},\"className\":\"Image\"}]}",
                "clientRect": {
                    "x": 406.7375115163828,
                    "y": 497.9444608386275,
                    "width": 120,
                    "height": 54
                }
            },
            "pdfjs": {
                "type": "STAMP",
                "subtype": "Stamp"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "",
                    "image": "data:image/png;base64,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"
                },
                "comments": []
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
            defaultShowAnnotationsSidebar={false}
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
