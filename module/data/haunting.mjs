/**
 * A Haunting: the GM's dossier for one story. One transgression, one thing.
 * @module jamesian-dark/data/haunting
 */

const fields = foundry.data.fields;

const id = () => new fields.StringField({ required: true, blank: false, initial: () => foundry.utils.randomID() });
const text = () => new fields.StringField({ required: true, blank: true, initial: "" });

/** Six Provenance discoveries. */
const PROVENANCE_COUNT = 6;

export default class HauntingData extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    return {
      // One transgression, one thing: a transgression already made, and a single
      // entity tethered to an object or place.
      transgression: text(),
      thing: text(),
      tether: text(),
      restitution: text(),
      // Optional frame: a narrator, years later.
      frame: text(),
      // Unease, dread, terror, horror.
      escalation: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0, max: 3 }),
      laidToRest: new fields.BooleanField({ initial: false }),
      warnings: new fields.ArrayField(new fields.SchemaField({ id: id(), text: text() })),
      provenance: new fields.ArrayField(new fields.SchemaField({
        id: id(), title: text(), text: text(),
        found: new fields.BooleanField({ initial: false })
      }), {
        initial: () => Array.from({ length: PROVENANCE_COUNT }, () => ({
          id: foundry.utils.randomID(), title: "", text: "", found: false
        }))
      }),
      // Stay reticent: never describe it whole.
      glimpses: new fields.ArrayField(new fields.SchemaField({ id: id(), text: text() })),
      notes: new fields.HTMLField({ initial: "", textSearch: true })
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    this.provenanceFound = this.provenance.filter(p => p.found).length;
  }
}
