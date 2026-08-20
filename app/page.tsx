"use client";

import { useEffect, useMemo, useState } from "react";

const BOARD_SIZE = 15;
type Stone = "black" | "white";
type Cell = Stone | null;
type Move = { row: number; col: number; stone: Stone };
type GameMode = "ai" | "local";

const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const emptyBoard = (): Cell[][] =>
  Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null));

function lineLength(board: Cell[][], row: number, col: number, stone: Stone, dr: number, dc: number) {
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
  return count;
}

function hasFive(board: Cell[][], row: number, col: number, stone: Stone) {
  return DIRECTIONS.some(([dr, dc]) => lineLength(board, row, col, stone, dr, dc) >= 5);
}

function placementScore(board: Cell[][], row: number, col: number, stone: Stone) {
  let score = 0;
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === stone) {
        count += 1;
        r += dr * sign;
        c += dc * sign;
      }
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) openEnds += 1;
    }
    if (count >= 5) score += 1_000_000;
    else if (count === 4) score += openEnds === 2 ? 80_000 : 18_000;
    else if (count === 3) score += openEnds === 2 ? 9_000 : 1_500;
    else if (count === 2) score += openEnds === 2 ? 700 : 120;
    else score += openEnds * 12;
  }
  return score;
}

function chooseAiMove(board: Cell[][]) {
  const occupied: Array<[number, number]> = [];
  board.forEach((line, row) => line.forEach((cell, col) => cell && occupied.push([row, col])));
  if (!occupied.length) return { row: 7, col: 7 };

  const candidates: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col]) continue;
      if (occupied.some(([r, c]) => Math.abs(r - row) <= 2 && Math.abs(c - col) <= 2)) {
        candidates.push({ row, col });
      }
    }
  }

  for (const candidate of candidates) {
    if (DIRECTIONS.some(([dr, dc]) => lineLength(board, candidate.row, candidate.col, "white", dr, dc) >= 5)) return candidate;
  }
  for (const candidate of candidates) {
    if (DIRECTIONS.some(([dr, dc]) => lineLength(board, candidate.row, candidate.col, "black", dr, dc) >= 5)) return candidate;
  }

  return candidates.reduce((best, candidate) => {
    const attack = placementScore(board, candidate.row, candidate.col, "white");
    const defense = placementScore(board, candidate.row, candidate.col, "black");
    const center = 14 - (Math.abs(candidate.row - 7) + Math.abs(candidate.col - 7));
    const score = attack * 1.08 + defense * 1.16 + center;
    return score > best.score ? { ...candidate, score } : best;
  }, { row: 7, col: 7, score: -1 });
}

