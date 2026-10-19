// Built-in chains. Most use a bundled logo (logos/<id>.png); a few render
// as a brand-colored text badge because no decent logo was available.
const logo = (id, name) => ({ id, name, img: `logos/${id}.png` });
const badge = (id, name, bg, fg, text) => ({ id, name, badge: { bg, fg, text } });

export const CHAINS = [
  logo('mcdonalds', "McDonald's"),
  logo('burger-king', 'Burger King'),
  logo('wendys', "Wendy's"),
  logo('taco-bell', 'Taco Bell'),
  logo('kfc', 'KFC'),
  badge('subway', 'Subway', '#008c15', '#ffc20d', 'SUBWAY'),
  logo('chick-fil-a', 'Chick-fil-A'),
  logo('chipotle', 'Chipotle'),
  logo('popeyes', 'Popeyes'),
  logo('five-guys', 'Five Guys'),
  logo('whataburger', 'Whataburger'),
  logo('raising-canes', "Raising Cane's"),
  logo('sonic', 'Sonic'),
  logo('arbys', "Arby's"),
  logo('jack-in-the-box', 'Jack in the Box'),
  logo('white-castle', 'White Castle'),
  logo('dominos', "Domino's"),
  logo('pizza-hut', 'Pizza Hut'),
  logo('papa-johns', "Papa John's"),
  logo('little-caesars', 'Little Caesars'),
  logo('dairy-queen', 'Dairy Queen'),
  logo('panda-express', 'Panda Express'),
  logo('shake-shack', 'Shake Shack'),
  badge('culvers', "Culver's", '#0054a4', '#ffffff', "CULVER'S"),
  logo('wingstop', 'Wingstop'),
  logo('jimmy-johns', "Jimmy John's"),
  logo('jersey-mikes', "Jersey Mike's"),
  logo('panera', 'Panera'),
  logo('starbucks', 'Starbucks'),
  logo('dunkin', "Dunkin'"),
  logo('carls-jr', "Carl's Jr."),
  logo('hardees', "Hardee's"),
  logo('del-taco', 'Del Taco'),
  logo('long-john-silvers', "Long John Silver's"),
  logo('cook-out', 'Cook Out'),
  logo('zaxbys', "Zaxby's"),
  badge('checkers', "Checkers / Rally's", '#d71920', '#ffffff', 'CHECKERS'),
  logo('qdoba', 'Qdoba'),
  logo('el-pollo-loco', 'El Pollo Loco'),
  logo('bojangles', 'Bojangles'),
  logo('krispy-kreme', 'Krispy Kreme'),
];

export const CHAIN_BY_ID = new Map(CHAINS.map((c) => [c.id, c]));

// The example chart. Positions are 0..1 across the board: x left→right, y top→bottom.
export const DEFAULT_STATE = {
  title: 'FAST FOOD CHAINS',
  sub: 'Food Quality × 2 A.M. Reliability',
  ax: ['Never Lets You Down', 'Open During The Day', 'Regret', 'Would Choose Sober'],
  q: [
    ['Gremlin Fuel', 'Not great.', 'Always there.'],
    ['Late-Night Legend', 'Tastes good.', 'Comes through.'],
    ['Daylight Regret', 'Weak food.', 'Weak hours.'],
    ['Daytime Darlings', 'Great sober pick.', 'Asleep by midnight.'],
  ],
  names: true,
  c: [],
  p: [
    ['white-castle', 0.17, 0.21], ['jack-in-the-box', 0.41, 0.15], ['taco-bell', 0.33, 0.29],
    ['whataburger', 0.66, 0.17], ['cook-out', 0.78, 0.22], ['raising-canes', 0.9, 0.29],
    ['mcdonalds', 0.55, 0.27], ['dominos', 0.64, 0.36],
    ['wendys', 0.73, 0.39], ['burger-king', 0.32, 0.41], ['sonic', 0.44, 0.43],
    ['kfc', 0.38, 0.62], ['arbys', 0.24, 0.68], ['subway', 0.43, 0.74],
    ['popeyes', 0.62, 0.64], ['chipotle', 0.75, 0.69], ['five-guys', 0.87, 0.7],
    ['chick-fil-a', 0.92, 0.82], ['long-john-silvers', 0.1, 0.8],
  ],
};
