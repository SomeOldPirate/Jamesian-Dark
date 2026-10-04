/**
 * Atmosphere: the things that happen at the edge of the screen.
 * @module jamesian-dark/helpers/effects
 */

import JD, { SYSTEM_ID } from "../config.mjs";

/** Are atmospheric effects switched on for this client? */
const enabled = () => game.settings.get(SYSTEM_ID, "atmosphere");

/* -------------------------------------------- */
/*  Notice                                      */
/* -------------------------------------------- */

/**
 * Notice has changed. Runs on every client.
 * @param {Actor} actor
 * @param {number} before
 * @param {number} after
 */
export function onNoticeChanged(actor, before, after) {
  refreshAmbience();
  if ( !enabled() || !(after > before) ) return;
  // Only the people it concerns feel it: the character's own players.
  const mine = (game.user.character === actor) || (!game.user.isGM && actor.isOwner);
  if ( !mine ) return;
  pulse();
  if ( game.settings.get(SYSTEM_ID, "sounds") ) {
    foundry.audio.AudioHelper.play({ src: "sounds/lock.wav", volume: 0.35, autoplay: true, loop: false }, false);
  }
}

/** A brief darkening at the edges of the screen. */
function pulse() {
  const el = document.createElement("div");
  el.className = "jd-pulse";
  document.body.append(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 4000);
}

/**
 * The higher your character's Notice, the closer the dark sits around the screen.
 * Game Masters are spared.
 */
export function refreshAmbience() {
  const body = document.body;
  const character = game.user?.character;
  const on = enabled() && !game.user.isGM && (character?.type === "investigator") && !character.system.departed;
  if ( on ) body.dataset.jdNotice = String(character.system.notice.value);
  else delete body.dataset.jdNotice;
}

/* -------------------------------------------- */
/*  Dice So Nice                                */
/* -------------------------------------------- */

/**
 * Give the three kinds of die their own look when Dice So Nice is installed:
 * bone for Light, oxblood for Meddle, black for Notice.
 * @param {object} dice3d
 */
export function registerDiceSoNice(dice3d) {
  const category = "Jamesian Dark";
  dice3d.addColorset({
    name: JD.dice.light.colorset, description: game.i18n.localize("JD.Die.light"), category,
    foreground: "#2b2118", background: "#e9dfc6", outline: "none", edge: "#cfc3a3",
    texture: "none", material: "plastic", visibility: "visible"
  }, "default");
  dice3d.addColorset({
    name: JD.dice.meddle.colorset, description: game.i18n.localize("JD.Die.meddle"), category,
    foreground: "#f1e3c8", background: "#7a1c1c", outline: "none", edge: "#4f0f0f",
    texture: "none", material: "plastic", visibility: "visible"
  }, "default");
  dice3d.addColorset({
    name: JD.dice.notice.colorset, description: game.i18n.localize("JD.Die.notice"), category,
    foreground: "#c9d2cc", background: "#0d0d0f", outline: "none", edge: "#000000",
    texture: "none", material: "glass", visibility: "visible"
  }, "default");
  dice3d.addColorset({
    name: JD.dice.failure.colorset, description: game.i18n.localize("JD.Die.failure"), category,
    foreground: "#e9dfc6", background: "#4a4a44", outline: "none", edge: "#2c2c28",
    texture: "none", material: "plastic", visibility: "visible"
  }, "default");
}
