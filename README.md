# Jamesian Dark for Foundry VTT

Ghost stories in the manner of M. R. James: a one-page hack of Graham Walmsley's *Cthulhu Dark*.
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
- **Notice rolls** happen automatically when the Notice die is highest or an investigation turns up a 6.
  On a 6 doing anything else, the GM gets a "Call for a Notice roll" button on the card.
- **Try again** is a button on every roll card: it adds the Notice die, or makes a Notice roll first if the
  Notice die was already in the pool.
- **Failure Die** is a button anyone at the table can press on a roll that wasn't an investigation, once they
  have said how the character fails.
- **Leave the story** rolls the die, lowers Notice if it should, and shows the epilogue.
- **The Visit** is a button for the GM, on the sheet banner at Notice 6 and on the Company tab. It posts a
  card and marks the Investigator for the worst epilogue.

The system rolls dice and keeps Notice. It leaves the talking to the table: asking whether something is
meddling, offering a bargain, striking at the thing (the GM clicks the sixth candle), deciding who is alone,
and telling the epilogues.

**The Haunting** is the GM's sheet for one story: the transgression, the thing, its tether and the restitution;
an escalation ladder (unease, dread, terror, horror); warnings, six Provenance discoveries and glimpses, kept
as notes for the GM to speak from (a Provenance discovery can also be posted to chat, as a handout); and
**The Company**, a live view of every Investigator with one-click Notice rolls, Notice up and down, and the Visit.

**The Rules** are available from the ⋮ menu of any sheet, or `game.jamesianDark.openRules()`.

## Settings

| Setting | Default | |
|---|---|---|
| The Notice die wins ties with Light dice | off | See below. |
| Players may set Notice by hand | off | Otherwise only the GM can click the candles. |
| Atmosphere (per player) | on | The screen edges darken as your own Investigator's Notice rises. |
| Sounds (per player) | on | A latch when your Notice rises. |

## Rulings the system makes

The one-page rules leave a few things open. The system reads them like this:

1. **Notice die ties.** "If the Notice die is highest" is read as highest outright, or tied with the Meddle die
   (the one tie the rules spell out). A tie with a Light die does not call for a Notice roll. There is a setting
   to change this.
2. **One Notice roll per roll.** If the Notice die is highest *and* it is a 6 while investigating, that is one
   Notice roll, not two.
3. **"Each distinct transgression counts once"** is left to the table. The system raises Notice whenever the
   Meddle die is highest or ties; if that transgression had already counted (on a Try again, say), the GM
   lowers Notice again.
4. **Try again when meddling** rerolls the Meddle die with everything else.

## Development

    node tools/test-rules.mjs

runs the rules tests. `module/dice/rules.mjs` holds the rules as pure functions with no Foundry dependency.

Fonts: IM Fell English by Igino Marini, SIL Open Font License (see `assets/fonts/OFL.txt`).
