import './style.css';

document.body.append(
    <h1>Hello Azoth</h1>
);

const adjectives = [
    'pretty',
    'large',
    'big',
    'small',
    'tall',
    'short',
    'long',
    'handsome',
    'plain',
    'quaint',
    'clean',
    'elegant',
    'easy',
    'angry',
    'crazy',
    'helpful',
    'mushy',
    'odd',
    'unsightly',
    'adorable',
    'important',
    'inexpensive',
    'cheap',
    'expensive',
    'fancy'
];
const colors = [
    'red',
    'yellow',
    'blue',
    'green',
    'pink',
    'brown',
    'purple',
    'brown',
    'white',
    'black',
    'orange'
];
const nouns = [
    'table',
    'chair',
    'house',
    'bbq',
    'desk',
    'car',
    'pony',
    'cookie',
    'sandwich',
    'burger',
    'pizza',
    'mouse',
    'keyboard'
];

function _random(max) {
    return Math.round(Math.random() * 1000) % max;
}

let rowId = 1;
class Item {
    id = rowId++;
    label = `${adjectives[_random(adjectives.length)]} ${colors[_random(colors.length)]} ${nouns[_random(nouns.length)]}`;
}

function buildData(count = 1000) {
    const data = new Array(count);
    for (let i = 0; i < count; i++) {
        data[i] = new Item();
    }
    return data;
}

console.time('create 1000 rows');

const data = buildData();

document.body.append($table({ data }));

console.timeEnd('create 1000 rows')

function $table({ data }) {
    const rows = data.map($row);
    return 	<table class="table table-hover table-striped test-data">
		<tbody>{rows}</tbody>
    </table>;
}

function $row({ id, label }) {
    return <tr
        ><td class="col-md-1">{id}</td><td class="col-md-4"
            ><a
                >{label}</a
            ></td
        ><td class="col-md-1"
            ><a
                ><span class="glyphicon glyphicon-remove" aria-hidden="true" /></a
            ></td
        ><td class="col-md-6" /></tr
    >
}