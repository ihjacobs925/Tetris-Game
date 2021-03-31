const game = document.querySelector("#game");
const ctx = game.getContext("2d");

const next = document.querySelector("#next");
const ctxN = next.getContext("2d");

const colors = [
  "#aaaaaa",
  "#00ffff", // 1
  "#ffff00", // 2
  "#800080", // 3
  "#008000", // 4
  "#ff0000", // 5
  "#0000ff", // 6
  "#ffa500", // 7
  "#2e3131"
];

const stroke = "#ccc";

const tetro = [
  [
    // I piece
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [
    // O piece
    [2, 2],
    [2, 2]
  ],
  [
    // T piece
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0]
  ],
  [
    // S piece
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0]
  ],
  [
    // Z piece
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0]
  ],
  [
    // J piece
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  [
    // L piece
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0]
  ]
];

const ROW = 20;
const COL = 10;
const SIZE = 20;

let gameOver = false;
let isPaused = false;
let playerScore = 0;
let playerLines = 0;
let playerLevel = 0;
let speed = 48;
let highScore = 0;

let nextTetro;
let activePiece;
let loopStart;

// create board
let board = [];
function createBoard() {
  for (let r = 0; r < ROW; r++) {
    board.push(new Array(COL).fill(0));
  }
}

//! Draw Functions
// draw indivitual cell
function drawCell(x, y, value) {
  ctx.fillStyle = colors[value];
  ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);

  ctx.strokeStyle = stroke;
  ctx.strokeRect(x * SIZE, y * SIZE, SIZE, SIZE);
}

/**
 * @param {number[][]} matrix any grid, tetrominoes and board
 * @param {{x,y}} position  x-> column, y-> row
 * go through each row and column, change cells fill color to value
 */
function drawMatrix(matrix, position) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (matrix === board && !gameOver) {
        drawCell(x + position.x, y + position.y, value);
      } else if (value !== 0 && !gameOver) {
        drawCell(x + position.x, y + position.y, value);
      } else if (gameOver && value !== 0) {
        drawCell(x + position.x, y + position.y, colors.length - 1);
      }
    });
  });
}

// next block
const empty = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];

function drawCellNext(x, y, value) {
  ctxN.fillStyle = colors[value];
  ctxN.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);

  ctxN.strokeStyle = stroke;
  ctxN.strokeRect(x * SIZE, y * SIZE, SIZE, SIZE);
}

function drawNext(matrix) {
  matrix.forEach((row, r) => {
    row.forEach((value, c) => {
      if (matrix.length === 3) {
        drawCellNext(c, r + 1, value);
      } else if (matrix.length === 2) {
        drawCellNext(c + 1, r + 1, value);
      } else {
        drawCellNext(c, r, value);
      }
    });
  });
}

// returns a random tetromino matrix
function getTetro() {
  let randNum = Math.floor(Math.random() * tetro.length);
  return tetro[randNum];
  // return tetro[1];
}

//! initGame
function initGame() {
  gameOver = false;
  isPaused = false;
  playerScore = 0;
  playerLines = 0;
  playerLevel = 0;
  speed = 48;
  updateScreen();

  board.length = 0;
  createBoard();

  activePiece = {
    position: {
      x: 3,
      y: 0
    },
    matrix: getTetro()
  };

  nextTetro = getTetro();
  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(activePiece.matrix, activePiece.position);
  drawNext(empty);
  drawNext(nextTetro);

  message.classList.add("hidden");

  pauseIcon.classList.add("fa-pause");
  pauseIcon.classList.remove("fa-play");

  getHighScore();
  highScoreSpan.classList.remove("blinking");
  scoreSpan.classList.remove("blinking");

  loopStart = Date.now();
  gameLoop();
}

//! Move functions
function movePiece(e) {
  if (!gameOver && !isPaused) {
    switch (true) {
      case e.keyCode === 37:
        moveLeft();
        break;
      case e.keyCode === 39:
        moveRight();
        break;
      case e.keyCode === 40:
        moveDown();
        break;
      case e.keyCode === 38:
        rotatePiece();
        break;
    }
  }
}

function moveLeft() {
  activePiece.position.x -= 1;
  if (collideCheck()) {
    activePiece.position.x += 1;
  }
}

function moveRight() {
  activePiece.position.x += 1;
  if (collideCheck()) {
    activePiece.position.x -= 1;
  }
}

function moveDown() {
  activePiece.position.y += 1;
  if (collideCheck()) {
    activePiece.position.y--;
    lockPiece();
  }
}

function rotatePiece() {
  let m = activePiece.matrix;
  let pX = activePiece.position.x;

  let kick = 1;
  activePiece.matrix = rotateMatrix();
  while (collideCheck()) {
    activePiece.position.x += kick;
    kick = -(kick % 2 == 0 ? kick - 1 : kick + 1);
    if (Math.abs(kick) > m[0].length + 1) {
      console.log("cant rotate");
      activePiece.matrix = m;
      activePiece.position.x = pX;
      return;
    }
  }
}

// row of new matrix <- col of old matrix
function rotateMatrix() {
  let m = activePiece.matrix.slice();
  m.reverse();
  let newMatrix = [];
  for (let i = 0; i < m.length; i++) {
    newMatrix.push([]);
    for (let j = 0; j < m.length; j++) {
      newMatrix[i].push(m[j][i]);
    }
  }

  // matrix rotation: https://medium.com/front-end-weekly/matrix-rotation-%EF%B8%8F-6550397f16ab
  return newMatrix;
}

