export const TAU = Math.PI * 2;

export interface Vec2 {
    x: number;
    y: number;
}

export function pointOnCircle(center: Vec2, radius: number, radians: number): Vec2 {
    return {
        x: center.x + radius * Math.cos(radians),
        y: center.y + radius * Math.sin(radians)
    }
}

export function lerp(
    value1: number,
    value2: number,
    t: number,
): number {
    return (1.0 - t) * value1 + t * value2;
}

export function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

export function clamp(
    value: number,
    min: number,
    max: number
) {
    return Math.min(Math.max(value, min), max);
}