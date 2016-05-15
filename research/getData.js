function getData() {

	var copies = location.hash.slice(1); // @1000 takes ~ 1ms to create
	if ( copies !== 0 && ( !copies || isNaN( copies ) ) ) copies = 100;
	
	window.onhashchange = function(){
		location.reload();
	}
	
	console.log( `${copies} todo's` );
	var items = new Array( copies );
	var fizz = ['fizz', '', ''], buzz = ['buzz', '', '', '', ''];
	
	for( var i = 0; i < copies; i++ ){
		items[i] = { 
			name: 'This is task ' + ( fizz[ i%3 ] + buzz[ i%5 ] || i ),
			done: ( i % 4 === 0 )
		};
	}			
	return items;
}