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
 * @param {boolean} [options.noticeTies=false]       Does the Notice die count as highest when it only ties a Light die?
 * @returns {object}
 */
export function resolvePool({ light = [], notice = null, meddle = null } = {}, {
  kind = "other", noticeTies = false
} = {}) {
  const all = [...light];
  if ( notice !== null ) all.push(notice);
  if ( meddle !== null ) all.push(meddle);
  if ( !all.length ) throw new Error("A pool needs at least one die.");
  const highest = Math.max(...all);

  // Meddling: remarked, and Notice rises, if the Meddle die is highest or ties for highest.
  const meddled = meddle !== null;
  const meddleRemarked = meddled && (meddle === highest);

  // The Notice die: highest outright, or tying the Meddle die for highest.
  const othersThanNotice = [...light, ...(meddled ? [meddle] : [])];
  const bestOther = othersThanNotice.length ? Math.max(...othersThanNotice) : 0;
  const noticed = notice !== null;
  const noticeOutright = noticed && (notice > bestOther);
  const meddleNoticeTie = noticed && meddled && (notice === meddle) && (notice === highest);
  const noticeTied = noticed && noticeTies && (notice === highest);
  const noticeDieHighest = noticeOutright || meddleNoticeTie || noticeTied;

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
    meddled, meddleRemarked,
    noticeDieHighest, meddleNoticeTie, glimpse,
    noticeRoll, noticeRollReasons,
    // Doing anything else, a six lets the GM call for a Notice roll if none is already due.
    gmMayCall: (kind === "other") && (highest === 6) && !noticeRoll
  };
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
 * @param {boolean} [visited=false]   Anyone who suffered the Visit is ruined, whatever their final Notice.
 * @returns {"untouched"|"unwell"|"ruined"}
 */
export function epilogue(notice, visited = false) {
  if ( visited || (notice >= 5) ) return "ruined";
  if ( notice >= 3 ) return "unwell";
  return "untouched";
}

/**
 * What a "Try again" does to the pool.
 * @param {object} pool
 * @param {boolean} pool.notice    Was the Notice die in the original pool?
 * @returns {{addNotice: boolean, noticeRollFirst: boolean}}
 */
export function tryAgain({ notice }) {
  return notice ? { addNotice: false, noticeRollFirst: true } : { addNotice: true, noticeRollFirst: false };
}
