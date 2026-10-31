/**
 * The rules of Jamesian Dark as pure functions, free of any Foundry API so that
 * they can be tested on their own (see tools/test-rules.mjs).
 * @module jamesian-dark/dice/rules
 */

/**
 * Which band of the result table a highest die falls into.
 * @param {number} highest
 * @returns {"low"|"four"|"five"|"six"}
 */
export function band(highest) {
  if ( highest >= 6 ) return "six";
  if ( highest === 5 ) return "five";
  if ( highest === 4 ) return "four";
  return "low";
}

/**
 * Read a rolled pool.
 *
 * @param {object} dice
 * @param {number[]} [dice.light]        Results of the Light dice (zero, one or two).
 * @param {number|null} [dice.notice]    Result of the Notice die, if it was rolled.
 * @param {number|null} [dice.meddle]    Result of the Meddle die, if it was rolled.
 * @param {object} [options]
 * @param {"investigate"|"other"} [options.kind="other"]
 * @param {boolean} [options.meddleCounted=false]    Has this act of meddling already raised Notice, on an earlier attempt?
 * @returns {object}
 */
export function resolvePool({ light = [], notice = null, meddle = null } = {}, {
  kind = "other", meddleCounted = false
} = {}) {
  const all = [...light];
  if ( notice !== null ) all.push(notice);
  if ( meddle !== null ) all.push(meddle);
  if ( !all.length ) throw new Error("A pool needs at least one die.");
  const highest = Math.max(...all);

  // Meddling: remarked, and Notice rises, if the Meddle die is highest or ties for highest.
  const meddled = meddle !== null;
  const meddleRemarked = meddled && (meddle === highest);
  // An act of meddling can raise Notice only once, however many times the roll is retried.
  const meddleRaises = meddleRemarked && !meddleCounted;

  // The Notice die: strictly higher than every other die, or tying the Meddle die for highest.
  // A tie with a Light die does not count.
  const othersThanNotice = [...light, ...(meddled ? [meddle] : [])];
  const bestOther = othersThanNotice.length ? Math.max(...othersThanNotice) : 0;
  const noticed = notice !== null;
  const noticeOutright = noticed && (notice > bestOther);
  const meddleNoticeTie = noticed && meddled && (notice === meddle) && (notice === highest);
  const noticeDieHighest = noticeOutright || meddleNoticeTie;

  // A six while investigating is a glimpse of what is really happening.
  const glimpse = (kind === "investigate") && (highest === 6);

  const noticeRollReasons = [];
  if ( meddleNoticeTie ) noticeRollReasons.push("meddleTie");
  else if ( noticeDieHighest ) noticeRollReasons.push("noticeDie");
  if ( glimpse ) noticeRollReasons.push("glimpse");
  const noticeRoll = noticeRollReasons.length > 0;

  return {
    highest,
    band: band(highest),
    meddled, meddleRemarked, meddleRaises,
    noticeDieHighest, meddleNoticeTie, glimpse,
    noticeRoll, noticeRollReasons,
    // Doing anything else, a six lets the GM call for a Notice roll if none is already due.
    gmMayCall: (kind === "other") && (highest === 6) && !noticeRoll
  };
}

/**
 * Does this Investigator still make Notice rolls? Not at Notice 6, and not after the Visit.
 * @param {number} notice
 * @param {boolean} [visited=false]
 * @returns {boolean}
 */
export function makesNoticeRolls(notice, visited = false) {
  return (notice < 6) && !visited;
}

/**
 * A Notice roll raises Notice if the die beats the current value.
 * @param {number} die
 * @param {number} notice
 * @returns {boolean}
 */
export function noticeRollRises(die, notice) {
  return (die > notice) && (notice < 6);
}

/**
 * Leaving the story lowers Notice if the die is lower than the current value.
 * @param {number} die
 * @param {number} notice
 * @returns {boolean}
 */
export function leavingFalls(die, notice) {
  return (die < notice) && (notice > 1);
}

/**
 * The Failure Die makes you fail if it beats your highest die.
 * @param {number} die
 * @param {number} highest
 * @returns {boolean}
 */
export function failureBeats(die, highest) {
  return die > highest;
}

/**
 * Which epilogue a character receives.
 * @param {number} notice
 * Notice alone never ruins anyone: 1–2 is Untouched, 3–6 Never quite well again. Ruined comes
 * only from the Visit (survived at a cost, or not survived) or a loose end the scenario names.
 * @param {null|"survives"|"cost"|"lost"} [visit=null]   How they came through the Visit, if they suffered it.
 *   At a cost (or not at all) they are Ruined, even if Notice later falls; on a 4 or more, Notice decides.
 * @param {boolean} [looseEnd=false]    A loose end the scenario names moves them one band worse.
 * @returns {"untouched"|"unwell"|"ruined"}
 */
export function epilogue(notice, visit = null, looseEnd = false) {
  const bands = ["untouched", "unwell", "ruined"];
  let i = (notice >= 3) ? 1 : 0;
  if ( (visit === "cost") || (visit === "lost") ) i = 2;
  if ( looseEnd ) i = Math.min(i + 1, 2);
  return bands[i];
}

/**
 * May the Notice die go into a pool? At Notice 6 it is set aside for good: never added to
 * any roll again, for any reason.
 * @param {number} notice
 * @returns {boolean}
 */
export function noticeDieAllowed(notice) {
  return notice < 6;
}

/**
 * May this Investigator try again? Trying again depends on the Notice die, so not at Notice 6.
 * @param {number} notice
 * @returns {boolean}
 */
export function canTryAgain(notice) {
  return noticeDieAllowed(notice);
}

/**
 * Read the Visit roll: a Light die, plus a second if occupation or interest helps.
 * On a 4 or more you survive. On 1–3 you may survive at a cost the GM names, unless you
 * struck at the thing, in which case you do not survive.
 * @param {number} highest
 * @param {boolean} [struck=false]    Did the Investigator strike at the thing during the Visit?
 * @returns {"survives"|"cost"|"lost"}
 */
export function visitOutcome(highest, struck = false) {
  if ( highest >= 4 ) return "survives";
  return struck ? "lost" : "cost";
}

/**
 * What a "Try again" does to the pool: add the Notice die if it was not there, then reroll
 * every die. Any Notice roll the first result triggered has already been made.
 * @param {object} pool
 * @param {boolean} pool.notice    Was the Notice die in the original pool?
 * @returns {{addNotice: boolean}}
 */
export function tryAgain({ notice }) {
  return { addNotice: !notice };
}
