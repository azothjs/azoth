import './style.css';
import { __makeRenderer } from '../azoth/index.js';

const template = ({ title, category, description }) => #`
    <main>
        <h2>Rendered {title}</h2>
        <p class={category}>{description}</p>
    </main>
`;

const footer = #`<footer>&copy; 2023 Azoth JS</footer>`;

document.body.append(template({ 
    title: 'azoth', 
    category: 'ftw', 
    description: 'hello template',
}), footer);

console.log(footer)