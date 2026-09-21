// ==UserScript==
// @name         Hide YouTube End Cards (reveal on hover)
// @namespace    https://github.com/VitaKaninen
// @version      1.2.0
// @description  Keeps YouTube's end-screen cards and in-video info cards out of the way: cards stay hidden until the cursor has rested on the player for a delay you set, so a click meant to pause the video never lands on a card. Revealing only uncovers cards YouTube would already be showing. The delay is adjustable from the userscript menu.
// @author       VitaKaninen
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @downloadURL  https://raw.githubusercontent.com/VitaKaninen/Hide-YouTube-End-Cards/main/Hide-YouTube-End-Cards.user.js
// @updateURL    https://raw.githubusercontent.com/VitaKaninen/Hide-YouTube-End-Cards/main/Hide-YouTube-End-Cards.user.js
// ==/UserScript==

(function () {
  "use strict";

  const STORE_KEY = "revealDelaySeconds";
  const DEFAULT_DELAY = 2;

  // Read the stored delay, falling back to the default if it's missing or junk.
  function getDelay() {
    const v = Number(GM_getValue(STORE_KEY, DEFAULT_DELAY));
    return Number.isFinite(v) && v >= 0 ? v : DEFAULT_DELAY;
  }

  // One <style> node we own, so the rules can be rebuilt whenever the delay changes.
  let styleTag = null;
  function applyStyles() {
    if (!styleTag) {
      styleTag = document.createElement("style");
      (document.head || document.documentElement).appendChild(styleTag);
    }
    const delay = getDelay();

    // No rule ever forces a card visible:
    //  - Cursor off the player: cards held hidden. visibility:hidden also stops
    //    them intercepting clicks, so a click meant to pause reaches the video.
    //  - Cursor on the player: the hidden override is released after the delay,
    //    with no "visible" set, so YouTube's own state decides the outcome. A card
    //    shows only once the delay has elapsed AND YouTube would have shown it.
    //  - Leaving re-applies the hidden rule at 0s, so cards vanish instantly.
    // End-screen cards: div[class^="ytp-ce"]. Info-card teaser + "i" button (top right):
    // .ytp-cards-teaser, .ytp-cards-button.
    const CARDS = 'div[class^="ytp-ce"], .ytp-cards-teaser, .ytp-cards-button';
    styleTag.textContent = `
      div[class*="video-player"]:not(:hover) :is(${CARDS}) {
        visibility: hidden !important;
        transition: visibility 0s !important;
      }
      div[class*="video-player"]:hover :is(${CARDS}) {
        transition: visibility 0s ${delay}s !important;
      }
    `;
  }

  // The "Settings" entry in the userscript-manager menu. Its label shows the
  // current delay; clicking it prompts for a new one and applies it immediately.
  let menuId = null;
  function registerMenu() {
    const newId = GM_registerMenuCommand(
      `Hover delay: ${getDelay()}s (click to change)`,
      onSettings
    );
    if (menuId != null && typeof GM_unregisterMenuCommand === "function") {
      GM_unregisterMenuCommand(menuId); // drop the entry with the stale label
    }
    menuId = newId;
  }

  function onSettings() {
    const input = prompt(
      "Seconds to hover before end cards appear (0 = no delay):",
      String(getDelay())
    );
    if (input === null) return; // cancelled
    const trimmed = input.trim();
    if (trimmed === "") return; // left blank: no change
    const next = Number(trimmed);
    if (!Number.isFinite(next) || next < 0) {
      alert("Please enter a number of seconds (0 or greater).");
      return;
    }
    GM_setValue(STORE_KEY, next);
    applyStyles();   // live update, no reload
    registerMenu();  // refresh the menu label
  }

  applyStyles();
  registerMenu();
})();