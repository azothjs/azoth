/* global QUnit */
const { test, module, assert } = QUnit;
export { test, module, assert };
export const skip = { test: () => {} };
export const fixture = document.getElementById('qunit-fixture');

const clean = html => html
    .replace(/ data-bind=""/g, '')
    .replace(/<!-- block -->/g, '')
    .replace(/<!-- block start -->/g, '');

fixture.cleanHTML = function cleanHtml() {
    return clean(this.innerHTML).trim();
};

const stripWhitespace = string => string.replace(/\s+/g, '');

QUnit.assert.contentEqual = function(actual, expected, message) {
    this.equal(stripWhitespace(actual), stripWhitespace(expected), message);
};