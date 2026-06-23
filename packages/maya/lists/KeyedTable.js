import { KeyedList } from './KeyedList.js';

/**
 * KeyedTable — the `<table>` keyed-list leaf. Owns a real `<table><tbody>` and
 * manages `<tr>` rows in the tbody; the author's `view` returns the `<tr>`.
 *
 * This is why the base separates `root` (appended to the element) from
 * `rowContainer` (where rows go): here root is the `<table>`, rowContainer the
 * nested `<tbody>`. Self-defines `<keyed-table>` idempotently.
 */
export class KeyedTable extends KeyedList {
    createRoot() {
        const table = document.createElement('table');
        table.append(document.createElement('tbody'));
        return table;
    }

    get rowContainer() { return this.root.querySelector('tbody'); }
}

if(!customElements.get('keyed-table')) customElements.define('keyed-table', KeyedTable);
