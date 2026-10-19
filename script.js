const SIZE = 9;
const MINES = 10;

const boardEl = document.getElementById('board');
const mineCountEl = document.getElementById('mineCount');
const timeEl = document.getElementById('time');
const hintEl = document.getElementById('hint');
const resetBtn = document.getElementById('resetBtn');
const faceEl = resetBtn;

let cells = [];
let started = false;
let over = false;
let flags = 0;
let openedCount = 0;
let seconds = 0;
let timerId = null;

function indexOf(row, col) {
  return row * SIZE + col;
}

function neighbors(index) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const result = [];

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r === row && c === col) continue;
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) result.push(indexOf(r, c));
    }
  }

  return result;
}

function startTimer() {
  timerId = setInterval(() => {
    seconds++;
    timeEl.textContent = seconds;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function buildBoard() {
  stopTimer();

  cells = [];
  started = false;
  over = false;
  flags = 0;
  openedCount = 0;
  seconds = 0;

  boardEl.innerHTML = '';
  mineCountEl.textContent = MINES;
  timeEl.textContent = '0';
  hintEl.textContent = 'Left click to reveal. Right click to flag.';
  faceEl.textContent = '🙂';

  for (let index = 0; index < SIZE * SIZE; index++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `Cell ${index + 1}`);

    button.addEventListener('click', () => reveal(index));
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      toggleFlag(index);
    });

    boardEl.appendChild(button);
    cells.push({ mine: false, revealed: false, flagged: false, count: 0, el: button });
  }
}

function placeMines(safeIndex) {
  const blocked = new Set([safeIndex, ...neighbors(safeIndex)]);
  const options = [];

  for (let index = 0; index < SIZE * SIZE; index++) {
    if (!blocked.has(index)) options.push(index);
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  options.slice(0, MINES).forEach((index) => {
    cells[index].mine = true;
  });

  cells.forEach((cell, index) => {
    if (cell.mine) return;
    cell.count = neighbors(index).filter((n) => cells[n].mine).length;
  });
}

function paint(cell) {
  cell.el.classList.add('open');

  if (cell.mine) {
    cell.el.textContent = '💥';
    cell.el.classList.add('mine');
    return;
  }

  if (cell.count > 0) {
    cell.el.textContent = String(cell.count);
    cell.el.dataset.n = String(cell.count);
  }
}

function reveal(index) {
  if (over) return;

  const cell = cells[index];
  if (cell.flagged || cell.revealed) return;

  if (!started) {
    started = true;
    placeMines(index);
    startTimer();
  }

  if (cell.mine) {
    cell.el.classList.add('boom');
    paint(cell);
    lose();
    return;
  }

  const stack = [index];

  while (stack.length) {
    const current = stack.pop();
    const target = cells[current];
    if (target.revealed || target.flagged) continue;

    target.revealed = true;
    openedCount++;
    paint(target);

    if (target.count === 0) {
      neighbors(current).forEach((n) => {
        if (!cells[n].revealed && !cells[n].flagged) stack.push(n);
      });
    }
  }

  checkWin();
}

function toggleFlag(index) {
  if (over) return;

  const cell = cells[index];
  if (cell.revealed) return;

  cell.flagged = !cell.flagged;
  cell.el.classList.toggle('flag', cell.flagged);
  cell.el.textContent = cell.flagged ? '🚩' : '';

  flags += cell.flagged ? 1 : -1;
  mineCountEl.textContent = Math.max(0, MINES - flags);
}

function lose() {
  over = true;
  stopTimer();
  faceEl.textContent = '😵';
  hintEl.textContent = 'You hit a mine. Press the face to try again.';

  cells.forEach((cell) => {
    if (cell.mine && !cell.revealed) {
      cell.el.classList.remove('flag');
      cell.el.classList.add('open', 'mine');
      cell.el.textContent = '💣';
    }
  });
}

function checkWin() {
  if (openedCount < SIZE * SIZE - MINES) return;

  over = true;
  stopTimer();
  faceEl.textContent = '😎';
  hintEl.textContent = `Cleared in ${seconds} seconds. Well played.`;

  cells.forEach((cell) => {
    if (cell.mine && !cell.flagged) {
      cell.flagged = true;
      cell.el.classList.add('flag');
      cell.el.textContent = '🚩';
    }
  });

  mineCountEl.textContent = '0';
}

resetBtn.addEventListener('click', buildBoard);

buildBoard();
