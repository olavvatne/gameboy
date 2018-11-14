(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/* global document window Gameboy FileReader */
var gameboy = null;
var data = null;

var initGameboy = function initGameboy() {
  var c = document.getElementById('screen');
  gameboy = new Gameboy(c.getContext('2d'));
};

var handleRomSelect = function handleRomSelect(evt) {
  // TODO: Only called once for some reason?
  if (evt.target.files.length < 1) return;
  var localRom = evt.target.files[0];
  var rd = new FileReader();

  rd.onload = function (event) {
    data = event.target.result;
  };

  rd.readAsArrayBuffer(localRom);
};

window.onload = function () {
  initGameboy();

  document.getElementById('start').onclick = function () {
    return gameboy.start(data);
  };

  document.getElementById('pause').onclick = function () {
    return gameboy.pause();
  };

  document.getElementById('reset').onclick = function () {
    return gameboy.reset();
  };

  document.addEventListener('keydown', function (e) {
    return gameboy.io.handleKeyDown(e);
  });
  document.addEventListener('keyup', function (e) {
    return gameboy.io.handleKeyUp(e);
  });
  document.getElementById('load').addEventListener('change', function (e) {
    return handleRomSelect(e);
  }, false);
};

},{}]},{},[1]);
