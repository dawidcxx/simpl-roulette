import { useRef } from "react";

const INIT = Object.create(null);

export function useExpensiveRef<T>(producer: () => T): React.MutableRefObject<T> {
  const ref = useRef(INIT);
  if (ref.current === INIT) {
    ref.current = producer();
  }
  return ref;
}
