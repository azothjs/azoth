import './style.css';
// import { __makeRenderer } from '../azoth/index.js';
// import { searchHandler } from './lab.js';

class DomBlock {
    constructor(anchor, children) {
        if(Array.isArray(children)) {
            anchor.append(...children);
        }
        else {
            anchor.append(children);
        }
    }
}

// // const t = `hello ${world}`;

// const template = ({ title, category, description }) => /*html*/`
//     <main>
//         <h2>Rendered {title}</h2>
//         <form id="search" onsubmit={searchHandler}>
//             <input name="query">
//             <button>search</button>
//         </form>
//         <p class={category}>{description}</p>
//         <ul>#{[1, 4, 534].map(n => \`<li>{n}</li>\`)}
//     </main>
// `;

// const footer = #`<footer>&copy; 2023 Azoth JS</footer>`;

// document.body.append(template({ 
//     title: 'azoth', 
//     category: 'ftw', 
//     description: 'hello template',
// }), footer);
