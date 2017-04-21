
export { default as renderer } from './renderer';

export { makeFragment } from './domUtil';

export function html(){}

export function __tb( index ) {
	return node => {
		const text = node.childNodes[ index ];
		return val => text.nodeValue = val;
	};
}

export function __bb( index ) {
	return node => {
		const anchor = node.childNodes[ index ];
		const insertBefore = node => anchor.parentNode.insertBefore(node, anchor);

		// TODO: pass in block observe status so we know not to do this work if possible 
		// insert a top and iterate till anchor to remove
		const top = document.createComment('block start');
		insertBefore(top, anchor);

		//let contents = null;
		
		return val => {
			removePrior(top, anchor);
			const fragment = typeof val === 'function' ? val() : val;
			insertBefore(fragment, anchor);
		};
	};
}

const removePrior = (top, anchor) => {
	let sibling = top.nextSibling;
	while(sibling && sibling !== anchor) {
		const current = sibling;
		sibling = sibling.nextSibling;
		current.remove();
	}
};

// const getContents = fragment => {
// 	const childNodes = fragment.childNodes;
// 	return childNodes.length === 1 ? childNodes[0] : childNodes;
// };

// const removeContents = nodes => Array.isArray(nodes) ? removeNodes(nodes) : removeNode(nodes);
// const removeNodes = nodes => nodes.forEach(removeNode);
// const removeNode = node => node.remove();


