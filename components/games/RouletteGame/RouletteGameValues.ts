// List of values the ball can land on
// IMPORTANT: make sure to add a timing in RouletteGameRenderer#ROULETTE_OUTCOME_TO_TIMING

// note: I'm a bit lazy here, so not actually all values are supported
export const ROULETTE_GAME_VALUES = Object.freeze([
    3,
    7,
    12,
    26,
    29,
] as const);

export type RouletteGameValue = typeof ROULETTE_GAME_VALUES[number];


export function getRandomRouletteValue(): RouletteGameValue {
    return ROULETTE_GAME_VALUES[Math.floor(Math.random() * ROULETTE_GAME_VALUES.length)];
}


export const ROULETTE_VALUE_TO_COLOR: { [key in RouletteGameValue]: 'red' | 'black' } = {
    3: 'red',
    7: 'red',
    12: 'red',
    26: 'black',
    29: 'black'
};