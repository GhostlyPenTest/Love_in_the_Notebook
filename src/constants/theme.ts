/**
 * No. 2 pencil / high-school-notebook visual theme.
 * Applied app-wide via components/paper — not just to games.
 */

export const paperColors = {
  // paper
  page: '#FBF7EE', // off-white notebook paper
  pageShadow: '#EDE6D3',
  ruleBlue: '#A9C4E8', // faint blue ruled lines
  marginRed: '#E08585', // red vertical margin line
  // "ink"
  pencil: '#33322E', // graphite grey-black, primary text
  pencilSoft: '#6B6A63', // secondary/muted text
  pencilFaint: '#B9B6A9', // placeholder/disabled
  // her set (floral doodles) accent
  inkPink: '#D2698C',
  inkPinkSoft: '#F2D6E0',
  // his set (arrows/stars doodles) accent
  inkBlue: '#3E6FA6',
  inkBlueSoft: '#D9E6F5',
  // status
  highlighterYellow: '#FCE993',
  good: '#5B8A6B',
  warn: '#C9762D',
  danger: '#C24D4D',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/**
 * Ruled-paper geometry: line spacing mimics wide-ruled notebook paper,
 * and the red margin sits a fixed distance from the left edge.
 */
export const ruledPaper = {
  lineSpacing: 32,
  marginInset: 44,
  lineColor: paperColors.ruleBlue,
  marginColor: paperColors.marginRed,
};

/**
 * Fonts: a handwriting-style display font for headers/notebook chrome,
 * and a slightly-imperfect body font. Both loaded in app/_layout.tsx via expo-font.
 * Falls back to system fonts until loaded.
 */
export const fonts = {
  hand: 'PatrickHand_400Regular', // big, clean-ish handwriting — headers, buttons, doodled chrome
  body: 'ArchitectsDaughter_400Regular', // messier scrawl — body copy, notes, entries
  system: 'System',
};

export const shadow = {
  paper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
};
