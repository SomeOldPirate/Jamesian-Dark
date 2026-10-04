/**
 * The Curio sheet: a label tied to an object.
 * @module jamesian-dark/apps/curio-sheet
 */

import { SYSTEM_ID } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;

export default class JDCurioSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["jamesian-dark", "jd-sheet", "jd-curio"],
    position: { width: 460, height: 480 },
    window: { resizable: true, icon: "fa-solid fa-key" },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  /** @inheritdoc */
  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/item/curio.hbs`, scrollable: [""] }
  };

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    Object.assign(context, {
      item,
      system: item.system,
      fields: item.system.schema.fields,
      editable: this.isEditable,
      enrichedDescription: await TextEditor.implementation.enrichHTML(item.system.description, {
        relativeTo: item, secrets: item.isOwner
      })
    });
    return context;
  }
}
