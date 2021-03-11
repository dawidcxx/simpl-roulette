export function delay(delayInMs: number): Promise<void> {
    return new Promise((resolve, _) => {
        setTimeout(resolve, delayInMs);
    });
}