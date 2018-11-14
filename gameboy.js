(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Gameboy = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

module.exports = require('./gameboy').default;
},{"./gameboy":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _processor = require("./processor");

var _memory = require("./memory");

var _gpu = require("./gpu");

var _ioRegister = _interopRequireDefault(require("./io/io-register"));

var _interrupts = _interopRequireDefault(require("./processor/interrupts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Gameboy =
/*#__PURE__*/
function () {
  function Gameboy(canvas) {
    var _this = this;

    _classCallCheck(this, Gameboy);

    this.canvas = canvas;
    this.interrupts = new _interrupts.default();
    this.gpu = new _gpu.GPU(new _gpu.Screen(canvas), this.interrupts);
    this.io = new _ioRegister.default(this.gpu);
    var vidMem = this.gpu.getVideoMemory();
    var attTab = this.gpu.getAttributeTable();
    this.memory = new _memory.MMU(vidMem, attTab, this.io, this.interrupts);
    this.core = new _processor.CPU(this.memory, this.interrupts, function (tick) {
      return _this.gpu.step(tick);
    });
    this.core.setActions(function () {
      return _this.pause();
    });
    this.interval = null;
  }

  _createClass(Gameboy, [{
    key: "start",
    value: function start(data) {
      var _this2 = this;

      if (this.interval) return;
      this.loadRom(data);
      this.interval = setInterval(function () {
        return _this2.runForAWhile();
      }, 1);
    }
  }, {
    key: "runForAWhile",
    value: function runForAWhile() {
      this.timeBeforeFrame = new Date();
      this.cyclesBeforeFrame = this.core.clockCycles;
      this.core.loop();
      this.syncTime();
      this.handleFpsCounter();
    }
  }, {
    key: "syncTime",
    value: function syncTime() {
      if (this.memory._inBios) return;
      var diffTime = (new Date() - this.timeBeforeFrame) / 1000;
      var diffCycles = this.core.clockCycles - this.cyclesBeforeFrame;
      var cyclesPerSec = 4194304;
      var virtualTimeElapsed = diffCycles / cyclesPerSec; // while (virtualTimeElapsed > diffTime) {
      //   diffTime = (new Date() - this.timeBeforeFrame) / 1000;
      // }
    }
    /* istanbul ignore next */

  }, {
    key: "handleFpsCounter",
    value: function handleFpsCounter() {
      if (this.core.numVSync > 0 && this.core.numVSync % 60 === 0) {
        var timeDiff = (new Date() - this.previousFpsTime) / 1000;
        this.fps = Math.round(60 / timeDiff);
        this.previousFpsTime = new Date();
      }

      if (this.previousFpsTime) {
        this.canvas.fillStyle = 'blue';
        this.canvas.font = '10px Arial';
        this.canvas.fillText(this.fps, 10, 10);
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      if (this.interval != null) clearInterval(this.interval);
      this.interval = null;
    }
  }, {
    key: "reset",
    value: function reset() {
      this.pause();
      this.gpu.reset();
      this.core.reset();
      this.memory.reset();
    }
  }, {
    key: "loadRom",
    value: function loadRom(data) {
      this.memory.load(data);
    }
  }]);

  return Gameboy;
}();

exports.default = Gameboy;
},{"./gpu":5,"./io/io-register":11,"./memory":15,"./processor":20,"./processor/interrupts":32}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = _interopRequireDefault(require("../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
  tile based. 8x8 pixels. 256 unique tiles.
  Two maps of 32x32 tiles held in memory. One displayed at the time.
  Space for 384 tiles total in memory.
  8 bits combination in tile map so only 256 unique maps can be addressed.
  Some tiles are therefore shared between the maps.

  8000 - 87FF : Tile set #1 (128 tiles)
  8800 - 8FFF : Shared #1 #2 (256 shared tiles)
  9000 - 97FF : Tile set #0 (128 tiles)
  9800 - 9BFF : Tile map #0 (32x32 tile references)
  9C00 - 9FFF : Tile map #1 (32x32 tile references)
 */
// TODO: scroll x and scroll y. Wraps around as well

/* eslint no-bitwise: 0 */

/* eslint no-bitwise: 0 */
var numTiles = 384;

var initTileset = function initTileset() {
  var tiles = [];

  for (var t = 0; t < numTiles; t += 1) {
    tiles[t] = new Array(8).fill().map(function () {
      return new Array(8).fill(0);
    });
  }

  return tiles;
};

var FrameBuffer =
/*#__PURE__*/
function () {
  function FrameBuffer() {
    _classCallCheck(this, FrameBuffer);

    this.tiles = initTileset();
  }

  _createClass(FrameBuffer, [{
    key: "reset",
    value: function reset() {
      this.tiles = initTileset();
    }
  }, {
    key: "updateTile",
    value: function updateTile(address, firstByte, secondByte) {
      // 16 bytes per tile. A row is 2 bytes.
      // A tile pixel is 2 bits, one in each of the bytes.
      var tile = address >> 4 & 0x1FF;
      var row = address >> 1 & 0x7;

      for (var i = 0; i < 8; i += 1) {
        var bit0 = _util.default.getBit(firstByte, 7 - i);

        var bit1 = _util.default.getBit(secondByte, 7 - i);

        var val = bit0 + bit1 * 2;
        this.tiles[tile][row][i] = val;
      }
    }
  }, {
    key: "getTile",
    value: function getTile(tileset, tile) {
      if (tileset > 1) throw new Error('Only two tilesets');
      var t = tile;

      if (tileset === 0) {
        t = _util.default.convertSignedByte(tile);
      }

      if (tileset === 1 && t >= 0 && t < 256) return this.tiles[t];
      var secondSetOffset = 128 * 2;
      if (tileset === 0 && t >= -128 && t < 128) return this.tiles[t + secondSetOffset];
      throw new Error('tile is out of bounds');
    }
  }]);

  return FrameBuffer;
}();

exports.default = FrameBuffer;
},{"../util":36}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectAttributeMemory = _interopRequireDefault(require("./object-attribute-memory"));

var _videoMemory = _interopRequireDefault(require("./video-memory"));

var _timing = _interopRequireDefault(require("./timing"));

var _frameBuffer = _interopRequireDefault(require("./frame-buffer"));

var _renderer = _interopRequireDefault(require("./renderer"));

var _util = _interopRequireDefault(require("../util"));

var _interrupts = _interopRequireDefault(require("../processor/interrupts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var GPU =
/*#__PURE__*/
function () {
  function GPU(screen) {
    var interrupts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new _interrupts.default();

    _classCallCheck(this, GPU);

    this.screen = screen;
    this.registers = {
      x: 0,
      y: 0,
      tileset: 0,
      tilemap: 0,
      tilemapWindow: 0,
      bg: 0,
      sprite: 0,
      lcd: 1,
      spriteHeight: 8,
      window: 0,
      wx: 0,
      wy: 0
    };
    this.initPalette();
    this._frameBuffer = new _frameBuffer.default();
    this.renderTiming = new _timing.default(interrupts);
    this._vram = new _videoMemory.default(this._frameBuffer);
    this._oam = new _objectAttributeMemory.default();
    this._renderer = new _renderer.default(this._frameBuffer, this._oam, screen, this._vram, this.registers, this.palette);
  }

  _createClass(GPU, [{
    key: "initPalette",
    value: function initPalette() {
      var palette = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        bg: [],
        obj0: [],
        obj1: []
      };
      this.palette = palette;
      this.setPalette(27, 'bg');
      this.setPalette(27, 'obj0');
      this.setPalette(27, 'obj1');
    }
  }, {
    key: "setPalette",
    value: function setPalette(value, type) {
      // 4 color palette. Each 2 bits in the byte decides palette color
      for (var i = 0; i < 4; i += 1) {
        var pal = _util.default.getHalfNibble(value, i);

        this.palette[type][i] = _util.default.getPaletteColor(pal);
      }
    }
  }, {
    key: "getVideoMemory",
    value: function getVideoMemory() {
      return this._vram;
    }
  }, {
    key: "getAttributeTable",
    value: function getAttributeTable() {
      return this._oam;
    }
  }, {
    key: "step",
    value: function step(tick) {
      var result = this.renderTiming.step(tick);
      if (result.shouldScanline) this._renderer.renderScanline(this.renderTiming.getLine());

      if (result.shouldDisplay) {
        this._renderer.displayImage();
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      this.registers.x = 0;
      this.registers.y = 0;
      this.registers.tilemap = 0;
      this.registers.tileset = 0;
      this.registers.bg = 0;
      this.registers.sprite = 0;
      this.initPalette(this.palette);

      this._oam.reset();

      this._frameBuffer.reset();

      this.renderTiming.reset();
      this.screen.reset();
    }
  }]);

  return GPU;
}();

exports.default = GPU;
},{"../processor/interrupts":32,"../util":36,"./frame-buffer":3,"./object-attribute-memory":6,"./renderer":7,"./timing":9,"./video-memory":10}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "GPU", {
  enumerable: true,
  get: function get() {
    return _gpu.default;
  }
});
Object.defineProperty(exports, "Screen", {
  enumerable: true,
  get: function get() {
    return _screen.default;
  }
});
Object.defineProperty(exports, "RenderTiming", {
  enumerable: true,
  get: function get() {
    return _timing.default;
  }
});
Object.defineProperty(exports, "FrameBuffer", {
  enumerable: true,
  get: function get() {
    return _frameBuffer.default;
  }
});
Object.defineProperty(exports, "VideoMemory", {
  enumerable: true,
  get: function get() {
    return _videoMemory.default;
  }
});
Object.defineProperty(exports, "Renderer", {
  enumerable: true,
  get: function get() {
    return _renderer.default;
  }
});
Object.defineProperty(exports, "OAM", {
  enumerable: true,
  get: function get() {
    return _objectAttributeMemory.default;
  }
});

var _gpu = _interopRequireDefault(require("./gpu"));

var _screen = _interopRequireDefault(require("./screen"));

var _timing = _interopRequireDefault(require("./timing"));

var _frameBuffer = _interopRequireDefault(require("./frame-buffer"));

var _videoMemory = _interopRequireDefault(require("./video-memory"));

var _renderer = _interopRequireDefault(require("./renderer"));

var _objectAttributeMemory = _interopRequireDefault(require("./object-attribute-memory"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./frame-buffer":3,"./gpu":4,"./object-attribute-memory":6,"./renderer":7,"./screen":8,"./timing":9,"./video-memory":10}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _memory = _interopRequireDefault(require("../memory/memory"));

var _util = _interopRequireDefault(require("../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/* eslint no-bitwise: 0 */
var OAM =
/*#__PURE__*/
function (_Memory) {
  _inherits(OAM, _Memory);

  function OAM() {
    var _this;

    _classCallCheck(this, OAM);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(OAM).call(this, Math.pow(2, 8)));

    _this.init();

    return _this;
  }

  _createClass(OAM, [{
    key: "init",
    value: function init() {
      this.objects = new Array(40).fill().map(function () {
        return {
          y: -16,
          x: -8,
          tile: 0,
          palette: 0,
          priority: false
        };
      });
    }
  }, {
    key: "reset",
    value: function reset() {
      this.init();
    }
  }, {
    key: "setMemoryReader",
    value: function setMemoryReader(mmu) {
      this._mmu = mmu;
    }
  }, {
    key: "readByte",
    value: function readByte(address) {
      return _get(_getPrototypeOf(OAM.prototype), "readByte", this).call(this, address);
    }
  }, {
    key: "writeByte",
    value: function writeByte(address, value) {
      _get(_getPrototypeOf(OAM.prototype), "writeByte", this).call(this, address, value);

      this.updateObject(address, value);
    }
  }, {
    key: "startDmaTransfer",
    value: function startDmaTransfer(value) {
      for (var i = 0; i < 160; i += 1) {
        var val = this._mmu.readByte((value << 8) + i);

        this.writeByte(i, val);
      }
    }
  }, {
    key: "updateObject",
    value: function updateObject(address, value) {
      var index = address >> 2;
      if (index >= 40) return;
      var sprite = this.objects[index];
      var field = address & 0x03;

      if (field === 0) {
        sprite.y = value - 16;
      } else if (field === 1) {
        sprite.x = value - 8;
      } else if (field === 2) {
        sprite.tile = value;
      } else {
        sprite.palette = _util.default.getBit(value, 4);
        sprite.flipY = _util.default.getBit(value, 6);
        sprite.flipX = _util.default.getBit(value, 5);
        sprite.priority = _util.default.getBit(value, 7) === 0;
      }
    }
  }]);

  return OAM;
}(_memory.default);

exports.default = OAM;
},{"../memory/memory":16,"../util":36}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */

/* eslint no-continue: 0 */

/* eslint prefer-destructuring: 0 */
// width: 160 - height: 144
var Renderer =
/*#__PURE__*/
function () {
  function Renderer(buffer, oam, screen, vram, registers, palette) {
    _classCallCheck(this, Renderer);

    this._registers = registers;
    this._vram = vram;
    this._screen = screen;
    this._frameBuffer = buffer;
    this._palette = palette;
    this._oam = oam;
    this.backgroundValues = new Array(144).fill().map(function () {
      return new Array(160).fill(0);
    });
  }

  _createClass(Renderer, [{
    key: "_findCurrentPositionInMap",
    value: function _findCurrentPositionInMap(line) {
      this._mapOffset = (line + this._registers.y & 0xFF) >> 3 << 5;
      this._tileOffset = this._registers.x >> 3 & 0x1F;
    }
  }, {
    key: "_findCurrentTileAddress",
    value: function _findCurrentTileAddress() {
      var pos = this._mapOffset + this._tileOffset;
      this._tileAddress = this._vram.getTileAddressFromMap(this._registers.tilemap, pos);
    }
  }, {
    key: "renderScanline",
    value: function renderScanline(line) {
      if (!this._registers.lcd) return;
      if (this._registers.bg) this.renderBackground(line);
      if (this._registers.sprite) this.renderSprites(line);
    }
  }, {
    key: "renderBackground",
    value: function renderBackground(line) {
      this._findCurrentPositionInMap(line);

      this._findCurrentTileAddress();

      var tileY = line + this._registers.y & 7;
      var tileX = this._registers.x & 7;

      for (var i = 0; i < 160; i += 1) {
        var tile = this._frameBuffer.getTile(this._registers.tileset, this._tileAddress);

        var PixelVal = tile[tileY][tileX];
        var pixelColor = this._palette.bg[PixelVal];

        this._screen.setPixel(line, i, pixelColor);

        this.backgroundValues[line][i] = PixelVal;
        tileX += 1;

        if (tileX === 8) {
          tileX = 0;
          this._tileOffset = this._tileOffset + 1 & 0x1F;

          this._findCurrentTileAddress();
        }
      }
    }
  }, {
    key: "renderSprites",
    value: function renderSprites(line) {
      var spriteHeight = this._registers.spriteHeight;

      for (var i = 0; i < 40; i += 1) {
        var sprite = this._oam.objects[i];

        if (sprite.y > line || sprite.y <= line - spriteHeight) {
          continue;
        }

        var pal = sprite.palette ? this._palette.obj1 : this._palette.obj0;

        var tile = this._frameBuffer.getTile(1, sprite.tile);

        var flipYVal = 7;

        if (spriteHeight === 16) {
          flipYVal = 15;

          var extra = this._frameBuffer.getTile(1, sprite.tile + 1);

          tile = tile.concat(extra);
        }

        var rowIndex = line - sprite.y;
        var row = sprite.flipY ? tile[flipYVal - rowIndex] : tile[rowIndex];

        for (var x = 0; x < 8; x += 1) {
          if (!(sprite.x + x >= 0 && sprite.x + x < 160)) continue;
          var correctedX = sprite.flipX ? 7 - x : x;
          var bgVal = this.backgroundValues[line][sprite.x + x];

          if (row[correctedX] && (sprite.priority || !bgVal)) {
            var color = pal[row[correctedX]];

            this._screen.setPixel(line, sprite.x + x, color);
          }
        }
      }
    }
  }, {
    key: "renderWindow",
    value: function renderWindow() {
      var tilemapSize = 32 * 32;
      var wx = this._registers.wx - 7; // wx= 7 and xy = 0 put window at upper left corner

      var wy = this._registers.wy;

      for (var i = 0; i < tilemapSize; i += 1) {
        var x = i % 32 * 8;
        var y = (i / 32 | 0) * 8; // Entire tile must fit assumtion?

        var isOnScreen = x + wx >= 0 && x + wx < 160 && y + wy >= 0 && y + wy < 144;

        if (isOnScreen) {
          var tileAddr = this._vram.getTileAddressFromMap(this._registers.tilemapWindow, i);

          var tile = this._frameBuffer.getTile(this._registers.tileset, tileAddr);

          this.drawTile(tile, x + wx, y + wy);
        }
      }
    }
  }, {
    key: "drawTile",
    value: function drawTile(tile, x, y) {
      var maxWidth = Math.min(Math.max(166 - x, 0), 8);
      var maxHeight = Math.min(Math.max(144 - y, 0), 8);
      var pal = this._palette.bg;

      for (var i = 0; i < maxHeight; i += 1) {
        for (var j = 0; j < maxWidth; j += 1) {
          if (tile[i][j] === 0) continue;
          var color = pal[tile[i][j]];

          this._screen.setPixel(y + i, x + j, color);
        }
      }
    }
  }, {
    key: "displayImage",
    value: function displayImage() {
      if (this._registers.lcd && this._registers.window) {
        this.renderWindow();
      }

      this._screen.displayImage();
    }
  }]);

  return Renderer;
}();

exports.default = Renderer;
},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Screen =
/*#__PURE__*/
function () {
  function Screen(canvas) {
    _classCallCheck(this, Screen);

    this._canvas = canvas;
    this._image = null;

    if (this._canvas) {
      this._image = this._canvas.createImageData(160, 144);
    } else {
      this._image = {
        width: 160,
        height: 144,
        data: new Array(160 * 144 * 4).fill(255)
      };
    }
  }

  _createClass(Screen, [{
    key: "setPixel",
    value: function setPixel(y, x, pixel) {
      var pos = y * this._image.width * 4 + x * 4;

      var _pixel = _slicedToArray(pixel, 4),
          r = _pixel[0],
          g = _pixel[1],
          b = _pixel[2],
          a = _pixel[3];

      this._image.data[pos] = r;
      this._image.data[pos + 1] = g;
      this._image.data[pos + 2] = b;
      this._image.data[pos + 3] = a;
    }
  }, {
    key: "getPixel",
    value: function getPixel(y, x) {
      var pos = y * this._image.width * 4 + x * 4;
      var r = this._image.data[pos];
      var g = this._image.data[pos + 1];
      var b = this._image.data[pos + 2];
      var a = this._image.data[pos + 3];
      return [r, g, b, a];
    }
  }, {
    key: "displayImage",
    value: function displayImage() {
      if (!this._canvas) return;

      this._canvas.putImageData(this._image, 0, 0);
    }
  }, {
    key: "reset",
    value: function reset() {
      if (this._canvas) {
        for (var i = 0; i < this._image.data.length; i += 1) {
          this._image.data[i] = 0;
        }
      } else {
        this._image.data = new Array(160 * 144 * 4).fill(255);
      }

      this.displayImage();
    }
  }]);

  return Screen;
}();

exports.default = Screen;
},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = _interopRequireDefault(require("../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var ticksBackgroundLine = 172;
var ticksSpriteLine = 80;
var ticksHBlank = 204;
var ticksVBlank = 456;
var numlines = 144;
var numVertLines = 10;
var Mode = {
  hblank: 0,
  vblank: 1,
  sprite: 2,
  background: 3
};

var RenderTiming =
/*#__PURE__*/
function () {
  function RenderTiming(interrupts) {
    _classCallCheck(this, RenderTiming);

    this.inter = interrupts || {
      triggerStat: function triggerStat() {},
      triggerVblank: function triggerVblank() {}
    };
    this.reset();
  }

  _createClass(RenderTiming, [{
    key: "reset",
    value: function reset() {
      this._modeClock = 0;
      this._line = 0;
      this._mode = Mode.sprite;
      this.state = {
        shouldScanline: false,
        lastHblank: false
      };
      this.lcdStat = {};
      this.lyc = 0;
    }
  }, {
    key: "EnableOrDisableStatInterrupts",
    value: function EnableOrDisableStatInterrupts(value) {
      var isLyc = _util.default.getBit(value, 6) === 1;
      var isOam = _util.default.getBit(value, 5) === 1;
      var isVblank = _util.default.getBit(value, 4) === 1;
      var isHblank = _util.default.getBit(value, 3) === 1;
      this.lcdStat = {
        lyc: isLyc,
        oam: isOam,
        vblank: isVblank,
        hblank: isHblank
      };
    }
  }, {
    key: "getStat",
    value: function getStat() {
      var currentStat = (this._line === this.lyc ? 4 : 0) | this._mode;
      currentStat |= this.lcdStat.hblank << 3;
      currentStat |= this.lcdStat.vblank << 4;
      currentStat |= this.lcdStat.oam << 5;
      currentStat |= this.lcdStat.lyc << 6;
      currentStat |= 128;
      return currentStat;
    }
  }, {
    key: "getMode",
    value: function getMode() {
      return this._mode;
    }
  }, {
    key: "getLine",
    value: function getLine() {
      return this._line & 0xFF;
    }
  }, {
    key: "resetLine",
    value: function resetLine() {
      this._line = 0;
    } // simple state machine that based on tick switches between hblank, vblank and line(s) states.

  }, {
    key: "step",
    value: function step(tick) {
      this._modeClock += tick;
      if (this._mode === Mode.hblank) this._visitHblankState();else if (this._mode === Mode.vblank) this._visitVblankState();else if (this._mode === Mode.sprite) this._visitSpriteLineState();else if (this._mode === Mode.background) this._visitBackgroundLineState();else {
        throw new Error('Not a a valid state');
      }
      return this._getStateAndReset();
    }
  }, {
    key: "_updateLY",
    value: function _updateLY() {
      // TODO: create a new stat on every updateLY and setMode?
      if (this._line === this.lyc && this.lcdStat.lyc) this.inter.triggerStat();
    }
  }, {
    key: "_setMode",
    value: function _setMode(mode) {
      this._mode = mode;

      if (mode === Mode.vblank && this.lcdStat.vblank || mode === Mode.hblank && this.lcdStat.hblank || mode === Mode.sprite && this.lcdStat.oam) {
        this.inter.triggerStat();
      }
    }
  }, {
    key: "_getStateAndReset",
    value: function _getStateAndReset() {
      var result = Object.assign({}, this.state);
      this.state.shouldScanline = false;
      this.state.shouldDisplay = false;
      return result;
    }
  }, {
    key: "_visitHblankState",
    value: function _visitHblankState() {
      if (this._modeClock >= ticksHBlank) {
        this._modeClock -= ticksHBlank;
        this._line += 1;

        this._updateLY();

        if (this._line === numlines) {
          this._setMode(Mode.vblank);

          this.inter.triggerVblank();
          this.state.shouldDisplay = true;
        } else {
          this._mode = Mode.sprite;
        }
      }
    }
  }, {
    key: "_visitVblankState",
    value: function _visitVblankState() {
      if (this._modeClock >= ticksVBlank) {
        this._modeClock -= ticksVBlank;
        this._line += 1;

        if (this._line >= numlines + numVertLines) {
          this._setMode(Mode.sprite);

          this._line = 0;
        }

        this._updateLY();
      }
    } // Scanline oam

  }, {
    key: "_visitSpriteLineState",
    value: function _visitSpriteLineState() {
      if (this._modeClock >= ticksSpriteLine) {
        this._modeClock -= ticksSpriteLine;

        this._setMode(Mode.background);
      }
    }
  }, {
    key: "_visitBackgroundLineState",
    value: function _visitBackgroundLineState() {
      if (this._modeClock >= ticksBackgroundLine) {
        this._modeClock -= ticksBackgroundLine;

        this._setMode(Mode.hblank);

        this.state.shouldScanline = true;
      }
    }
  }]);

  return RenderTiming;
}();

RenderTiming.Mode = Mode;
var _default = RenderTiming;
exports.default = _default;
},{"../util":36}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _memory = _interopRequireDefault(require("../memory/memory"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/* eslint no-bitwise: 0 */
var tilesetAddressMax = 0x9800 & 0x1FFF;

var VideoMemory =
/*#__PURE__*/
function (_Memory) {
  _inherits(VideoMemory, _Memory);

  function VideoMemory(frameBuffer) {
    var _this;

    _classCallCheck(this, VideoMemory);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(VideoMemory).call(this, Math.pow(2, 13)));
    _this._frameBuffer = frameBuffer;
    return _this;
  }

  _createClass(VideoMemory, [{
    key: "readByte",
    value: function readByte(address) {
      return _get(_getPrototypeOf(VideoMemory.prototype), "readByte", this).call(this, address);
    }
  }, {
    key: "writeByte",
    value: function writeByte(address, value) {
      _get(_getPrototypeOf(VideoMemory.prototype), "writeByte", this).call(this, address, value); // Test if address falls inside tile set area.
      // Include both rows to update enable row update


      if (address < tilesetAddressMax) {
        // Identify first byte of tile row. Send both row bytes to update tile
        var firstAddr = address - address % 2;
        var firstByte = this.readByte(firstAddr);
        var secondByte = this.readByte(firstAddr + 1);

        this._frameBuffer.updateTile(firstAddr, firstByte, secondByte);
      }
    }
  }, {
    key: "getTileAddressFromMap",
    value: function getTileAddressFromMap(tilemap, offset) {
      var mapAddr = tilemap ? 0x1C00 : 0x1800;
      var val = this.readByte(mapAddr + offset);
      return val;
    }
  }]);

  return VideoMemory;
}(_memory.default);

exports.default = VideoMemory;
},{"../memory/memory":16}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = _interopRequireDefault(require("../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var toByte = function toByte(arr) {
  var val = arr[0];

  for (var i = 1; i < arr.length; i += 1) {
    val = (val << 1) + arr[i];
  }

  return val;
};

var isUnmapped = function isUnmapped(address) {
  return address === 0x03 || address === 0x08 || address === 0x09 || address === 0x0A || address === 0x0B || address === 0x0C || address === 0x0D || address === 0x0E || address === 0x15 || address === 0x1F || address === 0x27 || address === 0x28 || address === 0x29 || address >= 0x4C && address <= 0x7F;
}; // TODO: split into input and gpu state classes


var IORegister =
/*#__PURE__*/
function () {
  function IORegister(gpu) {
    _classCallCheck(this, IORegister);

    this._memory = new Uint8Array(Math.pow(2, 7));
    this.keyColumns = [new Array(4).fill(1), new Array(4).fill(1)];
    this.currentColumn = 0;
    this._gpu = gpu;
  }

  _createClass(IORegister, [{
    key: "readByte",
    value: function readByte(address) {
      if (address === 0x00) return this.getKeys();else if (address === 0x02) return this._memory[address] | 126; // TODO: SC
      else if (address === 0x10) return this._memory[address] | 128; // TODO: NR 10
        else if (address === 0x1A) return this._memory[address] | 127; // TODO: NR 30
          else if (address === 0x1C) return this._memory[address] | 159; // TODO: NR 32
            else if (address === 0x20) return this._memory[address] | 192; // TODO: NR 41
              else if (address === 0x23) return this._memory[address] | 63; // TODO: NR 44
                else if (address === 0x26) return this._memory[address] | 112; // TODO: NR 52
                  else if (address === 0x41) return this._gpu.renderTiming.getStat();else if (address === 0x42) return this._gpu.registers.y;else if (address === 0x43) return this._gpu.registers.x;else if (address === 0x44) return this._gpu.renderTiming.getLine();else if (isUnmapped(address)) return 0xFF;
      return this._memory[address];
    }
  }, {
    key: "writeByte",
    value: function writeByte(address, value) {
      this._memory[address] = value;
      if (address === 0x00) this.currentColumn = value & 0x30;else if (address === 0x40) this._handleLCDC(value);else if (address === 0x41) this._gpu.renderTiming.EnableOrDisableStatInterrupts(value);else if (address === 0x42) this._gpu.registers.y = value;else if (address === 0x43) this._gpu.registers.x = value;else if (address === 0x44) this._gpu.renderTiming.resetLine();else if (address === 0x45) this._gpu.renderTiming.lyc = value & 0xFF;else if (address === 0x47) this._gpu.setPalette(value, 'bg');else if (address === 0x48) this._gpu.setPalette(value, 'obj0');else if (address === 0x49) this._gpu.setPalette(value, 'obj1');else if (address === 0x4A) this._gpu.registers.wy = value;else if (address === 0x4B) this._gpu.registers.wx = value;
    }
  }, {
    key: "getKeys",
    value: function getKeys() {
      switch (this.currentColumn) {
        case 0x10:
          return toByte(this.keyColumns[0]);

        case 0x20:
          return toByte(this.keyColumns[1]);

        default:
          return 0xFF;
      }
    } // TODO: custom mapping scheme

  }, {
    key: "handleKeyDown",
    value: function handleKeyDown(event) {
      switch (event.key) {
        case 'Enter':
          this.keyColumns[0][0] = 0;
          break;

        case 'Space':
          this.keyColumns[0][1] = 0;
          break;

        case 'z':
          this.keyColumns[0][2] = 0;
          break;

        case 'x':
          this.keyColumns[0][3] = 0;
          break;

        case 'Down':
        case 'ArrowDown':
          this.keyColumns[1][0] = 0;
          break;

        case 'Up':
        case 'ArrowUp':
          this.keyColumns[1][1] = 0;
          break;

        case 'Left':
        case 'ArrowLeft':
          this.keyColumns[1][2] = 0;
          break;

        case 'Right':
        case 'ArrowRight':
          this.keyColumns[1][3] = 0;
          break;

        default:
          break;
      }
    }
  }, {
    key: "handleKeyUp",
    value: function handleKeyUp(event) {
      switch (event.key) {
        case 'Enter':
          this.keyColumns[0][0] = 1;
          break;

        case 'Space':
          this.keyColumns[0][1] = 1;
          break;

        case 'z':
          this.keyColumns[0][2] = 1;
          break;

        case 'x':
          this.keyColumns[0][3] = 1;
          break;

        case 'Down':
        case 'ArrowDown':
          this.keyColumns[1][0] = 1;
          break;

        case 'Up':
        case 'ArrowUp':
          this.keyColumns[1][1] = 1;
          break;

        case 'Left':
        case 'ArrowLeft':
          this.keyColumns[1][2] = 1;
          break;

        case 'Right':
        case 'ArrowRight':
          this.keyColumns[1][3] = 1;
          break;

        default:
          break;
      }
    }
  }, {
    key: "_handleLCDC",
    value: function _handleLCDC(value) {
      var bgOn = _util.default.getBit(value, 0);

      var spriteOn = _util.default.getBit(value, 1);

      this._gpu.registers.bg = bgOn;
      this._gpu.registers.sprite = spriteOn;
      this._gpu.registers.spriteHeight = _util.default.getBit(value, 2) ? 16 : 8;
      this._gpu.registers.tilemap = _util.default.getBit(value, 3);
      this._gpu.registers.tileset = _util.default.getBit(value, 4);
      this._gpu.registers.window = _util.default.getBit(value, 5);
      this._gpu.registers.tilemapWindow = _util.default.getBit(value, 6);
      this._gpu.registers.lcd = _util.default.getBit(value, 7);
    }
  }]);

  return IORegister;
}();

exports.default = IORegister;
},{"../util":36}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var bios = [0x31, 0xFE, 0xFF, 0xAF, 0x21, 0xFF, 0x9F, 0x32, 0xCB, 0x7C, 0x20, 0xFB, 0x21, 0x26, 0xFF, 0x0E, 0x11, 0x3E, 0x80, 0x32, 0xE2, 0x0C, 0x3E, 0xF3, 0xE2, 0x32, 0x3E, 0x77, 0x77, 0x3E, 0xFC, 0xE0, 0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1A, 0xCD, 0x95, 0x00, 0xCD, 0x96, 0x00, 0x13, 0x7B, 0xFE, 0x34, 0x20, 0xF3, 0x11, 0xD8, 0x00, 0x06, 0x08, 0x1A, 0x13, 0x22, 0x23, 0x05, 0x20, 0xF9, 0x3E, 0x19, 0xEA, 0x10, 0x99, 0x21, 0x2F, 0x99, 0x0E, 0x0C, 0x3D, 0x28, 0x08, 0x32, 0x0D, 0x20, 0xF9, 0x2E, 0x0F, 0x18, 0xF3, 0x67, 0x3E, 0x64, 0x57, 0xE0, 0x42, 0x3E, 0x91, 0xE0, 0x40, 0x04, 0x1E, 0x02, 0x0E, 0x0C, 0xF0, 0x44, 0xFE, 0x90, 0x20, 0xFA, 0x0D, 0x20, 0xF7, 0x1D, 0x20, 0xF2, 0x0E, 0x13, 0x24, 0x7C, 0x1E, 0x83, 0xFE, 0x62, 0x28, 0x06, 0x1E, 0xC1, 0xFE, 0x64, 0x20, 0x06, 0x7B, 0xE2, 0x0C, 0x3E, 0x87, 0xF2, 0xF0, 0x42, 0x90, 0xE0, 0x42, 0x15, 0x20, 0xD2, 0x05, 0x20, 0x4F, 0x16, 0x20, 0x18, 0xCB, 0x4F, 0x06, 0x04, 0xC5, 0xCB, 0x11, 0x17, 0xC1, 0xCB, 0x11, 0x17, 0x05, 0x20, 0xF5, 0x22, 0x23, 0x22, 0x23, 0xC9, 0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D, 0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E, 0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99, 0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC, 0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E, 0x3c, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x4C, 0x21, 0x04, 0x01, 0x11, 0xA8, 0x00, 0x1A, 0x13, 0xBE, 0x20, 0xFE, 0x23, 0x7D, 0xFE, 0x34, 0x20, 0xF5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xFB, 0x86, 0x20, 0xFE, 0x3E, 0x01, 0xE0, 0x50];
var _default = bios;
exports.default = _default;
},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var Cartridge =
/*#__PURE__*/
function () {
  function Cartridge() {
    _classCallCheck(this, Cartridge);

    this.type = 0;
    this.romOffset = 0x4000;
    this.ramOffset = 0x0000;
    this.rom = new Uint8Array(Math.pow(2, 15));
    this.ram = new Uint8Array(Math.pow(2, 15));
    this.isExternalRam = false;
    this.romBank = 0;
    this.ramBank = 0;
    this.mode = 0;
  }

  _createClass(Cartridge, [{
    key: "enableExternal",
    value: function enableExternal(val) {
      // Writing value to 0000 - 1FFF a value of 0x0A enabled ext ram
      if (this.type !== 1) return;
      this.isExternalRam = (val & 0x0F) === 0x0A;
    }
  }, {
    key: "setRomBank",
    value: function setRomBank(val) {
      // 4 cartridge types. 1, 2, 3 have MBC1
      // Two upper bits are kept, since it selects rom bank set.
      if (this.type > 0 || this.type < 4) {
        // switch between bank 1-31. 0 treated as 1
        this.romBank &= 0x60;
        var bank = val & 31;
        if (bank === 0) bank = 1;
        this.romBank |= bank;
        this.romOffset = this.romBank * 0x4000;
      }
    }
  }, {
    key: "setRomBankOrRamBank",
    value: function setRomBankOrRamBank(val) {
      if (this.type > 0 || this.type < 4) {
        if (this.mode) {
          this.ramBank = val & 3;
          this.ramOffset = this.ramBank * 0x2000;
        } else {
          this.romBank &= 0x1F;
          this.romBank |= (val & 3) << 5;
          this.romOffset = this.romBank * 0x4000;
        }
      }
    }
  }, {
    key: "setRamOrRomMode",
    value: function setRamOrRomMode(val) {
      if (this.type > 0 || this.type < 4) {
        this.mode = val & 1;
      }
    }
  }]);

  return Cartridge;
}();

exports.default = Cartridge;
},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bios = _interopRequireDefault(require("./bios"));

var _memory = _interopRequireDefault(require("./memory"));

var _interrupts = _interopRequireDefault(require("../processor/interrupts"));

var _objectAttributeMemory = _interopRequireDefault(require("../gpu/object-attribute-memory"));

var _cartrigde = _interopRequireDefault(require("./cartrigde"));

var _timer = _interopRequireDefault(require("../timer/timer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var MMU =
/*#__PURE__*/
function () {
  function MMU() {
    var vram = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new _memory.default(Math.pow(2, 13));
    var oam = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new _objectAttributeMemory.default();
    var io = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new _memory.default(Math.pow(2, 7));
    var interrupts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new _interrupts.default();

    _classCallCheck(this, MMU);

    this.init();
    this._vram = vram;
    this.interrupts = interrupts;
    this.io = io;
    this._oam = oam;

    this._oam.setMemoryReader(this);

    this.timer = new _timer.default(interrupts);
  }

  _createClass(MMU, [{
    key: "init",
    value: function init() {
      this._wram = new _memory.default(Math.pow(2, 13), true);
      this._zram = new _memory.default(Math.pow(2, 7));
      this.cartridge = new _cartrigde.default();
      this._inBios = true;
    }
  }, {
    key: "exitBios",
    value: function exitBios() {
      this._inBios = false;
    }
  }, {
    key: "readByte",
    value: function readByte(address) {
      switch (address & 0xF000) {
        // BIOS / ROM0
        case 0x0000:
          if (address < 0x0100 && this._inBios) {
            return _bios.default[address];
          }

          return this.cartridge.rom[address];

        case 0x1000:
        case 0x2000:
        case 0x3000:
          return this.cartridge.rom[address];
        // ROM1

        case 0x4000:
        case 0x5000:
        case 0x6000:
        case 0x7000:
          return this.cartridge.rom[this.cartridge.romOffset + (address & 0x3FFF)];
        // VRAM

        case 0x8000:
        case 0x9000:
          return this._vram.readByte(address & 0x1FFF);
        // Cartridge/external RAM

        case 0xA000:
        case 0xB000:
          return this.cartridge.ram[this.cartridge.ramOffset + (address & 0x1FFF)];

        case 0xC000:
        case 0xD000:
          return this._wram.readByte(address & 0x1FFF);
        // Working RAM shadow, I/O and zero-page RAM

        case 0xE000:
        case 0xF000:
          if (address < 0xFE00) {
            return this._wram.readByte(address & 0x1FFF);
          } else if (address < 0xFEA0) {
            return this._oam.readByte(address & 0xFF);
          } else if (address < 0xFF00) {
            return 0x0;
          } else if (address < 0xFF80) {
            if (address === 0xFF0F) return this.interrupts._if | 224;else if (address === 0xFF04) return this.timer.div;else if (address === 0xFF05) return this.timer.tima;else if (address === 0xFF06) return this.timer.tma;else if (address === 0xFF07) return this.timer.tac | 248;
            return this.io.readByte(address & 0xFF);
          } else if (address === 0xFFFF) {
            return this.interrupts._ie;
          }

          return this._zram.readByte(address & 0x7F);

        default:
          throw new Error('Map not working');
      }
    }
  }, {
    key: "readWord",
    value: function readWord(address) {
      return this.readByte(address + 1) << 8 | this.readByte(address);
    }
  }, {
    key: "writeByte",
    value: function writeByte(address, value) {
      switch (address & 0xF000) {
        // BIOS / ROM0
        // Read only, but can write certain values at certain addresses to configure cartrige rom/ram
        case 0x0000:
        case 0x1000:
          this.cartridge.enableExternal(value);
          break;

        case 0x2000:
        case 0x3000:
          this.cartridge.setRomBank(value);
          break;
        // ROM1

        case 0x4000:
        case 0x5000:
          this.cartridge.setRomBankOrRamBank(value);
          break;

        case 0x6000:
        case 0x7000:
          this.cartridge.setRamOrRomMode(value);
          break;
        // VRAM

        case 0x8000:
        case 0x9000:
          this._vram.writeByte(address & 0x1FFF, value);

          break;
        // Cartridge RAM

        case 0xA000:
        case 0xB000:
          this.cartridge.ram[this.cartridge.ramOffset + (address & 0x1FFF)] = value;
          break;

        case 0xC000:
        case 0xD000:
          this._wram.writeByte(address & 0x1FFF, value);

          break;
        // Working RAM shadow, I/O and zero-page RAM

        case 0xE000:
        case 0xF000:
          if (address < 0xFE00) {
            this._wram.writeByte(address & 0x1FFF, value);
          } else if (address < 0xFEA0) {
            this._oam.writeByte(address & 0xFF, value);
          } else if (address < 0xFF00) {// Writes are ignored on the original gb
          } else if (address < 0xFF80) {
            if (address === 0xFF50 && this._inBios) this.exitBios();else if (address === 0xFF0F) this.interrupts._if = value;else if (address === 0xFF46) this._oam.startDmaTransfer(value);else if (address === 0xFF04) this.timer.div = 0;else if (address === 0xFF05) this.timer.tima = value;else if (address === 0xFF06) this.timer.tma = value;else if (address === 0xFF07) this.timer.setTac(value & 7);
            this.io.writeByte(address & 0xFF, value);
          } else if (address === 0xFFFF) {
            this.interrupts._ie = value;
          } else {
            this._zram.writeByte(address & 0x7F, value);
          }

          break;

        default:
          throw new Error('Map not working');
      }
    }
  }, {
    key: "writeWord",
    value: function writeWord(address, value) {
      var mostSignificant = (value & 0xFF00) >>> 8;
      var leastSignificant = value & 0x00FF;
      this.writeByte(address + 1, mostSignificant);
      this.writeByte(address, leastSignificant);
    }
  }, {
    key: "load",
    value: function load(data) {
      if (!data) return;
      var prevInBios = this._inBios;
      this._inBios = false;
      this.cartridge.rom = new Uint8Array(data, 0, data.byteLength);
      this._inBios = prevInBios;
      this.cartridge.type = this.readByte(0x0147);
    }
  }, {
    key: "reset",
    value: function reset() {
      this.init();
    }
  }]);

  return MMU;
}();

exports.default = MMU;
},{"../gpu/object-attribute-memory":6,"../processor/interrupts":32,"../timer/timer":35,"./bios":12,"./cartrigde":13,"./memory":16}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "MMU", {
  enumerable: true,
  get: function get() {
    return _controller.default;
  }
});

var _controller = _interopRequireDefault(require("./controller"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./controller":14}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Memory =
/*#__PURE__*/
function () {
  function Memory(size) {
    _classCallCheck(this, Memory);

    this._memory = new Uint8Array(size);
  }

  _createClass(Memory, [{
    key: "readByte",
    value: function readByte(address) {
      return this._memory[address];
    }
  }, {
    key: "writeByte",
    value: function writeByte(address, value) {
      this._memory[address] = value;
    }
  }]);

  return Memory;
}();

exports.default = Memory;
},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dummy = exports.createOpTime = void 0;

var createOpTime = function createOpTime(m, t) {
  return {
    m: m,
    t: t
  };
};

exports.createOpTime = createOpTime;

var dummy = function dummy() {};

exports.dummy = dummy;
},{}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("./");

var _recorder = _interopRequireDefault(require("../../info/recorder"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var ProcessorCore =
/*#__PURE__*/
function () {
  function ProcessorCore(memoryController, interruptHandler, notifyGpu) {
    _classCallCheck(this, ProcessorCore);

    this.mmu = memoryController;
    this.timer = memoryController.timer;
    this.interrupts = interruptHandler;
    this.notifyGpu = !notifyGpu ? function () {} : notifyGpu;
    this.reg = new _.Registers();
    this.clockCycles = 0;
    this.actions = {
      stop: false,
      halt: false
    };
    this.currentOp = 0x00;
    this.currentPc = 0;
    this.currentInstruction = null;
    this.recorder = new _recorder.default();
    this.numVSync = 0;
    this.startDebug = false;
    this.oldCycleCount = 0;
  }

  _createClass(ProcessorCore, [{
    key: "fetch",
    value: function fetch() {
      var pc = this.reg.pc();
      this.currentPc = pc;
      this.currentOp = this.mmu.readByte(pc);
      this.reg.pc(pc + 1);
    }
  }, {
    key: "decode",
    value: function decode() {
      var op = this.currentOp;

      if (this.isOpAModifier()) {
        op = this.readNextOpAfterModiferAndCombine(op);
        this.currentOp = op;
      }

      if (_.opcodes[op] === undefined) {
        // this.recorder.printHistory();
        throw new Error("opcode not impl: ".concat(op.toString(16)));
      }

      this.currentInstruction = _.opcodes[op];
    }
  }, {
    key: "execute",
    value: function execute() {
      var state = {
        mmu: this.mmu,
        interrupt: this.interrupts,
        map: this.reg.map,
        actions: this.actions
      };
      var cyclesSpent = this.currentInstruction(state);
      this.clockCycles += cyclesSpent;
    }
  }, {
    key: "isOpAModifier",
    value: function isOpAModifier() {
      return this.currentOp === 0xCB;
    }
  }, {
    key: "readNextOpAfterModiferAndCombine",
    value: function readNextOpAfterModiferAndCombine(op) {
      this.fetch();
      var nextOp = this.currentOp;
      return (op << 8) + nextOp;
    }
  }, {
    key: "setActions",
    value: function setActions(pauseAction) {
      this.pause = pauseAction;
    }
  }, {
    key: "loop",
    value: function loop() {
      var oneFrame = this.clockCycles + 70224;

      while (this.clockCycles < oneFrame) {
        this.oldCycleCount = this.clockCycles;

        if (this.actions.halt) {
          this.handleHalt();
        } else {
          this.fetch();
          this.decode();
          this.execute();
        }

        this.handleClock();
        this.handleInterrupts();
      }

      this.clockCycles = 0;
    }
  }, {
    key: "handleClock",
    value: function handleClock() {
      var elapsed = this.clockCycles - this.oldCycleCount;
      this.timer.increment(elapsed);
      this.notifyGpu(elapsed);
    }
  }, {
    key: "handleHalt",
    value: function handleHalt() {
      if (this.interrupts.anyTriggered()) {
        this.actions.halt = false;
      }

      this.clockCycles += 4;
    }
  }, {
    key: "handleInterrupts",
    value: function handleInterrupts() {
      if (!this.interrupts.enabled) return;
      if (!this.interrupts.anyTriggered()) return;

      if (this.interrupts.checkVblankTriggered()) {
        this.numVSync += 1;
        this.callRst(0x0040);
      } else if (this.interrupts.checkLcdStatTriggered()) this.callRst(0x0048);else if (this.interrupts.checkTimerTriggered()) this.callRst(0x0050);else if (this.interrupts.checkSerialTriggered()) this.callRst(0x0058);else if (this.interrupts.checkJoypadTriggered()) this.callRst(0x0060);
    }
  }, {
    key: "callRst",
    value: function callRst(num) {
      this.interrupts.enabled = false;
      this.actions.halt = false;
      var state = {
        mmu: this.mmu,
        map: this.reg.map
      };

      var cyclesSpent = _.Z80.subroutine.rst(state, num);

      this.clockCycles += cyclesSpent + 4;
    }
  }, {
    key: "reset",
    value: function reset() {
      this.reg = new _.Registers();
      this.clockCycles = 0;
      this.currentOp = 0x00;
      this.currentPc = 0;
    }
  }]);

  return ProcessorCore;
}();

exports.default = ProcessorCore;
},{"../../info/recorder":39,"./":20}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var CheckFlagFor =
/*#__PURE__*/
function () {
  function CheckFlagFor() {
    var flag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    _classCallCheck(this, CheckFlagFor);

    this.flag = flag;
  }

  _createClass(CheckFlagFor, [{
    key: "subtraction",
    value: function subtraction() {
      this.setSubtraction(true);
      return this;
    }
  }, {
    key: "notSubtraction",
    value: function notSubtraction() {
      this.setSubtraction(false);
      return this;
    }
  }, {
    key: "setSubtraction",
    value: function setSubtraction(isSub) {
      if (isSub) this.flag |= 0x40;else this.flag &= 191;
      return this;
    } // TODO: depricated

  }, {
    key: "carry",
    value: function carry(val) {
      this.setCarry(val > 255);
      return this;
    }
  }, {
    key: "carry16",
    value: function carry16(val) {
      this.setCarry(val > 0xFFFF);
      return this;
    }
  }, {
    key: "zero",
    value: function zero(val) {
      this.setZero(!(val & 255));
      return this;
    }
  }, {
    key: "setZero",
    value: function setZero(isZero) {
      if (isZero) this.flag |= 0x80;else this.flag &= 127;
      return this;
    }
  }, {
    key: "setHalfCarry",
    value: function setHalfCarry(isHalfCarry) {
      if (isHalfCarry) this.flag |= 0x20;else this.flag &= 223;
      return this;
    } // TODO: depricated

  }, {
    key: "setCarry",
    value: function setCarry(isCarry) {
      if (isCarry) this.flag |= 0x10;else this.flag &= 239;
      return this;
    } // If carry occured from lower nibble (4 bit of reg) 3.2.2 GBCPUman

  }, {
    key: "setH",
    value: function setH(val, a, b) {
      this.setHalfCarry((val & 0xFF ^ b ^ a) & 0x10);
      return this;
    }
  }, {
    key: "setC",
    value: function setC(isCarry) {
      this.setCarry(isCarry);
      return this;
    }
  }, {
    key: "setH16",
    value: function setH16(val, a, b) {
      this.setHalfCarry((val & 0xFFFF ^ b ^ a) & 0x1000);
      return this;
    }
  }, {
    key: "get",
    value: function get() {
      return this.flag;
    }
  }, {
    key: "isCarry",
    value: function isCarry() {
      return (this.flag & 16) === 16;
    }
  }, {
    key: "isHalfCarry",
    value: function isHalfCarry() {
      return (this.flag & 32) === 32;
    }
  }, {
    key: "isZero",
    value: function isZero() {
      return (this.flag & 128) === 128;
    }
  }, {
    key: "isSubtraction",
    value: function isSubtraction() {
      return (this.flag & 64) === 64;
    }
  }]);

  return CheckFlagFor;
}();

exports.default = CheckFlagFor;
},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Registers", {
  enumerable: true,
  get: function get() {
    return _registers.Registers;
  }
});
Object.defineProperty(exports, "NameMap", {
  enumerable: true,
  get: function get() {
    return _registers.NameMap;
  }
});
Object.defineProperty(exports, "opcodes", {
  enumerable: true,
  get: function get() {
    return _opcodesMap.default;
  }
});
Object.defineProperty(exports, "CPU", {
  enumerable: true,
  get: function get() {
    return _core.default;
  }
});
Object.defineProperty(exports, "CheckFlagFor", {
  enumerable: true,
  get: function get() {
    return _flagCheck.default;
  }
});
Object.defineProperty(exports, "Interrupts", {
  enumerable: true,
  get: function get() {
    return _interrupts.default;
  }
});
exports.Z80 = void 0;

var _instructions = require("./instructions");

var _registers = require("./registers");

var _opcodesMap = _interopRequireDefault(require("./opcodes-map"));

var _core = _interopRequireDefault(require("./core"));

var _flagCheck = _interopRequireDefault(require("./flag-check"));

var _interrupts = _interopRequireDefault(require("./interrupts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Z80 = {
  load8: _instructions.load8,
  load16: _instructions.load16,
  alu8: _instructions.alu8,
  alu16: _instructions.alu16,
  misc: _instructions.misc,
  rotate: _instructions.rotate,
  shift: _instructions.shift,
  bit: _instructions.bit,
  jump: _instructions.jump,
  subroutine: _instructions.subroutine
};
exports.Z80 = Z80;
},{"./core":18,"./flag-check":19,"./instructions":24,"./interrupts":32,"./opcodes-map":33,"./registers":34}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _2 = require("../");

var _util = _interopRequireDefault(require("./../../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */
var _default = {
  addRegHLReg: function addRegHLReg(_ref, regX) {
    var map = _ref.map;
    var hl = map.hl();
    var x = regX();
    var val = hl + x;
    map.hl(val);
    var flag = new _2.CheckFlagFor(map.f()).notSubtraction().setH16(val, hl, x).carry16(val).get();
    map.f(flag);
    return 8;
  },
  inc: function inc(_, regX) {
    regX(regX() + 1);
    return 8;
  },
  dec: function dec(_, regX) {
    regX(regX() - 1);
    return 8;
  },
  addRegSPImmediate: function addRegSPImmediate(_ref2) {
    var mmu = _ref2.mmu,
        map = _ref2.map;
    var pc = map.pc();
    var sp = map.sp();

    var immediateSigned = _util.default.convertSignedByte(mmu.readByte(pc));

    map.pc(pc + 1);
    var val = sp + immediateSigned;
    map.sp(val & 0xFFFF);
    var isC = (sp & 0xFF) + (immediateSigned & 0xFF) > 0xFF;
    var flag = new _2.CheckFlagFor().setC(isC).setH(val, sp, immediateSigned).get();
    map.f(flag);
    return 16;
  }
};
exports.default = _default;
},{"../":20,"./../../util":36}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("../");

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */
var setSubtractionFlag = function setSubtractionFlag(map, val, subtrahend, minuend) {
  var flag = new _.CheckFlagFor().zero(val).subtraction().setC(val < 0).setH(val, subtrahend, minuend).get();
  map.f(flag);
};

var readImmediateValueAndIncrementPC = function readImmediateValueAndIncrementPC(map, mmu) {
  var pc = map.pc();
  var immediateValue = mmu.readByte(pc);
  map.pc(pc + 1);
  return immediateValue;
};

var readValFromHLMem = function readValFromHLMem(map, mmu) {
  var memAddr = map.hl();
  return mmu.readByte(memAddr);
};

var setLogicalAndFlag = function setLogicalAndFlag(map, val) {
  var flag = new _.CheckFlagFor().zero(val).setHalfCarry(true).get();
  map.f(flag);
};

var setLogicalOrFlag = function setLogicalOrFlag(map, val) {
  var flag = new _.CheckFlagFor().zero(val).get();
  map.f(flag);
};

var setFlagsOnCompare = function setFlagsOnCompare(map, val, subtrahend, minuend) {
  var flag = new _.CheckFlagFor().subtraction().zero(val).setC(val < 0).setH(val, subtrahend, minuend).get();
  map.f(flag);
};

var setFlagsOnInc = function setFlagsOnInc(map, val) {
  var prevFlag = map.f();
  var flag = new _.CheckFlagFor(prevFlag).zero(val).notSubtraction().setH(val, val - 1, 1).get();
  map.f(flag);
};

var setFlagsOnDec = function setFlagsOnDec(map, val) {
  var prevFlag = map.f(); // Only way to borrow. -1 each time. From 0001 000 -> 0000 111

  var flag = new _.CheckFlagFor(prevFlag).zero(val).subtraction().setH(val, val + 1, 1).get();
  map.f(flag);
};

var _default = {
  // ADDITION
  add: function add(_ref, regX) {
    var map = _ref.map;
    var a = map.a();
    var x = regX();
    var val = a + x;
    var flag = new _.CheckFlagFor().zero(val).carry(val).setH(val, a, x).get();
    map.f(flag);
    map.a(val);
    return 4;
  },
  addMemHL: function addMemHL(_ref2) {
    var mmu = _ref2.mmu,
        map = _ref2.map;
    var valFromMem = readValFromHLMem(map, mmu);
    var a = map.a();
    var sum = valFromMem + a;
    map.a(sum);
    var flag = new _.CheckFlagFor().zero(sum).carry(sum).setH(sum, a, valFromMem).get();
    map.f(flag);
    return 8;
  },
  adcMemHLPlusCarry: function adcMemHLPlusCarry(_ref3) {
    var mmu = _ref3.mmu,
        map = _ref3.map;
    var valFromMem = readValFromHLMem(map, mmu);
    var isCarry = new _.CheckFlagFor(map.f()).isCarry();
    var a = map.a();
    var sum = valFromMem + a + isCarry;
    map.a(sum);
    var flag = new _.CheckFlagFor().zero(sum).carry(sum).setH(sum, a, valFromMem).get();
    map.f(flag);
    return 8;
  },
  adcImmediatePlusCarry: function adcImmediatePlusCarry(_ref4) {
    var mmu = _ref4.mmu,
        map = _ref4.map;
    var immediateValue = readImmediateValueAndIncrementPC(map, mmu);
    var isCarry = new _.CheckFlagFor(map.f()).isCarry();
    var a = map.a();
    var sum = immediateValue + a + isCarry;
    map.a(sum);
    var flag = new _.CheckFlagFor().zero(sum).carry(sum).setH(sum, a, immediateValue).get();
    map.f(flag);
    return 8;
  },
  addImmediate: function addImmediate(_ref5) {
    var mmu = _ref5.mmu,
        map = _ref5.map;
    var imVal = readImmediateValueAndIncrementPC(map, mmu);
    var a = map.a();
    var sum = imVal + a;
    map.a(sum);
    var flag = new _.CheckFlagFor().zero(sum).carry(sum).setH(sum, a, imVal).get();
    map.f(flag);
    return 8;
  },
  adcPlusCarry: function adcPlusCarry(_ref6, regX) {
    var map = _ref6.map;
    var a = map.a();
    var x = regX();
    var isCarry = new _.CheckFlagFor(map.f()).isCarry();
    var sum = a + x + isCarry;
    map.a(sum);
    var flag = new _.CheckFlagFor().zero(sum).carry(sum).setH(sum, a, x).get();
    map.f(flag);
    return 4;
  },
  // SUBTRACTION
  sub: function sub(_ref7, regX) {
    var map = _ref7.map;
    var a = map.a();
    var x = regX();
    var val = a - x;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, x);
    return 4;
  },
  subMemHL: function subMemHL(_ref8) {
    var mmu = _ref8.mmu,
        map = _ref8.map;
    var a = map.a();
    var b = readValFromHLMem(map, mmu);
    var val = a - b;
    map.a(val);
    setSubtractionFlag(map, val, a, b);
    return 8;
  },
  subImmediate: function subImmediate(_ref9) {
    var mmu = _ref9.mmu,
        map = _ref9.map;
    var a = map.a();
    var b = readImmediateValueAndIncrementPC(map, mmu);
    var val = a - b;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, b);
    return 8;
  },
  sbc: function sbc(_ref10, regX) {
    var map = _ref10.map;
    var isCarry = new _.CheckFlagFor(map.f()).isCarry();
    var a = map.a();
    var x = regX();
    var val = a - x - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, x);
    return 4;
  },
  sbcMemHL: function sbcMemHL(_ref11) {
    var mmu = _ref11.mmu,
        map = _ref11.map;
    var isCarry = new _.CheckFlagFor(map.f()).isCarry();
    var a = map.a();
    var b = readValFromHLMem(map, mmu);
    var val = a - b - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, b);
    return 8;
  },
  sbcImmediate: function sbcImmediate(_ref12) {
    var mmu = _ref12.mmu,
        map = _ref12.map;
    var isCarry = new _.CheckFlagFor(map.f()).isCarry();
    var a = map.a();
    var b = readImmediateValueAndIncrementPC(map, mmu);
    var val = a - b - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, b);
    return 8;
  },
  // LOGICAL
  and: function and(_ref13, regX) {
    var map = _ref13.map;
    var val = map.a() & regX();
    map.a(val);
    setLogicalAndFlag(map, val);
    return 4;
  },
  andMemHL: function andMemHL(_ref14) {
    var mmu = _ref14.mmu,
        map = _ref14.map;
    var val = map.a() & readValFromHLMem(map, mmu);
    map.a(val);
    setLogicalAndFlag(map, val);
    return 8;
  },
  andImmediate: function andImmediate(_ref15) {
    var mmu = _ref15.mmu,
        map = _ref15.map;
    var val = map.a() & readImmediateValueAndIncrementPC(map, mmu);
    map.a(val);
    setLogicalAndFlag(map, val);
    return 8;
  },
  or: function or(_ref16, regX) {
    var map = _ref16.map;
    var val = map.a() | regX();
    map.a(val);
    setLogicalOrFlag(map, val);
    return 4;
  },
  orMemHL: function orMemHL(_ref17) {
    var mmu = _ref17.mmu,
        map = _ref17.map;
    var val = map.a() | readValFromHLMem(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return 8;
  },
  orImmediate: function orImmediate(_ref18) {
    var mmu = _ref18.mmu,
        map = _ref18.map;
    var val = map.a() | readImmediateValueAndIncrementPC(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return 8;
  },
  xor: function xor(_ref19, regX) {
    var map = _ref19.map;
    var val = map.a() ^ regX();
    map.a(val);
    setLogicalOrFlag(map, val);
    return 4;
  },
  xorMemHL: function xorMemHL(_ref20) {
    var mmu = _ref20.mmu,
        map = _ref20.map;
    var val = map.a() ^ readValFromHLMem(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return 8;
  },
  xorImmediate: function xorImmediate(_ref21) {
    var mmu = _ref21.mmu,
        map = _ref21.map;
    var val = map.a() ^ readImmediateValueAndIncrementPC(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return 8;
  },
  // Compare reg to A, setting flags (CP reg, B)
  cp: function cp(_ref22, regX) {
    var map = _ref22.map;
    var a = map.a();
    var x = regX();
    var res = a - x;
    setFlagsOnCompare(map, res, a, x);
    return 4;
  },
  cpMemHL: function cpMemHL(_ref23) {
    var mmu = _ref23.mmu,
        map = _ref23.map;
    var a = map.a();
    var mem = readValFromHLMem(map, mmu);
    var res = a - mem;
    setFlagsOnCompare(map, res, a, mem);
    return 8;
  },
  cpImmediate: function cpImmediate(_ref24) {
    var mmu = _ref24.mmu,
        map = _ref24.map;
    var a = map.a();
    var imm = readImmediateValueAndIncrementPC(map, mmu);
    var res = a - imm;
    setFlagsOnCompare(map, res, a, imm);
    return 8;
  },
  inc: function inc(cpu, regX) {
    regX(regX() + 1);
    setFlagsOnInc(cpu.map, regX());
    return 4;
  },
  // Seems like the offical manual says to set H if there was a borrow to bit 3.
  dec: function dec(cpu, regX) {
    regX(regX() - 1);
    setFlagsOnDec(cpu.map, regX());
    return 4;
  },
  incMemHL: function incMemHL(_ref25) {
    var mmu = _ref25.mmu,
        map = _ref25.map;
    var memAddr = map.hl();
    var val = mmu.readByte(memAddr) + 1;
    mmu.writeByte(memAddr, val);
    setFlagsOnInc(map, val);
    return 12;
  },
  decMemHL: function decMemHL(_ref26) {
    var mmu = _ref26.mmu,
        map = _ref26.map;
    var memAddr = map.hl();
    var val = mmu.readByte(memAddr) - 1;
    mmu.writeByte(memAddr, val);
    setFlagsOnDec(map, val);
    return 12;
  }
};
exports.default = _default;
},{"../":20}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("../");

var _clockUtil = require("../clock-util");

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */

/* eslint no-param-reassign: 0 */
var getValFromRegOrMem = function getValFromRegOrMem(map, mmu, regAddr) {
  if (regAddr === _.NameMap.hl) {
    return mmu.readByte(map.hl());
  }

  return map[regAddr]();
};

var setValInRegOrMem = function setValInRegOrMem(map, mmu, regAddr, val) {
  if (regAddr === _.NameMap.hl) {
    mmu.writeByte(map.hl(), val);
  } else {
    map[regAddr](val);
  }
};

var getTimeExpenditure = function getTimeExpenditure(regAddr) {
  if (regAddr === _.NameMap.hl) {
    return 16;
  }

  return 8;
};

var _default = {
  bit: function bit(_ref, regAddr, bitNr) {
    var mmu = _ref.mmu,
        map = _ref.map;
    var val = getValFromRegOrMem(map, mmu, regAddr);
    var mask = 1 << bitNr;
    var flag = new _.CheckFlagFor(map.f()).notSubtraction().setHalfCarry(true).zero(val & mask).get();
    map.f(flag);

    if (regAddr === _.NameMap.hl) {
      return 12;
    }

    return 8;
  },
  set: function set(_ref2, regAddr, bitNr) {
    var mmu = _ref2.mmu,
        map = _ref2.map;
    var val = getValFromRegOrMem(map, mmu, regAddr);
    var mask = 1 << bitNr;
    val |= mask;
    setValInRegOrMem(map, mmu, regAddr, val);
    return getTimeExpenditure(regAddr);
  },
  res: function res(_ref3, regAddr, bitNr) {
    var mmu = _ref3.mmu,
        map = _ref3.map;
    var val = getValFromRegOrMem(map, mmu, regAddr);
    var mask = 1 << bitNr;
    val &= ~mask;
    setValInRegOrMem(map, mmu, regAddr, val);
    return getTimeExpenditure(regAddr);
  }
};
exports.default = _default;
},{"../":20,"../clock-util":17}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "alu8", {
  enumerable: true,
  get: function get() {
    return _alu8bit.default;
  }
});
Object.defineProperty(exports, "alu16", {
  enumerable: true,
  get: function get() {
    return _alu16bit.default;
  }
});
Object.defineProperty(exports, "load8", {
  enumerable: true,
  get: function get() {
    return _load8bit.default;
  }
});
Object.defineProperty(exports, "load16", {
  enumerable: true,
  get: function get() {
    return _load16bit.default;
  }
});
Object.defineProperty(exports, "misc", {
  enumerable: true,
  get: function get() {
    return _misc.default;
  }
});
Object.defineProperty(exports, "rotate", {
  enumerable: true,
  get: function get() {
    return _rotate.default;
  }
});
Object.defineProperty(exports, "shift", {
  enumerable: true,
  get: function get() {
    return _shift.default;
  }
});
Object.defineProperty(exports, "bit", {
  enumerable: true,
  get: function get() {
    return _bit.default;
  }
});
Object.defineProperty(exports, "jump", {
  enumerable: true,
  get: function get() {
    return _jump.default;
  }
});
Object.defineProperty(exports, "subroutine", {
  enumerable: true,
  get: function get() {
    return _subroutine.default;
  }
});

