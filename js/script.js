const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const statusBtn = document.getElementById('undo');
const restartBtn = document.getElementById('restart');
const hintBtn = document.getElementById('hint');
const helpBtn = document.getElementById('help');

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
  // 设置canvas尺寸为正方形
  const containerWidth = document.getElementById('board-container').clientWidth;
  // 限制最大尺寸，移动设备屏幕一般较小
  const size = Math.min(containerWidth, 320);
  canvas.width = size;
  canvas.height = size;
  
  // 调整格子大小以适应画布
  const cellSize = (size - (BOARD_PADDING * 2)) / (BOARD_SIZE - 1);
  
  drawBoard(cellSize);
  updateStatus();
}

// 绘制棋盘
function drawBoard(cellSize = CELL_SIZE) {
  // 绘制木质背景
  ctx.fillStyle = '#e6c88c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制网格线
  ctx.strokeStyle = '#805a00';
  ctx.lineWidth = 0.8;
  
  const effectiveWidth = canvas.width - (BOARD_PADDING * 2);
  const effectiveHeight = canvas.height - (BOARD_PADDING * 2);
  const cellWidth = effectiveWidth / (BOARD_SIZE - 1);
  const cellHeight = effectiveHeight / (BOARD_SIZE - 1);
  
  for (let i = 0; i < BOARD_SIZE; i++) {
    // 横线
    ctx.beginPath();
    ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * cellHeight);
    ctx.lineTo(BOARD_PADDING + effectiveWidth, BOARD_PADDING + i * cellHeight);
    ctx.stroke();
    
    // 竖线
    ctx.beginPath();
    ctx.moveTo(BOARD_PADDING + i * cellWidth, BOARD_PADDING);
    ctx.lineTo(BOARD_PADDING + i * cellWidth, BOARD_PADDING + effectiveHeight);
    ctx.stroke();
  }
  
  // 绘制棋盘上的标记点
  const points = [3, 7, 11];
  const dotRadius = 3;
  
  ctx.fillStyle = '#805a00';
  for (const i of points) {
    for (const j of points) {
      ctx.beginPath();
      ctx.arc(
        BOARD_PADDING + i * cellWidth,
        BOARD_PADDING + j * cellHeight,
        dotRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  
  // 绘制棋子
  const pieceRadius = cellWidth / 2 - 2;
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 1) {
        drawPiece(j, i, 'black', cellWidth, cellHeight, pieceRadius);
      } else if (board[i][j] === 2) {
        drawPiece(j, i, 'white', cellWidth, cellHeight, pieceRadius);
      }
    }
  }
}

// 绘制棋子
function drawPiece(x, y, color, cellWidth = CELL_SIZE, cellHeight = CELL_SIZE, pieceRadius = PIECE_RADIUS) {
  ctx.beginPath();
  ctx.arc(
    BOARD_PADDING + x * cellWidth,
    BOARD_PADDING + y * cellHeight,
    pieceRadius,
    0,
    Math.PI * 2
  );
  
  // 绘制棋子阴影
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  // 设置棋子填充色
  if (color === 'black') {
    // 黑子渐变
    const gradient = ctx.createRadialGradient(
      BOARD_PADDING + x * cellWidth - pieceRadius/3,
      BOARD_PADDING + y * cellHeight - pieceRadius/3,
      pieceRadius/8,
      BOARD_PADDING + x * cellWidth,
      BOARD_PADDING + y * cellHeight,
      pieceRadius
    );
    gradient.addColorStop(0, '#666');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
  } else {
    // 白子渐变
    const gradient = ctx.createRadialGradient(
      BOARD_PADDING + x * cellWidth - pieceRadius/3,
      BOARD_PADDING + y * cellHeight - pieceRadius/3,
      pieceRadius/8,
      BOARD_PADDING + x * cellWidth,
      BOARD_PADDING + y * cellHeight,
      pieceRadius
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ddd');
    ctx.fillStyle = gradient;
  }
  
  ctx.fill();
  
  // 重置阴影效果
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // 绘制棋子边缘
  ctx.strokeStyle = color === 'black' ? '#000' : '#bbb';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// AI 走棋（改进的算法）
function aiMove() {
  if (gameOver) return;
  
  // 1. 寻找所有空位
  let emptyCells = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({x: j, y: i});
      }
    }
  }
  
  if (emptyCells.length === 0) return;
  
  // 2. 计算每个位置的评分
  let bestScore = -1;
  let bestMoves = [];
  
  for (const cell of emptyCells) {
    const score = evaluateMove(cell.x, cell.y);
    
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [cell];
    } else if (score === bestScore) {
      bestMoves.push(cell);
    }
  }
  
  // 3. 随机选择一个最高分的位置
  if (bestMoves.length > 0) {
    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    const move = bestMoves[randomIndex];
    makeMove(move.x, move.y, 2);
  } else if (emptyCells.length > 0) {
    // 出现意外情况，随机选择一个位置
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const move = emptyCells[randomIndex];
    makeMove(move.x, move.y, 2);
  }
}

