import { findByText, findAllByText } from '@testing-library/dom';

export function fixtureSetup(context) {
    document.body.innerHTML = '';
    context.fixture = document.body;
    context.find = (filter, options) => findByText(context.fixture, filter, options);
    context.findAll = (filter, options) => findAllByText(context.fixture, filter, options);
}