var _alu8bit = _interopRequireDefault(require("./alu-8bit"));

var _alu16bit = _interopRequireDefault(require("./alu-16bit"));

var _load8bit = _interopRequireDefault(require("./load-8bit"));

var _load16bit = _interopRequireDefault(require("./load-16bit"));

var _misc = _interopRequireDefault(require("./misc"));

var _rotate = _interopRequireDefault(require("./rotate"));

var _shift = _interopRequireDefault(require("./shift"));

var _bit = _interopRequireDefault(require("./bit"));

var _jump = _interopRequireDefault(require("./jump"));

var _subroutine = _interopRequireDefault(require("./subroutine"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./alu-16bit":21,"./alu-8bit":22,"./bit":23,"./jump":25,"./load-16bit":26,"./load-8bit":27,"./misc":28,"./rotate":29,"./shift":30,"./subroutine":31}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("..");

var _util = _interopRequireDefault(require("./../../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */

/* eslint no-param-reassign: 0 */
var doJump = function doJump(_ref) {
  var map = _ref.map,
      mmu = _ref.mmu;
  var pcAddr = map.pc();
  var newPc = mmu.readWord(pcAddr);
  map.pc(newPc);
};

var addImmediateToPc = function addImmediateToPc(_ref2) {
  var map = _ref2.map,
      mmu = _ref2.mmu;
  var pcAddr = map.pc();

  var signedByte = _util.default.convertSignedByte(mmu.readByte(pcAddr));

  map.pc(pcAddr + signedByte + 1 & 0xFFFF);
};

var _default = {
  jp: function jp(cpu) {
    doJump(cpu);
    return 16;
  },
  jpIfZ: function jpIfZ(_ref3, condition) {
    var mmu = _ref3.mmu,
        map = _ref3.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isZero() === condition) {
      doJump({
        map: map,
        mmu: mmu
      });
      return 16;
    }

    map.pc(map.pc() + 2);
    return 12;
  },
  jpIfC: function jpIfC(_ref4, condition) {
    var mmu = _ref4.mmu,
        map = _ref4.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isCarry() === condition) {
      doJump({
        map: map,
        mmu: mmu
      });
      return 16;
    }

    map.pc(map.pc() + 2);
    return 12;
  },
  jpHL: function jpHL(_ref5) {
    var map = _ref5.map;
    map.pc(map.hl());
    return 4;
  },
  jr: function jr(cpu) {
    addImmediateToPc(cpu);
    return 12;
  },
  jrIfZ: function jrIfZ(_ref6, condition) {
    var mmu = _ref6.mmu,
        map = _ref6.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isZero() === condition) {
      addImmediateToPc({
        map: map,
        mmu: mmu
      });
      return 12;
    }

    map.pc(map.pc() + 1);
    return 8;
  },
  jrIfC: function jrIfC(_ref7, condition) {
    var mmu = _ref7.mmu,
        map = _ref7.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isCarry() === condition) {
      addImmediateToPc({
        map: map,
        mmu: mmu
      });
      return 12;
    }

    map.pc(map.pc() + 1);
    return 8;
  }
};
exports.default = _default;
},{"..":20,"./../../util":36}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _2 = require("../");

