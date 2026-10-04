/**
 * The Actor document. Investigators carry the dice: the pool, the Notice roll,
 * meddling, trying again, the Failure Die, leaving, and the Visit.
 * @module jamesian-dark/documents/actor
 */

import JD, { SYSTEM_ID } from "../config.mjs";
import * as Rules from "../dice/rules.mjs";
import { promptPool } from "../dice/dialog.mjs";
import { postCard, dieFace, t, esc } from "../helpers/chat.mjs";
import * as Effects from "../helpers/effects.mjs";

const { DialogV2 } = foundry.applications.api;

const DEFAULT_IMAGES = {
  investigator: `systems/${SYSTEM_ID}/assets/icons/investigator.svg`,
  haunting: `systems/${SYSTEM_ID}/assets/icons/haunting.svg`
};

export default class JDActor extends Actor {

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ( (await super._preCreate(data, options, user)) === false ) return false;
    const updates = {};
    const img = DEFAULT_IMAGES[this.type];
    if ( img && (!data.img || (data.img === CONST.DEFAULT_TOKEN)) ) {
      updates.img = img;
      updates["prototypeToken.texture.src"] = img;
    }
    if ( this.type === "investigator" ) {
      updates["prototypeToken.actorLink"] = true;
      updates["prototypeToken.disposition"] = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
      updates["prototypeToken.sight.enabled"] = true;
    }
    this.updateSource(updates);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate(changed, options, user) {
    if ( (await super._preUpdate(changed, options, user)) === false ) return false;
    // Remember the old Notice so that every client can react to the change.
    if ( (this.type === "investigator") && foundry.utils.hasProperty(changed, "system.notice.value") ) {
      options.jdNoticeBefore = this.system.notice.value;
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if ( this.type !== "investigator" ) return;
    if ( foundry.utils.hasProperty(changed, "system.notice.value") ) {
      Effects.onNoticeChanged(this, options.jdNoticeBefore, this.system.notice.value);
    }
  }

  /* -------------------------------------------- */
  /*  Convenience                                 */
  /* -------------------------------------------- */

  /** Current Notice, for investigators. */
  get notice() {
    return this.system.notice?.value ?? JD.noticeMin;
  }

  /** Is this an investigator? Most of what follows applies to them alone. */
  get isInvestigator() {
    return this.type === "investigator";
  }

  /** Template data for a row of Notice pips. */
  noticeTrack(before = null) {
    const value = this.notice;
    return {
      value,
      pips: Array.from({ length: JD.noticeMax }, (_, i) => ({
        on: i < value,
        fresh: (before !== null) && (i >= before) && (i < value)
      }))
    };
  }

  /* -------------------------------------------- */
  /*  The pool                                    */
  /* -------------------------------------------- */

  /**
   * Ask the player what goes into the pool, then roll it.
   * @param {object} [preset]   Initial dialog state: kind, human, scholar, notice, meddle.
   * @returns {Promise<ChatMessage|null>}
   */
  async promptRoll(preset = {}) {
    if ( !this.isInvestigator ) return null;
    const config = await promptPool(this, preset);
    if ( !config ) return null;
    return this.rollPool(config);
  }

  /* -------------------------------------------- */

  /**
   * Build a pool, roll it, read the highest die, and apply everything that follows.
   * @param {object} config
   * @param {"investigate"|"other"} [config.kind="other"]
   * @param {boolean} [config.human=true]      A Light die: within human capability.
   * @param {boolean} [config.scholar=false]   A Light die: within your occupation or scholarly interest.
   * @param {boolean} [config.notice=false]    The Notice die: you risk your mind.
   * @param {boolean} [config.meddle=false]    The Meddle die.
   * @param {boolean} [config.reroll=false]    Is this a second attempt?
   * @returns {Promise<ChatMessage|null>}
   */
  async rollPool({
    kind = "other", human = true, scholar = false, notice = false, meddle = false, reroll = false
  } = {}) {
    if ( !this.isInvestigator ) return null;
    const types = [];
    if ( human ) types.push("light");
    if ( scholar ) types.push("scholar");
    if ( meddle ) types.push("meddle");
    if ( notice ) types.push("notice");
    if ( !types.length ) {
      ui.notifications.warn(t("JD.Roll.empty"));
      return null;
    }

    // Roll one die of each kind, each in its own colour.
    const roll = new Roll(types.map(type => `1d6[${t(JD.dice[type].label)}]`).join(" + "));
    roll.dice.forEach((die, i) => die.options.appearance = { colorset: JD.dice[types[i]].colorset });
    await roll.evaluate();
    const results = types.map((type, i) => ({ type, value: roll.dice[i].total }));
    const valueOf = type => results.find(r => r.type === type)?.value ?? null;

    const before = this.notice;
    const outcome = Rules.resolvePool({
      light: results.filter(r => (r.type === "light") || (r.type === "scholar")).map(r => r.value),
      notice: valueOf("notice"),
      meddle: valueOf("meddle")
    }, {
      kind,
      noticeTies: game.settings.get(SYSTEM_ID, "noticeTies")
    });

    // Meddling that was remarked raises Notice at once. Whether this transgression has
    // already counted is for the table to say; the GM can step Notice back.
    if ( outcome.meddleRemarked && (before < JD.noticeMax) ) await this.update({ "system.notice.value": before + 1 });
    const after = this.notice;

    // What the card says.
    const lines = [];
    if ( meddle ) {
      if ( outcome.meddleRemarked && (after > before) ) {
        lines.push({ icon: "fa-solid fa-eye", tone: "warn", text: t("JD.Roll.line.meddleRemarked", { notice: after }) });
      } else if ( outcome.meddleRemarked ) {
        lines.push({ icon: "fa-solid fa-eye", tone: "warn", text: t("JD.Roll.line.meddleRemarkedMax") });
      } else {
        lines.push({ icon: "fa-solid fa-eye-slash", text: t("JD.Roll.line.meddleUnremarked") });
      }
    }
    for ( const reason of outcome.noticeRollReasons ) {
      lines.push({ icon: "fa-solid fa-dice-d6", tone: "warn", text: t(`JD.Roll.line.${reason}`) });
    }
    if ( outcome.gmMayCall ) lines.push({ icon: "fa-solid fa-triangle-exclamation", text: t("JD.Roll.line.gmMayCall") });

    const again = Rules.tryAgain({ notice });
    const buttons = [{
      action: "tryAgain", who: "owner", icon: "fa-solid fa-rotate",
      label: t(again.addNotice ? "JD.Roll.tryAgainAdd" : "JD.Roll.tryAgainRoll")
    }];
    if ( kind === "other" ) {
      buttons.push({ action: "failureDie", who: "all", icon: "fa-solid fa-dice-one", label: t("JD.Failure.button") });
    }
    if ( outcome.gmMayCall ) {
      buttons.push({ action: "callNotice", who: "gm", icon: "fa-solid fa-eye", label: t("JD.Roll.callNotice") });
    }

    const kindLabel = t(JD.rollKinds[kind].label);
    const message = await postCard({
      tone: "roll",
      kicker: reroll ? t("JD.Roll.again", { kind: kindLabel }) : kindLabel,
      title: this.name,
      dice: results.map(r => dieFace(r.type, r.value, r.value === outcome.highest)),
      result: { value: outcome.highest, text: t(`JD.Outcome.${kind}.${outcome.band}`) },
      lines,
      track: (after !== before) ? this.noticeTrack(before) : null,
      buttons
    }, {
      actor: this,
      rolls: [roll],
      flags: {
        type: "roll",
        highest: outcome.highest,
        pool: { kind, human, scholar, notice, meddle }
      }
    });

    // "Notice rises by 1, then make a Notice roll."
    if ( outcome.noticeRoll ) await this.noticeRoll({ reason: outcome.noticeRollReasons[0], check: false });
    await this.checkFate(before);
    return message;
  }

  /* -------------------------------------------- */
  /*  Notice                                      */
  /* -------------------------------------------- */

  /**
   * Make a Notice roll: roll a die, and if it beats current Notice, Notice rises by 1.
   * @param {object} [options]
   * @param {string} [options.reason="seen"]   Why the roll is being made (a JD.NoticeRoll.reason key).
   * @param {boolean} [options.check=true]     Afterwards, see whether Notice has reached 6.
   * @returns {Promise<boolean|null>}          Whether Notice rose.
   */
  async noticeRoll({ reason = "seen", check = true } = {}) {
    if ( !this.isInvestigator ) return null;
    const before = this.notice;
    const roll = new Roll(`1d6[${t(JD.dice.notice.label)}]`);
    roll.dice[0].options.appearance = { colorset: JD.dice.notice.colorset };
    await roll.evaluate();
    const die = roll.total;
    const rises = Rules.noticeRollRises(die, before);
    if ( rises ) await this.update({ "system.notice.value": before + 1 });

    const verdict = rises ? t("JD.NoticeRoll.rises", { before, after: before + 1 })
      : (before >= JD.noticeMax) ? t("JD.NoticeRoll.max")
        : t("JD.NoticeRoll.holds", { before });
    await postCard({
      tone: "notice",
      kicker: t(`JD.NoticeRoll.reason.${reason}`),
      title: t("JD.NoticeRoll.title", { name: this.name }),
      dice: [dieFace("notice", die, rises)],
      result: { value: die, text: verdict },
      lines: rises ? [{ icon: "fa-solid fa-masks-theater", text: t("JD.NoticeRoll.unease") }] : [],
      track: this.noticeTrack(rises ? before : null)
    }, { actor: this, rolls: [roll], flags: { type: "notice" } });

    if ( check ) await this.checkFate(before);
    return rises;
  }

  /* -------------------------------------------- */

  /**
   * Set Notice by hand, as the GM may.
   * @param {number} value
   */
  async setNotice(value) {
    if ( !this.isInvestigator ) return;
    const before = this.notice;
    value = Math.clamp(Math.round(value), JD.noticeMin, JD.noticeMax);
    if ( value === before ) return;
    await this.update({ "system.notice.value": value });
    await this.checkFate(before);
  }

  /* -------------------------------------------- */

  /**
   * After Notice changes: announce Notice 6.
   * @param {number} before    Notice before the change.
   */
  async checkFate(before) {
    if ( !this.system.marked ) return;
    if ( before < JD.noticeMax ) {
      await postCard({
        tone: "marked",
        kicker: t("JD.Marked.kicker"),
        title: this.name,
        lines: [{ icon: "fa-solid fa-eye", tone: "warn", text: t("JD.Marked.text") }],
        track: this.noticeTrack()
      }, { actor: this, flags: { type: "marked" } });
    }
  }

  /* -------------------------------------------- */
  /*  The Visit                                   */
  /* -------------------------------------------- */

  /**
   * It comes for you. You cannot win; you may run, hide or endure. The GM says when.
   * @returns {Promise<ChatMessage|null>}
   */
  async sufferVisit() {
    if ( !this.isInvestigator || this.system.visited ) return null;
    await this.update({ "system.visited": true });
    return postCard({
      tone: "visit",
      kicker: t("JD.Visit.kicker"),
      title: t("JD.Visit.title", { name: this.name }),
      lines: [
        { text: t("JD.Visit.text") },
        { icon: "fa-solid fa-person-running", text: t("JD.Visit.choices") }
      ]
    }, { actor: this, flags: { type: "visit" } });
  }

  /* -------------------------------------------- */
  /*  Trying again                                */
  /* -------------------------------------------- */

  /**
   * Unhappy with a roll? If you didn't roll the Notice die, add it and reroll.
   * If you did, make a Notice roll, then reroll everything.
   * @param {ChatMessage} message    The roll being tried again.
   * @returns {Promise<ChatMessage|null>}
   */
  async tryAgain(message) {
    const pool = message.getFlag(SYSTEM_ID, "pool");
    if ( !pool || message.getFlag(SYSTEM_ID, "superseded") ) return null;
    if ( message.canUserModify(game.user, "update") ) await message.setFlag(SYSTEM_ID, "superseded", true);
    const again = Rules.tryAgain(pool);
    if ( again.noticeRollFirst ) await this.noticeRoll({ reason: "tryAgain" });
    return this.rollPool({ ...pool, notice: true, reroll: true });
  }

  /* -------------------------------------------- */
  /*  The Failure Die                             */
  /* -------------------------------------------- */

  /**
   * Someone thinks it would be more interesting for you to fail.
   * @param {object} options
   * @param {number} options.highest    The highest die of the roll being contested.
   * @param {User} [options.by]         Who proposed it.
   * @returns {Promise<ChatMessage>}
   */
  async failureDie({ highest = 0, by = game.user } = {}) {
    const roll = new Roll(`1d6[${t(JD.dice.failure.label)}]`);
    roll.dice[0].options.appearance = { colorset: JD.dice.failure.colorset };
    await roll.evaluate();
    const beats = Rules.failureBeats(roll.total, highest);
    return postCard({
      tone: beats ? "failure" : "plain",
      kicker: t("JD.Failure.kicker", { user: by.name }),
      title: this.name,
      dice: [dieFace("failure", roll.total, beats)],
      result: {
        value: roll.total,
        text: t(beats ? "JD.Failure.beats" : "JD.Failure.holds", { highest })
      }
    }, { actor: this, rolls: [roll], flags: { type: "failure" } });
  }

  /* -------------------------------------------- */
  /*  Endings                                     */
  /* -------------------------------------------- */

  /**
   * Leave the story. Roll a die; if it is lower than your Notice, Notice falls by 1.
   * You are then out of the story and go to your epilogue.
   * @returns {Promise<ChatMessage|null>}
   */
  async leaveStory() {
    if ( !this.isInvestigator || this.system.departed ) return null;
    const sure = await DialogV2.confirm({
      window: { title: t("JD.Leave.title"), icon: "fa-solid fa-door-open" },
      classes: ["jamesian-dark", "jd-dialog"],
      content: `<p class="jd-dialog__lede">${t("JD.Leave.confirm", { name: esc(this.name) })}</p>`,
      rejectClose: false
    });
    if ( !sure ) return null;

    const before = this.notice;
    const roll = new Roll(`1d6[${t(JD.dice.light.label)}]`);
    roll.dice[0].options.appearance = { colorset: JD.dice.light.colorset };
    await roll.evaluate();
    const falls = Rules.leavingFalls(roll.total, before);
    await this.update({
      "system.notice.value": falls ? before - 1 : before,
      "system.departed": true
    });
    const key = this.system.epilogue;
    return postCard({
      tone: "leave",
      kicker: t("JD.Leave.kicker"),
      title: this.name,
      dice: [dieFace("light", roll.total, falls)],
      result: {
        value: roll.total,
        text: falls ? t("JD.Leave.falls", { before, after: before - 1 }) : t("JD.Leave.holds", { before })
      },
      lines: [
        { icon: "fa-solid fa-feather", tone: "coda", text: `${t(`JD.Epilogue.${key}.label`)}. ${t(`JD.Epilogue.${key}.text`)}` }
      ],
      track: this.noticeTrack()
    }, { actor: this, rolls: [roll], flags: { type: "leave" } });
  }

  /* -------------------------------------------- */

  /**
   * Make an investigator ready for a new story.
   * @returns {Promise<Actor>}
   */
  async resetForNewStory() {
    if ( !this.isInvestigator ) return this;
    return this.update({
      "system.notice.value": JD.noticeMin,
      "system.visited": false,
      "system.departed": false,
      "system.transgressions": []
    });
  }
}
