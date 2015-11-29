import textRenderer from '../text';
import attrRenderer from '../attribute';
import elementRenderer from '../element';
import sectionRenderer from '../section';

const attrs = {
	attribute: attrRenderer
};

const nodes = {
	text: textRenderer,
	element: elementRenderer,
	section: sectionRenderer
}

export function getChildNode( type ) {
	return nodes[ type ];
}

export function getAttribute( type ) {
	return attrs[ type ];
}
