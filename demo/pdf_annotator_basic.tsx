/**
 * PDF Annotator Basic Demo (InkLayer Core)
 * ========================================
 */

import React, { useCallback } from 'react'
import { PdfAnnotator } from '@/features/annotator'
import type { Annotation } from '@/core/annotation.core'

const PdfAnnotatorBasic: React.FC = () => {
    const pdfUrl = './inklayer-demo.pdf'

    const INITIAL_STORES: Annotation[] = [
    {
        "id": "BptSJVcAcrQSE18p2ZrIV",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 53.96848572938689,
                            "y": 368.46960887949257
                        },
                        "p2": {
                            "x": 293.2584433686658,
                            "y": 368.46960887949257
                        },
                        "p3": {
                            "x": 53.96848572938689,
                            "y": 421.23520084566593
                        },
                        "p4": {
                            "x": 293.2584433686658,
                            "y": 421.23520084566593
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
            "createdAt": "D:20260623183252+08'00'",
            "updatedAt": "D:20260623183252+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"BptSJVcAcrQSE18p2ZrIV\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":117.24613091305497,\"y\":368.46960887949257,\"width\":176.01231245561078,\"height\":12.938689217758984,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":53.96848572938689,\"y\":378.4465512684989,\"width\":239.28249483330305,\"height\":12.938689217758984,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":53.96848572938689,\"y\":388.4234936575053,\"width\":239.28480474943842,\"height\":12.938689217758984,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":53.96848572938689,\"y\":398.40043604651163,\"width\":239.2876082373976,\"height\":12.938689217758984,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"},{\"attrs\":{\"x\":53.96848572938689,\"y\":408.29651162790697,\"width\":146.8824339013775,\"height\":12.938689217758984,\"opacity\":0.5,\"fill\":\"#b4fa56\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 53.96848572938689,
                    "y": 368.46960887949257,
                    "width": 239.2899576392789,
                    "height": 52.76559196617336
                }
            },
            "pdfjs": {
                "type": "HIGHLIGHT",
                "subtype": "Highlight"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "onal compilers need to emit ge...s machine code on the ﬂy that "
                },
                "comments": []
            }
        }
    },
    {
        "id": "drWb_O2IcIPTDKtFyS-uo",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 317.0079941860465,
                            "y": 445.1327959830866
                        },
                        "p2": {
                            "x": 556.3037364871002,
                            "y": 445.1327959830866
                        },
                        "p3": {
                            "x": 317.0079941860465,
                            "y": 476.5636231501057
                        },
                        "p4": {
                            "x": 556.3037364871002,
                            "y": 476.5636231501057
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
            "createdAt": "D:20260623183254+08'00'",
            "updatedAt": "D:20260623183254+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"drWb_O2IcIPTDKtFyS-uo\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":367.9739048254162,\"y\":445.1327959830866,\"width\":188.32983166168407,\"fill\":\"#1272e8\",\"hitStrokeWidth\":10,\"height\":1.5},\"className\":\"Rect\"},{\"attrs\":{\"x\":317.0079941860465,\"y\":455.109738372093,\"width\":239.28488372093022,\"fill\":\"#1272e8\",\"hitStrokeWidth\":10,\"height\":1.5},\"className\":\"Rect\"},{\"attrs\":{\"x\":317.0079941860465,\"y\":465.08668076109933,\"width\":239.28606829330732,\"fill\":\"#1272e8\",\"hitStrokeWidth\":10,\"height\":1.5},\"className\":\"Rect\"},{\"attrs\":{\"x\":317.0079941860465,\"y\":475.0636231501057,\"width\":157.78286891558204,\"fill\":\"#1272e8\",\"hitStrokeWidth\":10,\"height\":1.5},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 317.0079941860465,
                    "y": 445.1327959830866,
                    "width": 239.29574230105368,
                    "height": 31.43082716701906
                }
            },
            "pdfjs": {
                "type": "UNDERLINE",
                "subtype": "Underline"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "c type. Without exact type inf...be able to gather type informa"
                },
                "comments": []
            }
        }
    },
    {
        "id": "em9OPcmQYMN1dKBehgM0Q",
        "kind": "text-markup",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "quad",
                "quads": [
                    {
                        "p1": {
                            "x": 328.9459566596194,
                            "y": 390.8494978858351
                        },
                        "p2": {
                            "x": 415.92610539442387,
                            "y": 390.8494978858351
                        },
                        "p3": {
                            "x": 328.9459566596194,
                            "y": 392.8494978858351
                        },
                        "p4": {
                            "x": 415.92610539442387,
                            "y": 392.8494978858351
                        }
                    }
                ]
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "text-markup",
            "variant": "strikeout",
            "color": "#ff6b6b"
        },
        "appearance": {
            "strokeColor": "#ff6b6b",
            "fillColor": "rgba(255, 107, 107, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183259+08'00'",
            "updatedAt": "D:20260623183259+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"em9OPcmQYMN1dKBehgM0Q\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":328.9459566596194,\"y\":390.8494978858351,\"width\":86.98014873480443,\"fill\":\"#ff6b6b\",\"hitStrokeWidth\":10,\"height\":2},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 328.9459566596194,
                    "y": 390.8494978858351,
                    "width": 86.98014873480446,
                    "height": 2
                }
            },
            "pdfjs": {
                "type": "STRIKEOUT",
                "subtype": "StrikeOut"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "Compilers for statically "
                },
                "comments": []
            }
        }
    },
    {
        "id": "UQ7bV24M8dp9fnYzg4O9d",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 74.04439746300211,
                    "y": 67.56192442190336,
                    "width": 207.72515856236788,
                    "height": 31.106477348921217
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "rect"
        },
        "appearance": {
            "strokeColor": "#364fc7",
            "fillColor": "rgba(54, 79, 199, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183304+08'00'",
            "updatedAt": "D:20260623183304+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"UQ7bV24M8dp9fnYzg4O9d\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":75.04439746300211,\"y\":68.56192442190336,\"width\":205.72515856236788,\"height\":29.106477348921217,\"strokeScaleEnabled\":false,\"stroke\":\"#364fc7\"},\"className\":\"Rect\"}]}",
                "clientRect": {
                    "x": 74.04439746300211,
                    "y": 67.56192442190336,
                    "width": 207.72515856236788,
                    "height": 31.106477348921217
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
                "comments": []
            }
        }
    },
    {
        "id": "M2U-qmJxzErU1UEVYl417",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 42.3446088794926,
                    "y": 557.1975544915338,
                    "width": 112.62579281183932,
                    "height": 29.81285613341379
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "shape",
            "shape": "ellipse"
        },
        "appearance": {
            "strokeColor": "#ff6b6b",
            "fillColor": "rgba(255, 107, 107, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183314+08'00'",
            "updatedAt": "D:20260623183314+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"M2U-qmJxzErU1UEVYl417\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"radiusX\":55.31289640591966,\"radiusY\":13.906428066706837,\"x\":98.65750528541226,\"y\":572.1039825582407,\"strokeScaleEnabled\":false,\"stroke\":\"#ff6b6b\"},\"className\":\"Ellipse\"}]}",
                "clientRect": {
                    "x": 42.3446088794926,
                    "y": 557.1975544915338,
                    "width": 112.62579281183932,
                    "height": 29.81285613341379
                }
            },
            "pdfjs": {
                "type": "CIRCLE",
                "subtype": "Circle"
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
        "id": "RzdqiB94YUaS5Q1Wc0Qw6",
        "kind": "note",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 379.8790697674419,
                    "y": 259.4987279635526,
                    "width": 27.799999999999955,
                    "height": 30.799999999999955
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "note",
            "text": "InkLayer"
        },
        "appearance": {
            "strokeColor": "rgb(255, 221, 31)",
            "fillColor": "rgb(255, 221, 31)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183319+08'00'",
            "updatedAt": "D:20260623183319+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"RzdqiB94YUaS5Q1Wc0Qw6\",\"x\":2.587737843551797,\"y\":-7.114916685291823},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":381.69133192389006,\"y\":271.0136446488444,\"width\":18,\"height\":20,\"cornerRadius\":4,\"fillLinearGradientEndPointY\":20,\"fillLinearGradientColorStops\":[0,\"rgb(255, 221, 31)\",1,\"#FFFFFF\"],\"shadowColor\":\"rgba(0,0,0,0.25)\",\"shadowBlur\":4,\"shadowOffsetX\":1,\"shadowOffsetY\":2,\"shadowOpacity\":0.5,\"stroke\":\"#C0A042\",\"strokeWidth\":0.8},\"className\":\"Rect\"},{\"attrs\":{\"points\":[394.69133192389006,271.0136446488444,399.69133192389006,276.0136446488444,394.69133192389006,276.0136446488444],\"fill\":\"rgba(255,255,255,0.85)\",\"closed\":true,\"stroke\":\"rgba(0,0,0,0.12)\",\"strokeWidth\":0.6},\"className\":\"Line\"},{\"attrs\":{\"points\":[394.69133192389006,276.0136446488444,399.69133192389006,276.0136446488444,394.69133192389006,271.0136446488444],\"stroke\":\"rgba(0,0,0,0.10)\",\"strokeWidth\":0.4},\"className\":\"Line\"},{\"attrs\":{\"points\":[384.69133192389006,277.41364464884435,392.69133192389006,277.41364464884435],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"},{\"attrs\":{\"points\":[384.69133192389006,279.8136446488444,395.69133192389006,279.8136446488444],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"},{\"attrs\":{\"points\":[384.69133192389006,282.21364464884437,395.69133192389006,282.21364464884437],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"},{\"attrs\":{\"points\":[384.69133192389006,284.6136446488444,395.69133192389006,284.6136446488444],\"stroke\":\"rgba(0,0,0,0.45)\",\"strokeWidth\":0.7,\"lineCap\":\"round\"},\"className\":\"Line\"}]}",
                "clientRect": {
                    "x": 379.8790697674419,
                    "y": 259.4987279635526,
                    "width": 27.799999999999955,
                    "height": 30.799999999999955
                }
            },
            "pdfjs": {
                "type": "TEXT",
                "subtype": "Text"
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
        "id": "zoMQkweOjjlzyKhHCABzN",
        "kind": "line",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "line",
                "start": {
                    "x": 78.57293868921776,
                    "y": 275.3626143729053
                },
                "end": {
                    "x": 123.91754756871036,
                    "y": 336.5202205621944
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
            "strokeColor": "#51cf66",
            "fillColor": "rgba(81, 207, 102, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183333+08'00'",
            "updatedAt": "D:20260623183333+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"zoMQkweOjjlzyKhHCABzN\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"points\":[122.91754756871036,281.3626143729053,79.57293868921776,330.5202205621944],\"stroke\":\"#51cf66\",\"fill\":\"#51cf66\",\"hitStrokeWidth\":20,\"lineCap\":\"round\",\"lineJoin\":\"round\",\"strokeScaleEnabled\":false},\"className\":\"Arrow\"}]}",
                "clientRect": {
                    "x": 78.57293868921776,
                    "y": 275.3626143729053,
                    "width": 45.3446088794926,
                    "height": 61.15760618928914
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
        "id": "K_gLih_lClwnlcEHM2_1h",
        "kind": "shape",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 451.5161862881511,
                        "y": 255.3370499527213
                    },
                    {
                        "x": 573.2109494834908,
                        "y": 255.3370499527213
                    },
                    {
                        "x": 573.2109494834908,
                        "y": 326.2728145057889
                    },
                    {
                        "x": 451.5161862881511,
                        "y": 326.2728145057889
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
            "strokeColor": "#4dabf7",
            "fillColor": "rgba(77, 171, 247, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183344+08'00'",
            "updatedAt": "D:20260623183344+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"K_gLih_lClwnlcEHM2_1h\",\"x\":62.10570824524313,\"y\":146.8260079601138},\"className\":\"Group\",\"children\":[{\"attrs\":{\"data\":\"M 410.15644820295984 132.59617458953005 Q 422.9873150105708 115.97914807014553 435.8181818181818 129.36212155076103 Q 448.64904862579283 112.74509503137651 461.4799154334038 126.128068511992 Q 474.31078224101475 109.51104199260749 487.14164904862577 122.89401547322298 Q 504.2828310902561 126.88172475653865 492.9640591966173 140.35790188257573 Q 510.1052412382477 144.3456111658914 498.78646934460886 157.82178829192847 Q 487.91690987492905 173.59572698752154 475.01162790697674 159.438814811313 Q 464.14206843729687 175.21275350690607 451.23678646934457 161.0558413306975 Q 440.3672269996647 176.82978002629056 427.46194503171245 162.672867850082 Q 416.59238556203263 178.4468065456751 403.6871035940803 164.28989436946654 Q 390.410478042908 153.86826458976756 406.59830866807613 149.08984508725212 Q 393.3216831169037 138.66821530755314 409.5095137420719 133.88979580503766 Q 396.2553533143528 126.85715902292281 409.8329809725159 133.24298519728387 Q 396.5788205447968 126.21034841516902 410.15644820295984 132.59617458953005 \",\"stroke\":\"#4dabf7\",\"fillEnabled\":false,\"lineJoin\":\"round\",\"lineCap\":\"round\",\"hitStrokeWidth\":20,\"strokeScaleEnabled\":false},\"className\":\"Path\"}]}",
                "clientRect": {
                    "x": 451.5161862881511,
                    "y": 255.3370499527213,
                    "width": 121.6947631953397,
                    "height": 70.93576455306763
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
        "id": "-COSB5jvUBUILNiO24ZmC",
        "kind": "ink",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 348.3446088794926,
                        "y": 575.9550621163943
                    },
                    {
                        "x": 419.5665961945032,
                        "y": 575.9550621163943
                    },
                    {
                        "x": 419.5665961945032,
                        "y": 622.5849940514067
                    },
                    {
                        "x": 348.3446088794926,
                        "y": 622.5849940514067
                    }
                ],
                "closed": true
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "ink",
            "color": "#e64980",
            "width": 46.62993193501245
        },
        "appearance": {
            "strokeColor": "#e64980",
            "fillColor": "rgba(230, 73, 128, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183421+08'00'",
            "updatedAt": "D:20260623183421+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"-COSB5jvUBUILNiO24ZmC\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"strokeScaleEnabled\":false,\"stroke\":\"#e64980\",\"lineCap\":\"round\",\"lineJoin\":\"round\",\"hitStrokeWidth\":20,\"points\":[349.99154334038053,613.1764561506074,349.99154334038053,613.1764561506074,349.99154334038053,612.5296455428535,349.99154334038053,612.5296455428535,349.99154334038053,611.8828349350997,349.99154334038053,610.5892137195921,349.99154334038053,609.2955925040844,349.3446088794926,607.355160680823,349.3446088794926,604.7679182498078,349.3446088794926,602.8274864265464,349.3446088794926,600.887054603285,349.3446088794926,598.2998121722698,349.3446088794926,596.3593803490083,349.3446088794926,594.4189485257469,349.99154334038053,592.4785167024855,350.6384778012685,591.184895486978,351.28541226215646,589.8912742714704,352.5792811839323,588.5976530559627,353.87315010570825,587.3040318404551,355.8139534883721,586.0104106249476,357.75475687103597,584.7167894094399,360.34249471458776,583.4231681939323,364.2241014799154,581.4827363706709,368.10570824524314,580.1891151551633,371.3403805496829,578.8954939396557,373.9281183932347,577.601872724148,376.5158562367865,577.601872724148,378.4566596194503,576.9550621163943,381.0443974630021,576.9550621163943,384.27906976744185,576.9550621163943,388.16067653276957,576.9550621163943,393.33615221987316,577.601872724148,399.1585623678647,578.8954939396557,403.6871035940803,580.1891151551633,407.56871035940804,581.4827363706709,411.4503171247357,582.7763575861785,413.3911205073996,584.069978801686,415.3319238900634,584.7167894094399,416.62579281183935,586.0104106249476,417.27272727272725,586.6572212327013,417.9196617336152,587.3040318404551,417.9196617336152,588.5976530559627,418.5665961945032,589.2444636637165,418.5665961945032,590.5380848792241,418.5665961945032,591.8317060947318,418.5665961945032,593.1253273102393,418.5665961945032,594.4189485257469,418.5665961945032,595.7125697412546,417.9196617336152,597.653001564516,417.27272727272725,599.5934333877774,415.9788583509514,602.1806758187927,415.3319238900634,604.121107642054,414.0380549682875,606.7083500730693,412.09725158562367,609.2955925040844,410.8033826638478,611.236024327346,409.5095137420719,612.5296455428535,408.215644820296,613.8232667583611,406.9217758985201,615.1168879738688,404.98097251585625,616.4105091893764,403.04016913319236,617.0573197971302,401.7463002114165,617.7041304048839,399.80549682875267,618.3509410126377,397.8646934460888,618.9977516203916,396.5708245243129,619.6445622281454,394.630021141649,619.6445622281454,393.33615221987316,620.2913728358992,391.3953488372093,620.938183443653,389.45454545454544,620.938183443653,387.5137420718816,621.5849940514067,386.2198731501057,621.5849940514067,384.27906976744185,621.5849940514067,382.985200845666,621.5849940514067,381.69133192389006,621.5849940514067,380.39746300211414,621.5849940514067,379.10359408033827,620.938183443653,378.4566596194503,620.938183443653,377.16279069767444,620.2913728358992,376.5158562367865,620.2913728358992,375.8689217758985,619.6445622281454,374.57505285412265,619.6445622281454,373.9281183932347,618.9977516203916,372.63424947145876,618.3509410126377,371.9873150105708,617.7041304048839,370.69344608879493,616.4105091893764,370.04651162790697,615.7636985816225,368.7526427061311,615.1168879738688,367.4587737843552,614.470077366115,366.8118393234672,613.8232667583611,365.51797040169134,613.1764561506074,364.8710359408034,612.5296455428535,364.2241014799154,611.8828349350997,363.57716701902746,611.236024327346,362.93023255813955,610.5892137195921,362.2832980972516,609.9424031118383,362.2832980972516,609.2955925040844,361.6363636363636,608.6487818963307,361.6363636363636,608.0019712885769,360.98942917547566,607.355160680823,360.98942917547566,606.7083500730693,360.98942917547566,605.4147288575617,360.34249471458776,604.7679182498078,360.34249471458776,603.4742970343002,360.34249471458776,602.8274864265464,360.34249471458776,602.1806758187927,359.6955602536998,601.5338652110388,359.6955602536998,601.5338652110388,359.6955602536998,600.887054603285,359.6955602536998,600.2402439955313,359.6955602536998,599.5934333877774,359.6955602536998,599.5934333877774,359.6955602536998,598.9466227800236,359.6955602536998,598.2998121722698,359.6955602536998,598.2998121722698,359.6955602536998,598.2998121722698,359.6955602536998,598.2998121722698,359.6955602536998,597.653001564516,359.6955602536998,597.653001564516,359.6955602536998,597.653001564516,359.6955602536998,597.653001564516,359.6955602536998,597.0061909567622,359.6955602536998,597.0061909567622,359.6955602536998,597.0061909567622,359.6955602536998,596.3593803490083,359.6955602536998,595.7125697412546,359.6955602536998,595.7125697412546,359.6955602536998,595.0657591335007,359.6955602536998,594.4189485257469,359.6955602536998,594.4189485257469,359.6955602536998,593.7721379179932,359.6955602536998,593.7721379179932,359.6955602536998,593.1253273102393,359.6955602536998,593.1253273102393,359.6955602536998,592.4785167024855,359.6955602536998,592.4785167024855,359.6955602536998,591.8317060947318,359.6955602536998,591.8317060947318,359.6955602536998,591.8317060947318,359.6955602536998,591.8317060947318,359.6955602536998,591.8317060947318,359.6955602536998,591.8317060947318]},\"className\":\"Line\"}]}",
                "clientRect": {
                    "x": 348.3446088794926,
                    "y": 575.9550621163943,
                    "width": 71.22198731501055,
                    "height": 46.62993193501245
                }
            },
            "pdfjs": {
                "type": "INK",
                "subtype": "Ink"
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
        "id": "s1RlWWC3I84HqSL6vGxMx",
        "kind": "ink",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "path",
                "points": [
                    {
                        "x": 211.723044397463,
                        "y": 179.9878338175883
                    },
                    {
                        "x": 399.6300211416491,
                        "y": 179.9878338175883
                    },
                    {
                        "x": 399.6300211416491,
                        "y": 189.9878338175883
                    },
                    {
                        "x": 211.723044397463,
                        "y": 189.9878338175883
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
            "createdAt": "D:20260623183433+08'00'",
            "updatedAt": "D:20260623183433+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"s1RlWWC3I84HqSL6vGxMx\",\"x\":96.39323467230446,\"y\":40.749068288489724},\"className\":\"Group\",\"children\":[{\"attrs\":{\"strokeScaleEnabled\":false,\"stroke\":\"#ffe066\",\"strokeWidth\":10,\"opacity\":0.5,\"hitStrokeWidth\":10,\"lineCap\":\"round\",\"lineJoin\":\"round\",\"points\":[120.32980972515857,144.23876552909857,120.97674418604652,144.23876552909857,122.91754756871036,144.23876552909857,128.7399577167019,144.23876552909857,135.85623678646934,144.23876552909857,145.56025369978857,144.23876552909857,157.20507399577167,144.23876552909857,168.84989429175477,144.23876552909857,181.78858350951373,144.23876552909857,192.7864693446089,144.23876552909857,201.84355179704016,144.23876552909857,210.2536997885835,144.23876552909857,216.723044397463,144.23876552909857,221.25158562367864,144.23876552909857,225.13319238900635,144.23876552909857,228.36786469344608,144.23876552909857,231.60253699788584,144.23876552909857,234.8372093023256,144.23876552909857,238.71881606765328,144.23876552909857,243.89429175475686,144.23876552909857,250.36363636363637,144.23876552909857,256.8329809725159,144.23876552909857,262.6553911205074,144.23876552909857,267.830866807611,144.23876552909857,272.35940803382664,144.23876552909857,275.5940803382664,144.23876552909857,278.1818181818182,144.23876552909857,280.76955602537,144.23876552909857,283.3572938689218,144.23876552909857,285.2980972515856,144.23876552909857,287.2389006342495,144.23876552909857,289.1797040169133,144.23876552909857,290.47357293868924,144.23876552909857,291.12050739957715,144.23876552909857,292.4143763213531,144.23876552909857,293.06131078224104,144.23876552909857,293.70824524312894,144.23876552909857,293.70824524312894,144.23876552909857,293.70824524312894,144.23876552909857,294.3551797040169,144.23876552909857,294.3551797040169,144.23876552909857,295.64904862579283,144.23876552909857,296.29598308668074,144.23876552909857,297.58985200845666,144.23876552909857,297.58985200845666,144.23876552909857,298.2367864693446,144.23876552909857,298.2367864693446,144.23876552909857,298.2367864693446,144.23876552909857,298.2367864693446,144.23876552909857]},\"className\":\"Line\"}]}",
                "clientRect": {
                    "x": 211.723044397463,
                    "y": 179.9878338175883,
                    "width": 187.90697674418607,
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
        "id": "m4ZIWSAOf1TY7JwgjcdZ2",
        "kind": "note",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 116.44820295983084,
                    "y": 261.37105370927594,
                    "width": 57.6962890625,
                    "height": 14
                }
            },
            "coordinateSystem": "pdf-user-space"
        },
        "payload": {
            "kind": "note",
            "text": "InkLayer"
        },
        "appearance": {
            "strokeColor": "#51cf66",
            "fillColor": "rgba(81, 207, 102, 0.3)",
            "opacity": 1
        },
        "relations": {},
        "meta": {
            "createdAt": "D:20260623183454+08'00'",
            "updatedAt": "D:20260623183454+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"m4ZIWSAOf1TY7JwgjcdZ2\",\"x\":-292.4143763213531,\"y\":216.68155359752478},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":408.8625792811839,\"y\":44.689500111751144,\"text\":\"InkLayer\",\"width\":57.6962890625,\"fontSize\":14,\"fill\":\"#51cf66\"},\"className\":\"Text\"}]}",
                "clientRect": {
                    "x": 116.44820295983084,
                    "y": 261.37105370927594,
                    "width": 57.6962890625,
                    "height": 14
                }
            },
            "pdfjs": {
                "type": "FREETEXT",
                "subtype": "FreeText"
            },
            "legacy": {
                "title": "InkLayer",
                "contentsObj": {
                    "text": "InkLayer"
                },
                "comments": []
            }
        }
    },
    {
        "id": "SZcv3hmSJsrpus32RJ36q",
        "kind": "stamp",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 422.6131078224102,
                    "y": 19.250481711789533,
                    "width": 119.99999999999994,
                    "height": 45.58441558441558
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
            "createdAt": "D:20260623183527+08'00'",
            "updatedAt": "D:20260623183527+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"draggable\":true,\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"SZcv3hmSJsrpus32RJ36q\",\"x\":1.2938689217758985,\"y\":-3.23405303876903},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":421.3192389006343,\"y\":22.484534750558563,\"width\":120,\"height\":45.58441558441559,\"base64\":\"data:image/png;base64,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\"},\"className\":\"Image\"}]}",
                "clientRect": {
                    "x": 422.6131078224102,
                    "y": 19.250481711789533,
                    "width": 119.99999999999994,
                    "height": 45.58441558441558
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
                        "id": "r05w7lAZerQQrozJlerMp",
                        "title": "InkLayer",
                        "date": "D:20260623183630+08'00'",
                        "content": "Yes！"
                    }
                ]
            }
        }
    },
    {
        "id": "fNAMKt4_s4Xk_MS5gMiRi",
        "kind": "stamp",
        "target": {
            "pageIndex": 0,
            "geometry": {
                "type": "rect",
                "rect": {
                    "x": 451.0782241014799,
                    "y": 503.89442402240564,
                    "width": 120,
                    "height": 42.63157894736838
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
            "createdAt": "D:20260623183619+08'00'",
            "updatedAt": "D:20260623183619+08'00'",
            "authorId": {
                "id": "9527",
                "name": "InkLayer"
            },
            "isNative": false,
            "source": "inklayer"
        },
        "extensions": {
            "konva": {
                "serialized": "{\"attrs\":{\"name\":\"InkLayer_Annotator_shape_group\",\"id\":\"fNAMKt4_s4Xk_MS5gMiRi\"},\"className\":\"Group\",\"children\":[{\"attrs\":{\"x\":451.0782241014799,\"y\":503.89442402240564,\"width\":120,\"height\":42.63157894736842,\"base64\":\"data:image/png;base64,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\"},\"className\":\"Image\"}]}",
                "clientRect": {
                    "x": 451.0782241014799,
                    "y": 503.89442402240564,
                    "width": 120,
                    "height": 42.63157894736838
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
