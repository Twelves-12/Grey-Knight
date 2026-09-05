/**
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {HTMLElement | null}
 */
export const $ = (selector, root = document) => root.querySelector(selector);

/**
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {NodeListOf<HTMLElement>}
 */
export const $$ = (selector, root = document) =>
  root.querySelectorAll(selector);
