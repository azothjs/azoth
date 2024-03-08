import { __createElement } from 'azoth/runtime';
import { Hono } from 'hono';
import { G as Greeting } from './greeting.jsx';

const app = new Hono();
app.get("/", (c) => {
  return c.html(__createElement(Greeting));
});
