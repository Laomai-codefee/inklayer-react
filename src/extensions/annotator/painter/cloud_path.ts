export interface CloudPoint {
    x: number
    y: number
}

export function generateCloudPathData(points: CloudPoint[], radius = 15): string {
    if (points.length < 2) return ''
    const waveStep = radius * 1.3
    const center = points.reduce(
        (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
        { x: 0, y: 0 }
    )
    center.x /= points.length
    center.y /= points.length

    let path = ''
    for (let index = 0; index < points.length - 1; index++) {
        const first = points[index]
        const second = points[index + 1]
        const dx = second.x - first.x
        const dy = second.y - first.y
        const length = Math.hypot(dx, dy)
        const angle = Math.atan2(dy, dx)
        const normalX = Math.cos(angle + Math.PI / 2)
        const normalY = Math.sin(angle + Math.PI / 2)
        const segmentMidX = (first.x + second.x) / 2
        const segmentMidY = (first.y + second.y) / 2
        const toCenterX = center.x - segmentMidX
        const toCenterY = center.y - segmentMidY
        const normalSign = normalX * toCenterX + normalY * toCenterY > 0 ? -1 : 1
        const steps = Math.max(2, Math.floor(length / waveStep))

        for (let step = 0; step < steps; step++) {
            const startRatio = step / steps
            const endRatio = (step + 1) / steps
            const startX = first.x + dx * startRatio
            const startY = first.y + dy * startRatio
            const endX = first.x + dx * endRatio
            const endY = first.y + dy * endRatio
            const controlX = (startX + endX) / 2 + normalX * radius * normalSign
            const controlY = (startY + endY) / 2 + normalY * radius * normalSign

            if (index === 0 && step === 0) path += `M ${startX} ${startY} `
            path += `Q ${controlX} ${controlY} ${endX} ${endY} `
        }
    }
    return path
}
