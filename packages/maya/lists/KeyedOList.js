import { KeyedList } from './KeyedList.js';

/**
 * KeyedOList — the `<ol>` keyed-list leaf. Owns a real `<ol>`; the author's
 * `view` returns the `<li>`. Self-defines `<keyed-ol>` idempotently.
 */
export class KeyedOList extends KeyedList {
    createRoot() { return document.createElement('ol'); }
}

if(!customElements.get('keyed-ol')) customElements.define('keyed-ol', KeyedOList);
