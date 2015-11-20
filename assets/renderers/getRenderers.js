import DOMElementRenderer from './DOMElementRenderer';
import DOMAttributeRenderer from './DOMAttributeRenderer';
import DOMTextRenderer from './DOMTextRenderer';
import DOMSection from './DOMSection';
import DOMAttributeSection from './DOMAttributeSection';


import TextElementRenderer from './TextElementRenderer';
import TextTextRenderer from './TextTextRenderer';
import TextSection from './TextSection';

function getRenderers( types ) {

	return function getRenderer( template, index ) {

		const Renderer = types[ template.type || 'default' ];

		if ( !Renderer ) {
			throw `Unsupported renderer type: "${template.type}"`;
		}

		return new Renderer( template, index );
	};
}

var getDOMRenderer = getRenderers({
	element: DOMElementRenderer,
	text: DOMTextRenderer,
	section: DOMSection
	//, comment: DOMComment
});

var getTextRenderer = getRenderers({
	element: TextElementRenderer,
	text: TextTextRenderer,
	section: TextSection
});

var getAttributeRenderer = getRenderers({
	attribute: DOMAttributeRenderer,
	section: DOMAttributeSection
});

export { getDOMRenderer, getTextRenderer, getAttributeRenderer };

