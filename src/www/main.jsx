import './style.css';

const $Header = <header>
    <h1>Emojis for all my friends</h1>
</header>;

const $emoji = ({ name }) => <li>{name}</li>;

async function fetchEmojis() {
    const res = await fetch('https://emojihub.yurace.pro/api/all');
    return res.json();
}

const promise = fetchEmojis().then(emojis => emojis.map($emoji));
const $Emojis = <ul>{promise}</ul>;

document.body.append(
    $Emojis
);



// const $App = <>
//     {$Header}
//     <main>
//         {$Emojis}
//     </main>
// </>
