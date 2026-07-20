if (typeof HTMLCanvasElement !== 'undefined') {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value: jest.fn(function (this: HTMLCanvasElement) {
            const context: Record<PropertyKey, unknown> = {
                canvas: this,
                measureText: jest.fn(() => ({ width: 0 })),
                getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(0) })),
                createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(0) })),
                createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
                createPattern: jest.fn(() => null)
            }

            return new Proxy(context, {
                get(target, property) {
                    if (!(property in target)) target[property] = jest.fn()
                    return target[property]
                }
            })
        })
    })
}