var _util = _interopRequireDefault(require("./../../util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */
var _default = {
  ldImmediateIntoReg: function ldImmediateIntoReg(_ref, regX) {
    var mmu = _ref.mmu,
        map = _ref.map;
    var pc = map.pc();
    var imAddr = pc;
    map.pc(pc + 2);
    var imVal = mmu.readWord(imAddr);
    regX(imVal);
    return 12;
  },
  ldRegToReg: function ldRegToReg(_, fromReg, toReg) {
    var val = fromReg();
    toReg(val);
    return 8;
  },
  ldHLFromSPPlusImmediate: function ldHLFromSPPlusImmediate(_ref2) {
    var mmu = _ref2.mmu,
        map = _ref2.map;
    var spVal = map.sp();
    var pc = map.pc();

    var imSignedByte = _util.default.convertSignedByte(mmu.readByte(pc));

    map.pc(pc + 1);
    var newVal = spVal + imSignedByte;
    map.hl(newVal);
    var isC = (spVal & 0xFF) + (imSignedByte & 0xFF) > 0xFF;
    var flag = new _2.CheckFlagFor().setC(isC).setH(newVal, spVal, imSignedByte).get();
    map.f(flag);
    return 12;
  },
  ldSPIntoImmediate: function ldSPIntoImmediate(_ref3) {
    var mmu = _ref3.mmu,
        map = _ref3.map;
    var spVal = map.sp();
    var pc = map.pc();
    var imAddr = pc;
    var imVal = mmu.readWord(imAddr);
    map.pc(pc + 2);
    mmu.writeWord(imVal, spVal);
    return 20;
  },
  // Push register pair to the stack (PUSH HL)
  push: function push(_ref4, regX) {
    var mmu = _ref4.mmu,
        map = _ref4.map;
    var sp = map.sp();
    map.sp(sp - 2);
    mmu.writeWord(sp - 2, regX());
    return 16;
  },
  // Pop register pair off the stack (POP HL)
  pop: function pop(_ref5, regX) {
    var mmu = _ref5.mmu,
        map = _ref5.map;
    var sp = map.sp();
    var regVal = mmu.readWord(sp);
    map.sp(sp + 2);
    regX(regVal);
    return 12;
  }
};
exports.default = _default;
},{"../":20,"./../../util":36}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _2 = require("./");

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */
// Each operation is provided with a snapshot state of the processor
// Each operation return a new object containing only state that has been modified.
// Makes instructions modular and easier to test. Only need to test the state.
// Implementation based on explanations given by GBCPUman
// Mention of immediate values treated as using program counter as value
var ldMemHL = function ldMemHL(_ref, regX) {
  var mmu = _ref.mmu,
      map = _ref.map;
  var hl = map.hl();
  var val = mmu.readByte(hl);
  regX(val);
  return 8;
};

var ldMemRegA = function ldMemRegA(_ref2, regWithMem) {
  var mmu = _ref2.mmu,
      map = _ref2.map;
  var memAddr = regWithMem();
  var val = map.a();
  mmu.writeByte(memAddr, val);
  return 8;
};

var _default = {
  ld: function ld(_, regX, regY) {
    regX(regY());
    return 4;
  },
  ldMemHLReg: function ldMemHLReg(_ref3, regX) {
    var mmu = _ref3.mmu,
        map = _ref3.map;
    var val = regX();
    var memAddr = map.hl();
    mmu.writeByte(memAddr, val);
    return 8;
  },
  ldMemHLImmediate: function ldMemHLImmediate(_ref4) {
    var mmu = _ref4.mmu,
        map = _ref4.map;
    var pc = map.pc();
    var val = mmu.readByte(pc);
    map.pc(pc + 1);
    var memAddr = map.hl();
    mmu.writeByte(memAddr, val);
    return 12;
  },
  ldImmediate: function ldImmediate(_ref5, regX) {
    var mmu = _ref5.mmu,
        map = _ref5.map;
    var pc = map.pc();
    var imAddr = pc;
    map.pc(pc + 1);
    var imVal = mmu.readByte(imAddr);
    regX(imVal);
    return 8;
  },
  // Put byte at memory location found in 16 bit registers into A
  ldRegAMem: function ldRegAMem(_ref6, regX) {
    var mmu = _ref6.mmu,
        map = _ref6.map;
    var val = mmu.readByte(regX());
    map.a(val);
    return 8;
  },
  ldRegARegCPlusConst: function ldRegARegCPlusConst(_ref7) {
    var mmu = _ref7.mmu,
        map = _ref7.map;
    var val = mmu.readByte(0xFF00 + map.c());
    map.a(val);
    return 8;
  },
  ldRegCPlusConstRegA: function ldRegCPlusConstRegA(_ref8) {
    var mmu = _ref8.mmu,
        map = _ref8.map;
    var addr = 0xFF00 + map.c();
    var val = map.a();
    mmu.writeByte(addr, val);
    return 8;
  },
  ldMemHL: ldMemHL,
  ldMemRegA: ldMemRegA,
  lddRegAMemHL: function lddRegAMemHL(cpu) {
    ldMemHL(cpu, cpu.map.a);

    _2.alu16.dec(cpu, cpu.map.hl);

    return 8;
  },
  lddMemHLRegA: function lddMemHLRegA(cpu) {
    ldMemRegA(cpu, cpu.map.hl);

    _2.alu16.dec(cpu, cpu.map.hl);

    return 8;
  },
  ldiRegAMemHL: function ldiRegAMemHL(cpu) {
    ldMemHL(cpu, cpu.map.a);

    _2.alu16.inc(cpu, cpu.map.hl);

    return 8;
  },
  ldiMemHLRegA: function ldiMemHLRegA(cpu) {
    ldMemRegA(cpu, cpu.map.hl);

    _2.alu16.inc(cpu, cpu.map.hl);

    return 8;
  },
  // Read a byte from absolute location into A (LD A, addr)
  ldRegAImmediateWord: function ldRegAImmediateWord(_ref9) {
    var mmu = _ref9.mmu,
        map = _ref9.map;
    var pc = map.pc();
    var addr = mmu.readWord(pc);
    map.pc(pc + 2);
    var val = mmu.readByte(addr);
    map.a(val);
    return 16;
  },
  ldAImmediate: function ldAImmediate(_ref10) {
    var mmu = _ref10.mmu,
        map = _ref10.map;
    var pc = map.pc();
    var val = mmu.readByte(pc);
    map.pc(pc + 1);
    map.a(val);
    return 8;
  },
  ldImmediateA: function ldImmediateA(_ref11) {
    var mmu = _ref11.mmu,
        map = _ref11.map;
    var valInA = map.a();
    var pc = map.pc();
    var addr = mmu.readWord(pc);
    map.pc(pc + 2);
    mmu.writeByte(addr, valInA);
    return 16;
  },
  ldhMemFF00PlusImmediateRegA: function ldhMemFF00PlusImmediateRegA(_ref12) {
    var mmu = _ref12.mmu,
        map = _ref12.map;
    var valInA = map.a();
    var pc = map.pc();
    var offset = mmu.readByte(pc);
    map.pc(pc + 1);
    mmu.writeByte(0xFF00 + offset, valInA);
    return 12;
  },
  ldhRegAMemFF00PlusImmediate: function ldhRegAMemFF00PlusImmediate(_ref13) {
    var mmu = _ref13.mmu,
        map = _ref13.map;
    var pc = map.pc();
    var offset = mmu.readByte(pc);
    map.pc(pc + 1);
    var value = mmu.readByte(0xFF00 + offset);
    map.a(value);
    return 12;
  }
};
exports.default = _default;
},{"./":24}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("../");

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */

