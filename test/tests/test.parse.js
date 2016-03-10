import htmlparser from 'htmlparser';

const test = QUnit.test;
const module = QUnit.module;

const fixture = document.getElementById( 'qunit-fixture' );


const getTextRef = ref => ({ type: 'text', ref });
const getElement = ( name, children ) => ({ type: 'element', name, children });
const getLI = children => getElement( 'li', children );
const getSPAN = children => getElement( 'span', children );
const getDIV = children => getElement( 'div', children );

const staticText = { type: 'text', text: 'label:' };
const fooRef = getTextRef( 'foo' );
const barRef = getTextRef( 'bar' );
const span1 = getSPAN([ fooRef ]);
const span2 = getSPAN([ staticText, barRef ]);
const divWithSpans = getDIV([ span1, span2 ]);

const contextText = { type: 'text', ref: '.' };
const li = getLI( [ contextText ] );



module( 'parse research' );

test( 'render', t => {
	var html = `<ul>{{#items}}<li>{{foo}}</li>{{/}}</ul>`;
	
	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		console.log(error, dom);
		// if (error)
		// 	[...do something for errors...]
		// else
		// 	[...parsing done, do something...]
	});
	
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);
	
	console.dir( handler.dom );
	
	t.equal( handler.dom, null );
});
