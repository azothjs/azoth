import textRenderer from '../dom/text';
import attrRenderer from '../dom/attribute';
import elementRenderer from '../dom/element';
import sectionRenderer from '../dom/section';

const attrs = {
	attribute: attrRenderer
};

const nodes = {
	text: textRenderer,
	element: elementRenderer,
	section: sectionRenderer
};

export function getChildNode( type ) {
	return nodes[ type ];
}

export function getAttribute( type ) {
	return attrs[ type ];
}
