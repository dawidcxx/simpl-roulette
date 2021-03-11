import {
    easeOutCubic,
    lerp,
    pointOnCircle,
    TAU,
    Vec2
} from "utils/math";
import { Timer } from "utils/Timer";
import { RouletteGameValue, ROULETTE_GAME_VALUES } from "./RouletteGameValues";

export const CANVAS_WIDTH = 512;
export const CANVAS_HEIGHT = 512;

const CENTER: Vec2 = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
const ROULETTE_IMG_WIDTH = 412;
const ROULETTE_IMG_HEIGHT = 412;
const ROULETEE_IMG_POS = {
    x: (CANVAS_WIDTH - ROULETTE_IMG_WIDTH) / 2,
    y: (CANVAS_HEIGHT - ROULETTE_IMG_HEIGHT) / 2
}
const ROULETTE_IMAGE_RADIUS = (ROULETTE_IMG_WIDTH / 2.0) - 15.0;
const ROULETTE_RADIUS_MID = ROULETTE_IMAGE_RADIUS + 15.0;
const ROULETTE_RADIUS_OUTER = ROULETTE_IMAGE_RADIUS + 30.0;
const BALL_RADIUS = 15.0;

interface RouletteGameStateIdle { type: 'IDLE' }
interface RouletteGameStateRolling { type: 'ROLLING' }
interface RouletteGameStateSettled {
    type: 'SETTLED',
    timer: Timer,
    didRollOverFlag: boolean,
}

type RouletteGameState = RouletteGameStateIdle | RouletteGameStateRolling | RouletteGameStateSettled;

type Ctx = CanvasRenderingContext2D;

export class RouletteGameRenderer {
    private static ROULETTE_OUTCOME_TO_TIMING = (() => {
        const lookup = new Map<RouletteGameValue, number>();
        lookup.set(3, 1150);
        lookup.set(7, 1600);
        lookup.set(12, 1400);
        lookup.set(26, 1050);
        lookup.set(29, 1700);
        // ensure we handled all possible outcomes
        for (let [rouletteValue, _] of lookup.entries()) {
            if (!ROULETTE_GAME_VALUES.includes(rouletteValue)) {
                throw new Error(`Configuration Error, missing timing for roulete value ${rouletteValue}`);
            }
        }
        return lookup;
    })();

    private static INIT_ROT_BALL_VEL = -0.1;

    constructor(
        private rouletteImg: HTMLImageElement = new Image(),
        private state: RouletteGameState = { type: 'IDLE' },
        private ballRotation: number = 0,
        private ballRotationVel: number = RouletteGameRenderer.INIT_ROT_BALL_VEL,
    ) {
        rouletteImg.src = 'roulette.png';
    }

    onUpdate(ctx: Ctx, diff: number) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.drawRoulette(ctx);
        this.drawBall(ctx, pointOnCircle(CENTER, ROULETTE_RADIUS_MID, this.ballRotation), BALL_RADIUS);
        switch (this.state.type) {
            case 'IDLE':
                break;
            case 'ROLLING':
                this.ballRotation += this.ballRotationVel;
                break;
            case 'SETTLED':
                const {
                    timer,
                    didRollOverFlag,
                } = this.state;
                if (!didRollOverFlag) {
                    // first we need to wait for the ball to roll over 
                    // (be at position ~0 radians)
                    this.state.didRollOverFlag = Math.abs(this.ballRotation) < 0.1;
                } else {
                    if (timer.tick(diff)) {
                        this.ballRotationVel = 0; // stop the ball
                        this.state = { type: 'IDLE' };
                    } else {
                        this.ballRotationVel = lerp(RouletteGameRenderer.INIT_ROT_BALL_VEL, 0, easeOutCubic(timer.percent_complete()));
                    }
                }

                this.ballRotation += this.ballRotationVel;

                break;
        }

        this.ballRotation %= TAU;

    }

    startRolling() {
        this.state = { type: 'ROLLING' };
        this.ballRotation = 0;
        this.ballRotationVel = RouletteGameRenderer.INIT_ROT_BALL_VEL;
    }

    settleRoll(settledOn: RouletteGameValue): number {
        const timerDuration = RouletteGameRenderer.ROULETTE_OUTCOME_TO_TIMING.get(settledOn);
        if (!timerDuration) {
            throw new Error(`Unhandled [settledOn] value passed in: ${settledOn}`);
        }
        this.state = {
            type: 'SETTLED',
            didRollOverFlag: false,
            timer: new Timer(timerDuration),
        };
        return timerDuration;
    }

    private drawRoulette(ctx: Ctx) {
        { // draw "outer" ring
            ctx.fillStyle = "#3e2723";
            ctx.beginPath();
            ctx.arc(CENTER.x, CENTER.y, ROULETTE_RADIUS_OUTER, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = "#2d1c19";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(CENTER.x, CENTER.y, ROULETTE_RADIUS_OUTER + 2.0, 0, TAU);
            ctx.stroke();
        }
        { // draw the roulette image
            ctx.save();
            ctx.translate(CENTER.x, CENTER.y);
            ctx.translate(-CENTER.x, -CENTER.y);
            ctx.drawImage(
                this.rouletteImg,
                ROULETEE_IMG_POS.x,
                ROULETEE_IMG_POS.y,
                ROULETTE_IMG_WIDTH,
                ROULETTE_IMG_HEIGHT,
            );
            ctx.restore();
        }
    }

    private drawBall(ctx: Ctx, pos: Vec2, radius: number) {
        // gradient makes it look like its rotating
        const gradient = ctx.createRadialGradient(pos.x, pos.y, radius, 0, 0, 250);
        gradient.addColorStop(0, "#666");
        gradient.addColorStop(1, "#999");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, TAU)
        ctx.fill();
    }

}