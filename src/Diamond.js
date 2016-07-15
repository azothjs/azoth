
export { default as renderer } from './renderer2';

export { makeFragment } from './domUtil';

export function html(){}

export function __tb( index ) {
	return node => {
		const text = node.childNodes[ index ];
		return val => text.nodeValue = val;
	};
}

export { __tb as __otb };
export { __tb as __ctb };

