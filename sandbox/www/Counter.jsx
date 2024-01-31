import { subject } from 'azoth/futures';

export function Counter({ initial }) {
    let count = initial ?? 0;
    const [increment, $count] = subject(0, () => ++count);

    return <p>
        <button onclick={increment}>++</button>
        <span>{$count}</span>
    </p>;
}
