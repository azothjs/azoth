import './style.css';
import { _, __makeRenderer } from '../azoth/index.js';

const template = _/*html*/`
    <main>
        <h2>Rendered Azoth template!</h2>
        <ul>
            <li>one</li>
            <li>two</li>
            <li>three</li>
        </ul>
        <pre>what? \u0026#128102</pre>
    </main>
`;

// const template = _/*html*/`az`;

document.body.append(template());

// let $ = (strings, ...exprs) => () => (String.raw(strings, ...exprs));
class $ {}
class Component extends $ {
    
    render = _`
        <p><span></span></p>
    `;
    
    constructor(name) {
        super();
        this.name = name;
    }

	
}

let c = new Component('azoth');
console.log(c.render());