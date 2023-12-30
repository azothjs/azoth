import './style.css';
import { __makeRenderer } from '../azoth/index.js';
import { searchHandler } from './lab.js';

const template = ({ title, category, description }) => #`
    <main>
        <h2>Rendered {title}</h2>
        <form id="search" onsubmit={searchHandler}>
            <input name="query">
            <button>search</button>
        </form>
        <p class={category}>{description}</p>
    </main>
`;

const footer = #`<footer>&copy; 2023 Azoth JS</footer>`;

document.body.append(template({ 
    title: 'azoth', 
    category: 'ftw', 
    description: 'hello template',
}), footer);
