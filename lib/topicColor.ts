// Mosby's Files palette: flat saturated blocks. `ink` is the readable text colour on each.
export interface TopicColor {
  bg: string;
  ink: string;
}

export const TOPIC_PALETTE: TopicColor[] = [
  { bg: '#1e4bd7', ink: '#ffffff' }, // blue
  { bg: '#d71e1e', ink: '#ffffff' }, // red
  { bg: '#0c7866', ink: '#ffffff' }, // green
  { bg: '#581e70', ink: '#ffffff' }, // purple
  { bg: '#ffe927', ink: '#000000' }, // yellow
];

// Assigns palette colours to topics alphabetically, so each topic keeps the same colour
// on every page (home, topics, note detail, graph) and neighbours stay distinct.
export function buildTopicColorMap(topics: string[]): Record<string, TopicColor> {
  const sorted = Array.from(new Set(topics)).sort((a, b) => a.localeCompare(b));
  const map: Record<string, TopicColor> = {};
  sorted.forEach((topic, i) => {
    map[topic] = TOPIC_PALETTE[i % TOPIC_PALETTE.length];
  });
  return map;
}
