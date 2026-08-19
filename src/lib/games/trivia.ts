import { hashSeed } from '@/lib/paper/rough';

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

/** One question per day, deterministically picked from the date -- both
 * partners land on the same question with zero Firestore round-trip. */
const QUESTION_BANK: TriviaQuestion[] = [
  { question: 'what planet is known as the red planet?', options: ['venus', 'mars', 'jupiter', 'mercury'], correctIndex: 1 },
  { question: 'how many hearts does an octopus have?', options: ['1', '2', '3', '9'], correctIndex: 2 },
  { question: 'what year did the titanic sink?', options: ['1905', '1912', '1920', '1931'], correctIndex: 1 },
  { question: 'what’s the smallest country in the world?', options: ['monaco', 'san marino', 'vatican city', 'liechtenstein'], correctIndex: 2 },
  { question: 'how many bones are in the human body?', options: ['186', '206', '226', '246'], correctIndex: 1 },
  { question: 'what’s the capital of australia?', options: ['sydney', 'melbourne', 'canberra', 'perth'], correctIndex: 2 },
  { question: 'which animal sleeps the most per day?', options: ['sloth', 'koala', 'cat', 'bat'], correctIndex: 3 },
  { question: 'what color do you get mixing blue and yellow?', options: ['purple', 'green', 'orange', 'brown'], correctIndex: 1 },
  { question: 'how many strings does a standard guitar have?', options: ['4', '5', '6', '7'], correctIndex: 2 },
  { question: 'what’s the tallest mountain in the world?', options: ['k2', 'everest', 'denali', 'kilimanjaro'], correctIndex: 1 },
  { question: 'what’s the fastest land animal?', options: ['lion', 'cheetah', 'gazelle', 'horse'], correctIndex: 1 },
  { question: 'how many hearts total do u and ur partner have between u?', options: ['1', '2', '3', 'depends on the day'], correctIndex: 1 },
  { question: 'what’s the most consumed beverage in the world (after water)?', options: ['coffee', 'tea', 'soda', 'juice'], correctIndex: 1 },
  { question: 'which ocean is the largest?', options: ['atlantic', 'indian', 'arctic', 'pacific'], correctIndex: 3 },
  { question: 'how many colors are in a rainbow?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { question: 'what’s the currency of japan?', options: ['won', 'yuan', 'yen', 'ringgit'], correctIndex: 2 },
  { question: 'what gas do plants breathe in?', options: ['oxygen', 'nitrogen', 'carbon dioxide', 'hydrogen'], correctIndex: 2 },
  { question: 'how many legs does a spider have?', options: ['6', '8', '10', '12'], correctIndex: 1 },
  { question: 'what’s the longest river in the world?', options: ['amazon', 'nile', 'yangtze', 'mississippi'], correctIndex: 1 },
  { question: 'which planet has the most moons?', options: ['jupiter', 'saturn', 'uranus', 'neptune'], correctIndex: 1 },
  { question: 'what’s the freezing point of water in fahrenheit?', options: ['0', '32', '100', '212'], correctIndex: 1 },
  { question: 'how many chambers does a human heart have?', options: ['2', '3', '4', '5'], correctIndex: 2 },
  { question: 'what’s the national animal of china?', options: ['tiger', 'dragon', 'panda', 'crane'], correctIndex: 2 },
  { question: 'which language has the most native speakers?', options: ['english', 'spanish', 'mandarin', 'hindi'], correctIndex: 2 },
  { question: 'what’s the smallest planet in our solar system?', options: ['mars', 'mercury', 'venus', 'pluto'], correctIndex: 1 },
  { question: 'how many keys are on a standard piano?', options: ['76', '88', '96', '104'], correctIndex: 1 },
  { question: 'what’s the hardest natural substance on earth?', options: ['gold', 'quartz', 'diamond', 'titanium'], correctIndex: 2 },
  { question: 'which country invented pizza (as we know it)?', options: ['france', 'greece', 'italy', 'spain'], correctIndex: 2 },
  { question: 'what’s the largest organ in the human body?', options: ['liver', 'skin', 'brain', 'lungs'], correctIndex: 1 },
  { question: 'how many time zones does russia span?', options: ['5', '7', '9', '11'], correctIndex: 3 },
];

function dateToDayIndex(date: string): number {
  return hashSeed(date) % QUESTION_BANK.length;
}

export function getQuestionForDate(date: string): TriviaQuestion {
  return QUESTION_BANK[dateToDayIndex(date)];
}
