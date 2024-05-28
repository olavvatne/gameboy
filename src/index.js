import Gameboy from './gameboy/gameboy.js';

if (!window.IS_PRODUCTION) {
  new EventSource('/esbuild').addEventListener('change', () => location.reload())
}

let gameboy = null;
let data = null;

const startButton = document.querySelector('#start');
const pauseButton = document.querySelector('#pause');
const resetButton = document.querySelector('#reset');

const initGameboy = () => {
  const c = document.getElementById('screen');
  gameboy = new Gameboy(c.getContext('2d'));
};

const handleRomSelect = (evt) => {
  // TODO: Only called once for some reason?
  if (evt.target.files.length < 1) return;
  const localRom = evt.target.files[0];
  const rd = new FileReader();
  rd.onload = (event) => {
    data = event.target.result;
    gameboy.start(data);
  };
  rd.readAsArrayBuffer(localRom);
};

window.onload = () => {
  initGameboy();
  startButton.onclick = () => gameboy.start(data);
  pauseButton.onclick = () => gameboy.pause();
  resetButton.onclick = () => gameboy.reset();
  document.addEventListener('keydown', e => gameboy.io.handleKeyDown(e));
  document.addEventListener('keyup', e => gameboy.io.handleKeyUp(e));
  document.getElementById('load').addEventListener('change', e => handleRomSelect(e), false);
};

