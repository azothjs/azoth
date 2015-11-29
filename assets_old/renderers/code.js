




/*
TemplateFragment
	Element
	Section
	Comment
	Text


build an actual instance

bui
*/

class SectionItem {

	bind ( instance, context ) {
		context.on('add', item => {
			section.render( item );
		});

		context.on( 'change',
			value => input.value = value
		);
	}

}


// onmodeladd

