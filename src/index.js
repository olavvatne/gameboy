import Gameboy from './gameboy/gameboy.js';

if (!window.IS_PRODUCTION) {
  new EventSource('/esbuild').addEventListener('change', () => location.reload())
}

let gameboy = null;
let data = null;

const startButton = document.querySelector('#start');
const pauseButton = document.querySelector('#pause');
const resetButton = document.querySelector('#reset');

function hide(element) {
  element.style.display = 'none';
}

function show(element) {
  element.style.display = 'inline-flex';
}

const initGameboy = () => {
  const c = document.getElementById('screen');
  gameboy = new Gameboy(c.getContext('2d'));
};

const handleRomSelect = (evt) => {
  hide(startButton);
  hide(pauseButton);
  hide(resetButton);

  if (evt.target.files.length < 1) return;
  const localRom = evt.target.files[0];
  const rd = new FileReader();
  rd.onload = (event) => {
    data = event.target.result;
    gameboy.start(data);
    show(pauseButton);
    show(resetButton);
  };
  rd.readAsArrayBuffer(localRom);
};

window.onload = () => {
  initGameboy();
  startButton.onclick = () => {gameboy.start(data); hide(startButton); show(pauseButton)};
  pauseButton.onclick = () => {gameboy.pause(); hide(pauseButton); show(startButton)};
  resetButton.onclick = () => {gameboy.reset(); hide(pauseButton); show(startButton)};
  document.addEventListener('keydown', e => gameboy.io.handleKeyDown(e));
  document.addEventListener('keyup', e => gameboy.io.handleKeyUp(e));
  document.getElementById('load').addEventListener('change', e => handleRomSelect(e), false);
};

