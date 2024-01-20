import './style.css';
import { $cats } from './cats.jsx';
// import { searchHandler } from './lab.js';

const $form = ({ value, label = '' }) => (
    <form id="search">
        <input name="query" value={value} />
        <button>{label}</button>
    </form>
);

const $number = n => <li>{n}</li>;
const listOfNumbers = <ul>
    {[1, 4, 534].map($number)}
</ul>

const $chat = () => <>
    <p>chit</p>
    <p>chat</p>
</>

let cats = [
    { name: 'felix', lives: 9 },
    { name: 'duchess', lives: 9 },
    { name: 'tom', lives: 2 },
];

const $template = ({ title, category, description }) => (
    <main>
        <h2>Rendered {title}</h2>
        {listOfNumbers}
        {$cats({ cats })}
        {$chat()}
        {$form({ value: 'felix', label: 'search' })}
        <p className={category}>{description}</p>
    </main>
);

const footer = <footer>&copy; 2023 Azoth JS</footer>;

document.body.append(
    <h1>Hello Azoth</h1>,
    $template({ 
        title: 'azoth', 
        category: 'ftw', 
        description: 'hello template',
    }), 
    footer
);