/* eslint no-param-reassign: 0 */
var swapNibbles = function swapNibbles(val) {
  var newfirstNibble = val << 4;
  var newLastNibble = val >>> 4;
  return newfirstNibble + newLastNibble;
};

var _default = {
  nop: function nop() {
    return 4;
  },
  halt: function halt(_ref) {
    var actions = _ref.actions,
        interrupt = _ref.interrupt;
    actions.halt = true;
    if (!interrupt.enabled && interrupt.anyTriggered()) actions.halt = false;
    return 4;
  },
  swap: function swap(_ref2, regX) {
    var map = _ref2.map;
    var val = regX();
    var newVal = swapNibbles(val);
    regX(newVal);
    var newFlag = new _.CheckFlagFor().zero(newVal).get();
    map.f(newFlag);
    return 8;
  },
  swapMemHL: function swapMemHL(_ref3) {
    var mmu = _ref3.mmu,
        map = _ref3.map;
    var memAddr = map.hl();
    var val = mmu.readByte(memAddr);
    var newVal = swapNibbles(val);
    mmu.writeByte(memAddr, newVal);
    var newFlag = new _.CheckFlagFor().zero(newVal).get();
    map.f(newFlag);
    return 16;
  },
  // ensure content in A is in packed Binary coded decimal encoding
  // Intended to be run immediately after an a  dditon or subtraction operations,
  // where the values were BCD encoded.
  daa: function daa(_ref4) {
    var map = _ref4.map;
    var flag = new _.CheckFlagFor(map.f());
    var val = map.a();

    if (flag.isSubtraction()) {
      if (flag.isHalfCarry()) {
        val = val - 6 & 0xff;
      }

      if (flag.isCarry()) {
        val = val - 0x60 & 0xff;
      }
    } else {
      var isLowerNibbleOverNine = (val & 0xF) > 9;

      if (flag.isHalfCarry() || isLowerNibbleOverNine) {
        val += 0x06;
      }

      var isUpperNibbleOverNine = val > 0x9F;

      if (flag.isCarry() || isUpperNibbleOverNine) {
        val += 0x60;
      }
    }

    flag.setHalfCarry(false);

    if (val > 0xff) {
      flag.setCarry(true);
    }

    val &= 0xff;
    flag.setZero(val === 0);
    map.f(flag.flag);
    map.a(val);
    return 4;
  },
  cpl: function cpl(_ref5) {
    var map = _ref5.map;
    var val = map.a();
    val ^= 0xFF;
    map.a(val);
    var flag = new _.CheckFlagFor(map.f()).setHalfCarry(true).subtraction().get();
    map.f(flag);
    return 4;
  },
  ccf: function ccf(_ref6) {
    var map = _ref6.map;
    var flagChecker = new _.CheckFlagFor(map.f());
    var isCarry = flagChecker.isCarry();
    var flag = flagChecker.setHalfCarry(false).notSubtraction().setC(!isCarry).get();
    map.f(flag);
    return 4;
  },
  scf: function scf(_ref7) {
    var map = _ref7.map;
    var flagChecker = new _.CheckFlagFor(map.f());
    var flag = flagChecker.setHalfCarry(false).notSubtraction().setC(true).get();
    map.f(flag);
    return 4;
  },
  stop: function stop(_ref8) {
    var actions = _ref8.actions;
    actions.stop = true;
    return 4;
  },
  di: function di(_ref9) {
    var interrupt = _ref9.interrupt;
    interrupt.enabled = false;
    return 4;
  },
  ei: function ei(_ref10) {
    var interrupt = _ref10.interrupt;
    interrupt.enabled = true;
    return 4;
  }
};
exports.default = _default;
},{"../":20}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("../");

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */

/* eslint no-param-reassign: 0 */
var rotateLeftWithMsbAround = function rotateLeftWithMsbAround(val, map, checkZero) {
  var msb = (val & 128) === 128;
  var newVal = (val << 1) + msb & 0xFF;
  var newFlag = new _.CheckFlagFor().setZero(newVal === 0 && checkZero).setC(msb).get();
  map.f(newFlag);
  return newVal;
};

var rotateLeftWithCarryAround = function rotateLeftWithCarryAround(val, map, checkZero) {
  var isCarry = new _.CheckFlagFor(map.f()).isCarry();
  var msb = (val & 128) === 128;
  var newVal = (val << 1) + isCarry & 0xFF;
  var newFlag = new _.CheckFlagFor().setZero(newVal === 0 && checkZero).setC(msb).get();
  map.f(newFlag);
  return newVal;
};

var rotateRightWithLsbAround = function rotateRightWithLsbAround(val, map, checkZero) {
  var lsb = val & 1;
  var isLsb = lsb === 1;
  var newVal = (val >>> 1) + (lsb << 7) & 0xFF;
  var newFlag = new _.CheckFlagFor().setZero(newVal === 0 && checkZero).setC(isLsb).get();
  map.f(newFlag);
  return newVal;
};

var rotateRightWithCarryAround = function rotateRightWithCarryAround(val, map, checkZero) {
  var isCarry = new _.CheckFlagFor(map.f()).isCarry();
  var lsb = val & 1;
  var isLsb = lsb === 1;
  var newVal = (val >>> 1) + (isCarry << 7) & 0xFF;
  var newFlag = new _.CheckFlagFor().setZero(newVal === 0 && checkZero).setC(isLsb).get();
  map.f(newFlag);
  return newVal;
};

var _default = {
  rcla: function rcla(_ref) {
    var map = _ref.map;
    var val = map.a();
    var newVal = rotateLeftWithMsbAround(val, map, false);
    map.a(newVal);
    return 4;
  },
  rla: function rla(_ref2) {
    var map = _ref2.map;
    var val = map.a();
    var newVal = rotateLeftWithCarryAround(val, map, false);
    map.a(newVal);
    return 4;
  },
  rrca: function rrca(_ref3) {
    var map = _ref3.map;
    var val = map.a();
    var newVal = rotateRightWithLsbAround(val, map, false);
    map.a(newVal);
    return 4;
  },
  rra: function rra(_ref4) {
    var map = _ref4.map;
    var val = map.a();
    var newVal = rotateRightWithCarryAround(val, map, false);
    map.a(newVal);
    return 4;
  },
  rlc: function rlc(_ref5, regX) {
    var map = _ref5.map;
    var val = regX();
    var newVal = rotateLeftWithMsbAround(val, map, true);
    regX(newVal);
    return 8;
  },
  rlcMemHL: function rlcMemHL(_ref6) {
    var mmu = _ref6.mmu,
        map = _ref6.map;
    var addr = map.hl();
    var val = mmu.readByte(addr);
    var newVal = rotateLeftWithMsbAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },
  rl: function rl(_ref7, regX) {
    var map = _ref7.map;
    var val = regX();
    var newVal = rotateLeftWithCarryAround(val, map, true);
    regX(newVal);
    return 8;
  },
  rlMemHL: function rlMemHL(_ref8) {
    var mmu = _ref8.mmu,
        map = _ref8.map;
    var addr = map.hl();
    var val = mmu.readByte(addr);
    var newVal = rotateLeftWithCarryAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },
  rrc: function rrc(_ref9, regX) {
    var map = _ref9.map;
    var val = regX();
    var newVal = rotateRightWithLsbAround(val, map, true);
    regX(newVal);
    return 8;
  },
  rrcMemHL: function rrcMemHL(_ref10) {
    var mmu = _ref10.mmu,
        map = _ref10.map;
    var addr = map.hl();
    var val = mmu.readByte(addr);
    var newVal = rotateRightWithLsbAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },
  rr: function rr(_ref11, regX) {
    var map = _ref11.map;
    var val = regX();
    var newVal = rotateRightWithCarryAround(val, map, true);
    regX(newVal);
    return 8;
  },
  rrMemHL: function rrMemHL(_ref12) {
    var mmu = _ref12.mmu,
        map = _ref12.map;
    var addr = map.hl();
    var val = mmu.readByte(addr);
    var newVal = rotateRightWithCarryAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  }
};
exports.default = _default;
},{"../":20}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("../");

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */

/* eslint no-param-reassign: 0 */
var shiftLeft = function shiftLeft(val, map) {
  var msb = (val & 128) === 128;
  var newVal = val << 1;
  var newFlag = new _.CheckFlagFor().zero(newVal).setC(msb).get();
  map.f(newFlag);
  return newVal;
};

var shiftRight = function shiftRight(val, map, keepMsb) {
  var lsb = val & 1;
  var isLsb = lsb === 1;
  var newVal = val >>> 1;

  if (keepMsb) {
    var msbMask = val & 128;
    newVal |= msbMask;
  }

  var newFlag = new _.CheckFlagFor().zero(newVal).setC(isLsb).get();
  map.f(newFlag);
  return newVal;
};

var _default = {
  sla: function sla(_ref, regX) {
    var map = _ref.map;
    var val = regX();
    var newVal = shiftLeft(val, map);
    regX(newVal);
    return 8;
  },
  slaMemHL: function slaMemHL(_ref2) {
    var mmu = _ref2.mmu,
        map = _ref2.map;
    var addr = map.hl();
    var val = mmu.readByte(addr);
    var newVal = shiftLeft(val, map);
    mmu.writeByte(addr, newVal);
    return 16;
  },
  sra: function sra(_ref3, regX) {
    var map = _ref3.map;
    var val = regX();
    var newVal = shiftRight(val, map, true);
    regX(newVal);
    return 8;
  },
  sraMemHL: function sraMemHL(_ref4) {
    var mmu = _ref4.mmu,
        map = _ref4.map;
    var addr = map.hl();
    var val = mmu.readByte(addr);
    var newVal = shiftRight(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },
  srl: function srl(_ref5, regX) {
    var map = _ref5.map;
    var val = regX();
    var newVal = shiftRight(val, map);
    regX(newVal);
    return 8;
  },
  srlMemHL: function srlMemHL(_ref6) {
    var mmu = _ref6.mmu,
        map = _ref6.map;
    var addr = map.hl();
    var val = mmu.readByte(addr);
    var newVal = shiftRight(val, map);
    mmu.writeByte(addr, newVal);
    return 16;
  }
};
exports.default = _default;
},{"../":20}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ = require("..");

var _2 = require("./");

// Consists of Call, restart and return instructions which modify stack.

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */

/* eslint no-param-reassign: 0 */
var addToStack = function addToStack(map, mmu, val) {
  var newSp = map.sp() - 2;
  map.sp(newSp);
  mmu.writeWord(newSp, val);
};

var popFromStack = function popFromStack(map, mmu) {
  var regVal = mmu.readWord(map.sp());
  map.sp(map.sp() + 2);
  return regVal;
};

var doCall = function doCall(map, mmu) {
  var nextInstruction = map.pc() + 2 & 0xFFFF;
  addToStack(map, mmu, nextInstruction);

  _2.jump.jp({
    mmu: mmu,
    map: map
  });
};

var _default = {
  call: function call(_ref) {
    var mmu = _ref.mmu,
        map = _ref.map;
    doCall(map, mmu);
    return 24;
  },
  callIfZ: function callIfZ(_ref2, condition) {
    var mmu = _ref2.mmu,
        map = _ref2.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isZero() === condition) {
      doCall(map, mmu);
      return 24;
    }

    map.pc(map.pc() + 2);
    return 12;
  },
  callIfC: function callIfC(_ref3, condition) {
    var mmu = _ref3.mmu,
        map = _ref3.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isCarry() === condition) {
      doCall(map, mmu);
      return 24;
    }

    map.pc(map.pc() + 2);
    return 12;
  },
  rst: function rst(_ref4, addr) {
    var mmu = _ref4.mmu,
        map = _ref4.map;
    addToStack(map, mmu, map.pc());
    map.pc(addr);
    return 16;
  },
  ret: function ret(_ref5) {
    var mmu = _ref5.mmu,
        map = _ref5.map;
    var val = popFromStack(map, mmu);
    map.pc(val);
    return 16;
  },
  retIfZ: function retIfZ(_ref6, condition) {
    var mmu = _ref6.mmu,
        map = _ref6.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isZero() === condition) {
      var val = popFromStack(map, mmu);
      map.pc(val);
      return 20;
    }

    return 8;
  },
  retIfC: function retIfC(_ref7, condition) {
    var mmu = _ref7.mmu,
        map = _ref7.map;
    var flag = new _.CheckFlagFor(map.f());

    if (flag.isCarry() === condition) {
      var val = popFromStack(map, mmu);
      map.pc(val);
      return 20;
    }

    return 8;
  },
  reti: function reti(_ref8) {
    var mmu = _ref8.mmu,
        map = _ref8.map,
        interrupt = _ref8.interrupt;
    var val = popFromStack(map, mmu);
    map.pc(val);
    interrupt.enabled = true;
    return 16;
  }
};
exports.default = _default;
},{"..":20,"./":24}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var Interrupts =
/*#__PURE__*/
function () {
  function Interrupts() {
    _classCallCheck(this, Interrupts);

    this._ie = 0;
    this._if = 0;
    this.enabled = false;
  }

  _createClass(Interrupts, [{
    key: "getInterruptEnabled",
    value: function getInterruptEnabled() {
      return this._ie;
    }
  }, {
    key: "getInterruptFlags",
    value: function getInterruptFlags() {
      return this._if;
    }
  }, {
    key: "anyTriggered",
    value: function anyTriggered() {
      return (this._ie & this._if) !== 0;
    }
  }, {
    key: "checkVblankTriggered",
    value: function checkVblankTriggered() {
      var isVblank = this._ie & this._if & 1;
      if (isVblank) this._if &= 254;
      return isVblank;
    }
  }, {
    key: "checkLcdStatTriggered",
    value: function checkLcdStatTriggered() {
      var lcdStat = this._ie & this._if & 2;
      if (lcdStat) this._if &= 253;
      return lcdStat;
    }
  }, {
    key: "checkTimerTriggered",
    value: function checkTimerTriggered() {
      var isTimer = this._ie & this._if & 4;
      if (isTimer) this._if &= 251;
      return isTimer;
    }
  }, {
    key: "triggerTimer",
    value: function triggerTimer() {
      this._if |= 4;
    }
  }, {
    key: "triggerStat",
    value: function triggerStat() {
      this._if |= 2;
    }
  }, {
    key: "triggerVblank",
    value: function triggerVblank() {
      this._if |= 1;
    }
  }, {
    key: "checkSerialTriggered",
    value: function checkSerialTriggered() {
      var isSerial = this._ie & this._if & 8;
      if (isSerial) this._if &= 247;
      return isSerial;
    }
  }, {
    key: "checkJoypadTriggered",
    value: function checkJoypadTriggered() {
      var isJoypad = this._ie & this._if & 16;
      if (isJoypad) this._if &= 239;
      return isJoypad;
    }
  }]);

  return Interrupts;
}();

exports.default = Interrupts;
},{}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _2 = require("./");

/* eslint no-bitwise: 0 */

/* eslint no-unused-vars: 0 */