//! Game Loop
function gameLoop() {
  let now = Date.now();
  let delta = now - loopStart;
  if (delta > 1000 / (60 / speed)) {
    moveDown();
    loopStart = Date.now();
  }

  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(activePiece.matrix, activePiece.position);

  if (!gameOver && !isPaused) {
    requestAnimationFrame(gameLoop);
  }
}

//! collision detection
function collideCheck() {
  let m = activePiece.matrix;
  let p = activePiece.position;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (m[r][c] !== 0) {
        let newY = r + p.y; // y ( board row) to check
        let newX = c + p.x; // x (board col) to check

        if (newX < 0 || newX > 9 || newY > 19) {
          // console.log("wall found");
          return true;
        }

        if (board[newY][newX] !== 0) {
          // console.log("collision found");
          return true;
        }
      }
    }
  }
  return false;
}

// level up
function levelUp() {
  if (playerLines >= playerLevel * 10 + 10) {
    playerLevel++;
  }

  switch (playerLevel) {
    case 0:
      speed = 48;
      break;
    case 1:
      speed = 43;
      break;
    case 2:
      speed = 38;
      break;
    case 3:
      speed = 33;
      break;
    case 4:
      speed = 28;
      break;
    case 5:
      speed = 23;
      break;
    case 6:
      speed = 18;
      break;
    case 7:
      speed = 13;
      break;
    case 8:
      speed = 8;
      break;
    case 9:
      speed = 6;
      break;
    case 10:
      speed = 5;
      break;
    case 13:
      speed = 4;
      break;
    case 16:
      speed = 3;
      break;
    case 19:
      speed = 2;
      break;
    case 29:
      speed = 1;
      break;
  }
}

//! GAME OVER
const message = document.getElementById("message");

function endGame() {
  let p = activePiece.position;

  if (p.y > 0) {
    resetPiece();
  } else {
    console.log("game over");
    message.textContent = "GAME OVER";
    message.classList.remove("hidden");
    setHighScore();
    gameOver = true;
  }
}

// change the board[cell] value to matrix of active cell
function lockPiece() {
  activePiece.matrix.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell !== 0) {
        board[r + activePiece.position.y][
          c + activePiece.position.x
        ] = cell;
      }
    });
  });
  clearFullRow();
  endGame();
}

function clearFullRow() {
  let rowsCleared = 0;
  for (let r = 19; r > 0; r--) {
    if (!board[r].includes(0)) {
      board.splice(r, 1);
      board.unshift(new Array(10).fill(0));
      rowsCleared++;
      r++; // after delete, repeat check of row;
    }
  }
  switch (rowsCleared) {
    case 1:
      playerScore += 40 * (playerLevel + 1);
      break;
    case 2:
      playerScore += 100 * (playerLevel + 1);
      break;
    case 3:
      playerScore += 300 * (playerLevel + 1);
      break;
    case 4:
      playerScore += 1200 * (playerLevel + 1);
      break;
  }
  playerLines += rowsCleared;
  levelUp();
  updateScreen();
  // Play Tetris sound.
}

function resetPiece() {
  activePiece.matrix = nextTetro;
  activePiece.position.y = 0;
  activePiece.position.x =
    COL / 2 - Math.round(activePiece.matrix[0].length / 2);
  nextTetro = getTetro();
  drawNext(empty);
  drawNext(nextTetro);
}

//! Update function
// updateScreen
const highScoreSpan = document.getElementById("high-score-span");
const scoreSpan = document.getElementById("score-span");
const linesSpan = document.getElementById("lines-span");
const levelSpan = document.getElementById("level-span");

function updateScreen() {
  highScoreSpan.textContent = `${highScore}`;
  scoreSpan.textContent = `${playerScore}`;
  linesSpan.textContent = `${playerLines}`;
  levelSpan.textContent = `${playerLevel}`;
}

const restartBtn = document.getElementById("restart-button");
const pauseBtn = document.getElementById("pause-button");
const pauseIcon = pauseBtn.getElementsByTagName("i")[0];

// pauseGame
function pauseGame() {
  if (!gameOver) {
    isPaused = !isPaused;
    gameLoop();

    message.textContent = "PAUSED";
    message.classList.toggle("hidden");
    pauseIcon.classList.toggle("fa-pause");
    pauseIcon.classList.toggle("fa-play");
  }
}


//mobile controls
const leftBtn = document.getElementById("left-button");
const rightBtn = document.getElementById("right-button");
const downBtn = document.getElementById("down-button");
const rotateBtn = document.getElementById("rotate-button");

//! Local Storage
function getHighScore() {
  if (!localStorage.getItem("tetris-high-score")) {
    localStorage.setItem("tetris-high-score", `${highScore}`);
  } else {
    highScore = parseInt(localStorage.getItem("tetris-high-score"));
    updateScreen();
  }
}

function setHighScore() {
  if (playerScore > highScore) {
    console.log("new high score");
    localStorage.setItem("tetris-high-score", `${playerScore}`);
    highScoreSpan.textContent = `${playerScore}`;
    highScoreSpan.classList.add("blinking");
    scoreSpan.classList.add("blinking");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", movePiece);
  pauseBtn.addEventListener("click", pauseGame);
  restartBtn.addEventListener("click", initGame);

  leftBtn.addEventListener("click", () => {
    if (!isPaused) moveLeft();
  });
  rightBtn.addEventListener("click", () => {
    if (!isPaused) moveRight();
  });
  downBtn.addEventListener("click", () => {
    if (!isPaused) moveDown();
  });
  rotateBtn.addEventListener("click", () => {
    if (!isPaused) rotatePiece();
  });

  initGame();
});

  

