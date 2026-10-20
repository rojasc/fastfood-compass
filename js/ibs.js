// IBS Food Compass: the same chains, rated by flavor and what they do to you after.
export { ITEMS } from './chains.js?v=9';

export const STORE_KEY = 'ibsplot:v1';
export const FILE_NAME = 'ibs-food-compass.png';
export const SHARE_TEXT = 'My IBS food compass 💩';

// x: disgusting (0) → delicious (1). y: normal poop (0) → repeated diarrhea (1).
export const DEFAULT_STATE = {
  title: 'IBS FOOD COMPASS',
  sub: 'Flavor × Bathroom Consequences',
  ax: ['Normal Poop', 'Repeated Diarrhea', 'Disgusting', 'Delicious'],
  q: [
    ['Boring But Safe', 'Tastes meh.', 'Gut stays calm.'],
    ['Holy Grail', 'Tastes great.', 'Stays put.'],
    ['Lose-Lose', 'Tastes bad.', 'Wrecks you anyway.'],
    ['Worth The Risk', 'Tastes amazing.', 'Clear your schedule.'],
  ],
  names: true,
  c: [],
  p: [
    ['subway', 0.38, 0.17], ['panera', 0.24, 0.25], ['jimmy-johns', 0.52, 0.22],
    ['jersey-mikes', 0.68, 0.16], ['chick-fil-a', 0.84, 0.24], ['raising-canes', 0.76, 0.36],
    ['wendys', 0.6, 0.38], ['five-guys', 0.9, 0.44], ['burger-king', 0.3, 0.56],
    ['arbys', 0.16, 0.62], ['mcdonalds', 0.6, 0.58], ['kfc', 0.42, 0.66],
    ['starbucks', 0.54, 0.74], ['popeyes', 0.86, 0.64], ['dairy-queen', 0.72, 0.7],
    ['little-caesars', 0.2, 0.76], ['long-john-silvers', 0.1, 0.86], ['white-castle', 0.38, 0.86],
    ['chipotle', 0.82, 0.8], ['taco-bell', 0.66, 0.9],
  ],
};
