import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { uuidv4 } from "utils/uuid";
import { ROULETTE_VALUE_TO_COLOR } from "./RouletteGameValues";

const GAME_HISTORY_LS_KEY = 'RouletteGameHistory-LSKEY';

type SelectedColor = null | 'red' | 'black';

interface RouletteGameHistoryEntry {
  uuid: string,
  color: SelectedColor,
  betStakeValue: number,
  won: boolean,
}

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

  const [betHistory, setBetHistory] = useState<Array<RouletteGameHistoryEntry>>([]);

  useEffect(() => {
    setBetHistory(loadBetHistory());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(GAME_HISTORY_LS_KEY, JSON.stringify(betHistory, null, 2));
  }, [betHistory]);

  const isFormInvalid = !(stakeValue > 0 && selectedColor !== null);

  const handleColorSelectClick = (color: SelectedColor) => (_: any) => {
    setSelectedColor(color);
  };

  async function submitHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting || isFormInvalid) return;

    setIsSubmitting(true);
    const game = notNull(gameRenderer.current, 'gameRenderer');
    game.startRolling();

    try {
      const [_, settledOn] = await Promise.all([
        delay(500), // make sure we show off the animation a bit 
        rouletteService.getRoll()
      ]);
      const coolOff = game.settleRoll(settledOn.value);
      const won = ROULETTE_VALUE_TO_COLOR[settledOn.value] === selectedColor;
      await delay(coolOff);

      setBetHistory(history => [...history, { betStakeValue: stakeValue, color: selectedColor, won, uuid: uuidv4() }]);

    } catch (e) {
      // todo: let the user know or pipe it over to some error handling system
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setStakeValue(0);
      setSelectedColor(null);
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
            type="button"
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
            type="button"
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
      <div>
        <div>
          history: 
          <table>
            <thead>
              <tr>
                <th>won?</th>
                <th>stake</th>
                <th>color</th>
              </tr>
            </thead>
            <tbody>
              {betHistory.map(betHistoryEntry => {
                return (
                  <tr key={betHistoryEntry.uuid}>
                    <td>{betHistoryEntry.won ? 'WON' : 'LOST'}</td>
                    <td>${betHistoryEntry.betStakeValue}</td>
                    <td>{selectedColorToText(betHistoryEntry.color)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
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


function loadBetHistory(): Array<RouletteGameHistoryEntry> {
  let entry = window.localStorage.getItem(GAME_HISTORY_LS_KEY);
  if (entry !== null) {
    return JSON.parse(entry);
  } else {
    return [];
  }
}