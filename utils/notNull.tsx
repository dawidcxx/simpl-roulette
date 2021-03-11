/**
 * make sure the given value is not null at this point in time
 */
export function notNull<T>(value: T | null, desc: string): T {
    if (value === null) {
        throw new Error(`Nullpointer exception: ${desc}`);
    }
    return value;
} 