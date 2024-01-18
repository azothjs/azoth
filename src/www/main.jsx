import './style.css';
import { __renderById } from '../azoth/index.js';
// import { searchHandler } from './lab.js';

const template = ({ title, category, description }) => (
    <main>
        <h2>Rendered {title}</h2>
        <form id="search">
            <input name="query"/>
            <button>search</button>
        </form>
        <p className={category}>{description}</p>
    </main>
);

// <ul>#{[1, 4, 534].map(n => \`<li>{n}</li>\`)}
// const footer = #`<footer>&copy; 2023 Azoth JS</footer>`;

document.body.append(template({ 
    title: 'azoth', 
    category: 'ftw', 
    description: 'hello template',
}));
