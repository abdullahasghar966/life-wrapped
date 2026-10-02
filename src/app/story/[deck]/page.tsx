import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DECK_ORDER, DECKS, isDeckId } from '@/story/decks';
import { StoryClient } from './StoryClient';

export const dynamicParams = false;

export function generateStaticParams() {
  return DECK_ORDER.map((deck) => ({ deck }));
}

export async function generateMetadata({ params }: PageProps<'/story/[deck]'>): Promise<Metadata> {
  const { deck } = await params;
  return { title: isDeckId(deck) ? DECKS[deck].title : 'Story' };
}

export default async function StoryPage({ params }: PageProps<'/story/[deck]'>) {
  const { deck } = await params;
  if (!isDeckId(deck)) notFound();
  return (
    <Suspense>
      <StoryClient deck={deck} />
    </Suspense>
  );
}