// 评估位置分数
function evaluateMove(x, y) {
  // 基础分数
  let score = 0;
  
  // 临时在此位置放置一个棋子来评估
  const originalValue = board[y][x];
  
  // 检查AI是否可以获胜
  board[y][x] = 2; // 假设放置AI的棋子
  if (checkWin(x, y, 2)) {
    score += 100; // 能赢直接下
  }
  
  // 检查是否需要阻止玩家获胜
  board[y][x] = 1; // 假设放置玩家的棋子
  if (checkWin(x, y, 1)) {
    score += 90; // 阻止玩家获胜也很重要
  }
  
  board[y][x] = originalValue; // 恢复原始值
  
  // 检查各个方向的棋形
  const directions = [
    [1, 0],   // 水平
    [0, 1],   // 垂直
    [1, 1],   // 右下对角线
    [1, -1]   // 右上对角线
  ];
  
  for (const [dx, dy] of directions) {
    // 分别计算AI和玩家在此位置的潜力
    score += evaluateDirection(x, y, dx, dy, 2); // AI
    score += evaluateDirection(x, y, dx, dy, 1) * 0.8; // 玩家的威胁 (略小权重)
  }
  
  // 棋盘中心位置更有价值
  const centerX = Math.floor(BOARD_SIZE / 2);
  const centerY = Math.floor(BOARD_SIZE / 2);
  const distanceToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  const maxDistance = Math.sqrt(Math.pow(BOARD_SIZE, 2) + Math.pow(BOARD_SIZE, 2)) / 2;
  
  // 距离中心越近，加分越多（最多加5分）
  score += 5 * (1 - distanceToCenter / maxDistance);
  
  // 加入少量随机性，避免总是同样的走法
  score += Math.random() * 2;
  
  return score;
}

// 评估某个方向的棋形
function evaluateDirection(x, y, dx, dy, player) {
  const opponentPlayer = player === 1 ? 2 : 1;
  let score = 0;
  let consecutive = 0;
  let blocked = 0;
  let space = 0;
  
  // 正向检查
  for (let i = 1; i <= 4; i++) {
    const nx = x + i * dx;
    const ny = y + i * dy;
    
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
      blocked++;
      break;
    }
    
    if (board[ny][nx] === player) {
      consecutive++;
    } else if (board[ny][nx] === 0) {
      space++;
      break;
    } else {
      blocked++;
      break;
    }
  }
  
  // 反向检查
  for (let i = 1; i <= 4; i++) {
    const nx = x - i * dx;
    const ny = y - i * dy;
    
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
      blocked++;
      break;
    }
    
    if (board[ny][nx] === player) {
      consecutive++;
    } else if (board[ny][nx] === 0) {
      space++;
      break;
    } else {
      blocked++;
      break;
    }
  }
  
  // 评分规则
  if (consecutive === 4) {
    score += 80; // 能连5就赢了
  } else if (consecutive === 3) {
    if (blocked === 0) score += 40; // 活四
    else if (blocked === 1) score += 30; // 冲四
  } else if (consecutive === 2) {
    if (blocked === 0) score += 20; // 活三
    else if (blocked === 1) score += 15; // 冲三
  } else if (consecutive === 1) {
    if (blocked === 0) score += 10; // 活二
    else if (blocked === 1) score += 5; // 冲二
  }
  
  return score;
}

