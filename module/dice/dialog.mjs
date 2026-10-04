/**
 * The pool dialog: which dice does what you are doing earn you?
 * @module jamesian-dark/dice/dialog
 */

import JD, { SYSTEM_ID } from "../config.mjs";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;
const { FormDataExtended } = foundry.applications.ux;

/**
 * Ask the player to build their pool.
 * @param {Actor} actor
 * @param {object} [preset]
 * @returns {Promise<object|null>}   The pool configuration, or null if the dialog was dismissed.
 */
export async function promptPool(actor, preset = {}) {
  const kind = preset.kind ?? "other";
  const content = await renderTemplate(`systems/${SYSTEM_ID}/templates/apps/pool-dialog.hbs`, {
    kinds: Object.entries(JD.rollKinds).map(([key, k]) => ({
      key, icon: k.icon, label: game.i18n.localize(k.label), checked: key === kind
    })),
    human: preset.human ?? true,
    scholar: preset.scholar ?? false,
    notice: preset.notice ?? false,
    meddle: preset.meddle ?? false,
    occupation: actor.system.occupation,
    interest: actor.system.interest
  });

  return DialogV2.wait({
    window: { title: game.i18n.format("JD.Roll.dialogTitle", { name: actor.name }), icon: "fa-solid fa-dice-d6" },
    classes: ["jamesian-dark", "jd-dialog", "jd-pool-dialog"],
    position: { width: 460 },
    content,
    buttons: [{
      action: "roll",
      label: game.i18n.localize("JD.Roll.roll"),
      icon: "fa-solid fa-dice-d6",
      default: true,
      callback: (event, button) => {
        const data = new FormDataExtended(button.form).object;
        return {
          kind: data.kind ?? kind,
          human: !!data.human, scholar: !!data.scholar, notice: !!data.notice, meddle: !!data.meddle
        };
      }
    }],
    render: (event, dialog) => activatePool(dialog.element),
    rejectClose: false
  });
}

/**
 * Keep the dialog honest as boxes are ticked: refuse an empty pool.
 * @param {HTMLElement} root
 */
function activatePool(root) {
  const form = root.querySelector("form");
  if ( !form || form.dataset.jdBound ) return;
  form.dataset.jdBound = "1";
  const submit = form.querySelector('button[data-action="roll"]');
  const summary = form.querySelector(".jd-pool__summary");

  const refresh = () => {
    const on = name => !!form.elements[name]?.checked;
    const count = ["human", "scholar", "notice", "meddle"].filter(on).length;
    if ( submit ) submit.disabled = count === 0;
    if ( summary ) {
      summary.textContent = count === 0
        ? game.i18n.localize("JD.Roll.empty")
        : game.i18n.format(count === 1 ? "JD.Roll.summaryOne" : "JD.Roll.summaryMany", { count });
    }
  };
  form.addEventListener("change", refresh);
  refresh();
}
