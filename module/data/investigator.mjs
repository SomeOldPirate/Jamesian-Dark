/**
 * An Investigator: a name, an occupation, a scholarly interest, and Notice.
 * @module jamesian-dark/data/investigator
 */

import JD from "../config.mjs";
import { epilogue } from "../dice/rules.mjs";

const fields = foundry.data.fields;

export default class InvestigatorData extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    return {
      occupation: new fields.StringField({ required: true, blank: true, initial: "" }),
      interest: new fields.StringField({ required: true, blank: true, initial: "" }),
      notice: new fields.SchemaField({
        value: new fields.NumberField({
          required: true, nullable: false, integer: true,
          initial: JD.noticeMin, min: JD.noticeMin, max: JD.noticeMax
        })
      }),
      // Has the Visit happened? Anyone who suffered it takes the worst epilogue.
      visited: new fields.BooleanField({ initial: false }),
      // Has this character left the story?
      departed: new fields.BooleanField({ initial: false }),
      // Each distinct transgression counts once: a list kept by hand.
      transgressions: new fields.ArrayField(new fields.SchemaField({
        id: new fields.StringField({ required: true, blank: false, initial: () => foundry.utils.randomID() }),
        text: new fields.StringField({ required: true, blank: true, initial: "" })
      })),
      notes: new fields.HTMLField({ initial: "", textSearch: true })
    };
  }

  /* -------------------------------------------- */

  /**
   * Older or hand-edited data may carry a Notice outside 1–6, or not a number at all.
   * @inheritdoc
   */
  static migrateData(source) {
    const n = source.notice;
    if ( (typeof n === "number") || (typeof n === "string") ) source.notice = { value: Number(n) };
    if ( source.notice && (typeof source.notice === "object") ) {
      const v = Number(source.notice.value);
      source.notice.value = Number.isFinite(v)
        ? Math.min(JD.noticeMax, Math.max(JD.noticeMin, Math.round(v)))
        : JD.noticeMin;
    }
    return super.migrateData(source);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    this.notice.min = JD.noticeMin;
    this.notice.max = JD.noticeMax;
    this.epilogue = epilogue(this.notice.value, this.visited);
    // At Notice 6, the next time you are alone, it comes for you.
    this.marked = (this.notice.value >= JD.noticeMax) && !this.visited && !this.departed;
  }
}
