export const CATEGORIES = [
  { value: 'dance', label: 'Dance / Fitness / Yoga' },
  { value: 'dj', label: 'DJ' },
  { value: 'music', label: 'Musician / Band' },
  { value: 'other', label: 'Other' },
] as const

export type Category = (typeof CATEGORIES)[number]['value']

type Terms = {
  items: string
  item: string
  activeLabel: string
  addLabel: string
  scheduleLabel: string
}

const TERMS: Record<Category, Terms> = {
  dance: { items: 'Classes', item: 'Class', activeLabel: 'Teaching this week', addLabel: 'Add Class', scheduleLabel: 'Schedule' },
  dj: { items: 'Sets', item: 'Set', activeLabel: 'Playing this week', addLabel: 'Add Set', scheduleLabel: "This Week's Sets" },
  music: { items: 'Shows', item: 'Show', activeLabel: 'Performing this week', addLabel: 'Add Show', scheduleLabel: "This Week's Shows" },
  other: { items: 'Events', item: 'Event', activeLabel: 'Happening this week', addLabel: 'Add Event', scheduleLabel: "This Week's Events" },
}

export function getTerminology(category?: string | null): Terms {
  return TERMS[category as Category] ?? TERMS.other
}