/* eslint newline-per-chained-call: 0 */
var opcodes = {
  0xCB: function _() {
    throw Error('An opcode modifier should not be called');
  },
  // -------- 8 bit load --------
  // 1. LD nn n
  0x06: function _(cpu) {
    return _2.Z80.load8.ldImmediate(cpu, cpu.map.b);
  },
  0x0E: function _(cpu) {
    return _2.Z80.load8.ldImmediate(cpu, cpu.map.c);
  },
  0x16: function _(cpu) {
    return _2.Z80.load8.ldImmediate(cpu, cpu.map.d);
  },
  0x1E: function _(cpu) {
    return _2.Z80.load8.ldImmediate(cpu, cpu.map.e);
  },
  0x26: function _(cpu) {
    return _2.Z80.load8.ldImmediate(cpu, cpu.map.h);
  },
  0x2E: function _(cpu) {
    return _2.Z80.load8.ldImmediate(cpu, cpu.map.l);
  },
  // 2. LD r1 r2
  0x7F: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.a, cpu.map.a);
  },
  0x78: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.a, cpu.map.b);
  },
  0x79: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.a, cpu.map.c);
  },
  0x7A: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.a, cpu.map.d);
  },
  0x7B: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.a, cpu.map.e);
  },
  0x7C: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.a, cpu.map.h);
  },
  0x7D: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.a, cpu.map.l);
  },
  0x40: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.b, cpu.map.b);
  },
  0x41: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.b, cpu.map.c);
  },
  0x42: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.b, cpu.map.d);
  },
  0x43: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.b, cpu.map.e);
  },
  0x44: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.b, cpu.map.h);
  },
  0x45: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.b, cpu.map.l);
  },
  0x46: function _(cpu) {
    return _2.Z80.load8.ldMemHL(cpu, cpu.map.b);
  },
  0x48: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.c, cpu.map.b);
  },
  0x49: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.c, cpu.map.c);
  },
  0x4A: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.c, cpu.map.d);
  },
  0x4B: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.c, cpu.map.e);
  },
  0x4C: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.c, cpu.map.h);
  },
  0x4D: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.c, cpu.map.l);
  },
  0x4E: function _(cpu) {
    return _2.Z80.load8.ldMemHL(cpu, cpu.map.c);
  },
  0x50: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.d, cpu.map.b);
  },
  0x51: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.d, cpu.map.c);
  },
  0x52: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.d, cpu.map.d);
  },
  0x53: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.d, cpu.map.e);
  },
  0x54: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.d, cpu.map.h);
  },
  0x55: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.d, cpu.map.l);
  },
  0x56: function _(cpu) {
    return _2.Z80.load8.ldMemHL(cpu, cpu.map.d);
  },
  0x58: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.e, cpu.map.b);
  },
  0x59: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.e, cpu.map.c);
  },
  0x5A: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.e, cpu.map.d);
  },
  0x5B: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.e, cpu.map.e);
  },
  0x5C: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.e, cpu.map.h);
  },
  0x5D: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.e, cpu.map.l);
  },
  0x5E: function _(cpu) {
    return _2.Z80.load8.ldMemHL(cpu, cpu.map.e);
  },
  0x60: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.h, cpu.map.b);
  },
  0x61: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.h, cpu.map.c);
  },
  0x62: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.h, cpu.map.d);
  },
  0x63: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.h, cpu.map.e);
  },
  0x64: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.h, cpu.map.h);
  },
  0x65: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.h, cpu.map.l);
  },
  0x66: function _(cpu) {
    return _2.Z80.load8.ldMemHL(cpu, cpu.map.h);
  },
  0x68: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.l, cpu.map.b);
  },
  0x69: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.l, cpu.map.c);
  },
  0x6A: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.l, cpu.map.d);
  },
  0x6B: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.l, cpu.map.e);
  },
  0x6C: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.l, cpu.map.h);
  },
  0x6D: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.l, cpu.map.l);
  },
  0x6E: function _(cpu) {
    return _2.Z80.load8.ldMemHL(cpu, cpu.map.l);
  },
  0x70: function _(cpu) {
    return _2.Z80.load8.ldMemHLReg(cpu, cpu.map.b);
  },
  0x71: function _(cpu) {
    return _2.Z80.load8.ldMemHLReg(cpu, cpu.map.c);
  },
  0x72: function _(cpu) {
    return _2.Z80.load8.ldMemHLReg(cpu, cpu.map.d);
  },
  0x73: function _(cpu) {
    return _2.Z80.load8.ldMemHLReg(cpu, cpu.map.e);
  },
  0x74: function _(cpu) {
    return _2.Z80.load8.ldMemHLReg(cpu, cpu.map.h);
  },
  0x75: function _(cpu) {
    return _2.Z80.load8.ldMemHLReg(cpu, cpu.map.l);
  },
  0x36: function _(cpu) {
    return _2.Z80.load8.ldMemHLImmediate(cpu);
  },
  // 3. LD A, n
  0x0A: function _(cpu) {
    return _2.Z80.load8.ldRegAMem(cpu, cpu.map.bc);
  },
  0x1A: function _(cpu) {
    return _2.Z80.load8.ldRegAMem(cpu, cpu.map.de);
  },
  0x7E: function _(cpu) {
    return _2.Z80.load8.ldRegAMem(cpu, cpu.map.hl);
  },
  0xFA: function _(cpu) {
    return _2.Z80.load8.ldRegAImmediateWord(cpu);
  },
  0x3E: function _(cpu) {
    return _2.Z80.load8.ldAImmediate(cpu);
  },
  // 4. LD n, A
  0x47: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.b, cpu.map.a);
  },
  0x4F: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.c, cpu.map.a);
  },
  0x57: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.d, cpu.map.a);
  },
  0x5F: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.e, cpu.map.a);
  },
  0x67: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.h, cpu.map.a);
  },
  0x6F: function _(cpu) {
    return _2.Z80.load8.ld(cpu, cpu.map.l, cpu.map.a);
  },
  0x02: function _(cpu) {
    return _2.Z80.load8.ldMemRegA(cpu, cpu.map.bc);
  },
  0x12: function _(cpu) {
    return _2.Z80.load8.ldMemRegA(cpu, cpu.map.de);
  },
  0x77: function _(cpu) {
    return _2.Z80.load8.ldMemRegA(cpu, cpu.map.hl);
  },
  0xEA: function _(cpu) {
    return _2.Z80.load8.ldImmediateA(cpu);
  },
  // 5/6. LD A, (C) value at address FF00 + reg c into a and opposite
  0xF2: function _(cpu) {
    return _2.Z80.load8.ldRegARegCPlusConst(cpu);
  },
  0xE2: function _(cpu) {
    return _2.Z80.load8.ldRegCPlusConstRegA(cpu);
  },
  // 7/8/9 LDD A, (HL)
  0x3A: function _(cpu) {
    return _2.Z80.load8.lddRegAMemHL(cpu);
  },
  // 10/11/12 LDD (HL), A
  0x32: function _(cpu) {
    return _2.Z80.load8.lddMemHLRegA(cpu);
  },
  // 13/13/15 LDI A, (HL)
  0x2A: function _(cpu) {
    return _2.Z80.load8.ldiRegAMemHL(cpu);
  },
  // 16/17/18 LDI (HL), A
  0x22: function _(cpu) {
    return _2.Z80.load8.ldiMemHLRegA(cpu);
  },
  // 19 LDH (n), A
  0xE0: function _(cpu) {
    return _2.Z80.load8.ldhMemFF00PlusImmediateRegA(cpu);
  },
  // 20 LDH A, (n)
  0xF0: function _(cpu) {
    return _2.Z80.load8.ldhRegAMemFF00PlusImmediate(cpu);
  },
  // -------- 16 bit load --------
  // 1. LD n,nn
  0x01: function _(cpu) {
    return _2.Z80.load16.ldImmediateIntoReg(cpu, cpu.map.bc);
  },
  0x11: function _(cpu) {
    return _2.Z80.load16.ldImmediateIntoReg(cpu, cpu.map.de);
  },
  0x21: function _(cpu) {
    return _2.Z80.load16.ldImmediateIntoReg(cpu, cpu.map.hl);
  },
  0x31: function _(cpu) {
    return _2.Z80.load16.ldImmediateIntoReg(cpu, cpu.map.sp);
  },
  // 2. LD SP,HL
  0xF9: function _(cpu) {
    return _2.Z80.load16.ldRegToReg(cpu, cpu.map.hl, cpu.map.sp);
  },
  // 3/4. LD HL,SP+n
  0xF8: function _(cpu) {
    return _2.Z80.load16.ldHLFromSPPlusImmediate(cpu);
  },
  // 5. LD (nn), SP
  0x08: function _(cpu) {
    return _2.Z80.load16.ldSPIntoImmediate(cpu);
  },
  // 6. Push nn
  0xF5: function _(cpu) {
    return _2.Z80.load16.push(cpu, cpu.map.af);
  },
  0xC5: function _(cpu) {
    return _2.Z80.load16.push(cpu, cpu.map.bc);
  },
  0xD5: function _(cpu) {
    return _2.Z80.load16.push(cpu, cpu.map.de);
  },
  0xE5: function _(cpu) {
    return _2.Z80.load16.push(cpu, cpu.map.hl);
  },
  // 7. Popnn
  0xF1: function _(cpu) {
    return _2.Z80.load16.pop(cpu, cpu.map.af);
  },
  0xC1: function _(cpu) {
    return _2.Z80.load16.pop(cpu, cpu.map.bc);
  },
  0xD1: function _(cpu) {
    return _2.Z80.load16.pop(cpu, cpu.map.de);
  },
  0xE1: function _(cpu) {
    return _2.Z80.load16.pop(cpu, cpu.map.hl);
  },
  // -------- 8 bit ALU --------
  // 1. Add A, n
  0x87: function _(cpu) {
    return _2.Z80.alu8.add(cpu, cpu.map.a);
  },
  0x80: function _(cpu) {
    return _2.Z80.alu8.add(cpu, cpu.map.b);
  },
  0x81: function _(cpu) {
    return _2.Z80.alu8.add(cpu, cpu.map.c);
  },
  0x82: function _(cpu) {
    return _2.Z80.alu8.add(cpu, cpu.map.d);
  },
  0x83: function _(cpu) {
    return _2.Z80.alu8.add(cpu, cpu.map.e);
  },
  0x84: function _(cpu) {
    return _2.Z80.alu8.add(cpu, cpu.map.h);
  },
  0x85: function _(cpu) {
    return _2.Z80.alu8.add(cpu, cpu.map.l);
  },
  0x86: function _(cpu) {
    return _2.Z80.alu8.addMemHL(cpu);
  },
  0xC6: function _(cpu) {
    return _2.Z80.alu8.addImmediate(cpu);
  },
  // 2. ADC A,n
  0x8F: function _(cpu) {
    return _2.Z80.alu8.adcPlusCarry(cpu, cpu.map.a);
  },
  0x88: function _(cpu) {
    return _2.Z80.alu8.adcPlusCarry(cpu, cpu.map.b);
  },
  0x89: function _(cpu) {
    return _2.Z80.alu8.adcPlusCarry(cpu, cpu.map.c);
  },
  0x8A: function _(cpu) {
    return _2.Z80.alu8.adcPlusCarry(cpu, cpu.map.d);
  },
  0x8B: function _(cpu) {
    return _2.Z80.alu8.adcPlusCarry(cpu, cpu.map.e);
  },
  0x8C: function _(cpu) {
    return _2.Z80.alu8.adcPlusCarry(cpu, cpu.map.h);
  },
  0x8D: function _(cpu) {
    return _2.Z80.alu8.adcPlusCarry(cpu, cpu.map.l);
  },
  0x8E: function _(cpu) {
    return _2.Z80.alu8.adcMemHLPlusCarry(cpu);
  },
  0xCE: function _(cpu) {
    return _2.Z80.alu8.adcImmediatePlusCarry(cpu);
  },
  // 3. SUB n
  0x97: function _(cpu) {
    return _2.Z80.alu8.sub(cpu, cpu.map.a);
  },
  0x90: function _(cpu) {
    return _2.Z80.alu8.sub(cpu, cpu.map.b);
  },
  0x91: function _(cpu) {
    return _2.Z80.alu8.sub(cpu, cpu.map.c);
  },
  0x92: function _(cpu) {
    return _2.Z80.alu8.sub(cpu, cpu.map.d);
  },
  0x93: function _(cpu) {
    return _2.Z80.alu8.sub(cpu, cpu.map.e);
  },
  0x94: function _(cpu) {
    return _2.Z80.alu8.sub(cpu, cpu.map.h);
  },
  0x95: function _(cpu) {
    return _2.Z80.alu8.sub(cpu, cpu.map.l);
  },
  0x96: function _(cpu) {
    return _2.Z80.alu8.subMemHL(cpu);
  },
  0xD6: function _(cpu) {
    return _2.Z80.alu8.subImmediate(cpu);
  },
  // 4. SBC A,n
  0x9F: function _(cpu) {
    return _2.Z80.alu8.sbc(cpu, cpu.map.a);
  },
  0x98: function _(cpu) {
    return _2.Z80.alu8.sbc(cpu, cpu.map.b);
  },
  0x99: function _(cpu) {
    return _2.Z80.alu8.sbc(cpu, cpu.map.c);
  },
  0x9A: function _(cpu) {
    return _2.Z80.alu8.sbc(cpu, cpu.map.d);
  },
  0x9B: function _(cpu) {
    return _2.Z80.alu8.sbc(cpu, cpu.map.e);
  },
  0x9C: function _(cpu) {
    return _2.Z80.alu8.sbc(cpu, cpu.map.h);
  },
  0x9D: function _(cpu) {
    return _2.Z80.alu8.sbc(cpu, cpu.map.l);
  },
  0x9E: function _(cpu) {
    return _2.Z80.alu8.sbcMemHL(cpu);
  },
  0xDE: function _(cpu) {
    return _2.Z80.alu8.sbcImmediate(cpu);
  },
  // 5. AND n
  0xA7: function _(cpu) {
    return _2.Z80.alu8.and(cpu, cpu.map.a);
  },
  0xA0: function _(cpu) {
    return _2.Z80.alu8.and(cpu, cpu.map.b);
  },
  0xA1: function _(cpu) {
    return _2.Z80.alu8.and(cpu, cpu.map.c);
  },
  0xA2: function _(cpu) {
    return _2.Z80.alu8.and(cpu, cpu.map.d);
  },
  0xA3: function _(cpu) {
    return _2.Z80.alu8.and(cpu, cpu.map.e);
  },
  0xA4: function _(cpu) {
    return _2.Z80.alu8.and(cpu, cpu.map.h);
  },
  0xA5: function _(cpu) {
    return _2.Z80.alu8.and(cpu, cpu.map.l);
  },
  0xA6: function _(cpu) {
    return _2.Z80.alu8.andMemHL(cpu);
  },
  0xE6: function _(cpu) {
    return _2.Z80.alu8.andImmediate(cpu);
  },
  // 6. OR n
  0xB7: function _(cpu) {
    return _2.Z80.alu8.or(cpu, cpu.map.a);
  },
  0xB0: function _(cpu) {
    return _2.Z80.alu8.or(cpu, cpu.map.b);
  },
  0xB1: function _(cpu) {
    return _2.Z80.alu8.or(cpu, cpu.map.c);
  },
  0xB2: function _(cpu) {
    return _2.Z80.alu8.or(cpu, cpu.map.d);
  },
  0xB3: function _(cpu) {
    return _2.Z80.alu8.or(cpu, cpu.map.e);
  },
  0xB4: function _(cpu) {
    return _2.Z80.alu8.or(cpu, cpu.map.h);
  },
  0xB5: function _(cpu) {
    return _2.Z80.alu8.or(cpu, cpu.map.l);
  },
  0xB6: function _(cpu) {
    return _2.Z80.alu8.orMemHL(cpu);
  },
  0xF6: function _(cpu) {
    return _2.Z80.alu8.orImmediate(cpu);
  },
  // 7. XOR n
  0xAF: function _(cpu) {
    return _2.Z80.alu8.xor(cpu, cpu.map.a);
  },
  0xA8: function _(cpu) {
    return _2.Z80.alu8.xor(cpu, cpu.map.b);
  },
  0xA9: function _(cpu) {
    return _2.Z80.alu8.xor(cpu, cpu.map.c);
  },
  0xAA: function _(cpu) {
    return _2.Z80.alu8.xor(cpu, cpu.map.d);
  },
  0xAB: function _(cpu) {
    return _2.Z80.alu8.xor(cpu, cpu.map.e);
  },
  0xAC: function _(cpu) {
    return _2.Z80.alu8.xor(cpu, cpu.map.h);
  },
  0xAD: function _(cpu) {
    return _2.Z80.alu8.xor(cpu, cpu.map.l);
  },
  0xAE: function _(cpu) {
    return _2.Z80.alu8.xorMemHL(cpu);
  },
  0xEE: function _(cpu) {
    return _2.Z80.alu8.xorImmediate(cpu);
  },
  // 8 CP n
  0xBF: function _(cpu) {
    return _2.Z80.alu8.cp(cpu, cpu.map.a);
  },
  0xB8: function _(cpu) {
    return _2.Z80.alu8.cp(cpu, cpu.map.b);
  },
  0xB9: function _(cpu) {
    return _2.Z80.alu8.cp(cpu, cpu.map.c);
  },
  0xBA: function _(cpu) {
    return _2.Z80.alu8.cp(cpu, cpu.map.d);
  },
  0xBB: function _(cpu) {
    return _2.Z80.alu8.cp(cpu, cpu.map.e);
  },
  0xBC: function _(cpu) {
    return _2.Z80.alu8.cp(cpu, cpu.map.h);
  },
  0xBD: function _(cpu) {
    return _2.Z80.alu8.cp(cpu, cpu.map.l);
  },
  0xBE: function _(cpu) {
    return _2.Z80.alu8.cpMemHL(cpu);
  },
  0xFE: function _(cpu) {
    return _2.Z80.alu8.cpImmediate(cpu);
  },
  // 9 INC n
  0x3C: function _(cpu) {
    return _2.Z80.alu8.inc(cpu, cpu.map.a);
  },
  0x04: function _(cpu) {
    return _2.Z80.alu8.inc(cpu, cpu.map.b);
  },
  0x0c: function _(cpu) {
    return _2.Z80.alu8.inc(cpu, cpu.map.c);
  },
  0x14: function _(cpu) {
    return _2.Z80.alu8.inc(cpu, cpu.map.d);
  },
  0x1C: function _(cpu) {
    return _2.Z80.alu8.inc(cpu, cpu.map.e);
  },
  0x24: function _(cpu) {
    return _2.Z80.alu8.inc(cpu, cpu.map.h);
  },
  0x2C: function _(cpu) {
    return _2.Z80.alu8.inc(cpu, cpu.map.l);
  },
  0x34: function _(cpu) {
    return _2.Z80.alu8.incMemHL(cpu);
  },
  // 10 INC n
  0x3D: function _(cpu) {
    return _2.Z80.alu8.dec(cpu, cpu.map.a);
  },
  0x05: function _(cpu) {
    return _2.Z80.alu8.dec(cpu, cpu.map.b);
  },
  0x0D: function _(cpu) {
    return _2.Z80.alu8.dec(cpu, cpu.map.c);
  },
  0x15: function _(cpu) {
    return _2.Z80.alu8.dec(cpu, cpu.map.d);
  },
  0x1D: function _(cpu) {
    return _2.Z80.alu8.dec(cpu, cpu.map.e);
  },
  0x25: function _(cpu) {
    return _2.Z80.alu8.dec(cpu, cpu.map.h);
  },
  0x2D: function _(cpu) {
    return _2.Z80.alu8.dec(cpu, cpu.map.l);
  },
  0x35: function _(cpu) {
    return _2.Z80.alu8.decMemHL(cpu);
  },
  // -------- 16 bit ALU --------
  // 1. Add HL, n
  0x09: function _(cpu) {
    return _2.Z80.alu16.addRegHLReg(cpu, cpu.map.bc);
  },
  0x19: function _(cpu) {
    return _2.Z80.alu16.addRegHLReg(cpu, cpu.map.de);
  },
  0x29: function _(cpu) {
    return _2.Z80.alu16.addRegHLReg(cpu, cpu.map.hl);
  },
  0x39: function _(cpu) {
    return _2.Z80.alu16.addRegHLReg(cpu, cpu.map.sp);
  },
  // 2. ADD SP, n
  0xE8: function _(cpu) {
    return _2.Z80.alu16.addRegSPImmediate(cpu);
  },
  // 3 INC nn (16 bit reg)
  0x03: function _(cpu) {
    return _2.Z80.alu16.inc(cpu, cpu.map.bc);
  },
  0x13: function _(cpu) {
    return _2.Z80.alu16.inc(cpu, cpu.map.de);
  },
  0x23: function _(cpu) {
    return _2.Z80.alu16.inc(cpu, cpu.map.hl);
  },
  0x33: function _(cpu) {
    return _2.Z80.alu16.inc(cpu, cpu.map.sp);
  },
  // 4. DEC nn (16 bit reg)
  0x0B: function _(cpu) {
    return _2.Z80.alu16.dec(cpu, cpu.map.bc);
  },
  0x1B: function _(cpu) {
    return _2.Z80.alu16.dec(cpu, cpu.map.de);
  },
  0x2B: function _(cpu) {
    return _2.Z80.alu16.dec(cpu, cpu.map.hl);
  },
  0x3B: function _(cpu) {
    return _2.Z80.alu16.dec(cpu, cpu.map.sp);
  },
  // -------- Misc --------
  // 1. SWAP
  // CB: displacement opcode
  0xCB37: function _(cpu) {
    return _2.Z80.misc.swap(cpu, cpu.map.a);
  },
  0xCB30: function _(cpu) {
    return _2.Z80.misc.swap(cpu, cpu.map.b);
  },
  0xCB31: function _(cpu) {
    return _2.Z80.misc.swap(cpu, cpu.map.c);
  },
  0xCB32: function _(cpu) {
    return _2.Z80.misc.swap(cpu, cpu.map.d);
  },
  0xCB33: function _(cpu) {
    return _2.Z80.misc.swap(cpu, cpu.map.e);
  },
  0xCB34: function _(cpu) {
    return _2.Z80.misc.swap(cpu, cpu.map.h);
  },
  0xCB35: function _(cpu) {
    return _2.Z80.misc.swap(cpu, cpu.map.l);
  },
  0xCB36: function _(cpu) {
    return _2.Z80.misc.swapMemHL(cpu);
  },
  // 2. DAA
  0x27: function _(cpu) {
    return _2.Z80.misc.daa(cpu);
  },
  // 3. CPL
  0x2F: function _(cpu) {
    return _2.Z80.misc.cpl(cpu);
  },
  // 4. CCF
  0x3F: function _(cpu) {
    return _2.Z80.misc.ccf(cpu);
  },
  // 5. SCF
  0x37: function _(cpu) {
    return _2.Z80.misc.scf(cpu);
  },
  // 6. NOP
  0x00: function _() {
    return _2.Z80.misc.nop();
  },
  // 7. HALT
  0x76: function _(cpu) {
    return _2.Z80.misc.halt(cpu);
  },
  // 8. STOP
  0x10: function _(cpu) {
    return _2.Z80.misc.stop(cpu);
  },
  // 9. DI
  0xF3: function _(cpu) {
    return _2.Z80.misc.di(cpu);
  },
  // 10. EI
  0xFB: function _(cpu) {
    return _2.Z80.misc.ei(cpu);
  },
  // -------- Rotates & shifts --------
  // 1. RLCA
  0x07: function _(cpu) {
    return _2.Z80.rotate.rcla(cpu);
  },
  // 2. RLA
  0x17: function _(cpu) {
    return _2.Z80.rotate.rla(cpu);
  },
  // 3. RRCA
  0x0F: function _(cpu) {
    return _2.Z80.rotate.rrca(cpu);
  },
  // 4. RRA
  0x1F: function _(cpu) {
    return _2.Z80.rotate.rra(cpu);
  },
  // 5. RLC n
  0xCB07: function _(cpu) {
    return _2.Z80.rotate.rlc(cpu, cpu.map.a);
  },
  0xCB00: function _(cpu) {
    return _2.Z80.rotate.rlc(cpu, cpu.map.b);
  },
  0xCB01: function _(cpu) {
    return _2.Z80.rotate.rlc(cpu, cpu.map.c);
  },
  0xCB02: function _(cpu) {
    return _2.Z80.rotate.rlc(cpu, cpu.map.d);
  },
  0xCB03: function _(cpu) {
    return _2.Z80.rotate.rlc(cpu, cpu.map.e);
  },
  0xCB04: function _(cpu) {
    return _2.Z80.rotate.rlc(cpu, cpu.map.h);
  },
  0xCB05: function _(cpu) {
    return _2.Z80.rotate.rlc(cpu, cpu.map.l);
  },
  0xCB06: function _(cpu) {
    return _2.Z80.rotate.rlcMemHL(cpu);
  },
  // 6. RL n
  0xCB17: function _(cpu) {
    return _2.Z80.rotate.rl(cpu, cpu.map.a);
  },
  0xCB10: function _(cpu) {
    return _2.Z80.rotate.rl(cpu, cpu.map.b);
  },
  0xCB11: function _(cpu) {
    return _2.Z80.rotate.rl(cpu, cpu.map.c);
  },
  0xCB12: function _(cpu) {
    return _2.Z80.rotate.rl(cpu, cpu.map.d);
  },
  0xCB13: function _(cpu) {
    return _2.Z80.rotate.rl(cpu, cpu.map.e);
  },
  0xCB14: function _(cpu) {
    return _2.Z80.rotate.rl(cpu, cpu.map.h);
  },
  0xCB15: function _(cpu) {
    return _2.Z80.rotate.rl(cpu, cpu.map.l);
  },
  0xCB16: function _(cpu) {
    return _2.Z80.rotate.rlMemHL(cpu);
  },
  // 7. RRC n
  0xCB0F: function _(cpu) {
    return _2.Z80.rotate.rrc(cpu, cpu.map.a);
  },
  0xCB08: function _(cpu) {
    return _2.Z80.rotate.rrc(cpu, cpu.map.b);
  },
  0xCB09: function _(cpu) {
    return _2.Z80.rotate.rrc(cpu, cpu.map.c);
  },
  0xCB0A: function _(cpu) {
    return _2.Z80.rotate.rrc(cpu, cpu.map.d);
  },
  0xCB0B: function _(cpu) {
    return _2.Z80.rotate.rrc(cpu, cpu.map.e);
  },
  0xCB0C: function _(cpu) {
    return _2.Z80.rotate.rrc(cpu, cpu.map.h);
  },
  0xCB0D: function _(cpu) {
    return _2.Z80.rotate.rrc(cpu, cpu.map.l);
  },
  0xCB0E: function _(cpu) {
    return _2.Z80.rotate.rrcMemHL(cpu);
  },
  // 8. RR n
  0xCB1F: function _(cpu) {
    return _2.Z80.rotate.rr(cpu, cpu.map.a);
  },
  0xCB18: function _(cpu) {
    return _2.Z80.rotate.rr(cpu, cpu.map.b);
  },
  0xCB19: function _(cpu) {
    return _2.Z80.rotate.rr(cpu, cpu.map.c);
  },
  0xCB1A: function _(cpu) {
    return _2.Z80.rotate.rr(cpu, cpu.map.d);
  },
  0xCB1B: function _(cpu) {
    return _2.Z80.rotate.rr(cpu, cpu.map.e);
  },
  0xCB1C: function _(cpu) {
    return _2.Z80.rotate.rr(cpu, cpu.map.h);
  },
  0xCB1D: function _(cpu) {
    return _2.Z80.rotate.rr(cpu, cpu.map.l);
  },
  0xCB1E: function _(cpu) {
    return _2.Z80.rotate.rrMemHL(cpu);
  },
  // 9. SLA n
  0xCB27: function _(cpu) {
    return _2.Z80.shift.sla(cpu, cpu.map.a);
  },
  0xCB20: function _(cpu) {
    return _2.Z80.shift.sla(cpu, cpu.map.b);
  },
  0xCB21: function _(cpu) {
    return _2.Z80.shift.sla(cpu, cpu.map.c);
  },
  0xCB22: function _(cpu) {
    return _2.Z80.shift.sla(cpu, cpu.map.d);
  },
  0xCB23: function _(cpu) {
    return _2.Z80.shift.sla(cpu, cpu.map.e);
  },
  0xCB24: function _(cpu) {
    return _2.Z80.shift.sla(cpu, cpu.map.h);
  },
  0xCB25: function _(cpu) {
    return _2.Z80.shift.sla(cpu, cpu.map.l);
  },
  0xCB26: function _(cpu) {
    return _2.Z80.shift.slaMemHL(cpu);
  },
  // 10. SRA n
  0xCB2F: function _(cpu) {
    return _2.Z80.shift.sra(cpu, cpu.map.a);
  },
  0xCB28: function _(cpu) {
    return _2.Z80.shift.sra(cpu, cpu.map.b);
  },
  0xCB29: function _(cpu) {
    return _2.Z80.shift.sra(cpu, cpu.map.c);
  },
  0xCB2A: function _(cpu) {
    return _2.Z80.shift.sra(cpu, cpu.map.d);
  },
  0xCB2B: function _(cpu) {
    return _2.Z80.shift.sra(cpu, cpu.map.e);
  },
  0xCB2C: function _(cpu) {
    return _2.Z80.shift.sra(cpu, cpu.map.h);
  },
  0xCB2D: function _(cpu) {
    return _2.Z80.shift.sra(cpu, cpu.map.l);
  },
  0xCB2E: function _(cpu) {
    return _2.Z80.shift.sraMemHL(cpu);
  },
  // 11. SRL n
  0xCB3F: function _(cpu) {
    return _2.Z80.shift.srl(cpu, cpu.map.a);
  },
  0xCB38: function _(cpu) {
    return _2.Z80.shift.srl(cpu, cpu.map.b);
  },
  0xCB39: function _(cpu) {
    return _2.Z80.shift.srl(cpu, cpu.map.c);
  },
  0xCB3A: function _(cpu) {
    return _2.Z80.shift.srl(cpu, cpu.map.d);
  },
  0xCB3B: function _(cpu) {
    return _2.Z80.shift.srl(cpu, cpu.map.e);
  },
  0xCB3C: function _(cpu) {
    return _2.Z80.shift.srl(cpu, cpu.map.h);
  },
  0xCB3D: function _(cpu) {
    return _2.Z80.shift.srl(cpu, cpu.map.l);
  },
  0xCB3E: function _(cpu) {
    return _2.Z80.shift.srlMemHL(cpu);
  },
  //  -------- Rotates & shifts --------
  // Are loaded dynamically into this map. See below.
  //  -------- Jumps --------
  // 1. JP nn
  0xC3: function _(cpu) {
    return _2.Z80.jump.jp(cpu);
  },
  // 2. JP cc, nn
  0xC2: function _(cpu) {
    return _2.Z80.jump.jpIfZ(cpu, false);
  },
  0xCA: function _(cpu) {
    return _2.Z80.jump.jpIfZ(cpu, true);
  },
  0xD2: function _(cpu) {
    return _2.Z80.jump.jpIfC(cpu, false);
  },
  0xDA: function _(cpu) {
    return _2.Z80.jump.jpIfC(cpu, true);
  },
  // 3. JP (HL)
  0xE9: function _(cpu) {
    return _2.Z80.jump.jpHL(cpu);
  },
  // 4. JR n
  0x18: function _(cpu) {
    return _2.Z80.jump.jr(cpu);
  },
  // 5. JR cc, n
  0x20: function _(cpu) {
    return _2.Z80.jump.jrIfZ(cpu, false);
  },
  0x28: function _(cpu) {
    return _2.Z80.jump.jrIfZ(cpu, true);
  },
  0x30: function _(cpu) {
    return _2.Z80.jump.jrIfC(cpu, false);
  },
  0x38: function _(cpu) {
    return _2.Z80.jump.jrIfC(cpu, true);
  },
  //  -------- Jumps --------
  // 1. CALL nn
  0xCD: function _(cpu) {
    return _2.Z80.subroutine.call(cpu);
  },
  // 2. CALL cc,nn
  0xC4: function _(cpu) {
    return _2.Z80.subroutine.callIfZ(cpu, false);
  },
  0xCC: function _(cpu) {
    return _2.Z80.subroutine.callIfZ(cpu, true);
  },
  0xD4: function _(cpu) {
    return _2.Z80.subroutine.callIfC(cpu, false);
  },
  0xDC: function _(cpu) {
    return _2.Z80.subroutine.callIfC(cpu, true);
  },
  //  -------- Restarts --------
  // 1. RST n
  0xC7: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x00);
  },
  0xCF: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x08);
  },
  0xD7: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x10);
  },
  0xDF: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x18);
  },
  0xE7: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x20);
  },
  0xEF: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x28);
  },
  0xF7: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x30);
  },
  0xFF: function _(cpu) {
    return _2.Z80.subroutine.rst(cpu, 0x38);
  },
  //  -------- Returns --------
  // 1. RET
  0xC9: function _(cpu) {
    return _2.Z80.subroutine.ret(cpu);
  },
  // 2. RET cc
  0xC0: function _(cpu) {
    return _2.Z80.subroutine.retIfZ(cpu, false);
  },
  0xC8: function _(cpu) {
    return _2.Z80.subroutine.retIfZ(cpu, true);
  },
  0xD0: function _(cpu) {
    return _2.Z80.subroutine.retIfC(cpu, false);
  },
  0xD8: function _(cpu) {
    return _2.Z80.subroutine.retIfC(cpu, true);
  },
  // 3. RETI
  0xD9: function _(cpu) {
    return _2.Z80.subroutine.reti(cpu);
  }
};

