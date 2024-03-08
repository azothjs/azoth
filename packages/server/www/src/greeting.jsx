import { __compose } from 'azoth/runtime';
import { t as tff06997295 } from '../ff06997295.html';

function Greeting({ salutation = "Hello", name = "Hono" }) {
  const __root = tff06997295()[0];
  const __child0 = __root.childNodes[0];
  const __child1 = __root.childNodes[2];
  __compose(__child0, salutation);
  __compose(__child1, name);
  return __root;
}

export { Greeting as G };
