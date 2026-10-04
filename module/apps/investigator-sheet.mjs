/**
 * The Investigator's sheet: a page from a scholar's notebook that darkens as
 * the thing takes notice.
 * @module jamesian-dark/apps/investigator-sheet
 */

import JD, { SYSTEM_ID } from "../config.mjs";
import { activateListInputs, addListEntry, removeListEntry } from "./list-editing.mjs";
import RulesReference from "./rules-reference.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;

export default class JDInvestigatorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["jamesian-dark", "jd-sheet", "jd-investigator"],
    position: { width: 600, height: 820 },
    window: {
      resizable: true,
      icon: "fa-solid fa-book-open",
      controls: [{ icon: "fa-solid fa-scroll", label: "JD.Rules.open", action: "openRules" }]
    },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      roll: this.#onRoll,
      noticeRoll: this.#onNoticeRoll,
      leave: this.#onLeave,
      returnToStory: this.#onReturn,
      setNotice: this.#onSetNotice,
      visit: this.#onVisit,
      addTransgression: this.#onAddTransgression,
      removeTransgression: this.#onRemoveTransgression,
      itemCreate: this.#onItemCreate,
      itemEdit: this.#onItemEdit,
      itemDelete: this.#onItemDelete,
      openRules: this.#onOpenRules
    }
  };

  /** @inheritdoc */
  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/actor/investigator.hbs`, scrollable: [""] }
  };

  /* -------------------------------------------- */
  /*  Context                                     */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const sys = actor.system;
    const notice = sys.notice.value;
    const isGM = game.user.isGM;

    Object.assign(context, {
      actor,
      system: sys,
      fields: sys.schema.fields,
      editable: this.isEditable,
      owner: actor.isOwner,
      isGM,
      notice,
      canSetNotice: this.isEditable && (isGM || game.settings.get(SYSTEM_ID, "playersSetNotice")),
      candles: Array.from({ length: JD.noticeMax }, (_, i) => ({
        n: i + 1,
        out: (i + 1) <= notice,
        label: game.i18n.format("JD.Notice.set", { n: i + 1 })
      })),
      stage: {
        label: game.i18n.localize(`JD.Notice.stage.${notice}.label`),
        text: game.i18n.localize(`JD.Notice.stage.${notice}.text`)
      },
      canAct: this.isEditable && !sys.departed,
      transgressions: sys.transgressions.map((x, index) => ({ ...x, index })),
      curios: actor.items.filter(i => i.type === "curio").sort((a, b) => a.sort - b.sort),
      epilogue: {
        key: sys.epilogue,
        label: game.i18n.localize(`JD.Epilogue.${sys.epilogue}.label`),
        text: game.i18n.localize(`JD.Epilogue.${sys.epilogue}.text`)
      },
      enrichedNotes: await TextEditor.implementation.enrichHTML(sys.notes, {
        relativeTo: actor, secrets: actor.isOwner
      })
    });
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // The page darkens as Notice rises.
    const sys = this.document.system;
    this.element.dataset.notice = String(sys.notice.value);
    this.element.classList.toggle("is-departed", sys.departed);
    this.element.classList.toggle("is-visited", sys.visited);
    activateListInputs(this);
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /** Build a pool. */
  static async #onRoll(event, target) {
    return this.document.promptRoll({ kind: target.dataset.kind ?? "other" });
  }

  static async #onNoticeRoll() {
    return this.document.noticeRoll({ reason: "seen" });
  }

  static async #onLeave() {
    return this.document.leaveStory();
  }

  static async #onReturn() {
    return this.document.update({ "system.departed": false });
  }

  /** Clicking a candle sets Notice; clicking the current one steps back. */
  static async #onSetNotice(event, target) {
    const n = Number(target.dataset.n);
    const current = this.document.system.notice.value;
    return this.document.setNotice((n === current) ? n - 1 : n);
  }

  static async #onVisit() {
    return this.document.sufferVisit();
  }

  static async #onAddTransgression() {
    return addListEntry(this.document, "transgressions");
  }

  static async #onRemoveTransgression(event, target) {
    return removeListEntry(this.document, "transgressions", Number(target.dataset.index));
  }

  static async #onItemCreate() {
    const [item] = await this.document.createEmbeddedDocuments("Item", [{
      name: game.i18n.localize("JD.Curio.new"), type: "curio"
    }]);
    return item?.sheet.render({ force: true });
  }

  static #onItemEdit(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return this.document.items.get(id)?.sheet.render({ force: true });
  }

  static async #onItemDelete(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return this.document.items.get(id)?.deleteDialog();
  }

  static #onOpenRules() {
    return RulesReference.show();
  }
}