var LoadOpcodesIntoMap = function LoadOpcodesIntoMap(start, end, op) {
  var regs = [_2.NameMap.b, _2.NameMap.c, _2.NameMap.d, _2.NameMap.e, _2.NameMap.h, _2.NameMap.l, _2.NameMap.hl, _2.NameMap.a];

  var _loop = function _loop(code) {
    var reg = regs[(code - start) % regs.length];
    var bit = Math.floor((code - start) / regs.length);

    opcodes[0xCB00 + code] = function (cpu) {
      return op(cpu, reg, bit);
    };
  };

  for (var code = start; code <= end; code += 1) {
    _loop(code);
  }
}; // Many similar instructions with only reg and bit that differ.
// Uses opcode reference to dynamically load them into map. See tests for reference.


LoadOpcodesIntoMap(0x40, 0x7F, function (cpu, reg, bit) {
  return _2.Z80.bit.bit(cpu, reg, bit);
});
LoadOpcodesIntoMap(0x80, 0xBF, function (cpu, reg, bit) {
  return _2.Z80.bit.res(cpu, reg, bit);
});
LoadOpcodesIntoMap(0xC0, 0xFF, function (cpu, reg, bit) {
  return _2.Z80.bit.set(cpu, reg, bit);
});
var _default = opcodes;
exports.default = _default;
},{"./":20}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Registers = exports.NameMap = exports.RegMap = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var numRegs = 8;
var RegMap = {
  a: 0,
  f: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  h: 6,
  l: 7,
  af: 8,
  bc: 9,
  de: 10,
  hl: 11,
  sp: 12
};
exports.RegMap = RegMap;
var NameMap = {
  a: 'a',
  f: 'f',
  b: 'b',
  c: 'c',
  d: 'd',
  e: 'e',
  h: 'h',
  l: 'l',
  af: 'af',
  bc: 'bc',
  de: 'de',
  hl: 'hl',
  sp: 'sp'
};
exports.NameMap = NameMap;

var Registers =
/*#__PURE__*/
function () {
  function Registers() {
    _classCallCheck(this, Registers);

    this._initGeneralPurposeRegisters();

    this._sp = 0xFFFE; // Default on start up

    this._pc = 0x00;
    this.map = this._createAccessorMap();
  } // lower nibble of f is always ignored (blargg test)


  _createClass(Registers, [{
    key: "_createAccessorMap",
    value: function _createAccessorMap() {
      var _this = this;

      return {
        a: function a(val) {
          return _this._reg8(RegMap.a, val);
        },
        b: function b(val) {
          return _this._reg8(RegMap.b, val);
        },
        c: function c(val) {
          return _this._reg8(RegMap.c, val);
        },
        d: function d(val) {
          return _this._reg8(RegMap.d, val);
        },
        e: function e(val) {
          return _this._reg8(RegMap.e, val);
        },
        f: function f(val) {
          return _this._specialRegF(RegMap.f, val);
        },
        h: function h(val) {
          return _this._reg8(RegMap.h, val);
        },
        l: function l(val) {
          return _this._reg8(RegMap.l, val);
        },
        af: function af(val) {
          return _this._specialRegAF(RegMap.af, val);
        },
        bc: function bc(val) {
          return _this._reg16(RegMap.bc, val);
        },
        de: function de(val) {
          return _this._reg16(RegMap.de, val);
        },
        hl: function hl(val) {
          return _this._reg16(RegMap.hl, val);
        },
        sp: function sp(val) {
          return _this.sp(val);
        },
        pc: function pc(val) {
          return _this.pc(val);
        }
      };
    }
  }, {
    key: "_initGeneralPurposeRegisters",
    value: function _initGeneralPurposeRegisters() {
      this._gpr_buffer = new ArrayBuffer(numRegs);
      this._gpr = new DataView(this._gpr_buffer);
    }
  }, {
    key: "_specialRegF",
    value: function _specialRegF(num) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return this._reg8(num, value === null ? value : value & 0xF0);
    }
  }, {
    key: "_specialRegAF",
    value: function _specialRegAF(num) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return this._reg16(num, value === null ? value : value & 0xFFF0);
    }
  }, {
    key: "_reg8",
    value: function _reg8(num) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      if (value !== null) {
        this._gpr.setUint8(num, value);
      }

      return this._gpr.getUint8(num);
    }
  }, {
    key: "_reg16",
    value: function _reg16(num) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var regOffset = (num - RegMap.af) * 2;

      if (value !== null) {
        this._gpr.setUint16(regOffset, value, false);
      }

      return this._gpr.getUint16(regOffset, false);
    }
  }, {
    key: "pc",
    value: function pc() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (value !== null) {
        this._pc = value & 0xFFFF;
      }

      return this._pc;
    }
  }, {
    key: "sp",
    value: function sp() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (value !== null) {
        this._sp = value & 0xFFFF;
      }

      return this._sp;
    }
  }, {
    key: "getState",
    value: function getState() {
      var getHex = function getHex(val) {
        return "".concat(val.toString(16));
      };

      var state = {};
      Object.entries(this.map).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            name = _ref2[0],
            func = _ref2[1];

        state[name] = getHex(func());
      });
      return state;
    }
  }]);

  return Registers;
}();

exports.Registers = Registers;
},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */

/* eslint prefer-destructuring: 0 */
// 00: 4096Hz, 01: 262144Hz, 10: 65536Hz, 11: 16384Hz
var freq = [1024, 16, 64, 256];

var Timer =
/*#__PURE__*/
function () {
  function Timer(interrupts) {
    _classCallCheck(this, Timer);

    this.interrupts = interrupts;
    this.div = 0; // timer

    this.tima = 0; // timer

    this.tma = 0; // tima timer starts at modulo at overflow

    this.tac = 0; // controls tima timer. bit 0 and 1 - speed, bit 2 - enabled

    this.divCounter = 0;
    this.timaCounter = 0;
    this.timaEnabled = false;
    this.timaSpeed = freq[0];
  } // Gameboy cpu 4194304Hz. Cpu can produce this many  cycles per second
  // Div timer counts at 16384Hz
  // 4194304Hz / 16384hz = 256 cpu cycles required before incrementing div register


  _createClass(Timer, [{
    key: "increment",
    value: function increment(cycles) {
      var divThreshold = 256;
      this.divCounter += cycles;

      while (this.divCounter >= divThreshold) {
        this.divCounter -= divThreshold;
        this.div = this.div + 1 & 0xFF;
      } // this.div += this.divCounter >> 8; // increment after counter reaches 256
      // this.divCounter &= 0xFF;
      // this.div &= 0xFF; // After div timer has overflown it start at zero again.


      if (!this.timaEnabled) return;
      this.timaCounter += cycles;

      while (this.timaCounter >= this.timaSpeed) {
        this.timaCounter -= this.timaSpeed;
        this.tima += 1;

        if (this.tima > 0xFF) {
          this.tima = this.tma & 0xFF;
          this.interrupts.triggerTimer();
        }
      }
    }
  }, {
    key: "setTac",
    value: function setTac(tac) {
      this.tac = tac;
      this.timaEnabled = !!(tac & 4);
      this.timaSpeed = freq[tac & 3];
    }
  }]);

  return Timer;
}();

