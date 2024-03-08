import { Hono } from 'hono';
import { Greeting } from './greeting.jsx';

const app = new Hono();

app.get('/', (c) => {
    return c.html(<Greeting />);
});

export default app;
