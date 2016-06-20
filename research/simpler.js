import { Component, $, toHtml } from 'diamond-alpha/components';
import { text } from 'diamond-alpha/bindings';
import { POJO } from 'diamond-alpha/contexts';

export class C1 extends Component {

	$render() {
		return ({ name }) => $`
			<span>${name}</span>
		`;
	}

	static get __fragment() { return toHtml`<span data-bind></span>`; }
	//on Component...
	static __clone() {
		const clone = this.__fragment.cloneNode( true );
		// do orphan trick
		return [ clone, clone.querySelectorAll('[data-bind]') ];
	}

	static get __b1() { return text.render({ ref: 'name' }); }

	__$render(context) {
		const [ node, nodes ] = App.__$clone();
		App.__b1( context, nodes[0] );
		return node;
	}

}

export class C2 extends Component {

	$render() {
		return ({ name }) => $`
			<span>*${name}</span>
		`;
	}

	static get __fragment() { return toHtml`<span data-bind></span>`; }
	//on Component...
	static __clone() {
		const clone = this.__fragment.cloneNode( true );
		// do orphan trick
		return [ clone, clone.querySelectorAll('[data-bind]') ];
	}

	static get __b1() { return text.bind({ ref: 'name' }); }

	__$render(context) {
		if( !context.__context ) context = new POJO( context );
		const [ node, nodes ] = App.__$clone();
		App.__b1( context, nodes[0] );
		return node;
	}

}