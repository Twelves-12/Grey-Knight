const PREFIX = "grey-knight:";

/** @param {string} key */
export const get = (key) => localStorage.getItem(PREFIX + key);

/**
 * @param {string} key
 * @param {string} value
 */
export const set = (key, value) => localStorage.setItem(PREFIX + key, value);

/** @param {string} key */
export const remove = (key) => localStorage.removeItem(PREFIX + key);