exports.default = Timer;
},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* eslint no-bitwise: 0 */
var Util = {
  convertSignedByte: function convertSignedByte(val) {
    return val << 24 >> 24;
  },
  getBit: function getBit(byte, idx) {
    var mask = 1 << idx;
    return (byte & mask) >>> idx;
  },
  // TODO: move to palette?
  // bit 7,6 - 5,4 - 3,2 - 1,0
  getHalfNibble: function getHalfNibble(byte, idx) {
    return byte >> idx * 2 & 3;
  },
  getPaletteColor: function getPaletteColor(idx) {
    switch (idx) {
      case 0:
        return [255, 255, 255, 255];

      case 1:
        return [192, 192, 192, 255];

      case 2:
        return [96, 96, 96, 255];

      case 3:
        return [0, 0, 0, 255];

      default:
        throw new Error('Not a color');
    }
  },
  twoComplementByte: function twoComplementByte(val) {
    return ~(val & 0xFF) + 1;
  }
};
var _default = Util;
exports.default = _default;
},{}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _opcodes = _interopRequireDefault(require("./opcodes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */
var getHex = function getHex(op) {
  return "0x".concat((op & 0x00FF).toString(16));
};

var OpcodeInfoManager =
/*#__PURE__*/
function () {
  function OpcodeInfoManager() {
    _classCallCheck(this, OpcodeInfoManager);

    this._opcodes = _opcodes.default;
  }

  _createClass(OpcodeInfoManager, [{
    key: "getDescription",
    value: function getDescription(op) {
      var opInfo = this.findInfo(op);

      if (opInfo === undefined) {
        return 'Not found';
      }

      var text = "".concat(getHex(op), ": ").concat(opInfo.mnemonic);
      if (opInfo.operand1) text += " - ".concat(opInfo.operand1);
      if (opInfo.operand2) text += " ".concat(opInfo.operand2);
      return text;
    }
  }, {
    key: "findInfo",
    value: function findInfo(op) {
      if (op === null || op === undefined) return {};

      if (op >>> 8 === 0xCB) {
        var cbKey = getHex(op & 0x00FF);
        return this._opcodes.cbprefixed[cbKey];
      }

      var key = getHex(op);
      return this._opcodes.unprefixed[key];
    }
  }]);

  return OpcodeInfoManager;
}();

exports.default = OpcodeInfoManager;
},{"./opcodes":38}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var opcodes = {
  unprefixed: {
    '0x0': {
      mnemonic: 'NOP',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x0'
    },
    '0x1': {
      mnemonic: 'LD',
      length: 3,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0x1',
      operand1: 'BC',
      operand2: 'd16'
    },
    '0x2': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x2',
      operand1: '(BC)',
      operand2: 'A'
    },
    '0x3': {
      mnemonic: 'INC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x3',
      operand1: 'BC'
    },
    '0x4': {
      mnemonic: 'INC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', '-'],
      addr: '0x4',
      operand1: 'B'
    },
    '0x5': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', '-'],
      addr: '0x5',
      operand1: 'B'
    },
    '0x6': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x6',
      operand1: 'B',
      operand2: 'd8'
    },
    '0x7': {
      mnemonic: 'RLCA',
      length: 1,
      cycles: [4],
      flags: ['0', '0', '0', 'C'],
      addr: '0x7'
    },
    '0x8': {
      mnemonic: 'LD',
      length: 3,
      cycles: [20],
      flags: ['-', '-', '-', '-'],
      addr: '0x8',
      operand1: '(a16)',
      operand2: 'SP'
    },
    '0x9': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [8],
      flags: ['-', '0', 'H', 'C'],
      addr: '0x9',
      operand1: 'HL',
      operand2: 'BC'
    },
    '0xa': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa',
      operand1: 'A',
      operand2: '(BC)'
    },
    '0xb': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb',
      operand1: 'BC'
    },
    '0xc': {
      mnemonic: 'INC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', '-'],
      addr: '0xc',
      operand1: 'C'
    },
    '0xd': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', '-'],
      addr: '0xd',
      operand1: 'C'
    },
    '0xe': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe',
      operand1: 'C',
      operand2: 'd8'
    },
    '0xf': {
      mnemonic: 'RRCA',
      length: 1,
      cycles: [4],
      flags: ['0', '0', '0', 'C'],
      addr: '0xf'
    },
    '0x10': {
      mnemonic: 'STOP',
      length: 2,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x10',
      operand1: '0'
    },
    '0x11': {
      mnemonic: 'LD',
      length: 3,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0x11',
      operand1: 'DE',
      operand2: 'd16'
    },
    '0x12': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x12',
      operand1: '(DE)',
      operand2: 'A'
    },
    '0x13': {
      mnemonic: 'INC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x13',
      operand1: 'DE'
    },
    '0x14': {
      mnemonic: 'INC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', '-'],
      addr: '0x14',
      operand1: 'D'
    },
    '0x15': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', '-'],
      addr: '0x15',
      operand1: 'D'
    },
    '0x16': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x16',
      operand1: 'D',
      operand2: 'd8'
    },
    '0x17': {
      mnemonic: 'RLA',
      length: 1,
      cycles: [4],
      flags: ['0', '0', '0', 'C'],
      addr: '0x17'
    },
    '0x18': {
      mnemonic: 'JR',
      length: 2,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0x18',
      operand1: 'r8'
    },
    '0x19': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [8],
      flags: ['-', '0', 'H', 'C'],
      addr: '0x19',
      operand1: 'HL',
      operand2: 'DE'
    },
    '0x1a': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x1a',
      operand1: 'A',
      operand2: '(DE)'
    },
    '0x1b': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x1b',
      operand1: 'DE'
    },
    '0x1c': {
      mnemonic: 'INC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', '-'],
      addr: '0x1c',
      operand1: 'E'
    },
    '0x1d': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', '-'],
      addr: '0x1d',
      operand1: 'E'
    },
    '0x1e': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x1e',
      operand1: 'E',
      operand2: 'd8'
    },
    '0x1f': {
      mnemonic: 'RRA',
      length: 1,
      cycles: [4],
      flags: ['0', '0', '0', 'C'],
      addr: '0x1f'
    },
    '0x20': {
      mnemonic: 'JR',
      length: 2,
      cycles: [12, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0x20',
      operand1: 'NZ',
      operand2: 'r8'
    },
    '0x21': {
      mnemonic: 'LD',
      length: 3,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0x21',
      operand1: 'HL',
      operand2: 'd16'
    },
    '0x22': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x22',
      operand1: '(HL+)',
      operand2: 'A'
    },
    '0x23': {
      mnemonic: 'INC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x23',
      operand1: 'HL'
    },
    '0x24': {
      mnemonic: 'INC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', '-'],
      addr: '0x24',
      operand1: 'H'
    },
    '0x25': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', '-'],
      addr: '0x25',
      operand1: 'H'
    },
    '0x26': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x26',
      operand1: 'H',
      operand2: 'd8'
    },
    '0x27': {
      mnemonic: 'DAA',
      length: 1,
      cycles: [4],
      flags: ['Z', '-', '0', 'C'],
      addr: '0x27'
    },
    '0x28': {
      mnemonic: 'JR',
      length: 2,
      cycles: [12, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0x28',
      operand1: 'Z',
      operand2: 'r8'
    },
    '0x29': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [8],
      flags: ['-', '0', 'H', 'C'],
      addr: '0x29',
      operand1: 'HL',
      operand2: 'HL'
    },
    '0x2a': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x2a',
      operand1: 'A',
      operand2: '(HL+)'
    },
    '0x2b': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x2b',
      operand1: 'HL'
    },
    '0x2c': {
      mnemonic: 'INC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', '-'],
      addr: '0x2c',
      operand1: 'L'
    },
    '0x2d': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', '-'],
      addr: '0x2d',
      operand1: 'L'
    },
    '0x2e': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x2e',
      operand1: 'L',
      operand2: 'd8'
    },
    '0x2f': {
      mnemonic: 'CPL',
      length: 1,
      cycles: [4],
      flags: ['-', '1', '1', '-'],
      addr: '0x2f'
    },
    '0x30': {
      mnemonic: 'JR',
      length: 2,
      cycles: [12, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0x30',
      operand1: 'NC',
      operand2: 'r8'
    },
    '0x31': {
      mnemonic: 'LD',
      length: 3,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0x31',
      operand1: 'SP',
      operand2: 'd16'
    },
    '0x32': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x32',
      operand1: '(HL-)',
      operand2: 'A'
    },
    '0x33': {
      mnemonic: 'INC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x33',
      operand1: 'SP'
    },
    '0x34': {
      mnemonic: 'INC',
      length: 1,
      cycles: [12],
      flags: ['Z', '0', 'H', '-'],
      addr: '0x34',
      operand1: '(HL)'
    },
    '0x35': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [12],
      flags: ['Z', '1', 'H', '-'],
      addr: '0x35',
      operand1: '(HL)'
    },
    '0x36': {
      mnemonic: 'LD',
      length: 2,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0x36',
      operand1: '(HL)',
      operand2: 'd8'
    },
    '0x37': {
      mnemonic: 'SCF',
      length: 1,
      cycles: [4],
      flags: ['-', '0', '0', '1'],
      addr: '0x37'
    },
    '0x38': {
      mnemonic: 'JR',
      length: 2,
      cycles: [12, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0x38',
      operand1: 'C',
      operand2: 'r8'
    },
    '0x39': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [8],
      flags: ['-', '0', 'H', 'C'],
      addr: '0x39',
      operand1: 'HL',
      operand2: 'SP'
    },
    '0x3a': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x3a',
      operand1: 'A',
      operand2: '(HL-)'
    },
    '0x3b': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x3b',
      operand1: 'SP'
    },
    '0x3c': {
      mnemonic: 'INC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', '-'],
      addr: '0x3c',
      operand1: 'A'
    },
    '0x3d': {
      mnemonic: 'DEC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', '-'],
      addr: '0x3d',
      operand1: 'A'
    },
    '0x3e': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x3e',
      operand1: 'A',
      operand2: 'd8'
    },
    '0x3f': {
      mnemonic: 'CCF',
      length: 1,
      cycles: [4],
      flags: ['-', '0', '0', 'C'],
      addr: '0x3f'
    },
    '0x40': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x40',
      operand1: 'B',
      operand2: 'B'
    },
    '0x41': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x41',
      operand1: 'B',
      operand2: 'C'
    },
    '0x42': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x42',
      operand1: 'B',
      operand2: 'D'
    },
    '0x43': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x43',
      operand1: 'B',
      operand2: 'E'
    },
    '0x44': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x44',
      operand1: 'B',
      operand2: 'H'
    },
    '0x45': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x45',
      operand1: 'B',
      operand2: 'L'
    },
    '0x46': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x46',
      operand1: 'B',
      operand2: '(HL)'
    },
    '0x47': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x47',
      operand1: 'B',
      operand2: 'A'
    },
    '0x48': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x48',
      operand1: 'C',
      operand2: 'B'
    },
    '0x49': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x49',
      operand1: 'C',
      operand2: 'C'
    },
    '0x4a': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x4a',
      operand1: 'C',
      operand2: 'D'
    },
    '0x4b': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x4b',
      operand1: 'C',
      operand2: 'E'
    },
    '0x4c': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x4c',
      operand1: 'C',
      operand2: 'H'
    },
    '0x4d': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x4d',
      operand1: 'C',
      operand2: 'L'
    },
    '0x4e': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x4e',
      operand1: 'C',
      operand2: '(HL)'
    },
    '0x4f': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x4f',
      operand1: 'C',
      operand2: 'A'
    },
    '0x50': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x50',
      operand1: 'D',
      operand2: 'B'
    },
    '0x51': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x51',
      operand1: 'D',
      operand2: 'C'
    },
    '0x52': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x52',
      operand1: 'D',
      operand2: 'D'
    },
    '0x53': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x53',
      operand1: 'D',
      operand2: 'E'
    },
    '0x54': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x54',
      operand1: 'D',
      operand2: 'H'
    },
    '0x55': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x55',
      operand1: 'D',
      operand2: 'L'
    },
    '0x56': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x56',
      operand1: 'D',
      operand2: '(HL)'
    },
    '0x57': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x57',
      operand1: 'D',
      operand2: 'A'
    },
    '0x58': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x58',
      operand1: 'E',
      operand2: 'B'
    },
    '0x59': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x59',
      operand1: 'E',
      operand2: 'C'
    },
    '0x5a': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x5a',
      operand1: 'E',
      operand2: 'D'
    },
    '0x5b': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x5b',
      operand1: 'E',
      operand2: 'E'
    },
    '0x5c': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x5c',
      operand1: 'E',
      operand2: 'H'
    },
    '0x5d': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x5d',
      operand1: 'E',
      operand2: 'L'
    },
    '0x5e': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x5e',
      operand1: 'E',
      operand2: '(HL)'
    },
    '0x5f': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x5f',
      operand1: 'E',
      operand2: 'A'
    },
    '0x60': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x60',
      operand1: 'H',
      operand2: 'B'
    },
    '0x61': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x61',
      operand1: 'H',
      operand2: 'C'
    },
    '0x62': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x62',
      operand1: 'H',
      operand2: 'D'
    },
    '0x63': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x63',
      operand1: 'H',
      operand2: 'E'
    },
    '0x64': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x64',
      operand1: 'H',
      operand2: 'H'
    },
    '0x65': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x65',
      operand1: 'H',
      operand2: 'L'
    },
    '0x66': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x66',
      operand1: 'H',
      operand2: '(HL)'
    },
    '0x67': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x67',
      operand1: 'H',
      operand2: 'A'
    },
    '0x68': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x68',
      operand1: 'L',
      operand2: 'B'
    },
    '0x69': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x69',
      operand1: 'L',
      operand2: 'C'
    },
    '0x6a': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x6a',
      operand1: 'L',
      operand2: 'D'
    },
    '0x6b': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x6b',
      operand1: 'L',
      operand2: 'E'
    },
    '0x6c': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x6c',
      operand1: 'L',
      operand2: 'H'
    },
    '0x6d': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x6d',
      operand1: 'L',
      operand2: 'L'
    },
    '0x6e': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x6e',
      operand1: 'L',
      operand2: '(HL)'
    },
    '0x6f': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x6f',
      operand1: 'L',
      operand2: 'A'
    },
    '0x70': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x70',
      operand1: '(HL)',
      operand2: 'B'
    },
    '0x71': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x71',
      operand1: '(HL)',
      operand2: 'C'
    },
    '0x72': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x72',
      operand1: '(HL)',
      operand2: 'D'
    },
    '0x73': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x73',
      operand1: '(HL)',
      operand2: 'E'
    },
    '0x74': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x74',
      operand1: '(HL)',
      operand2: 'H'
    },
    '0x75': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x75',
      operand1: '(HL)',
      operand2: 'L'
    },
    '0x76': {
      mnemonic: 'HALT',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x76'
    },
    '0x77': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x77',
      operand1: '(HL)',
      operand2: 'A'
    },
    '0x78': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x78',
      operand1: 'A',
      operand2: 'B'
    },
    '0x79': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x79',
      operand1: 'A',
      operand2: 'C'
    },
    '0x7a': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x7a',
      operand1: 'A',
      operand2: 'D'
    },
    '0x7b': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x7b',
      operand1: 'A',
      operand2: 'E'
    },
    '0x7c': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x7c',
      operand1: 'A',
      operand2: 'H'
    },
    '0x7d': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x7d',
      operand1: 'A',
      operand2: 'L'
    },
    '0x7e': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x7e',
      operand1: 'A',
      operand2: '(HL)'
    },
    '0x7f': {
      mnemonic: 'LD',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0x7f',
      operand1: 'A',
      operand2: 'A'
    },
    '0x80': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x80',
      operand1: 'A',
      operand2: 'B'
    },
    '0x81': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x81',
      operand1: 'A',
      operand2: 'C'
    },
    '0x82': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x82',
      operand1: 'A',
      operand2: 'D'
    },
    '0x83': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x83',
      operand1: 'A',
      operand2: 'E'
    },
    '0x84': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x84',
      operand1: 'A',
      operand2: 'H'
    },
    '0x85': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x85',
      operand1: 'A',
      operand2: 'L'
    },
    '0x86': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [8],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x86',
      operand1: 'A',
      operand2: '(HL)'
    },
    '0x87': {
      mnemonic: 'ADD',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x87',
      operand1: 'A',
      operand2: 'A'
    },
    '0x88': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x88',
      operand1: 'A',
      operand2: 'B'
    },
    '0x89': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x89',
      operand1: 'A',
      operand2: 'C'
    },
    '0x8a': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x8a',
      operand1: 'A',
      operand2: 'D'
    },
    '0x8b': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x8b',
      operand1: 'A',
      operand2: 'E'
    },
    '0x8c': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x8c',
      operand1: 'A',
      operand2: 'H'
    },
    '0x8d': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x8d',
      operand1: 'A',
      operand2: 'L'
    },
    '0x8e': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [8],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x8e',
      operand1: 'A',
      operand2: '(HL)'
    },
    '0x8f': {
      mnemonic: 'ADC',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0x8f',
      operand1: 'A',
      operand2: 'A'
    },
    '0x90': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x90',
      operand1: 'B'
    },
    '0x91': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x91',
      operand1: 'C'
    },
    '0x92': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x92',
      operand1: 'D'
    },
    '0x93': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x93',
      operand1: 'E'
    },
    '0x94': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x94',
      operand1: 'H'
    },
    '0x95': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x95',
      operand1: 'L'
    },
    '0x96': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [8],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x96',
      operand1: '(HL)'
    },
    '0x97': {
      mnemonic: 'SUB',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x97',
      operand1: 'A'
    },
    '0x98': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x98',
      operand1: 'A',
      operand2: 'B'
    },
    '0x99': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x99',
      operand1: 'A',
      operand2: 'C'
    },
    '0x9a': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x9a',
      operand1: 'A',
      operand2: 'D'
    },
    '0x9b': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x9b',
      operand1: 'A',
      operand2: 'E'
    },
    '0x9c': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x9c',
      operand1: 'A',
      operand2: 'H'
    },
    '0x9d': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x9d',
      operand1: 'A',
      operand2: 'L'
    },
    '0x9e': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [8],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x9e',
      operand1: 'A',
      operand2: '(HL)'
    },
    '0x9f': {
      mnemonic: 'SBC',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0x9f',
      operand1: 'A',
      operand2: 'A'
    },
    '0xa0': {
      mnemonic: 'AND',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa0',
      operand1: 'B'
    },
    '0xa1': {
      mnemonic: 'AND',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa1',
      operand1: 'C'
    },
    '0xa2': {
      mnemonic: 'AND',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa2',
      operand1: 'D'
    },
    '0xa3': {
      mnemonic: 'AND',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa3',
      operand1: 'E'
    },
    '0xa4': {
      mnemonic: 'AND',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa4',
      operand1: 'H'
    },
    '0xa5': {
      mnemonic: 'AND',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa5',
      operand1: 'L'
    },
    '0xa6': {
      mnemonic: 'AND',
      length: 1,
      cycles: [8],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa6',
      operand1: '(HL)'
    },
    '0xa7': {
      mnemonic: 'AND',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '1', '0'],
      addr: '0xa7',
      operand1: 'A'
    },
    '0xa8': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xa8',
      operand1: 'B'
    },
    '0xa9': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xa9',
      operand1: 'C'
    },
    '0xaa': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xaa',
      operand1: 'D'
    },
    '0xab': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xab',
      operand1: 'E'
    },
    '0xac': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xac',
      operand1: 'H'
    },
    '0xad': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xad',
      operand1: 'L'
    },
    '0xae': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0xae',
      operand1: '(HL)'
    },
    '0xaf': {
      mnemonic: 'XOR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xaf',
      operand1: 'A'
    },
    '0xb0': {
      mnemonic: 'OR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb0',
      operand1: 'B'
    },
    '0xb1': {
      mnemonic: 'OR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb1',
      operand1: 'C'
    },
    '0xb2': {
      mnemonic: 'OR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb2',
      operand1: 'D'
    },
    '0xb3': {
      mnemonic: 'OR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb3',
      operand1: 'E'
    },
    '0xb4': {
      mnemonic: 'OR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb4',
      operand1: 'H'
    },
    '0xb5': {
      mnemonic: 'OR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb5',
      operand1: 'L'
    },
    '0xb6': {
      mnemonic: 'OR',
      length: 1,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb6',
      operand1: '(HL)'
    },
    '0xb7': {
      mnemonic: 'OR',
      length: 1,
      cycles: [4],
      flags: ['Z', '0', '0', '0'],
      addr: '0xb7',
      operand1: 'A'
    },
    '0xb8': {
      mnemonic: 'CP',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xb8',
      operand1: 'B'
    },
    '0xb9': {
      mnemonic: 'CP',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xb9',
      operand1: 'C'
    },
    '0xba': {
      mnemonic: 'CP',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xba',
      operand1: 'D'
    },
    '0xbb': {
      mnemonic: 'CP',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xbb',
      operand1: 'E'
    },
    '0xbc': {
      mnemonic: 'CP',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xbc',
      operand1: 'H'
    },
    '0xbd': {
      mnemonic: 'CP',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xbd',
      operand1: 'L'
    },
    '0xbe': {
      mnemonic: 'CP',
      length: 1,
      cycles: [8],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xbe',
      operand1: '(HL)'
    },
    '0xbf': {
      mnemonic: 'CP',
      length: 1,
      cycles: [4],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xbf',
      operand1: 'A'
    },
    '0xc0': {
      mnemonic: 'RET',
      length: 1,
      cycles: [20, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc0',
      operand1: 'NZ'
    },
    '0xc1': {
      mnemonic: 'POP',
      length: 1,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0xc1',
      operand1: 'BC'
    },
    '0xc2': {
      mnemonic: 'JP',
      length: 3,
      cycles: [16, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xc2',
      operand1: 'NZ',
      operand2: 'a16'
    },
    '0xc3': {
      mnemonic: 'JP',
      length: 3,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xc3',
      operand1: 'a16'
    },
    '0xc4': {
      mnemonic: 'CALL',
      length: 3,
      cycles: [24, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xc4',
      operand1: 'NZ',
      operand2: 'a16'
    },
    '0xc5': {
      mnemonic: 'PUSH',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xc5',
      operand1: 'BC'
    },
    '0xc6': {
      mnemonic: 'ADD',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0xc6',
      operand1: 'A',
      operand2: 'd8'
    },
    '0xc7': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xc7',
      operand1: '00H'
    },
    '0xc8': {
      mnemonic: 'RET',
      length: 1,
      cycles: [20, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc8',
      operand1: 'Z'
    },
    '0xc9': {
      mnemonic: 'RET',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xc9'
    },
    '0xca': {
      mnemonic: 'JP',
      length: 3,
      cycles: [16, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xca',
      operand1: 'Z',
      operand2: 'a16'
    },
    '0xcb': {
      mnemonic: 'PREFIX',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0xcb',
      operand1: 'CB'
    },
    '0xcc': {
      mnemonic: 'CALL',
      length: 3,
      cycles: [24, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xcc',
      operand1: 'Z',
      operand2: 'a16'
    },
    '0xcd': {
      mnemonic: 'CALL',
      length: 3,
      cycles: [24],
      flags: ['-', '-', '-', '-'],
      addr: '0xcd',
      operand1: 'a16'
    },
    '0xce': {
      mnemonic: 'ADC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', 'H', 'C'],
      addr: '0xce',
      operand1: 'A',
      operand2: 'd8'
    },
    '0xcf': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xcf',
      operand1: '08H'
    },
    '0xd0': {
      mnemonic: 'RET',
      length: 1,
      cycles: [20, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd0',
      operand1: 'NC'
    },
    '0xd1': {
      mnemonic: 'POP',
      length: 1,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0xd1',
      operand1: 'DE'
    },
    '0xd2': {
      mnemonic: 'JP',
      length: 3,
      cycles: [16, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xd2',
      operand1: 'NC',
      operand2: 'a16'
    },
    '0xd4': {
      mnemonic: 'CALL',
      length: 3,
      cycles: [24, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xd4',
      operand1: 'NC',
      operand2: 'a16'
    },
    '0xd5': {
      mnemonic: 'PUSH',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xd5',
      operand1: 'DE'
    },
    '0xd6': {
      mnemonic: 'SUB',
      length: 2,
      cycles: [8],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xd6',
      operand1: 'd8'
    },
    '0xd7': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xd7',
      operand1: '10H'
    },
    '0xd8': {
      mnemonic: 'RET',
      length: 1,
      cycles: [20, 8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd8',
      operand1: 'C'
    },
    '0xd9': {
      mnemonic: 'RETI',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xd9'
    },
    '0xda': {
      mnemonic: 'JP',
      length: 3,
      cycles: [16, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xda',
      operand1: 'C',
      operand2: 'a16'
    },
    '0xdc': {
      mnemonic: 'CALL',
      length: 3,
      cycles: [24, 12],
      flags: ['-', '-', '-', '-'],
      addr: '0xdc',
      operand1: 'C',
      operand2: 'a16'
    },
    '0xde': {
      mnemonic: 'SBC',
      length: 2,
      cycles: [8],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xde',
      operand1: 'A',
      operand2: 'd8'
    },
    '0xdf': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xdf',
      operand1: '18H'
    },
    '0xe0': {
      mnemonic: 'LDH',
      length: 2,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0xe0',
      operand1: '(a8)',
      operand2: 'A'
    },
    '0xe1': {
      mnemonic: 'POP',
      length: 1,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0xe1',
      operand1: 'HL'
    },
    '0xe2': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe2',
      operand1: '(C)',
      operand2: 'A'
    },
    '0xe5': {
      mnemonic: 'PUSH',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xe5',
      operand1: 'HL'
    },
    '0xe6': {
      mnemonic: 'AND',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '0'],
      addr: '0xe6',
      operand1: 'd8'
    },
    '0xe7': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xe7',
      operand1: '20H'
    },
    '0xe8': {
      mnemonic: 'ADD',
      length: 2,
      cycles: [16],
      flags: ['0', '0', 'H', 'C'],
      addr: '0xe8',
      operand1: 'SP',
      operand2: 'r8'
    },
    '0xe9': {
      mnemonic: 'JP',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0xe9',
      operand1: '(HL)'
    },
    '0xea': {
      mnemonic: 'LD',
      length: 3,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xea',
      operand1: '(a16)',
      operand2: 'A'
    },
    '0xee': {
      mnemonic: 'XOR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0xee',
      operand1: 'd8'
    },
    '0xef': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xef',
      operand1: '28H'
    },
    '0xf0': {
      mnemonic: 'LDH',
      length: 2,
      cycles: [12],
      flags: ['-', '-', '-', '-'],
      addr: '0xf0',
      operand1: 'A',
      operand2: '(a8)'
    },
    '0xf1': {
      mnemonic: 'POP',
      length: 1,
      cycles: [12],
      flags: ['Z', 'N', 'H', 'C'],
      addr: '0xf1',
      operand1: 'AF'
    },
    '0xf2': {
      mnemonic: 'LD',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf2',
      operand1: 'A',
      operand2: '(C)'
    },
    '0xf3': {
      mnemonic: 'DI',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0xf3'
    },
    '0xf5': {
      mnemonic: 'PUSH',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xf5',
      operand1: 'AF'
    },
    '0xf6': {
      mnemonic: 'OR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0xf6',
      operand1: 'd8'
    },
    '0xf7': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xf7',
      operand1: '30H'
    },
    '0xf8': {
      mnemonic: 'LD',
      length: 2,
      cycles: [12],
      flags: ['0', '0', 'H', 'C'],
      addr: '0xf8',
      operand1: 'HL',
      operand2: 'SP+r8'
    },
    '0xf9': {
      mnemonic: 'LD',
      length: 1,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf9',
      operand1: 'SP',
      operand2: 'HL'
    },
    '0xfa': {
      mnemonic: 'LD',
      length: 3,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xfa',
      operand1: 'A',
      operand2: '(a16)'
    },
    '0xfb': {
      mnemonic: 'EI',
      length: 1,
      cycles: [4],
      flags: ['-', '-', '-', '-'],
      addr: '0xfb'
    },
    '0xfe': {
      mnemonic: 'CP',
      length: 2,
      cycles: [8],
      flags: ['Z', '1', 'H', 'C'],
      addr: '0xfe',
      operand1: 'd8'
    },
    '0xff': {
      mnemonic: 'RST',
      length: 1,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xff',
      operand1: '38H'
    }
  },
  cbprefixed: {
    '0x0': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x0',
      operand1: 'B'
    },
    '0x1': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x1',
      operand1: 'C'
    },
    '0x2': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x2',
      operand1: 'D'
    },
    '0x3': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x3',
      operand1: 'E'
    },
    '0x4': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x4',
      operand1: 'H'
    },
    '0x5': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x5',
      operand1: 'L'
    },
    '0x6': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x6',
      operand1: '(HL)'
    },
    '0x7': {
      mnemonic: 'RLC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x7',
      operand1: 'A'
    },
    '0x8': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x8',
      operand1: 'B'
    },
    '0x9': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x9',
      operand1: 'C'
    },
    '0xa': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0xa',
      operand1: 'D'
    },
    '0xb': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0xb',
      operand1: 'E'
    },
    '0xc': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0xc',
      operand1: 'H'
    },
    '0xd': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0xd',
      operand1: 'L'
    },
    '0xe': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', 'C'],
      addr: '0xe',
      operand1: '(HL)'
    },
    '0xf': {
      mnemonic: 'RRC',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0xf',
      operand1: 'A'
    },
    '0x10': {
      mnemonic: 'RL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x10',
      operand1: 'B'
    },
    '0x11': {
      mnemonic: 'RL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x11',
      operand1: 'C'
    },
    '0x12': {
      mnemonic: 'RL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x12',
      operand1: 'D'
    },
    '0x13': {
      mnemonic: 'RL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x13',
      operand1: 'E'
    },
    '0x14': {
      mnemonic: 'RL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x14',
      operand1: 'H'
    },
    '0x15': {
      mnemonic: 'RL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x15',
      operand1: 'L'
    },
    '0x16': {
      mnemonic: 'RL',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x16',
      operand1: '(HL)'
    },
    '0x17': {
      mnemonic: 'RL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x17',
      operand1: 'A'
    },
    '0x18': {
      mnemonic: 'RR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x18',
      operand1: 'B'
    },
    '0x19': {
      mnemonic: 'RR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x19',
      operand1: 'C'
    },
    '0x1a': {
      mnemonic: 'RR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x1a',
      operand1: 'D'
    },
    '0x1b': {
      mnemonic: 'RR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x1b',
      operand1: 'E'
    },
    '0x1c': {
      mnemonic: 'RR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x1c',
      operand1: 'H'
    },
    '0x1d': {
      mnemonic: 'RR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x1d',
      operand1: 'L'
    },
    '0x1e': {
      mnemonic: 'RR',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x1e',
      operand1: '(HL)'
    },
    '0x1f': {
      mnemonic: 'RR',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x1f',
      operand1: 'A'
    },
    '0x20': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x20',
      operand1: 'B'
    },
    '0x21': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x21',
      operand1: 'C'
    },
    '0x22': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x22',
      operand1: 'D'
    },
    '0x23': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x23',
      operand1: 'E'
    },
    '0x24': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x24',
      operand1: 'H'
    },
    '0x25': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x25',
      operand1: 'L'
    },
    '0x26': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x26',
      operand1: '(HL)'
    },
    '0x27': {
      mnemonic: 'SLA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x27',
      operand1: 'A'
    },
    '0x28': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x28',
      operand1: 'B'
    },
    '0x29': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x29',
      operand1: 'C'
    },
    '0x2a': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x2a',
      operand1: 'D'
    },
    '0x2b': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x2b',
      operand1: 'E'
    },
    '0x2c': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x2c',
      operand1: 'H'
    },
    '0x2d': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x2d',
      operand1: 'L'
    },
    '0x2e': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', '0'],
      addr: '0x2e',
      operand1: '(HL)'
    },
    '0x2f': {
      mnemonic: 'SRA',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x2f',
      operand1: 'A'
    },
    '0x30': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x30',
      operand1: 'B'
    },
    '0x31': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x31',
      operand1: 'C'
    },
    '0x32': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x32',
      operand1: 'D'
    },
    '0x33': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x33',
      operand1: 'E'
    },
    '0x34': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x34',
      operand1: 'H'
    },
    '0x35': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x35',
      operand1: 'L'
    },
    '0x36': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', '0'],
      addr: '0x36',
      operand1: '(HL)'
    },
    '0x37': {
      mnemonic: 'SWAP',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', '0'],
      addr: '0x37',
      operand1: 'A'
    },
    '0x38': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x38',
      operand1: 'B'
    },
    '0x39': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x39',
      operand1: 'C'
    },
    '0x3a': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x3a',
      operand1: 'D'
    },
    '0x3b': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x3b',
      operand1: 'E'
    },
    '0x3c': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x3c',
      operand1: 'H'
    },
    '0x3d': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x3d',
      operand1: 'L'
    },
    '0x3e': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x3e',
      operand1: '(HL)'
    },
    '0x3f': {
      mnemonic: 'SRL',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '0', 'C'],
      addr: '0x3f',
      operand1: 'A'
    },
    '0x40': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x40',
      operand1: '0',
      operand2: 'B'
    },
    '0x41': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x41',
      operand1: '0',
      operand2: 'C'
    },
    '0x42': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x42',
      operand1: '0',
      operand2: 'D'
    },
    '0x43': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x43',
      operand1: '0',
      operand2: 'E'
    },
    '0x44': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x44',
      operand1: '0',
      operand2: 'H'
    },
    '0x45': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x45',
      operand1: '0',
      operand2: 'L'
    },
    '0x46': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x46',
      operand1: '0',
      operand2: '(HL)'
    },
    '0x47': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x47',
      operand1: '0',
      operand2: 'A'
    },
    '0x48': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x48',
      operand1: '1',
      operand2: 'B'
    },
    '0x49': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x49',
      operand1: '1',
      operand2: 'C'
    },
    '0x4a': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x4a',
      operand1: '1',
      operand2: 'D'
    },
    '0x4b': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x4b',
      operand1: '1',
      operand2: 'E'
    },
    '0x4c': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x4c',
      operand1: '1',
      operand2: 'H'
    },
    '0x4d': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x4d',
      operand1: '1',
      operand2: 'L'
    },
    '0x4e': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x4e',
      operand1: '1',
      operand2: '(HL)'
    },
    '0x4f': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x4f',
      operand1: '1',
      operand2: 'A'
    },
    '0x50': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x50',
      operand1: '2',
      operand2: 'B'
    },
    '0x51': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x51',
      operand1: '2',
      operand2: 'C'
    },
    '0x52': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x52',
      operand1: '2',
      operand2: 'D'
    },
    '0x53': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x53',
      operand1: '2',
      operand2: 'E'
    },
    '0x54': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x54',
      operand1: '2',
      operand2: 'H'
    },
    '0x55': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x55',
      operand1: '2',
      operand2: 'L'
    },
    '0x56': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x56',
      operand1: '2',
      operand2: '(HL)'
    },
    '0x57': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x57',
      operand1: '2',
      operand2: 'A'
    },
    '0x58': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x58',
      operand1: '3',
      operand2: 'B'
    },
    '0x59': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x59',
      operand1: '3',
      operand2: 'C'
    },
    '0x5a': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x5a',
      operand1: '3',
      operand2: 'D'
    },
    '0x5b': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x5b',
      operand1: '3',
      operand2: 'E'
    },
    '0x5c': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x5c',
      operand1: '3',
      operand2: 'H'
    },
    '0x5d': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x5d',
      operand1: '3',
      operand2: 'L'
    },
    '0x5e': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x5e',
      operand1: '3',
      operand2: '(HL)'
    },
    '0x5f': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x5f',
      operand1: '3',
      operand2: 'A'
    },
    '0x60': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x60',
      operand1: '4',
      operand2: 'B'
    },
    '0x61': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x61',
      operand1: '4',
      operand2: 'C'
    },
    '0x62': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x62',
      operand1: '4',
      operand2: 'D'
    },
    '0x63': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x63',
      operand1: '4',
      operand2: 'E'
    },
    '0x64': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x64',
      operand1: '4',
      operand2: 'H'
    },
    '0x65': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x65',
      operand1: '4',
      operand2: 'L'
    },
    '0x66': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x66',
      operand1: '4',
      operand2: '(HL)'
    },
    '0x67': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x67',
      operand1: '4',
      operand2: 'A'
    },
    '0x68': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x68',
      operand1: '5',
      operand2: 'B'
    },
    '0x69': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x69',
      operand1: '5',
      operand2: 'C'
    },
    '0x6a': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x6a',
      operand1: '5',
      operand2: 'D'
    },
    '0x6b': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x6b',
      operand1: '5',
      operand2: 'E'
    },
    '0x6c': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x6c',
      operand1: '5',
      operand2: 'H'
    },
    '0x6d': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x6d',
      operand1: '5',
      operand2: 'L'
    },
    '0x6e': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x6e',
      operand1: '5',
      operand2: '(HL)'
    },
    '0x6f': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x6f',
      operand1: '5',
      operand2: 'A'
    },
    '0x70': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x70',
      operand1: '6',
      operand2: 'B'
    },
    '0x71': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x71',
      operand1: '6',
      operand2: 'C'
    },
    '0x72': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x72',
      operand1: '6',
      operand2: 'D'
    },
    '0x73': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x73',
      operand1: '6',
      operand2: 'E'
    },
    '0x74': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x74',
      operand1: '6',
      operand2: 'H'
    },
    '0x75': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x75',
      operand1: '6',
      operand2: 'L'
    },
    '0x76': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x76',
      operand1: '6',
      operand2: '(HL)'
    },
    '0x77': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x77',
      operand1: '6',
      operand2: 'A'
    },
    '0x78': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x78',
      operand1: '7',
      operand2: 'B'
    },
    '0x79': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x79',
      operand1: '7',
      operand2: 'C'
    },
    '0x7a': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x7a',
      operand1: '7',
      operand2: 'D'
    },
    '0x7b': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x7b',
      operand1: '7',
      operand2: 'E'
    },
    '0x7c': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x7c',
      operand1: '7',
      operand2: 'H'
    },
    '0x7d': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x7d',
      operand1: '7',
      operand2: 'L'
    },
    '0x7e': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [16],
      flags: ['Z', '0', '1', '-'],
      addr: '0x7e',
      operand1: '7',
      operand2: '(HL)'
    },
    '0x7f': {
      mnemonic: 'BIT',
      length: 2,
      cycles: [8],
      flags: ['Z', '0', '1', '-'],
      addr: '0x7f',
      operand1: '7',
      operand2: 'A'
    },
    '0x80': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x80',
      operand1: '0',
      operand2: 'B'
    },
    '0x81': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x81',
      operand1: '0',
      operand2: 'C'
    },
    '0x82': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x82',
      operand1: '0',
      operand2: 'D'
    },
    '0x83': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x83',
      operand1: '0',
      operand2: 'E'
    },
    '0x84': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x84',
      operand1: '0',
      operand2: 'H'
    },
    '0x85': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x85',
      operand1: '0',
      operand2: 'L'
    },
    '0x86': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0x86',
      operand1: '0',
      operand2: '(HL)'
    },
    '0x87': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x87',
      operand1: '0',
      operand2: 'A'
    },
    '0x88': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x88',
      operand1: '1',
      operand2: 'B'
    },
    '0x89': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x89',
      operand1: '1',
      operand2: 'C'
    },
    '0x8a': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x8a',
      operand1: '1',
      operand2: 'D'
    },
    '0x8b': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x8b',
      operand1: '1',
      operand2: 'E'
    },
    '0x8c': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x8c',
      operand1: '1',
      operand2: 'H'
    },
    '0x8d': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x8d',
      operand1: '1',
      operand2: 'L'
    },
    '0x8e': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0x8e',
      operand1: '1',
      operand2: '(HL)'
    },
    '0x8f': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x8f',
      operand1: '1',
      operand2: 'A'
    },
    '0x90': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x90',
      operand1: '2',
      operand2: 'B'
    },
    '0x91': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x91',
      operand1: '2',
      operand2: 'C'
    },
    '0x92': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x92',
      operand1: '2',
      operand2: 'D'
    },
    '0x93': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x93',
      operand1: '2',
      operand2: 'E'
    },
    '0x94': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x94',
      operand1: '2',
      operand2: 'H'
    },
    '0x95': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x95',
      operand1: '2',
      operand2: 'L'
    },
    '0x96': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0x96',
      operand1: '2',
      operand2: '(HL)'
    },
    '0x97': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x97',
      operand1: '2',
      operand2: 'A'
    },
    '0x98': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x98',
      operand1: '3',
      operand2: 'B'
    },
    '0x99': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x99',
      operand1: '3',
      operand2: 'C'
    },
    '0x9a': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x9a',
      operand1: '3',
      operand2: 'D'
    },
    '0x9b': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x9b',
      operand1: '3',
      operand2: 'E'
    },
    '0x9c': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x9c',
      operand1: '3',
      operand2: 'H'
    },
    '0x9d': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x9d',
      operand1: '3',
      operand2: 'L'
    },
    '0x9e': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0x9e',
      operand1: '3',
      operand2: '(HL)'
    },
    '0x9f': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0x9f',
      operand1: '3',
      operand2: 'A'
    },
    '0xa0': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa0',
      operand1: '4',
      operand2: 'B'
    },
    '0xa1': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa1',
      operand1: '4',
      operand2: 'C'
    },
    '0xa2': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa2',
      operand1: '4',
      operand2: 'D'
    },
    '0xa3': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa3',
      operand1: '4',
      operand2: 'E'
    },
    '0xa4': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa4',
      operand1: '4',
      operand2: 'H'
    },
    '0xa5': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa5',
      operand1: '4',
      operand2: 'L'
    },
    '0xa6': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xa6',
      operand1: '4',
      operand2: '(HL)'
    },
    '0xa7': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa7',
      operand1: '4',
      operand2: 'A'
    },
    '0xa8': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa8',
      operand1: '5',
      operand2: 'B'
    },
    '0xa9': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xa9',
      operand1: '5',
      operand2: 'C'
    },
    '0xaa': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xaa',
      operand1: '5',
      operand2: 'D'
    },
    '0xab': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xab',
      operand1: '5',
      operand2: 'E'
    },
    '0xac': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xac',
      operand1: '5',
      operand2: 'H'
    },
    '0xad': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xad',
      operand1: '5',
      operand2: 'L'
    },
    '0xae': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xae',
      operand1: '5',
      operand2: '(HL)'
    },
    '0xaf': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xaf',
      operand1: '5',
      operand2: 'A'
    },
    '0xb0': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb0',
      operand1: '6',
      operand2: 'B'
    },
    '0xb1': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb1',
      operand1: '6',
      operand2: 'C'
    },
    '0xb2': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb2',
      operand1: '6',
      operand2: 'D'
    },
    '0xb3': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb3',
      operand1: '6',
      operand2: 'E'
    },
    '0xb4': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb4',
      operand1: '6',
      operand2: 'H'
    },
    '0xb5': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb5',
      operand1: '6',
      operand2: 'L'
    },
    '0xb6': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xb6',
      operand1: '6',
      operand2: '(HL)'
    },
    '0xb7': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb7',
      operand1: '6',
      operand2: 'A'
    },
    '0xb8': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb8',
      operand1: '7',
      operand2: 'B'
    },
    '0xb9': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xb9',
      operand1: '7',
      operand2: 'C'
    },
    '0xba': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xba',
      operand1: '7',
      operand2: 'D'
    },
    '0xbb': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xbb',
      operand1: '7',
      operand2: 'E'
    },
    '0xbc': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xbc',
      operand1: '7',
      operand2: 'H'
    },
    '0xbd': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xbd',
      operand1: '7',
      operand2: 'L'
    },
    '0xbe': {
      mnemonic: 'RES',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xbe',
      operand1: '7',
      operand2: '(HL)'
    },
    '0xbf': {
      mnemonic: 'RES',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xbf',
      operand1: '7',
      operand2: 'A'
    },
    '0xc0': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc0',
      operand1: '0',
      operand2: 'B'
    },
    '0xc1': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc1',
      operand1: '0',
      operand2: 'C'
    },
    '0xc2': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc2',
      operand1: '0',
      operand2: 'D'
    },
    '0xc3': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc3',
      operand1: '0',
      operand2: 'E'
    },
    '0xc4': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc4',
      operand1: '0',
      operand2: 'H'
    },
    '0xc5': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc5',
      operand1: '0',
      operand2: 'L'
    },
    '0xc6': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xc6',
      operand1: '0',
      operand2: '(HL)'
    },
    '0xc7': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc7',
      operand1: '0',
      operand2: 'A'
    },
    '0xc8': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc8',
      operand1: '1',
      operand2: 'B'
    },
    '0xc9': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xc9',
      operand1: '1',
      operand2: 'C'
    },
    '0xca': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xca',
      operand1: '1',
      operand2: 'D'
    },
    '0xcb': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xcb',
      operand1: '1',
      operand2: 'E'
    },
    '0xcc': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xcc',
      operand1: '1',
      operand2: 'H'
    },
    '0xcd': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xcd',
      operand1: '1',
      operand2: 'L'
    },
    '0xce': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xce',
      operand1: '1',
      operand2: '(HL)'
    },
    '0xcf': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xcf',
      operand1: '1',
      operand2: 'A'
    },
    '0xd0': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd0',
      operand1: '2',
      operand2: 'B'
    },
    '0xd1': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd1',
      operand1: '2',
      operand2: 'C'
    },
    '0xd2': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd2',
      operand1: '2',
      operand2: 'D'
    },
    '0xd3': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd3',
      operand1: '2',
      operand2: 'E'
    },
    '0xd4': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd4',
      operand1: '2',
      operand2: 'H'
    },
    '0xd5': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd5',
      operand1: '2',
      operand2: 'L'
    },
    '0xd6': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xd6',
      operand1: '2',
      operand2: '(HL)'
    },
    '0xd7': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd7',
      operand1: '2',
      operand2: 'A'
    },
    '0xd8': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd8',
      operand1: '3',
      operand2: 'B'
    },
    '0xd9': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xd9',
      operand1: '3',
      operand2: 'C'
    },
    '0xda': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xda',
      operand1: '3',
      operand2: 'D'
    },
    '0xdb': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xdb',
      operand1: '3',
      operand2: 'E'
    },
    '0xdc': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xdc',
      operand1: '3',
      operand2: 'H'
    },
    '0xdd': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xdd',
      operand1: '3',
      operand2: 'L'
    },
    '0xde': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xde',
      operand1: '3',
      operand2: '(HL)'
    },
    '0xdf': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xdf',
      operand1: '3',
      operand2: 'A'
    },
    '0xe0': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe0',
      operand1: '4',
      operand2: 'B'
    },
    '0xe1': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe1',
      operand1: '4',
      operand2: 'C'
    },
    '0xe2': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe2',
      operand1: '4',
      operand2: 'D'
    },
    '0xe3': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe3',
      operand1: '4',
      operand2: 'E'
    },
    '0xe4': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe4',
      operand1: '4',
      operand2: 'H'
    },
    '0xe5': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe5',
      operand1: '4',
      operand2: 'L'
    },
    '0xe6': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xe6',
      operand1: '4',
      operand2: '(HL)'
    },
    '0xe7': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe7',
      operand1: '4',
      operand2: 'A'
    },
    '0xe8': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe8',
      operand1: '5',
      operand2: 'B'
    },
    '0xe9': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xe9',
      operand1: '5',
      operand2: 'C'
    },
    '0xea': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xea',
      operand1: '5',
      operand2: 'D'
    },
    '0xeb': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xeb',
      operand1: '5',
      operand2: 'E'
    },
    '0xec': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xec',
      operand1: '5',
      operand2: 'H'
    },
    '0xed': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xed',
      operand1: '5',
      operand2: 'L'
    },
    '0xee': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xee',
      operand1: '5',
      operand2: '(HL)'
    },
    '0xef': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xef',
      operand1: '5',
      operand2: 'A'
    },
    '0xf0': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf0',
      operand1: '6',
      operand2: 'B'
    },
    '0xf1': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf1',
      operand1: '6',
      operand2: 'C'
    },
    '0xf2': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf2',
      operand1: '6',
      operand2: 'D'
    },
    '0xf3': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf3',
      operand1: '6',
      operand2: 'E'
    },
    '0xf4': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf4',
      operand1: '6',
      operand2: 'H'
    },
    '0xf5': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf5',
      operand1: '6',
      operand2: 'L'
    },
    '0xf6': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xf6',
      operand1: '6',
      operand2: '(HL)'
    },
    '0xf7': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf7',
      operand1: '6',
      operand2: 'A'
    },
    '0xf8': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf8',
      operand1: '7',
      operand2: 'B'
    },
    '0xf9': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xf9',
      operand1: '7',
      operand2: 'C'
    },
    '0xfa': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xfa',
      operand1: '7',
      operand2: 'D'
    },
    '0xfb': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xfb',
      operand1: '7',
      operand2: 'E'
    },
    '0xfc': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xfc',
      operand1: '7',
      operand2: 'H'
    },
    '0xfd': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xfd',
      operand1: '7',
      operand2: 'L'
    },
    '0xfe': {
      mnemonic: 'SET',
      length: 2,
      cycles: [16],
      flags: ['-', '-', '-', '-'],
      addr: '0xfe',
      operand1: '7',
      operand2: '(HL)'
    },
    '0xff': {
      mnemonic: 'SET',
      length: 2,
      cycles: [8],
      flags: ['-', '-', '-', '-'],
      addr: '0xff',
      operand1: '7',
      operand2: 'A'
    }
  }
};
var _default = opcodes;
exports.default = _default;
},{}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _infoManager = _interopRequireDefault(require("./info-manager"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint no-bitwise: 0 */

/* eslint no-console: 0 */
var getHex = function getHex(pc) {
  return "".concat((pc & 0xFFFF).toString(16));
};

var Recorder =
/*#__PURE__*/
function () {
  function Recorder() {
    _classCallCheck(this, Recorder);

    this.history = new Array(100);
    this.pos = 0;
    this.opcodeInfo = new _infoManager.default();
  }

  _createClass(Recorder, [{
    key: "getPreviousRecord",
    value: function getPreviousRecord(offset) {
      var cur = Math.abs((this.pos - 1 - offset) % this.history.length);
      return this.history[cur];
    }
  }, {
    key: "record",
    value: function record(op) {
      var pc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
      var state = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      this.history[this.pos] = {
        op: op,
        pc: pc,
        state: state
      };
      this.pos = (this.pos + 1) % this.history.length;
    }
    /* istanbul ignore next */

  }, {
    key: "printCurrent",
    value: function printCurrent(op, pc, clock, state) {
      console.log(this.getCurrent(op, pc, clock, state));
    }
  }, {
    key: "getCurrent",
    value: function getCurrent(op, pc, clock, state) {
      var info = this.opcodeInfo.getDescription(op);
      var hexPc = getHex(pc);

      if (!state) {
        return "".concat(hexPc, ", ").concat(getHex(op), ", ").concat(info);
      }

      return "".concat(hexPc, ", ").concat(getHex(op), ", ").concat(info, " \n      A:").concat(state.a, " B:").concat(state.b, " C:").concat(state.c, " D:").concat(state.d, " E:").concat(state.e, " F:").concat(state.f, " H:").concat(state.h, " L:").concat(state.l, " SP:").concat(state.sp, " ").concat(clock);
    }
    /* istanbul ignore next */

  }, {
    key: "printHistory",
    value: function printHistory() {
      console.log(this.getHistory());
    }
  }, {
    key: "getHistory",
    value: function getHistory() {
      var historyInOrder = [];

      for (var i = 0; i < this.history.length; i += 1) {
        var cur = Math.abs((this.pos - 1 - i) % this.history.length);

        if (this.history[cur]) {
          var hist = this.history[cur];
          var instr = this.getCurrent(hist.op, hist.pc, '', hist.state);
          historyInOrder.push(instr);
        } else {
          historyInOrder.push('----');
        }
      }

      return historyInOrder;
    }
  }]);

  return Recorder;
}();

exports.default = Recorder;
},{"./info-manager":37}]},{},[1])(1)
});

//# sourceMappingURL=gameboy.js.map
