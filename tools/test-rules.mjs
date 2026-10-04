// Run with: node tools/test-rules.mjs
import assert from "node:assert/strict";
import * as R from "../module/dice/rules.mjs";

// Bands
assert.equal(R.band(1), "low"); assert.equal(R.band(3), "low");
assert.equal(R.band(4), "four"); assert.equal(R.band(5), "five"); assert.equal(R.band(6), "six");

// Plain pool
let r = R.resolvePool({ light: [2, 5] }, { kind: "other" });
assert.equal(r.highest, 5); assert.equal(r.noticeRoll, false); assert.equal(r.gmMayCall, false);

// Six doing anything else: GM may call
r = R.resolvePool({ light: [6, 1] }, { kind: "other" });
assert.equal(r.gmMayCall, true); assert.equal(r.noticeRoll, false);

// Six investigating: automatic Notice roll
r = R.resolvePool({ light: [6] }, { kind: "investigate" });
assert.deepEqual(r.noticeRollReasons, ["glimpse"]);

// Notice die highest outright
r = R.resolvePool({ light: [2, 3], notice: 5 });
assert.equal(r.noticeDieHighest, true); assert.deepEqual(r.noticeRollReasons, ["noticeDie"]);

// Notice die ties a Light die: not highest by default, highest with the setting
r = R.resolvePool({ light: [5, 3], notice: 5 });
assert.equal(r.noticeRoll, false);
r = R.resolvePool({ light: [5, 3], notice: 5 }, { noticeTies: true });
assert.equal(r.noticeRoll, true);

// Notice die highest AND a six while investigating: one roll, two reasons
r = R.resolvePool({ light: [1], notice: 6 }, { kind: "investigate" });
assert.deepEqual(r.noticeRollReasons, ["noticeDie", "glimpse"]);

// Meddle die highest
r = R.resolvePool({ light: [2, 3], meddle: 4 });
assert.equal(r.meddleRemarked, true); assert.equal(r.noticeRoll, false);

// Meddle die ties for highest
r = R.resolvePool({ light: [4, 3], meddle: 4 });
assert.equal(r.meddleRemarked, true);

// Meddle die beaten: unremarked
r = R.resolvePool({ light: [5], meddle: 4 });
assert.equal(r.meddleRemarked, false);

// Meddle and Notice tie for highest: rise, then a Notice roll
r = R.resolvePool({ light: [1], meddle: 4, notice: 4 });
assert.equal(r.meddleRemarked, true); assert.deepEqual(r.noticeRollReasons, ["meddleTie"]);

// Meddle and Notice tie but a Light die beats both: nothing
r = R.resolvePool({ light: [5], meddle: 4, notice: 4 });
assert.equal(r.meddleRemarked, false); assert.equal(r.noticeRoll, false);

// Meddle die alone in the pool
r = R.resolvePool({ meddle: 2 });
assert.equal(r.meddleRemarked, true);

assert.throws(() => R.resolvePool({}));

// Notice rolls
assert.equal(R.noticeRollRises(3, 2), true); assert.equal(R.noticeRollRises(2, 2), false);
assert.equal(R.noticeRollRises(6, 6), false);

// Leaving
assert.equal(R.leavingFalls(2, 3), true); assert.equal(R.leavingFalls(3, 3), false);
assert.equal(R.leavingFalls(1, 1), false);

// Failure die
assert.equal(R.failureBeats(5, 4), true); assert.equal(R.failureBeats(4, 4), false);

// Epilogues
assert.equal(R.epilogue(1), "untouched"); assert.equal(R.epilogue(2), "untouched");
assert.equal(R.epilogue(3), "unwell"); assert.equal(R.epilogue(4), "unwell");
assert.equal(R.epilogue(5), "ruined"); assert.equal(R.epilogue(6), "ruined");
assert.equal(R.epilogue(1, true), "ruined");

// Trying again
assert.deepEqual(R.tryAgain({ notice: false }), { addNotice: true, noticeRollFirst: false });
assert.deepEqual(R.tryAgain({ notice: true }), { addNotice: false, noticeRollFirst: true });

console.log("rules: all assertions passed");
