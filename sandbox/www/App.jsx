import { subject } from 'azoth/generators';

function Counter() {
    let count = 0;
    const [increment, $count] = subject(0, () => ++count);
    return <p>
        <button onclick={increment}>++</button>
        <span>{$count}</span>
    </p>;
}

function Emojis() {
    return <div>Emojis</div>;
}

function Pokedex() {
    return <div>Pokedex</div>;
}

function Dashboard() {
    return <div>Dashboard</div>;
}

const emojis = <Emojis/>;
const pokedex = <Pokedex/>;
const dashboard = <Dashboard/>;
const pages = { emojis, pokedex };

const [hashChange, Page] = subject(dashboard, (e) => {
    const url = new URL(e.newURL);
    const key = url.hash.slice(1);
    return pages[key] || dashboard;
});

window.onhashchange = hashChange;

export default <>
    <header>
        <h1>App Header</h1>
        <nav>
            <a href="#">home</a>
            <a href="#emojis">emojis</a>
            <a href="#pokedex">pokedex</a>
        </nav>
    </header>
    <main>
        {Page}
        <Counter/>
    </main>
</>;