import React, { useState } from 'react'
import { PdfAnnotator } from '@/features/annotator'
import type { Annotation } from '@/core/annotation.core'
import type { AnnotationPermissions } from '@/extensions/annotator/types/annotator'
import type { User } from '@/types'
import { SegmentedControl } from '@radix-ui/themes'

const USERS: User[] = [
    { id: 'alice', name: '王芳' },
    { id: 'bob', name: '李明' },
    { id: 'admin', name: '管理员' }
]

const OWNER_ONLY_PERMISSIONS: AnnotationPermissions = {
    mode: 'owner-only',
    can: ({ currentUser }) => currentUser?.id === 'admin' ? true : undefined
}

const READ_ONLY_PERMISSIONS: AnnotationPermissions = {
    can: () => false
}

const INITIAL_ANNOTATIONS: Annotation[] = [
    {
        "id": "g8qVym-PPQvASEarqZsyp",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 161.29138183593753,
                            "y": 247.35937500000003
                        },
                        "p2": {
                            "x": 378.66137695312506,
                            "y": 247.35937500000003
                        },
                        "p3": {
                            "x": 161.29138183593753,
                            "y": 261.75937500000003
                        },
                        "p4": {
                            "x": 378.66137695312506,
                            "y": 261.75937500000003
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "highlight",
            "text": "这里是文档渲染的核心说明，具体实现请参考 #6",
            "selectedText": "coordinate transforms and zoom-level alignment",
            "color": "#b4fa56"
        },
        "appearance": {
            "strokeColor": "#b4fa56",
            "fillColor": "rgba(180, 250, 86, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "referenceNumber": 1,
            "createdAt": "D:20260726111503+08'00'",
            "updatedAt": "D:20260726111503+08'00'",
            "authorId": {
                "id": "alice",
                "name": "王芳"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"g8qVym-PPQvASEarqZsyp\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":161.29138183593753,\"y\":247.35937500000003,\"width\":217.36999511718753,\"height\":14.400000000000002,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 161.29138183593753,
                    "y": 247.35937500000003,
                    "width": 217.36999511718753,
                    "height": 14.400000000000006
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "annotationType": 1,
                "title": "王芳",
                "contentsObj": {
                    "text": "这里是文档渲染的核心说明，具体实现请参考 #6",
                    "selectedText": "coordinate transforms and zoom-level alignment",
                    "references": [
                        {
                            "type": "annotation",
                            "annotationId": "9esQFBGforu5DhQKZihoJ",
                            "label": "#6"
                        }
                    ]
                },
                "comments": [
                    {
                        "id": "3Lq7rMaeSEDDZ-HHuUJwp",
                        "title": "李明",
                        "date": "D:20260726111604+08'00'",
                        "content": "已确认在 50%、100% 和 200% 缩放比例下显示正常。",
                        "user": {
                            "id": "bob",
                            "name": "李明"
                        }
                    }
                ]
            }
        }
    },
    {
        "id": "8uMUnEkwPk2fGvJRl7Iyi",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 32.121509267174716,
                        "y": 260.05850229970196
                    },
                    {
                        "x": 229.09104242121737,
                        "y": 260.05850229970196
                    },
                    {
                        "x": 229.09104242121737,
                        "y": 398.97663219908094
                    },
                    {
                        "x": 32.121509267174716,
                        "y": 398.97663219908094
                    }
                ],
                "closed": true
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "cloud"
        },
        "appearance": {
            "strokeColor": "#ff6b6b",
            "fillColor": "rgba(255, 107, 107, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "referenceNumber": 2,
            "createdAt": "D:20260726111440+08'00'",
            "updatedAt": "D:20260726111440+08'00'",
            "authorId": {
                "id": "bob",
                "name": "李明"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"8uMUnEkwPk2fGvJRl7Iyi\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"data\":\"M 59.692478266347486 277.1722185721763 Q 70.54533757949979 262.08697064319796 81.6325707806116 277.00080718159364 Q 92.48543009376391 261.9155592526153 103.57266329487572 276.82939579101094 Q 114.42552260802802 261.7441478620326 125.51275580913983 276.6579844004283 Q 136.36561512229216 261.57273647144996 147.45284832340397 276.48657300984564 Q 158.30570763655626 261.4013250808673 169.39294083766808 276.315161619263 Q 180.24580015082037 261.2299136902846 191.3330333519322 276.1437502286803 Q 202.18589266508448 261.05850229970196 213.27312586619632 275.97233883809764 Q 228.0910424212174 286.9626173296072 212.91317122338418 297.4501860781061 Q 227.73108777840523 308.44046456961564 212.55321658057204 318.92803331811456 Q 227.37113313559308 329.91831180962413 212.19326193775987 340.40588055812304 Q 227.01117849278094 351.3961590496326 211.83330729494773 361.88372779813153 Q 226.65122384996877 372.8740062896411 211.4733526521356 383.36157503813996 Q 200.65255211500633 397.97663219908094 190.92594179160895 382.6116502043408 Q 180.10514125447966 397.22670736528175 170.37853093108228 381.86172537054165 Q 159.557730393953 396.47678253148257 149.83112007055564 381.11180053674246 Q 139.01031953342635 395.72685769768344 129.28370921002897 380.3618757029433 Q 118.46290867289972 394.9769328638842 108.73629834950233 379.6119508691441 Q 97.91549781237308 394.2270080300851 88.1888874889757 378.8620260353449 Q 77.36808695184642 393.4770831962859 67.64147662844903 378.1121012015458 Q 56.82067609131976 392.7271583624867 47.09406576792239 377.3621763677466 Q 33.121509267174716 365.861086535577 49.013823862920496 357.20419683522465 Q 35.041267362172825 345.7031070030551 50.93358195791861 337.04621730270276 Q 36.96102545717093 325.54512747053315 52.85334005291672 316.8882377701808 Q 38.88078355216905 305.3871479380112 54.77309814791484 296.73025823765886 Q 40.800541647167165 285.22916840548925 56.692856242912946 276.57227870513697 Q 60.38457667955577 262.0135681174632 58.192667254630216 276.87224863865663 Q 61.88438769127304 262.3135380509828 59.692478266347486 277.1722185721763 \",\"stroke\":\"#ff6b6b\",\"fillEnabled\":false,\"lineJoin\":\"round\",\"lineCap\":\"round\",\"hitStrokeWidth\":20,\"strokeScaleEnabled\":false},\"className\":\"Path\"}]}",
                "clientRect": {
                    "x": 32.121509267174716,
                    "y": 260.05850229970196,
                    "width": 196.96953315404267,
                    "height": 138.91812989937898
                }
            },
            "pdfjs": {
                "type": "POLYLINE",
                "subtype": "PolyLine"
            },
            "legacy": {
                "annotationType": 13,
                "title": "李明",
                "contentsObj": {
                    "text": "查看器与批注器的组件划分很清晰，PdfAnnotator 的接入方式请参考 #4",
                    "references": [
                        {
                            "type": "annotation",
                            "annotationId": "-wDkPKK-K8-jwmuw6wFZp",
                            "label": "#4"
                        }
                    ]
                },
                "comments": [
                    {
                        "id": "BKcYbhjsunrUa_0p6Qxhr",
                        "title": "王芳",
                        "date": "D:20260726111618+08'00'",
                        "content": "同意，PdfViewer 继续保持轻量查看器的定位。",
                        "user": {
                            "id": "alice",
                            "name": "王芳"
                        }
                    }
                ]
            }
        }
    },
    {
        "id": "WppawwW1MHo-Qoub3Jw2s",
        "kind": "ink",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 389.450296081643,
                        "y": 311.7682497967729
                    },
                    {
                        "x": 534.4332871361976,
                        "y": 311.7682497967729
                    },
                    {
                        "x": 534.4332871361976,
                        "y": 321.7682497967729
                    },
                    {
                        "x": 389.450296081643,
                        "y": 321.7682497967729
                    }
                ],
                "closed": true
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "ink",
            "color": "#1272e8",
            "width": 10
        },
        "appearance": {
            "strokeColor": "#1272e8",
            "fillColor": "rgba(18, 114, 232, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "referenceNumber": 3,
            "createdAt": "D:20260726111526+08'00'",
            "updatedAt": "D:20260726111526+08'00'",
            "authorId": {
                "id": "alice",
                "name": "王芳"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"WppawwW1MHo-Qoub3Jw2s\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"strokeScaleEnabled\":false,\"stroke\":\"#1272e8\",\"strokeWidth\":10,\"opacity\":0.5,\"hitStrokeWidth\":10,\"lineCap\":\"round\",\"lineJoin\":\"round\",\"points\":[394.450296081643,316.7682497967729,395.05022048632986,316.7682497967729,395.05022048632986,316.7682497967729,398.0498425097644,316.7682497967729,402.8492377472597,316.7682497967729,408.2485573894418,316.7682497967729,414.2478014363109,316.7682497967729,421.4468942925539,316.7682497967729,430.4457603628575,316.7682497967729,440.64447524253495,316.7682497967729,451.44311452689936,316.7682497967729,461.6418294065768,316.7682497967729,471.24061988156734,316.7682497967729,479.63956154718414,316.7682497967729,487.4385788081139,316.7682497967729,493.437822854983,316.7682497967729,497.03736928310445,316.7682497967729,501.2368401159128,316.7682497967729,505.4363109487212,316.7682497967729,509.03585737684267,316.7682497967729,512.6354038049641,316.7682497967729,515.6350258283986,316.7682497967729,518.0347234471463,316.7682497967729,520.434421065894,316.7682497967729,522.2341942799546,316.7682497967729,524.0339674940154,316.7682497967729,525.2338163033892,316.7682497967729,526.433665112763,316.7682497967729,527.03358951745,316.7682497967729,528.2334383268237,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,529.4332871361976,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729,528.8333627315106,316.7682497967729]},\"className\":\"Line\"}]}",
                "clientRect": {
                    "x": 389.450296081643,
                    "y": 311.7682497967729,
                    "width": 144.9829910545546,
                    "height": 10
                }
            },
            "pdfjs": {
                "type": "INK",
                "subtype": "Highlight"
            },
            "legacy": {
                "annotationType": 8,
                "title": "王芳",
                "contentsObj": {
                    "text": "这里进一步补充了 #1 中的说明",
                    "references": [
                        {
                            "type": "annotation",
                            "annotationId": "g8qVym-PPQvASEarqZsyp",
                            "label": "#1"
                        }
                    ]
                },
                "comments": []
            }
        }
    },
    {
        "id": "-wDkPKK-K8-jwmuw6wFZp",
        "kind": "text-markup",
        "target": {
            "pageIndex": 1,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 354.79687500000006,
                            "y": 357.08125
                        },
                        "p2": {
                            "x": 408.79980468750006,
                            "y": 357.08125
                        },
                        "p3": {
                            "x": 354.79687500000006,
                            "y": 358.58125
                        },
                        "p4": {
                            "x": 408.79980468750006,
                            "y": 358.58125
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "underline",
            "text": "这是最小化的 React 接入示例，将 #1 中的说明落实为可运行代码。",
            "selectedText": "PdfAnnotator",
            "color": "#1272e8"
        },
        "appearance": {
            "strokeColor": "#1272e8",
            "fillColor": "rgba(18, 114, 232, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "referenceNumber": 4,
            "createdAt": "D:20260726111548+08'00'",
            "updatedAt": "D:20260726111548+08'00'",
            "authorId": {
                "id": "alice",
                "name": "王芳"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"-wDkPKK-K8-jwmuw6wFZp\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":354.79687500000006,\"y\":357.08125,\"width\":54.00292968750001,\"fill\":\"#1272e8\",\"hitStrokeWidth\":10,\"height\":1.5},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 354.79687500000006,
                    "y": 357.08125,
                    "width": 54.0029296875,
                    "height": 1.5
                }
            },
            "pdfjs": {
                "type": "UNDERLINE",
                "subtype": "Underline"
            },
            "legacy": {
                "annotationType": 3,
                "title": "王芳",
                "contentsObj": {
                    "text": "这是最小化的 React 接入示例，将 #1 中的说明落实为可运行代码。",
                    "selectedText": "PdfAnnotator",
                    "references": [
                        {
                            "type": "annotation",
                            "annotationId": "g8qVym-PPQvASEarqZsyp",
                            "label": "#1"
                        }
                    ]
                },
                "comments": [
                    {
                        "id": "0nLmmL_fEbRnZPj1kVG-a",
                        "title": "李明",
                        "date": "D:20260726111644+08'00'",
                        "content": "依赖引入和样式入口已经验证。",
                        "user": {
                            "id": "bob",
                            "name": "李明"
                        }
                    },
                    {
                        "id": "HDpmhkPGb_qyT7E-UKHoU",
                        "title": "王芳",
                        "date": "D:20260726111701+08'00'",
                        "content": "可以进入 #5 对应的审批确认环节。",
                        "references": [
                            {
                                "type": "annotation",
                                "annotationId": "xAASMTVlV57DyDmyKdXLK",
                                "label": "#5"
                            }
                        ],
                        "user": {
                            "id": "alice",
                            "name": "王芳"
                        }
                    }
                ]
            }
        }
    },
    {
        "id": "xAASMTVlV57DyDmyKdXLK",
        "kind": "stamp",
        "target": {
            "pageIndex": 1,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 384.8439460753433,
                    "y": 727.0734693045878,
                    "width": 120,
                    "height": 51.702127659574444
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "stamp",
            "name": "李明",
            "label": "李明",
            "source": "custom"
        },
        "appearance": {
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "referenceNumber": 5,
            "createdAt": "D:20260726111416+08'00'",
            "updatedAt": "D:20260726111416+08'00'",
            "authorId": {
                "id": "bob",
                "name": "李明"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"xAASMTVlV57DyDmyKdXLK\",\"x\":5.399319642182171,\"y\":8.999098005590074},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":379.44462643316115,\"y\":718.0743712989977,\"width\":120,\"height\":51.70212765957447,\"base64\":\"data:image/png;base64,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\"},\"className\":\"Image\"}]}",
                "clientRect": {
                    "x": 384.8439460753433,
                    "y": 727.0734693045878,
                    "width": 120,
                    "height": 51.702127659574444
                }
            },
            "pdfjs": {
                "type": "STAMP",
                "subtype": "Stamp"
            },
            "legacy": {
                "annotationType": 10,
                "title": "李明",
                "contentsObj": {
                    "text": "参考 #4 完成检查后，1.2.0 演示内容已通过审核",
                    "image": "data:image/png;base64,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",
                    "references": [
                        {
                            "type": "annotation",
                            "annotationId": "-wDkPKK-K8-jwmuw6wFZp",
                            "label": "#4"
                        }
                    ]
                },
                "comments": [
                    {
                        "id": "yqjMWHg3wP0erdpwRbrBx",
                        "title": "王芳",
                        "date": "D:20260726111720+08'00'",
                        "content": "所有审阅意见均已处理。",
                        "user": {
                            "id": "alice",
                            "name": "王芳"
                        }
                    },
                    {
                        "id": "alEkFC2AWFhxkOABALJ4X",
                        "title": "李明",
                        "date": "D:20260726111734+08'00'",
                        "content": "状态已设置为：接受",
                        "status": "Accepted",
                        "user": {
                            "id": "bob",
                            "name": "李明"
                        }
                    }
                ]
            }
        }
    },
    {
        "id": "9esQFBGforu5DhQKZihoJ",
        "kind": "shape",
        "target": {
            "pageIndex": 2,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 51.49338541010458,
                    "y": 545.5452188728411,
                    "width": 489.1386166057705,
                    "height": 196.98045678778635
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "rect"
        },
        "appearance": {
            "strokeColor": "#ff6b6b",
            "fillColor": "rgba(255, 107, 107, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "referenceNumber": 6,
            "createdAt": "D:20260726111357+08'00'",
            "updatedAt": "D:20260726111357+08'00'",
            "authorId": {
                "id": "bob",
                "name": "李明"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"9esQFBGforu5DhQKZihoJ\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":52.49338541010458,\"y\":546.5452188728411,\"width\":487.1386166057705,\"height\":194.98045678778635,\"strokeScaleEnabled\":false,\"stroke\":\"#ff6b6b\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 51.49338541010458,
                    "y": 545.5452188728411,
                    "width": 489.1386166057705,
                    "height": 196.98045678778635
                }
            },
            "pdfjs": {
                "type": "SQUARE",
                "subtype": "Square"
            },
            "legacy": {
                "annotationType": 5,
                "title": "李明",
                "contentsObj": {
                    "text": "批注引擎负责坐标转换、命中检测和批量操作。"
                },
                "comments": [
                    {
                        "id": "It-vBYnf8UQqma8Th2ghE",
                        "title": "王芳",
                        "date": "D:20260726111752+08'00'",
                        "content": "这解决了 #1 中提出的实现问题。",
                        "references": [
                            {
                                "type": "annotation",
                                "annotationId": "g8qVym-PPQvASEarqZsyp",
                                "label": "#1"
                            }
                        ],
                        "user": {
                            "id": "alice",
                            "name": "王芳"
                        }
                    }
                ]
            }
        }
    }
]