export default function Home() {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [history, setHistory] = useState<Move[]>([]);
  const [winner, setWinner] = useState<Stone | "draw" | null>(null);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const turn: Stone = history.length % 2 === 0 ? "black" : "white";
  const lastMove = history.at(-1);

  useEffect(() => {
    if (mode !== "ai" || turn !== "white" || winner) return;
    setAiThinking(true);
    const timer = window.setTimeout(() => {
      const move = chooseAiMove(board);
      const next = board.map((line) => [...line]);
      next[move.row][move.col] = "white";
      const nextHistory = [...history, { ...move, stone: "white" as const }];
      setBoard(next);
      setHistory(nextHistory);
      if (hasFive(next, move.row, move.col, "white")) setWinner("white");
      else if (nextHistory.length === BOARD_SIZE * BOARD_SIZE) setWinner("draw");
      setAiThinking(false);
    }, 520);
    return () => {
      window.clearTimeout(timer);
      setAiThinking(false);
    };
  }, [board, history, mode, turn, winner]);

  const statusText = useMemo(() => {
    if (!mode) return "请选择对局方式";
    if (winner === "draw") return "本局和棋";
    if (winner) return `${winner === "black" ? (mode === "ai" ? "你" : "黑棋") : (mode === "ai" ? "AI" : "白棋")}获胜`;
    if (aiThinking) return "AI 正在思考";
    return `${turn === "black" ? (mode === "ai" ? "你的" : "黑棋") : "白棋"}回合`;
  }, [aiThinking, mode, turn, winner]);

  function resetBoard() {
    setBoard(emptyBoard());
    setHistory([]);
    setWinner(null);
    setAiThinking(false);
  }

  function selectMode(nextMode: GameMode) {
    resetBoard();
    setMode(nextMode);
  }

  function play(row: number, col: number) {
    if (!mode || board[row][col] || winner || aiThinking || (mode === "ai" && turn === "white")) return;
    const next = board.map((line) => [...line]);
    next[row][col] = turn;
    const nextHistory = [...history, { row, col, stone: turn }];
    setBoard(next);
    setHistory(nextHistory);
    if (hasFive(next, row, col, turn)) setWinner(turn);
    else if (nextHistory.length === BOARD_SIZE * BOARD_SIZE) setWinner("draw");
  }

  function undo() {
    if (!history.length || winner) return;
    const removeCount = mode === "ai" && history.at(-1)?.stone === "white" ? 2 : 1;
    const nextHistory = history.slice(0, Math.max(0, history.length - removeCount));
    const next = emptyBoard();
    nextHistory.forEach((move) => { next[move.row][move.col] = move.stone; });
    setBoard(next);
    setHistory(nextHistory);
    setAiThinking(false);
  }

  function changeMode() {
    resetBoard();
    setMode(null);
  }

  const winnerName = winner === "draw" ? "本局和棋" : winner === "black"
    ? (mode === "ai" ? "你赢了" : "黑棋获胜")
    : (mode === "ai" ? "AI 获胜" : "白棋获胜");

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#game" aria-label="弈间首页">
          <span className="brand-mark" aria-hidden="true">弈</span><span>弈间</span>
        </a>
        <div className="header-note">{mode === "ai" ? "人机对弈 · 你执黑" : mode === "local" ? "双人同屏对弈" : "选择你的对局"}</div>
      </header>

      <section className="hero" id="game">
        <div className="intro">
          <p className="eyebrow">GOMOKU · 五子棋</p>
          <h1>一方棋盘，<br /><em>等你落子。</em></h1>
          <p className="lede">黑白交替落子，率先将五枚棋子连成一线即可获胜。</p>

          {!mode ? (
            <div className="mode-card">
              <small>选择对局方式</small>
              <div className="mode-options">
                <button className="mode-option featured" onClick={() => selectMode("ai")}>
                  <span className="mode-icon">AI</span><span><strong>挑战 AI</strong><em>你执黑棋，AI 执白棋</em></span>
                </button>
                <button className="mode-option" onClick={() => selectMode("local")}>
                  <span className="mode-icon two">双</span><span><strong>双人对弈</strong><em>两人轮流在本机落子</em></span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="turn-card" aria-live="polite">
                <span className={`turn-stone ${turn}`} />
                <div><small>{aiThinking ? "请稍候" : `第 ${history.length + 1} 手`}</small><strong>{statusText}</strong></div>
              </div>
              <div className="actions">
                <button className="primary-action" onClick={resetBoard}>重新开局</button>
                <button className="secondary-action" onClick={undo} disabled={!history.length || Boolean(winner)}>悔棋一步</button>
                <button className="text-action" onClick={changeMode}>换模式</button>
              </div>
              <div className="stats" aria-label="本局数据">
                <div><strong>{history.length}</strong><span>已落子</span></div>
                <div><strong>{Math.ceil(history.length / 2)}</strong><span>{mode === "ai" ? "你" : "黑棋"}</span></div>
                <div><strong>{Math.floor(history.length / 2)}</strong><span>{mode === "ai" ? "AI" : "白棋"}</span></div>
              </div>
            </>
          )}
        </div>

        <div className={`board-wrap ${!mode ? "waiting" : ""}`}>
          <div className="board-frame">
            <div className="board" role="grid" aria-label="十五路五子棋棋盘">
              {board.map((row, rowIndex) => row.map((cell, colIndex) => {
                const isLast = lastMove?.row === rowIndex && lastMove?.col === colIndex;
                return (
                  <button type="button" role="gridcell" className={`intersection ${cell ? "occupied" : ""}`}
                    key={`${rowIndex}-${colIndex}`} onClick={() => play(rowIndex, colIndex)}
                    disabled={Boolean(!mode || cell || winner || aiThinking || (mode === "ai" && turn === "white"))}
                    aria-label={`${rowIndex + 1} 行 ${colIndex + 1} 列${cell ? `，${cell === "black" ? "黑棋" : "白棋"}` : "，空位"}`}>
                    {cell && <span className={`stone ${cell} ${isLast ? "last" : ""}`} />}
                  </button>
                );
              }))}
            </div>
            {!mode && <div className="board-lock" aria-hidden="true"><span>选择模式</span><small>然后开始落子</small></div>}
            {winner && (
              <div className="result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title">
                <span className={`result-stone ${winner === "draw" ? "split" : winner}`} />
                <small>本局结束</small>
                <h2 id="result-title">{winnerName}</h2>
                <p>{winner === "draw" ? "棋逢对手，再来一局吧。" : "五子连珠，胜负已定。"}</p>
                <div className="result-actions">
                  <button className="primary-action" onClick={resetBoard}>直接下一局</button>
                  <button className="secondary-action" onClick={changeMode}>更换模式</button>
                </div>
              </div>
            )}
          </div>
          <p className="board-caption"><span /> {aiThinking ? "AI 正在观察棋局…" : "棋子将精准落在交叉点中央"}</p>
        </div>
      </section>

      <footer><span>规则：横、竖或斜线连成五子</span><span>弈间 · 人机与双人对局</span></footer>
    </main>
  );
}
