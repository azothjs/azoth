import './style.css';
import html from '/package.json';
import { _, __makeRenderer } from './azoth/index.js';

const template = _`
    <main>
        <h2>Rendered Azoth template!</h2>
        <ul>
            <li>one</li>
            <li>two</li>
            <li>three</li>
        </ul>
    </main>
`;

document.body.append(template());
