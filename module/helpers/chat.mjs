/**
 * Chat cards: building them, and wiring up their buttons.
 * @module jamesian-dark/helpers/chat
 */

import JD, { SYSTEM_ID } from "../config.mjs";

const { renderTemplate } = foundry.applications.handlebars;

const CARD = `systems/${SYSTEM_ID}/templates/chat/card.hbs`;

/** Shorthand for localisation. */
export const t = (key, data) => data ? game.i18n.format(key, data) : game.i18n.localize(key);

/** Escape text supplied by a user before it goes into a card. */
export const esc = s => foundry.utils.escapeHTML(String(s ?? ""));

/**
 * Describe a die for the card template.
 * @param {"light"|"scholar"|"meddle"|"notice"|"failure"} type
 * @param {number} value
 * @param {boolean} [top=false]   Is this die the one that is read?
 * @returns {object}
 */
export function dieFace(type, value, top = false) {
  return { type, value, top, label: t(JD.dice[type].label) };
}

/**
 * Render and post a card.
 * @param {object} data                   Template data: tone, kicker, title, quote, dice, result, lines, track, buttons.
 * @param {object} [options]
 * @param {Actor} [options.actor]         The actor the card concerns.
 * @param {Roll[]} [options.rolls]        Rolls to attach, so that 3D dice are shown.
 * @param {object} [options.flags]        System flags to store on the message.
 * @param {string[]} [options.whisper]    User ids to whisper to.
 * @returns {Promise<ChatMessage>}
 */
export async function postCard(data, { actor = null, rolls = [], flags = {}, whisper = [] } = {}) {
  const content = await renderCard(data, actor);
  const messageData = {
    content,
    speaker: ChatMessage.getSpeaker({ actor }),
    flags: { [SYSTEM_ID]: { actorUuid: actor?.uuid ?? null, card: data, ...flags } }
  };
  if ( rolls.length ) {
    messageData.rolls = rolls;
    messageData.sound = CONFIG.sounds.dice;
  }
  if ( whisper.length ) messageData.whisper = whisper;
  return ChatMessage.create(messageData);
}

/**
 * Render card HTML.
 * @param {object} data
 * @param {Actor} [actor]
 * @returns {Promise<string>}
 */
export function renderCard(data, actor = null) {
  return renderTemplate(CARD, { img: actor?.img, actorUuid: actor?.uuid, ...data });
}

/**
 * Re-render a card that has already been posted, with some of its data changed.
 * @param {ChatMessage} message
 * @param {object} changes       Changes to the stored card data.
 * @param {object} [flags]       Further flag changes.
 */
export async function updateCard(message, changes, flags = {}) {
  const stored = message.getFlag(SYSTEM_ID, "card") ?? {};
  const data = { ...stored, ...changes };
  const actor = await actorOf(message);
  const content = await renderCard(data, actor);
  return message.update({ content, [`flags.${SYSTEM_ID}`]: { card: data, ...flags } });
}

/**
 * The actor a card concerns.
 * @param {ChatMessage} message
 * @returns {Promise<Actor|null>}
 */
export async function actorOf(message) {
  const uuid = message.getFlag(SYSTEM_ID, "actorUuid");
  return uuid ? fromUuid(uuid) : null;
}

/* -------------------------------------------- */
/*  Rendering hook                              */
/* -------------------------------------------- */

/**
 * Wire up a rendered chat message. V14 hands us a plain HTMLElement.
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
export function onRenderChatMessage(message, html) {
  const card = html.querySelector?.(".jd-card");
  if ( !card ) return;
  html.classList.add("jd-message");

  const flags = message.flags?.[SYSTEM_ID] ?? {};
  if ( flags.superseded ) card.classList.add("is-superseded");

  const actor = flags.actorUuid ? fromUuidSync(flags.actorUuid) : null;
  for ( const button of card.querySelectorAll("[data-jd-action]") ) {
    const who = button.dataset.jdWho;
    const allowed = (who === "gm") ? game.user.isGM
      : (who === "owner") ? !!actor?.isOwner
        : true;
    if ( !allowed || flags.superseded ) { button.remove(); continue; }
    button.addEventListener("click", event => onCardAction(event, message, actor));
  }
  const bar = card.querySelector(".jd-card__buttons");
  if ( bar && !bar.children.length ) bar.remove();
}

/**
 * Dispatch a click on a card button.
 * @param {PointerEvent} event
 * @param {ChatMessage} message
 * @param {Actor|null} actor
 */
async function onCardAction(event, message, actor) {
  event.preventDefault();
  const button = event.currentTarget;
  if ( button.disabled ) return;
  button.disabled = true;
  try {
    switch ( button.dataset.jdAction ) {
      case "tryAgain": return await actor?.tryAgain(message);
      case "failureDie":
        return await actor?.failureDie({ highest: message.getFlag(SYSTEM_ID, "highest"), by: game.user });
      case "callNotice":
        await actor?.noticeRoll({ reason: "called" });
        return await updateCard(message, { buttons: withoutButton(message, "callNotice") });
      default: return null;
    }
  } finally {
    button.disabled = false;
  }
}

/** The buttons of a stored card, minus one. */
function withoutButton(message, action) {
  const buttons = message.getFlag(SYSTEM_ID, "card")?.buttons ?? [];
  return buttons.filter(b => b.action !== action);
}
