
const group = 'js execution time including dom creation';
console.group( group );
console.time( 'total' );

	console.group( 'init' );

		console.time( 'el' );
			const el = document.querySelector( 'main' );
		console.timeEnd( 'el' );

		console.time( 'data' );
			const data = { items: getData() };
		console.timeEnd( 'data' );

		console.time( 'template' );
			const template = getTemplate();
		console.timeEnd( 'template' );

	console.groupEnd( 'init' );


	console.group( 'render' );

		console.time( `${data.items.length} todo's` );
		new Diamond({ el, template, data });
		console.timeEnd( `${data.items.length} todo's` );

	console.groupEnd( 'render' );

console.timeEnd( 'total' );	
console.groupEnd( group );