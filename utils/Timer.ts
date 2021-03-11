import { clamp } from "./math";

export class Timer {
    constructor(
        private duration: number,
        private elapsed: number = 0
    ) { }
    public tick(dt: number) {
        this.elapsed += dt;
        return this.elapsed > this.duration;
    }
    public percent_complete(): number {
        return clamp(this.elapsed / this.duration, 0, 1.0);
    }
}


