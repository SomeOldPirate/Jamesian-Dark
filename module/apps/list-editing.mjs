/**
 * Editing arrays of small records on a sheet (transgressions, warnings, provenance…).
 *
 * Inputs for list entries carry no `name`, so the sheet's form never submits them.
 * Instead each has `data-list`, `data-index` and `data-prop`, and a change writes
 * the whole array back in one update.
 * @module jamesian-dark/apps/list-editing
 */

/**
 * Bind list inputs within a rendered sheet.
 * @param {DocumentSheetV2} sheet
 */
export function activateListInputs(sheet) {
  for ( const input of sheet.element.querySelectorAll("[data-list][data-prop]") ) {
    if ( input.dataset.jdBound ) continue;
    input.dataset.jdBound = "1";
    input.addEventListener("change", async event => {
      event.stopPropagation();
      if ( !sheet.isEditable ) return;
      const { list, index, prop } = input.dataset;
      const value = (input.type === "checkbox") ? input.checked : input.value;
      await updateListEntry(sheet.document, list, Number(index), { [prop]: value });
    });
  }
}

/**
 * Change one entry of a list.
 * @param {Document} doc
 * @param {string} list       The name of an ArrayField on the document's system data.
 * @param {number} index
 * @param {object} changes
 */
export async function updateListEntry(doc, list, index, changes) {
  const entries = doc.system.toObject()[list];
  if ( !entries?.[index] ) return;
  Object.assign(entries[index], changes);
  return doc.update({ [`system.${list}`]: entries });
}

/**
 * Add an entry to a list.
 * @param {Document} doc
 * @param {string} list
 * @param {object} [entry]
 */
export async function addListEntry(doc, list, entry = {}) {
  const entries = doc.system.toObject()[list] ?? [];
  // A bare {} would fail validation: start from the entry schema's own defaults.
  const blank = doc.system.schema.fields[list].element.getInitialValue();
  entries.push({ ...blank, ...entry });
  return doc.update({ [`system.${list}`]: entries });
}

/**
 * Remove an entry from a list.
 * @param {Document} doc
 * @param {string} list
 * @param {number} index
 */
export async function removeListEntry(doc, list, index) {
  const entries = doc.system.toObject()[list] ?? [];
  if ( !entries[index] ) return;
  entries.splice(index, 1);
  return doc.update({ [`system.${list}`]: entries });
}
