/**
 * A Curio: an object worth writing down. A whistle, a crown, a mezzotint.
 * @module jamesian-dark/data/curio
 */

const fields = foundry.data.fields;

export default class CurioData extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    return {
      // Where it was left, and where it ought perhaps to have stayed.
      origin: new fields.StringField({ required: true, blank: true, initial: "" }),
      description: new fields.HTMLField({ initial: "", textSearch: true })
    };
  }
}
