import './style.css';
import { add } from './calc.js';

// console.log('baa', add(3, 5));

document.querySelector('h1').textContent = 'baa ja jha ha ta';

const _ = options => () => {};

const Testhtml = /*html*/`<span>hello html</span>`;
const Testhml = html`    <span>hello html</span>`;
const Test_ = _`<span>hello html</span>`;

const Card = _({
    hydrate: true,
    pool: 100
})`
    <article>


    </article>
`;