/**
 * Basic offline word list for Word Chain validation, per the brief ("validate
 * against a basic dictionary word list") -- not an exhaustive dictionary,
 * just enough common English words with decent letter coverage (including
 * awkward chain-enders like q/x/z/u) to keep a casual game moving. Swap for
 * a real dictionary package later without touching the game logic --
 * lib/games/wordChain.ts only calls isValidWord() from here.
 */
export const WORD_LIST: string[] = [
  'apple', 'ant', 'arrow', 'art', 'avocado', 'axe', 'amber', 'anchor', 'angle', 'animal',
  'banana', 'bear', 'bird', 'blue', 'book', 'bridge', 'bubble', 'button', 'breeze', 'brave',
  'cat', 'candle', 'cloud', 'coffee', 'cookie', 'crown', 'circle', 'coast', 'comet', 'cozy',
  'dog', 'dream', 'drum', 'daisy', 'dance', 'diamond', 'doodle', 'dusk', 'dawn', 'delta',
  'egg', 'echo', 'eagle', 'ember', 'engine', 'entry', 'evening', 'ever', 'exit', 'extra',
  'feather', 'flower', 'forest', 'friend', 'frog', 'fox', 'fudge', 'fable', 'flame', 'fizz',
  'garden', 'ghost', 'glow', 'grape', 'guitar', 'galaxy', 'gentle', 'giggle', 'globe', 'grin',
  'harbor', 'heart', 'honey', 'horse', 'house', 'hug', 'hollow', 'hobby', 'humor', 'hymn',
  'ice', 'igloo', 'ink', 'iris', 'island', 'ivy', 'idea', 'inbox', 'inch', 'iron',
  'jacket', 'jam', 'jar', 'jelly', 'jewel', 'joke', 'journal', 'joy', 'jungle', 'jazz',
  'kettle', 'key', 'kind', 'kite', 'kitten', 'knight', 'knot', 'koala', 'kayak', 'kiwi',
  'lamp', 'leaf', 'lemon', 'light', 'lion', 'lizard', 'lucky', 'lunar', 'lyric', 'latte',
  'magic', 'maple', 'melody', 'mint', 'moon', 'mountain', 'mouse', 'music', 'mellow', 'myth',
  'nectar', 'needle', 'nest', 'night', 'noodle', 'north', 'note', 'nova', 'nudge', 'nutmeg',
  'ocean', 'olive', 'onion', 'opal', 'orange', 'orbit', 'otter', 'oval', 'owl', 'oxygen',
  'paper', 'peach', 'pebble', 'pencil', 'penguin', 'pillow', 'pine', 'planet', 'puzzle', 'purple',
  'quack', 'quail', 'quart', 'queen', 'quest', 'quick', 'quiet', 'quill', 'quilt', 'quirk',
  'rabbit', 'rain', 'raven', 'ribbon', 'river', 'robin', 'rocket', 'rose', 'rustic', 'ripple',
  'sail', 'salt', 'sand', 'shadow', 'ship', 'silver', 'sky', 'snow', 'star', 'sunset',
  'table', 'tea', 'tiger', 'toast', 'tornado', 'tree', 'tulip', 'turtle', 'twilight', 'tangle',
  'umbrella', 'uncle', 'under', 'unicorn', 'union', 'unique', 'unity', 'up', 'urban', 'utter',
  'valley', 'vanilla', 'velvet', 'vessel', 'view', 'village', 'violet', 'violin', 'vivid', 'voyage',
  'wagon', 'walnut', 'water', 'wave', 'whale', 'wheat', 'willow', 'window', 'winter', 'wonder',
  'xenon', 'xerox', 'xylophone', 'yak', 'yarn', 'year', 'yellow', 'yeti', 'yogurt', 'young',
  'zebra', 'zero', 'zest', 'zigzag', 'zinc', 'zip', 'zone', 'zoom', 'zephyr', 'zeal',
  'again', 'about', 'above', 'across', 'after', 'always', 'amazing', 'answer', 'around', 'away',
  'begin', 'below', 'between', 'better', 'brown', 'build', 'busy', 'buddy', 'bright', 'brush',
  'change', 'chase', 'cheer', 'chill', 'climb', 'clock', 'close', 'color', 'count', 'curious',
  'dance', 'dark', 'deep', 'delight', 'dizzy', 'doubt', 'dozen', 'drift', 'dry', 'dusty',
  'early', 'earth', 'easy', 'edge', 'eight', 'empty', 'enjoy', 'enough', 'equal', 'even',
  'fancy', 'far', 'fast', 'field', 'fifty', 'fine', 'first', 'fresh', 'funny', 'future',
  'gather', 'gentle', 'giant', 'gift', 'glad', 'gold', 'good', 'grand', 'green', 'grow',
  'happy', 'harmony', 'heavy', 'hidden', 'high', 'hold', 'hope', 'hour', 'huge', 'humble',
  'imagine', 'inside', 'into', 'itself', 'jolly', 'jump', 'just', 'keen', 'known', 'large',
  'later', 'laugh', 'learn', 'level', 'light', 'listen', 'little', 'lively', 'lovely', 'lower',
  'magic', 'major', 'many', 'match', 'mellow', 'mighty', 'mild', 'mind', 'more', 'move',
  'name', 'near', 'never', 'new', 'next', 'nice', 'nine', 'now', 'number', 'nurture',
  'often', 'okay', 'once', 'only', 'open', 'other', 'over', 'own', 'peace', 'plenty',
  'quaint', 'quality', 'quantum', 'quarter', 'quiver', 'quote', 'race', 'rain', 'reach', 'ready',
  'safe', 'same', 'sea', 'settle', 'seven', 'shine', 'simple', 'six', 'slow', 'small',
  'talk', 'tall', 'ten', 'thankful', 'thin', 'three', 'today', 'together', 'true', 'try',
  'under', 'until', 'upon', 'us', 'usual', 'value', 'vast', 'very', 'vibe', 'visit',
  'warm', 'way', 'well', 'when', 'wide', 'wild', 'wish', 'with', 'wrap', 'write',
];

const WORD_SET = new Set(WORD_LIST.map((w) => w.toLowerCase()));

export function isValidWord(word: string): boolean {
  return WORD_SET.has(word.trim().toLowerCase());
}
