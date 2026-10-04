/**
 * Jamesian Dark: ghost stories in the manner of M. R. James.
 * A Foundry Virtual Tabletop game system for Foundry V14 and later.
 *
 * @module jamesian-dark
 */

import JD, { SYSTEM_ID } from "./config.mjs";

import InvestigatorData from "./data/investigator.mjs";
import HauntingData from "./data/haunting.mjs";
import CurioData from "./data/curio.mjs";

import JDActor from "./documents/actor.mjs";

import JDInvestigatorSheet from "./apps/investigator-sheet.mjs";
import JDHauntingSheet from "./apps/haunting-sheet.mjs";
import JDCurioSheet from "./apps/curio-sheet.mjs";
import RulesReference from "./apps/rules-reference.mjs";

import * as Rules from "./dice/rules.mjs";
import * as Chat from "./helpers/chat.mjs";
import * as Effects from "./helpers/effects.mjs";

/* -------------------------------------------- */
/*  Init                                        */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.log("Jamesian Dark | Quis est iste qui venit?");

  // The system API, for macros and modules.
  game.jamesianDark = {
    JD,
    rules: Rules,
    documents: { JDActor },
    applications: { JDInvestigatorSheet, JDHauntingSheet, JDCurioSheet, RulesReference },
    openRules: () => RulesReference.show()
  };
  CONFIG.JD = JD;

  /* ---------- Documents ---------- */
  CONFIG.Actor.documentClass = JDActor;
  CONFIG.Actor.dataModels = { investigator: InvestigatorData, haunting: HauntingData };
  CONFIG.Item.dataModels = { curio: CurioData };
  CONFIG.Actor.trackableAttributes = {
    investigator: { bar: ["notice"], value: [] },
    haunting: { bar: [], value: ["escalation"] }
  };

  // There is no fighting, but someone will press the button.
  CONFIG.Combat.initiative = { formula: "1d6", decimals: 0 };

  /* ---------- Fonts ---------- */
  const fontPath = `systems/${SYSTEM_ID}/assets/fonts`;
  CONFIG.fontDefinitions["IM Fell English"] = {
    editor: true,
    fonts: [
      { urls: [`${fontPath}/IMFellEnglish-Regular.woff2`] },
      { urls: [`${fontPath}/IMFellEnglish-Italic.woff2`], style: "italic" }
    ]
  };
  CONFIG.fontDefinitions["IM Fell English SC"] = {
    editor: true,
    fonts: [{ urls: [`${fontPath}/IMFellEnglishSC-Regular.woff2`] }]
  };

  /* ---------- Sheets ---------- */
  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, JDInvestigatorSheet, {
    types: ["investigator"], makeDefault: true, label: "JD.Sheet.investigator"
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, JDHauntingSheet, {
    types: ["haunting"], makeDefault: true, label: "JD.Sheet.haunting"
  });
  DocumentSheetConfig.registerSheet(Item, SYSTEM_ID, JDCurioSheet, {
    types: ["curio"], makeDefault: true, label: "JD.Sheet.curio"
  });

  /* ---------- Templates ---------- */
  foundry.applications.handlebars.loadTemplates([
    `systems/${SYSTEM_ID}/templates/chat/card.hbs`,
    `systems/${SYSTEM_ID}/templates/apps/pool-dialog.hbs`
  ]);

  registerSettings();
});

/* -------------------------------------------- */
/*  Settings                                    */
/* -------------------------------------------- */

function registerSettings() {
  game.settings.register(SYSTEM_ID, "noticeTies", {
    name: "JD.Settings.noticeTies.name",
    hint: "JD.Settings.noticeTies.hint",
    scope: "world", config: true, type: Boolean, default: false
  });

  game.settings.register(SYSTEM_ID, "playersSetNotice", {
    name: "JD.Settings.playersSetNotice.name",
    hint: "JD.Settings.playersSetNotice.hint",
    scope: "world", config: true, type: Boolean, default: false
  });

  game.settings.register(SYSTEM_ID, "atmosphere", {
    name: "JD.Settings.atmosphere.name",
    hint: "JD.Settings.atmosphere.hint",
    scope: "client", config: true, type: Boolean, default: true,
    onChange: () => Effects.refreshAmbience()
  });

  game.settings.register(SYSTEM_ID, "sounds", {
    name: "JD.Settings.sounds.name",
    hint: "JD.Settings.sounds.hint",
    scope: "client", config: true, type: Boolean, default: true
  });
}

/* -------------------------------------------- */
/*  Ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", () => Effects.refreshAmbience());

Hooks.once("diceSoNiceReady", dice3d => Effects.registerDiceSoNice(dice3d));

/* -------------------------------------------- */
/*  Chat                                        */
/* -------------------------------------------- */

Hooks.on("renderChatMessageHTML", Chat.onRenderChatMessage);

/* -------------------------------------------- */
/*  Keeping the GM's view of the company fresh  */
/* -------------------------------------------- */

/** Re-render the Company tab of any open Haunting sheet. */
function refreshCompany(actor) {
  if ( actor?.type !== "investigator" ) return;
  for ( const app of foundry.applications.instances.values() ) {
    if ( (app instanceof JDHauntingSheet) && app.rendered ) app.render({ parts: ["company"] });
  }
}
Hooks.on("updateActor", refreshCompany);
Hooks.on("createActor", refreshCompany);
Hooks.on("deleteActor", refreshCompany);

// Curios get their own default picture.
Hooks.on("preCreateItem", (item, data) => {
  if ( (item.type === "curio") && (!data.img || (data.img === Item.DEFAULT_ICON)) ) {
    item.updateSource({ img: `systems/${SYSTEM_ID}/assets/icons/curio.svg` });
  }
});

// A player's assigned character may change; so may the dark around the screen.
Hooks.on("updateUser", () => Effects.refreshAmbience());
