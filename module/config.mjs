/**
 * Static configuration for Jamesian Dark.
 * @module jamesian-dark/config
 */

export const SYSTEM_ID = "jamesian-dark";

const JD = {};

/** Notice runs from 1 to 6. */
JD.noticeMin = 1;
JD.noticeMax = 6;

/** The two kinds of roll, each with its own reading of the highest die. */
JD.rollKinds = {
  investigate: { label: "JD.Roll.kind.investigate", verb: "JD.Roll.verb.investigate", icon: "fa-solid fa-magnifying-glass" },
  other: { label: "JD.Roll.kind.other", verb: "JD.Roll.verb.other", icon: "fa-solid fa-hand" }
};

/** The dice that can go into a pool. */
JD.dice = {
  light: { label: "JD.Die.light", colorset: "jd-light" },
  scholar: { label: "JD.Die.scholar", colorset: "jd-light" },
  meddle: { label: "JD.Die.meddle", colorset: "jd-meddle" },
  notice: { label: "JD.Die.notice", colorset: "jd-notice" },
  failure: { label: "JD.Die.failure", colorset: "jd-failure" }
};

/** The GM's escalation ladder. Horror happens once per story. */
JD.escalation = ["unease", "dread", "terror", "horror"];

/** Epilogue bands. */
JD.epilogues = ["untouched", "unwell", "ruined"];

export default JD;
