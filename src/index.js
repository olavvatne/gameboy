import Gameboy from './gameboy/gameboy.js';

if (!window.IS_PRODUCTION) {
  new EventSource('/esbuild').addEventListener('change', () => location.reload())
}

let gameboy = null;
let data = null;
let zoomFactor = 1.0;

const startButton = document.querySelector('#start');
const pauseButton = document.querySelector('#pause');
const resetButton = document.querySelector('#reset');
const zoomInButton = document.querySelector('#zoom-in');
const zoomOutButton = document.querySelector('#zoom-out');
const viewOptionsButton = document.querySelector('#view-options');
const viewOptionsMenu = document.querySelector('.view-options-menu');

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
  const root = document.documentElement;
  root.style.setProperty('--zoom-factor', 1.0)
  window.addEventListener('click', (e) => {
    if (!viewOptionsMenu.contains(e.target) && !viewOptionsButton.contains(e.target) ) {
      viewOptionsMenu.style.visibility = 'collapse';
    };
  });

  initGameboy();
  startButton.onclick = () => {gameboy.start(data); hide(startButton); show(pauseButton)};
  pauseButton.onclick = () => {gameboy.pause(); hide(pauseButton); show(startButton)};
  resetButton.onclick = () => {gameboy.reset(); hide(pauseButton); show(startButton)};
  zoomInButton.onclick = () => {
    zoomFactor = Math.min(zoomFactor + 0.2, 3.0); 
    root.style.setProperty('--zoom-factor', zoomFactor); 
  };
  zoomOutButton.onclick = () => {
    zoomFactor = Math.max(zoomFactor - 0.2, 0.2); 
    root.style.setProperty('--zoom-factor', zoomFactor); 
  };
  viewOptionsButton.onclick = () => {
    if (viewOptionsMenu.style.visibility === 'collapse') {
      viewOptionsMenu.style.visibility = 'unset';
    }
    else {
      viewOptionsMenu.style.visibility = 'collapse';

    }
  }
  document.addEventListener('keydown', e => gameboy.io.handleKeyDown(e));
  document.addEventListener('keyup', e => gameboy.io.handleKeyUp(e));
  document.getElementById('load').addEventListener('change', e => handleRomSelect(e), false);
};

