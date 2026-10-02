import type { DeckId } from '../types';
import { hashOf } from './filters';
import type { DataCtx, InsightDef, InsightResult, QueryFn } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInsight = InsightDef<any>;

const REGISTRY: AnyInsight[] = [];

export function registerInsights(defs: AnyInsight[]): void {
  for (const d of defs) {
    if (REGISTRY.some((r) => r.id === d.id)) continue;
    REGISTRY.push(d);
  }
}

export function insightsFor(deck: DeckId): AnyInsight[] {
  return REGISTRY.filter((d) => d.deck === deck).sort((a, b) => a.order - b.order);
}

export function allInsights(): AnyInsight[] {
  return [...REGISTRY];
}

/** Runs every insight of a deck; cards whose minimum-data rule fails are left out. */
export async function runDeck(deck: DeckId, q: QueryFn, ctx: DataCtx): Promise<InsightResult[]> {
  const out: InsightResult[] = [];
  for (const def of insightsFor(deck)) {
    if (!(await def.requires(q, ctx))) continue;
    const props = await def.run(q, ctx);
    if (props === null || props === undefined) continue;
    out.push({
      id: def.id,
      deck: def.deck,
      order: def.order,
      title: def.title,
      props,
      a11y: def.a11yText(props),
      shareable: !!def.share,
      share: def.share?.(props, ctx),
      seed: hashOf(props),
    });
  }
  return out;
}
