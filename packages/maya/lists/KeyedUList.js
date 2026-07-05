import { KeyedList } from './KeyedList.js';

/**
 * KeyedUList — the `<ul>` keyed-list leaf. Owns a real `<ul>` (light DOM) and
 * manages `<li>` rows inside it; the author's `view` returns the `<li>`.
 *
 * Self-defines `<keyed-ul>` idempotently on import (a double-load can't throw).
 * Author subclasses extend this and define their own tag.
 */
export class KeyedUList extends KeyedList {
    createRoot() { return document.createElement('ul'); }
}

if(!customElements.get('keyed-ul')) customElements.define('keyed-ul', KeyedUList);
