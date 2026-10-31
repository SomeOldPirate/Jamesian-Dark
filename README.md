# Jamesian Dark for Foundry VTT

Ghost stories in the manner of M. R. James: a hack of Graham Walmsley's *Cthulhu Dark*.
Built for Foundry V14 (DataModels, ApplicationV2, DialogV2). No dependencies; Dice So Nice is supported if present.

## What it does

**Investigators** have a notebook sheet: name, occupation, scholarly interest, and Notice shown as six candles.
Each point of Notice snuffs a candle and darkens the page; at 6 the page is night.

- **Investigate / Anything else** open the pool dialog. Tick what applies (human capability, occupation or
  interest, risking your mind, meddling) and the system rolls the right dice, reads the highest, and posts the
  result from the right table.
- **Meddling** adds the Meddle die, and raises Notice by itself if that die is highest or ties. A
  Meddle/Notice tie raises Notice and then makes the Notice roll. The Meddlings list on the sheet is a plain
  list the table keeps by hand.
- **Notice rolls** happen automatically when the Notice die is higher than every other die or an
  investigation turns up a 6. On a 6 doing anything else, the GM gets a "Call for a Notice roll" button on
  the card. An Investigator at Notice 6, or one who has suffered the Visit, makes no more Notice rolls.
- **At Notice 6** the Notice die is set aside for good: the pool dialog greys it out, and Try again is no
  longer offered. The Meddle die can no longer raise Notice.
- **Try again** is a button on every roll card below Notice 6: it adds the Notice die if it was not in the
  pool, and rerolls every die. Meddling that has already raised Notice does not raise it again on a second
  attempt.
- **Failure Die** is a button anyone at the table can press on a roll that wasn't an investigation, once they
  have said how the character fails. It can be proposed once per roll.
- **Leave the story** rolls the die, lowers Notice if it should, and shows the epilogue.
- **A loose end** is a tick the GM sets on an Investigator's epilogue when the scenario says so: one band
  worse.
- **The Visit** is a button for the GM, on the sheet banner at Notice 6 and on the Company tab. It posts a
  card and marks the Investigator as visited. The card has a **Run, hide or endure** button for
  the player: a Light die, plus a second if their occupation or interest helps, and a tick for striking at
  the thing (then 1–3 means they do not survive). The Visit roll has no Failure Die and no Try again, and
  can be rolled once. On 1–3 the Investigator is Ruined, whatever their Notice; on a 4 or more their
  Notice sets the epilogue as usual.
- **Epilogues** follow Notice: 1–2 Untouched, 3–6 Never quite well again. Only the Visit (at a cost) or a
  loose end makes an Investigator Ruined.

The system rolls dice and keeps Notice. It leaves the talking to the table: asking whether something is
meddling, offering a bargain, striking at the thing (the GM clicks the sixth candle), deciding who is alone,
and telling the epilogues.

**The Haunting** is the GM's sheet for one story: the transgression, the thing, its tether, the restitution,
how it draws people apart and the narrator's frame; an escalation ladder (unease, dread, terror, horror);
warnings, bargains (meddling shortcuts and what each gets), six Provenance discoveries and glimpses, kept
as notes for the GM to speak from (a Provenance discovery can also be posted to chat, as a handout); and
**The Company**, a live view of every Investigator with one-click Notice rolls, Notice up and down, and the Visit.

**The Rules** are available from the ⋮ menu of any sheet, or `game.jamesianDark.openRules()`.

## Settings

| Setting | Default | |
|---|---|---|
| Players may set Notice by hand | off | Otherwise only the GM can click the candles. |
| Atmosphere (per player) | on | The screen edges darken as your own Investigator's Notice rises. |
| Sounds (per player) | on | A latch when your Notice rises. |

## Rulings the system makes

The system follows the GM Rules. Where they leave something open, it reads them like this:

1. **Three-way ties.** If the Meddle die and the Notice die tie for highest and a Light die ties them too,
   the system still applies both: Notice rises by 1, then a Notice roll.
2. **"Each transgression counts once"** is tracked only across Try again, as the rules now spell out. A second
   attempt at the same roll cannot raise Notice for meddling a second time (a Meddle/Notice tie still calls
   for its Notice roll). A fresh roll is taken to be a fresh act; if it was not, the GM lowers Notice again.
3. **Group rolls** are not a separate button. Each helper rolls their own pool, which applies their own
   triggers; the table reads the best card, and proposes the Failure Die on that one.

## Development

    node tools/test-rules.mjs

runs the rules tests. `module/dice/rules.mjs` holds the rules as pure functions with no Foundry dependency.

Fonts: IM Fell English by Igino Marini, SIL Open Font License (see `assets/fonts/OFL.txt`).