// 落子
function makeMove(x, y, player) {
  if (board[y][x] !== 0 || gameOver) return false;
  
  board[y][x] = player;
  moveHistory.push({x, y, player});
  
  const effectiveWidth = canvas.width - (BOARD_PADDING * 2);
  const cellWidth = effectiveWidth / (BOARD_SIZE - 1);
  const cellHeight = cellWidth;
  const pieceRadius = cellWidth / 2 - 2;
  
  drawBoard(cellWidth);
  
  if (checkWin(x, y, player)) {
    gameOver = true;
    updateStatus(`${player === 1 ? "您" : "AI"} 获胜！`);
    return true;
  }
  
  currentPlayer = player === 1 ? 2 : 1;
  updateStatus();
  
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

// 更新状态显示
function updateStatus(message) {
  if (message) {
    statusBtn.textContent = message;
    return;
  }
  
  if (currentPlayer === 1) {
    statusBtn.textContent = "黑子回合";
  } else {
    statusBtn.textContent = "白子回合";
  }
}

// 提示功能
function showHint() {
  // 如果游戏已经结束则不显示提示
  if (gameOver) return;
  
  // 只在玩家回合显示提示
  if (currentPlayer !== 1) return;
  
  // 获取有效的空位置
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
    
    const effectiveWidth = canvas.width - (BOARD_PADDING * 2);
    const cellWidth = effectiveWidth / (BOARD_SIZE - 1);
    const pieceRadius = cellWidth / 2 - 2;
    
    // 绘制提示
    ctx.beginPath();
    ctx.arc(
      BOARD_PADDING + hint.x * cellWidth,
      BOARD_PADDING + hint.y * cellWidth,
      pieceRadius / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
    ctx.fill();
  }
}

// 撤销上一步
function undoMove() {
  if (moveHistory.length === 0 || gameOver) return;
  
  // 如果最后一步是AI，则需要撤销两步（玩家+AI）
  if (currentPlayer === 1) {
    // 撤销AI的步骤
    const aiMove = moveHistory.pop();
    board[aiMove.y][aiMove.x] = 0;
    
    // 撤销玩家的步骤（如果有）
    if (moveHistory.length > 0) {
      const playerMove = moveHistory.pop();
      board[playerMove.y][playerMove.x] = 0;
    }
  } else {
    // 只撤销玩家的步骤
    const playerMove = moveHistory.pop();
    board[playerMove.y][playerMove.x] = 0;
  }
  
  currentPlayer = 1; // 恢复到玩家回合
  gameOver = false;
  
  drawBoard();
  updateStatus();
}

// 显示帮助信息
function showHelp() {
  alert('五子棋游戏规则：\n\n1. 黑白双方轮流在棋盘上落子\n2. 先形成五子连珠者获胜\n3. 连珠可以是横向、纵向或对角线\n4. 黑子先行，您执黑子，AI执白子');
}

// 重新开始游戏
function restartGame() {
  board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
  currentPlayer = 1;
  gameOver = false;
  moveHistory = [];
  
  drawBoard();
  updateStatus();
}

// 事件监听
canvas.addEventListener('click', (e) => {
  if (currentPlayer !== 1 || gameOver) return;
  
  const rect = canvas.getBoundingClientRect();
  const effectiveWidth = canvas.width - (BOARD_PADDING * 2);
  const cellWidth = effectiveWidth / (BOARD_SIZE - 1);
  
  const x = Math.round((e.clientX - rect.left - BOARD_PADDING) / cellWidth);
  const y = Math.round((e.clientY - rect.top - BOARD_PADDING) / cellWidth);
  
  if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
    if (makeMove(x, y, 1)) {
      setTimeout(aiMove, 500);
    }
  }
});

restartBtn.addEventListener('click', restartGame);
hintBtn.addEventListener('click', showHint);
statusBtn.addEventListener('click', undoMove);
helpBtn.addEventListener('click', showHelp);

// 窗口大小改变时调整棋盘大小
window.addEventListener('resize', initBoard);

// 初始化游戏
initBoard();