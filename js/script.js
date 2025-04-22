const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const hintBtn = document.getElementById('hint');
const undoBtn = document.getElementById('undo');

const BOARD_SIZE = 15;
const CELL_SIZE = 30;
const BOARD_PADDING = 20;
const PIECE_RADIUS = CELL_SIZE / 2 - 2;

let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
let currentPlayer = 1; // 1: 玩家(黑棋), 2: AI(白棋)
let gameOver = false;
let moveHistory = [];

// 初始化棋盘
function initBoard() {
  canvas.width = BOARD_SIZE * CELL_SIZE + BOARD_PADDING * 2;
  canvas.height = BOARD_SIZE * CELL_SIZE + BOARD_PADDING * 2;
  drawBoard();
}

// 绘制棋盘
function drawBoard() {
  ctx.fillStyle = '#e6c88c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    // 横线
    ctx.beginPath();
    ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
    ctx.lineTo(BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE, BOARD_PADDING + i * CELL_SIZE);
    ctx.stroke();
    
    // 竖线
    ctx.beginPath();
    ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING);
    ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
    ctx.stroke();
  }
  
  // 绘制棋子
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 1) {
        drawPiece(j, i, 'black');
      } else if (board[i][j] === 2) {
        drawPiece(j, i, 'white');
      }
    }
  }
}

// 绘制棋子
function drawPiece(x, y, color) {
  ctx.beginPath();
  ctx.arc(
    BOARD_PADDING + x * CELL_SIZE,
    BOARD_PADDING + y * CELL_SIZE,
    PIECE_RADIUS,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.stroke();
}

// AI 走棋（简单随机算法）
function aiMove() {
  if (gameOver) return;
  
  let emptyCells = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({x: j, y: i});
      }
    }
  }
  
  if (emptyCells.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const move = emptyCells[randomIndex];
    makeMove(move.x, move.y, 2);
  }
}

// 落子
function makeMove(x, y, player) {
  if (board[y][x] !== 0 || gameOver) return false;
  
  board[y][x] = player;
  moveHistory.push({x, y, player});
  drawBoard();
  
  if (checkWin(x, y, player)) {
    gameOver = true;
    statusDisplay.textContent = player === 1 ? "玩家获胜！" : "AI 获胜！";
    return true;
  }
  
  currentPlayer = player === 1 ? 2 : 1;
  statusDisplay.textContent = `当前回合: ${currentPlayer === 1 ? "玩家（黑棋）" : "AI（白棋）"}`;
  
  return true;
}

// 检查胜利条件
function checkWin(x, y, player) {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];
  
  for (const [dx, dy] of directions) {
    let count = 1;
    
    // 正向检查
    for (let i = 1; i < 5; i++) {
      const nx = x + i * dx;
      const ny = y + i * dy;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE || board[ny][nx] !== player) break;
      count++;
    }
    
    // 反向检查
    for (let i = 1; i < 5; i++) {
      const nx = x - i * dx;
      const ny = y - i * dy;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE || board[ny][nx] !== player) break;
      count++;
    }
    
    if (count >= 5) return true;
  }
  
  return false;
}

// 提示功能
function showHint() {
  // 简单实现：随机选一个空位
  let emptyCells = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({x: j, y: i});
      }
    }
  }
  
  if (emptyCells.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const hint = emptyCells[randomIndex];
    
    // 绘制提示
    ctx.beginPath();
    ctx.arc(
      BOARD_PADDING + hint.x * CELL_SIZE,
      BOARD_PADDING + hint.y * CELL_SIZE,
      PIECE_RADIUS / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
  }
}

// 撤销上一步
function undoMove() {
  if (moveHistory.length === 0) return;
  
  const lastMove = moveHistory.pop();
  board[lastMove.y][lastMove.x] = 0;
  currentPlayer = lastMove.player;
  gameOver = false;
  statusDisplay.textContent = `当前回合: ${currentPlayer === 1 ? "玩家（黑棋）" : "AI（白棋）"}`;
  drawBoard();
}

// 重新开始游戏
function restartGame() {
  board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
  currentPlayer = 1;
  gameOver = false;
  moveHistory = [];
  statusDisplay.textContent = "当前回合: 玩家（黑棋）";
  drawBoard();
}

// 事件监听
canvas.addEventListener('click', (e) => {
  if (currentPlayer !== 1 || gameOver) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left - BOARD_PADDING) / CELL_SIZE);
  const y = Math.floor((e.clientY - rect.top - BOARD_PADDING) / CELL_SIZE);
  
  if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
    if (makeMove(x, y, 1)) {
      setTimeout(aiMove, 500);
    }
  }
});

restartBtn.addEventListener('click', restartGame);
hintBtn.addEventListener('click', showHint);
undoBtn.addEventListener('click', undoMove);

// 初始化游戏
initBoard();