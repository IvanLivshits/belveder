import { RESERVED_QUALITIES, type StoryPartKind, type World } from "@belvedere/content-schema";
import { evaluateAll } from "./conditions";
import { EngineError, emptyHistory, type GameState, type NightRecord, type Profile } from "./state";
import { renderText } from "./text";

type Bags = Pick<GameState, "run" | "profile">;

/** Paragraphs are separated by blank lines in content. */
export function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export interface EndingView {
  id: string;
  title: string;
  image: string;
  paragraphs: string[];
  /** Epilogues whose `when` holds (they may look at `endings.*` of earlier cases). */
  epilogues: string[];
}

function findEnding(world: World, id: string) {
  const ending = world.endings?.endings.find((e) => e.id === id);
  if (!ending) throw new EngineError(`unknown ending: ${id}`);
  return ending;
}

/** The ending screen for a state in phase "ending". */
export function endingView(state: GameState, world: World): EndingView {
  if (state.phase !== "ending" || state.ending === null) throw new EngineError("no ending on screen");
  const ending = findEnding(world, state.ending);
  return {
    id: ending.id,
    title: ending.title,
    image: ending.image,
    paragraphs: paragraphs(renderText(ending.text, state, world)),
    epilogues: ending.epilogues.filter((e) => evaluateAll(state, world, e.when)).map((e) => renderText(e.text, state, world)),
  };
}

export type StorySection =
  | { kind: "opening"; text: string }
  /** One night's report as plain prose: one paragraph per slot, no slot labels; `night` is the night's real number. */
  | { kind: "night"; night: number; paragraphs: string[] }
  | { kind: "pledged_note"; text: string }
  | { kind: "litany"; intro: string; text: string }
  | { kind: "ending"; title: string; paragraphs: string[] }
  | { kind: "epilogues"; texts: string[] }
  | { kind: "closing"; text: string };

/** Renders a saved night's fragment with the placeholder values recorded at report time. */
function fragmentText(world: World, profile: Profile, record: NightRecord, slot: string): string | null {
  const id = record.report[slot];
  const fragment = world.fragments.find((f) => f.id === id);
  if (!fragment) return null;
  const bags: Bags = { run: record.values, profile: { ...profile.profile, ...record.values } };
  return renderText(fragment.text, bags, world);
}

/** The final story, assembled from the profile's history in the order `story.parts` gives.
 *  Pawned nights are left out; the closing line always comes last. */
export function storyView(profile: Profile, world: World, endingId: string): { title: string; sections: StorySection[] } {
  const config = world.endings;
  if (!config) throw new EngineError("world has no endings");
  const { story } = config;
  const ending = findEnding(world, endingId);
  const history = profile.history ?? emptyHistory();
  const bags: Bags = { run: {}, profile: profile.profile };
  const slots = world.report.slots;
  const openingSlot = story.opening_slot ?? slots[0]!.id;
  const litanySlot = story.litany_slot ?? slots[slots.length - 1]!.id;
  const sections: StorySection[] = [];
  for (const part of story.parts as readonly StoryPartKind[]) {
    switch (part) {
      case "opening": {
        const first = history.nights[0];
        const text = first && fragmentText(world, profile, first, openingSlot);
        if (text) sections.push({ kind: "opening", text });
        break;
      }
      case "nights": {
        // The first night's opening slot is already the story's opening, and the litany repeats the
        // litany slot of every night a pair was pawned, so those pages skip them.
        const hasOpening = story.parts.includes("opening");
        const hasLitany = story.parts.includes("litany");
        history.nights.forEach((rec, i) => {
          if (rec.pledged) return;
          const paragraphs = slots.flatMap(({ id }) => {
            if (hasOpening && i === 0 && id === openingSlot) return [];
            if (hasLitany && rec.pair !== undefined && id === litanySlot) return [];
            const text = fragmentText(world, profile, rec, id);
            return text === null ? [] : [text];
          });
          sections.push({ kind: "night", night: rec.night, paragraphs });
        });
        break;
      }
      case "pledged_note":
        if (history.nights.some((n) => n.pledged)) sections.push({ kind: "pledged_note", text: renderText(story.pledged_note, bags, world) });
        break;
      case "litany": {
        const texts = history.pledges.flatMap((pair) => {
          const rec = history.nights.find((n) => n.pair === pair);
          const text = rec && fragmentText(world, profile, rec, litanySlot);
          return text ? [text] : [];
        });
        if (texts.length > 0) sections.push({ kind: "litany", intro: renderText(story.litany_intro, bags, world), text: texts.join(" ") });
        break;
      }
      case "ending":
        sections.push({ kind: "ending", title: ending.title, paragraphs: paragraphs(renderText(ending.text, bags, world)) });
        break;
      case "epilogues": {
        const texts = ending.epilogues.filter((e) => evaluateAll(bags, world, e.when)).map((e) => renderText(e.text, bags, world));
        if (texts.length > 0) sections.push({ kind: "epilogues", texts });
        break;
      }
    }
  }
  sections.push({ kind: "closing", text: renderText(story.closing, bags, world) });
  return { title: story.title, sections };
}

/** A fresh profile for the next case: only the `endings.*` flags survive, the history is empty. */
export function newCase(profile: Profile): Profile {
  const kept = Object.fromEntries(Object.entries(profile.profile).filter(([id]) => id.startsWith(RESERVED_QUALITIES.endingPrefix)));
  return { v: profile.v, profile: kept, history: emptyHistory() };
}
