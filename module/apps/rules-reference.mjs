/**
 * The one-page rules, to hand at the table.
 * @module jamesian-dark/apps/rules-reference
 */

import { SYSTEM_ID } from "../config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class RulesReference extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "jd-rules-reference",
    classes: ["jamesian-dark", "jd-rules"],
    position: { width: 560, height: 760 },
    window: { title: "JD.Rules.title", icon: "fa-solid fa-scroll", resizable: true }
  };

  /** @inheritdoc */
  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/apps/rules-reference.hbs`, scrollable: [""] }
  };

  /** @inheritdoc */
  async _prepareContext() {
    return { isGM: game.user.isGM };
  }

  /**
   * Open the reference, or bring it to the front.
   * @returns {Promise<RulesReference>}
   */
  static show() {
    const existing = foundry.applications.instances.get("jd-rules-reference");
    if ( existing ) {
      existing.bringToFront();
      return existing;
    }
    return new this().render({ force: true });
  }
}
