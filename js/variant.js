// Each page picks its item set with <html data-variant="...">.
import * as fastfood from './chains.js?v=9';
import * as ibs from './ibs.js?v=9';

const VARIANTS = { fastfood, ibs };

export const VARIANT = VARIANTS[document.documentElement.dataset.variant] || fastfood;
export const { ITEMS, DEFAULT_STATE, STORE_KEY, FILE_NAME, SHARE_TEXT } = VARIANT;
export const ITEM_BY_ID = new Map(ITEMS.map((c) => [c.id, c]));
