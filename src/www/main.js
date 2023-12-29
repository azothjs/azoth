import './style.css';
import { __makeRenderer } from '../azoth/index.js';
// import './lab.js';

const template = ({ title, category, description }) => #`
    <main>
        <h2>Rendered {title}</h2>
        <p class={category}>{description}</p>
    </main>
`;

const dom = template({ 
    title: 'azoth', 
    category: 'ftw', 
    description: 'hello template',
});
const d2 = dom()
document.body.append(d2);