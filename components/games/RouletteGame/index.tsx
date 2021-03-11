import { useCallback, useRef, useState } from "react";
import { classNames } from "utils/classNames";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  RouletteGameRenderer,
} from "./RouletteGameRenderer";
import styles from './style.module.css';
import NumberFormat from 'react-number-format';
import { rouletteService } from "service/rouletteService";
import { delay } from "utils/delay";
import { notNull } from "utils/notNull";

type SelectedColor = null | 'red' | 'black';

export function RouletteGameComponent() {
  const reqAnimmId = useRef(-1);
  const gameRenderer = useRef<RouletteGameRenderer | null>(null);
  const canvasRef = useCallback((canvasNode: HTMLCanvasElement | null) => {
    if (canvasNode == null) return; // can happen during a hot reload
    const ctx = canvasNode.getContext('2d')!;
    gameRenderer.current = new RouletteGameRenderer();
    let lastRender = performance.now();
    function tick() {
      let diff = performance.now() - lastRender;
      gameRenderer.current!.onUpdate(ctx, diff);
      reqAnimmId.current = requestAnimationFrame(tick);
      lastRender = performance.now();
    }
    tick();
    return () => {
      cancelAnimationFrame(reqAnimmId.current);
    }
  }, []);

  const [selectedColor, setSelectedColor] = useState<SelectedColor>(null);
  const [stakeValue, setStakeValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormInvalid = !(stakeValue > 0 && selectedColor !== null);

  const handleColorSelectClick = (color: SelectedColor) => (_: any) => {
    setSelectedColor(color);
  };

  async function submitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const game = notNull(gameRenderer.current, 'gameRenderer');
    game.startRolling();

    try {
      const [_, settledOn] = await Promise.all([
        delay(500), // make sure we show off the animation a bit 
        rouletteService.getRoll()
      ]);
      const coolOff = game.settleRoll(settledOn.value);
      await delay(coolOff);
    } catch (e) {
      // todo: let the user know or pipe it over to some error handling system
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }

    return false;
  }

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
      <form className={styles.betMenu} onSubmit={submitHandler}>
        <span className={styles.betMenuHeader}>
          COLOR BET <i>(picked {selectedColorToText(selectedColor)})</i>
        </span>
        <div className={styles.betMenuInputs}>
          <button
            className={classNames(
              styles.betMenuInputBtn,
              styles.betMenuBlackBtn,
              selectedColor === 'black' && styles.selected
            )}
            onClick={handleColorSelectClick('black')}
          >
            black
          </button>
          <button
            className={
              classNames(
                styles.betMenuInputBtn,
                styles.betMenuRedBtn,
                selectedColor === 'red' && styles.selected
              )}
            onClick={handleColorSelectClick('red')}
          >
            red
          </button>
          <NumberFormat
            value={stakeValue}
            onValueChange={value => setStakeValue(value.floatValue || 0)}
            thousandSeparator={true}
            prefix={'$'}
            allowNegative={false}
            className={styles.betMenuInputValueInpt}
            placeholder={'bet value'}
          />
        </div>
        <button
          type="submit"
          className={classNames(styles.betMenuInputBtn, styles.betMenuSubmitBtn)}
          onClick={_ => {
            if (isFormInvalid) {
              alert('Please select a color and enter a bet value > 0$!');
            }
          }}
        >
          GO!
        </button>
      </form>
    </div>
  )
}


function selectedColorToText(color: SelectedColor) {
  switch (color) {
    case null:
      return 'none';
    case 'black':
      return 'black';
    case 'red':
      return 'red';
  }
}