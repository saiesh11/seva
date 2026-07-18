// Emoji placeholders until real category artwork exists (categories.icon_url
// is reserved in the schema for that — swap this map out once assets land).
const CATEGORY_ICONS: Record<string, string> = {
  Electrician: '⚡',
  Plumber: '🔧',
  Carpenter: '🪚',
  Painter: '🎨',
  'AC Repair & Servicing': '❄️',
  'Appliance Repair': '🔌',
  'Pest Control': '🐜',
  'Cleaning & Housekeeping': '🧹',
};

const FALLBACK_ICON = '🛠️';

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? FALLBACK_ICON;
}