const PdfAnnotatorPermissions: React.FC = () => {
    const [user, setUser] = useState(USERS[1])
    const [permissionPreset, setPermissionPreset] = useState<'owner-only' | 'read-only'>('owner-only')
    const [, setLastEvent] = useState('正在等待 PDF 加载')
    const permissions = permissionPreset === 'read-only' ? READ_ONLY_PERMISSIONS : OWNER_ONLY_PERMISSIONS

    return (
            <PdfAnnotator
                title={(
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px'
                        }}
                    >
                        <strong>当前用户</strong>
                        <SegmentedControl.Root
                            data-testid="current-user"
                            aria-label="当前用户"
                            value={user.id}
                            onValueChange={(value) => {
                                const selectedUser = USERS.find(option => option.id === value)
                                if (selectedUser) setUser(selectedUser)
                            }}
                            size="2"
                            radius="full"
                        >
                            {USERS.map(option => (
                                <SegmentedControl.Item key={option.id} value={option.id} data-testid={`switch-${option.id}`}>
                                    {option.name}
                                </SegmentedControl.Item>
                            ))}
                        </SegmentedControl.Root>
                        <strong style={{ marginLeft: 12 }}>权限模式</strong>
                        <SegmentedControl.Root
                            data-testid="current-permission"
                            aria-label="权限模式"
                            value={permissionPreset}
                            onValueChange={value => setPermissionPreset(value as 'owner-only' | 'read-only')}
                            size="2"
                            radius="full"
                        >
                            <SegmentedControl.Item value="owner-only" data-testid="permission-owner-only">
                                仅限本人
                            </SegmentedControl.Item>
                            <SegmentedControl.Item value="read-only" data-testid="permission-read-only">
                                只读
                            </SegmentedControl.Item>
                        </SegmentedControl.Root>
                    </div>
                )}
                url="https://inklayer.dev/inklayer-demo.pdf"
                user={user}
                annotationPermissions={permissions}
                initialAnnotations={INITIAL_ANNOTATIONS}
                defaultShowAnnotationsSidebar
                locale="zh-CN"
                onSave={(annotations) => {
                    console.log('Saved:', annotations)
                }}
                layoutStyle={{ width: '100%', height: 'calc(100vh - 5px)' }}
                onLoad={() => setLastEvent('PDF 已加载')}
                onAnnotationAdded={(annotation) => setLastEvent(`已添加批注 ${annotation.id}`)}
                onAnnotationUpdated={(annotation) => setLastEvent(`已更新批注 ${annotation.id}`)}
                onAnnotationDeleted={(id) => setLastEvent(`已删除批注 ${id}`)}
            />
    )
}

export default PdfAnnotatorPermissions
