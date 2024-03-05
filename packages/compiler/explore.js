import { __compose, __register, update } from 'azoth/runtime';
import { t2b440f4741 } from 'virtual:azoth-templates?id=2b440f4741';

const Item = (props) => <_ update>
    <li className={props.category}>Hello {props.place}</li>
</_>;

const Item_compiled = (props) => {
    const __root = t2b440f4741()[0];
    const __child1 = __root.childNodes[1];

    function __apply(props) {
        __root.className = (props.category);
        __compose(__child1, props.place);
    }

    __register('t2b440f4741', __apply);
    __apply(props);

    return __root;
};

const item = <Item category="fun" place="arcade" />;
update(item, { category: 'art', place: 'museum' });

