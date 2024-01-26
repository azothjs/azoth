export function $cats({ cats }) {
    return <ul>{cats.map($cat)}</ul>;
}

export function $cat({ name, lives }) {
    return <li className={lives < 3 ? 'warning' : ''}>
        {name}
    </li>
}
