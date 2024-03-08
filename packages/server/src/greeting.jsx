
export function Greeting({
    salutation = 'Hello',
    name = 'Hono'
}) {
    return <h1>{salutation} {name}</h1>;
}