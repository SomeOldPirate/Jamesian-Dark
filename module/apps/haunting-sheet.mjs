/**
 * The Haunting sheet: the Game Master's black book for one story.
 * One transgression, one thing; warnings, provenance, glimpses; and the company.
 * @module jamesian-dark/apps/haunting-sheet
 */

import JD, { SYSTEM_ID } from "../config.mjs";
import { postCard, t } from "../helpers/chat.mjs";
import { activateListInputs, addListEntry, removeListEntry, updateListEntry } from "./list-editing.mjs";
import RulesReference from "./rules-reference.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;

export default class JDHauntingSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["jamesian-dark", "jd-sheet", "jd-haunting"],
    position: { width: 700, height: 820 },
    window: {
      resizable: true,
      icon: "fa-solid fa-ghost",
      controls: [{ icon: "fa-solid fa-scroll", label: "JD.Rules.open", action: "openRules" }]
    },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      setEscalation: this.#onSetEscalation,
      toggleRest: this.#onToggleRest,
      listAdd: this.#onListAdd,
      listRemove: this.#onListRemove,
      revealProvenance: this.#onRevealProvenance,
      companyOpen: this.#onCompanyOpen,
      companyNotice: this.#onCompanyNotice,
      companyStep: this.#onCompanyStep,
      companyVisit: this.#onCompanyVisit,
      newStory: this.#onNewStory,
      openRules: this.#onOpenRules
    }
  };

  /** @inheritdoc */
  static PARTS = {
    header: { template: `systems/${SYSTEM_ID}/templates/actor/haunting-header.hbs` },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    matter: { template: `systems/${SYSTEM_ID}/templates/actor/haunting-matter.hbs`, scrollable: [""] },
    clues: { template: `systems/${SYSTEM_ID}/templates/actor/haunting-clues.hbs`, scrollable: [""] },
    company: { template: `systems/${SYSTEM_ID}/templates/actor/haunting-company.hbs`, scrollable: [""] },
    notes: { template: `systems/${SYSTEM_ID}/templates/actor/haunting-notes.hbs`, scrollable: [""] }
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "matter", icon: "fa-solid fa-ghost" },
        { id: "clues", icon: "fa-solid fa-envelope-open-text" },
        { id: "company", icon: "fa-solid fa-people-group" },
        { id: "notes", icon: "fa-solid fa-feather" }
      ],
      initial: "matter",
      labelPrefix: "JD.Tab"
    }
  };

  /* -------------------------------------------- */
  /*  Context                                     */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const sys = actor.system;
    const indexed = list => sys[list].map((x, index) => ({ ...x, index, number: index + 1 }));

    Object.assign(context, {
      actor,
      system: sys,
      fields: sys.schema.fields,
      editable: this.isEditable,
      isGM: game.user.isGM,
      escalation: JD.escalation.map((key, i) => ({
        key, i,
        label: t(`JD.Escalation.${key}.label`),
        text: t(`JD.Escalation.${key}.text`),
        reached: i <= sys.escalation,
        current: i === sys.escalation
      })),
      warnings: indexed("warnings"),
      provenance: indexed("provenance"),
      glimpses: indexed("glimpses"),
      company: this.#prepareCompany(),
      enrichedNotes: await TextEditor.implementation.enrichHTML(sys.notes, { relativeTo: actor, secrets: actor.isOwner })
    });
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    context.tabs ??= this._prepareTabs("primary");
    if ( partId in context.tabs ) context.tab = context.tabs[partId];
    return context;
  }

  /* -------------------------------------------- */

  /**
   * Every investigator in the world, with what the GM needs to know at a glance.
   * @returns {object[]}
   */
  #prepareCompany() {
    return game.actors.filter(a => a.type === "investigator")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(a => {
        const s = a.system;
        return {
          id: a.id, name: a.name, img: a.img,
          occupation: s.occupation,
          notice: s.notice.value,
          pips: a.noticeTrack().pips,
          visited: s.visited, departed: s.departed, marked: s.marked,
          epilogue: t(`JD.Epilogue.${s.epilogue}.label`),
          players: game.users.filter(u => !u.isGM && a.testUserPermission(u, "OWNER")).map(u => u.name).join(", ")
        };
      });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("is-at-rest", this.document.system.laidToRest);
    activateListInputs(this);
  }

  /* -------------------------------------------- */
  /*  Actions: the matter                         */
  /* -------------------------------------------- */

  static async #onSetEscalation(event, target) {
    return this.document.update({ "system.escalation": Number(target.dataset.i) });
  }

  static async #onToggleRest() {
    return this.document.update({ "system.laidToRest": !this.document.system.laidToRest });
  }

  /* -------------------------------------------- */
  /*  Actions: lists                              */
  /* -------------------------------------------- */

  static async #onListAdd(event, target) {
    return addListEntry(this.document, target.dataset.list);
  }

  static async #onListRemove(event, target) {
    return removeListEntry(this.document, target.dataset.list, Number(target.dataset.index));
  }

  /** Put a Provenance discovery in front of the players. */
  static async #onRevealProvenance(event, target) {
    const index = Number(target.dataset.index);
    const clue = this.document.system.provenance[index];
    if ( !clue || !(clue.title.trim() || clue.text.trim()) ) return ui.notifications.info(t("JD.Haunting.emptyEntry"));
    await postCard({
      tone: "provenance",
      kicker: t("JD.Provenance.kicker", { n: index + 1, total: this.document.system.provenance.length }),
      title: clue.title.trim() || t("JD.Provenance.untitled"),
      quote: clue.text
    }, { flags: { type: "provenance" } });
    return updateListEntry(this.document, "provenance", index, { found: true });
  }

  /* -------------------------------------------- */
  /*  Actions: the company                        */
  /* -------------------------------------------- */

  /** The investigator a company control belongs to. */
  static #member(target) {
    return game.actors.get(target.closest("[data-actor-id]")?.dataset.actorId);
  }

  static #onCompanyOpen(event, target) {
    return JDHauntingSheet.#member(target)?.sheet.render({ force: true });
  }

  static async #onCompanyNotice(event, target) {
    return JDHauntingSheet.#member(target)?.noticeRoll({ reason: "called" });
  }

  static async #onCompanyStep(event, target) {
    const actor = JDHauntingSheet.#member(target);
    return actor?.setNotice(actor.system.notice.value + Number(target.dataset.step));
  }

  static async #onCompanyVisit(event, target) {
    return JDHauntingSheet.#member(target)?.sufferVisit();
  }

  static async #onNewStory() {
    const sure = await DialogV2.confirm({
      window: { title: t("JD.Company.newStory"), icon: "fa-solid fa-book-open" },
      classes: ["jamesian-dark", "jd-dialog"],
      content: `<p class="jd-dialog__lede">${t("JD.Company.newStoryConfirm")}</p>`,
      rejectClose: false
    });
    if ( !sure ) return;
    for ( const actor of game.actors.filter(a => a.type === "investigator") ) await actor.resetForNewStory();
  }

  static #onOpenRules() {
    return RulesReference.show();
  }
}
