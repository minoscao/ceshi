"use client";

import { useMemo, useState } from "react";

const BOARD_SIZE = 15;
type Stone = "black" | "white";
type Cell = Stone | null;
type Move = { row: number; col: number; stone: Stone };

const emptyBoard = (): Cell[][] =>
  Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null));

function hasFive(board: Cell[][], row: number, col: number, stone: Stone) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  return directions.some(([dr, dc]) => {
    let count = 1;
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === stone) {
        count += 1;
        r += dr * sign;
        c += dc * sign;
      }
    }
    return count >= 5;
  });
}

export default function Home() {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [history, setHistory] = useState<Move[]>([]);
  const [winner, setWinner] = useState<Stone | "draw" | null>(null);
  const turn: Stone = history.length % 2 === 0 ? "black" : "white";
  const lastMove = history.at(-1);
  const statusText = useMemo(() => {
    if (winner === "draw") return "和棋";
    if (winner) return `${winner === "black" ? "黑棋" : "白棋"}获胜`;
    return `${turn === "black" ? "黑棋" : "白棋"}回合`;
  }, [turn, winner]);

  function play(row: number, col: number) {
    if (board[row][col] || winner) return;
    const next = board.map((line) => [...line]);
    next[row][col] = turn;
    const nextHistory = [...history, { row, col, stone: turn }];
    setBoard(next);
    setHistory(nextHistory);
    if (hasFive(next, row, col, turn)) setWinner(turn);
    else if (nextHistory.length === BOARD_SIZE * BOARD_SIZE) setWinner("draw");
  }

  function undo() {
    if (!history.length) return;
    const previous = history[history.length - 1];
    const next = board.map((line) => [...line]);
    next[previous.row][previous.col] = null;
    setBoard(next);
    setHistory(history.slice(0, -1));
    setWinner(null);
  }

  function restart() {
    setBoard(emptyBoard());
    setHistory([]);
    setWinner(null);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#game" aria-label="弈间首页">
          <span className="brand-mark" aria-hidden="true">弈</span><span>弈间</span>
        </a>
        <div className="header-note">双人同屏对弈</div>
      </header>

      <section className="hero" id="game">
        <div className="intro">
          <p className="eyebrow">GOMOKU · 五子棋</p>
          <h1>一方棋盘，<br /><em>等你落子。</em></h1>
          <p className="lede">黑白交替落子，率先将五枚棋子连成一线即可获胜。</p>
          <div className={`turn-card ${winner ? "finished" : ""}`} aria-live="polite">
            <span className={`turn-stone ${winner === "draw" ? "split" : winner || turn}`} />
            <div><small>{winner ? "本局结果" : `第 ${history.length + 1} 手`}</small><strong>{statusText}</strong></div>
          </div>
          <div className="actions">
            <button className="primary-action" onClick={restart}>重新开局</button>
            <button className="secondary-action" onClick={undo} disabled={!history.length}>悔棋一步</button>
          </div>
          <div className="stats" aria-label="本局数据">
            <div><strong>{history.length}</strong><span>已落子</span></div>
            <div><strong>{Math.ceil(history.length / 2)}</strong><span>黑棋</span></div>
            <div><strong>{Math.floor(history.length / 2)}</strong><span>白棋</span></div>
          </div>
        </div>

        <div className="board-wrap">
          <div className="board-frame">
            <div className="board" role="grid" aria-label="十五路五子棋棋盘">
              {board.map((row, rowIndex) => row.map((cell, colIndex) => {
                const isLast = lastMove?.row === rowIndex && lastMove?.col === colIndex;
                return (
                  <button type="button" role="gridcell" className={`intersection ${cell ? "occupied" : ""}`}
                    key={`${rowIndex}-${colIndex}`} onClick={() => play(rowIndex, colIndex)} disabled={Boolean(cell || winner)}
                    aria-label={`${rowIndex + 1} 行 ${colIndex + 1} 列${cell ? `，${cell === "black" ? "黑棋" : "白棋"}` : "，空位"}`}>
                    {cell && <span className={`stone ${cell} ${isLast ? "last" : ""}`} />}
                  </button>
                );
              }))}
            </div>
          </div>
          <p className="board-caption"><span /> 落子无悔，也可以悔一步</p>
        </div>
      </section>

      <footer><span>规则：横、竖或斜线连成五子</span><span>弈间 · 轻松对局</span></footer>
    </main>
  );
}
