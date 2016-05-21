
console.group( 'total' );
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

console.log( `${data.items.length} todo's` );

console.time( 'render' );
new Diamond({ el, template, data });
console.timeEnd( 'render' );

console.timeEnd( 'total' );
console.groupEnd( 'total' );