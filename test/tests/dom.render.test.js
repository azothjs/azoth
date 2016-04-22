import Diamond from './Diamond';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };

module( 'dom render' );

const { $tatic, bound } = Diamond.dom;

test( 'elements and text', t => {
	
	const t1 = bound.text({ ref: 'foo' });
	const t2 = bound.text({ ref: 'bar' });
	
	const fragment = $tatic([
		$tatic.el( 'div', null, [
			$tatic.el( 'span', null, [ t1 ] ),
			$tatic.el( 'span', null, [ $tatic.text( 'label: ' ), t2 ] )
		])
	]);
	
	new Diamond( { 
		template: { fragment }, 
		data: { foo: 'foo', bar: 'bar' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
});

test( 'static section', t => {
	
	const t1 = bound.text({ ref: 'foo' });
	
	const fragment = $tatic([
		$tatic.el( 'div', null, [ t1 ] )
	]);
	
	new Diamond( { 
		template: { fragment }, 
		data: { foo: 'foo' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div>foo</div>' );
});

test( '#for section', t => {
	
	const t1 = bound.text({ ref: '.' });
	
	const fragment = $tatic([
		bound( { type: 'for', ref: 'items' }, {
			fragment: $tatic( [ $tatic.el( 'li', null, [ t1 ] ) ] )
		})
	]);
	
	new Diamond( { 
		template: { fragment }, 
		data: { items: [ 1, 2, 3 ] }, 
		el: fixture 
	});	
	
	t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

});

(function () {
	
	const t1 = bound.text({ ref: 'foo' });
	
	const fragment = $tatic([
		bound( { type: 'if', ref: 'condition' }, {
			fragment: $tatic( [ $tatic.el( 'li', null, [ t1 ] ) ] )
		})
	]);
		
	test( '#if section true', t => {
		new Diamond( { 
			template: { fragment }, 
			data: { condition: true, foo: 'foo' }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<li>foo</li><!--if-->' );
	});

	
	test( '#if section false', t => {
		new Diamond( { 
			template: { fragment }, 
			data: { condition: false, foo: 'foo' }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<!--if-->' );
	});
	
})();

(function () {
	
	const t1 = bound.text({ ref: 'a' });
	const t2 = bound.text({ ref: 'b' });
	
	const fragment = $tatic([
		bound( { type: 'with', ref: 'obj' }, {
			fragment: $tatic( [ $tatic.el( 'p', null, [ t1, t2 ] ) ] )
		})
	]);
		
	test( '#with section', t => {
		new Diamond( { 
			template: { fragment }, 
			data: { obj: { a: 'A', b: 'B' } }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<p>AB</p><!--with-->' );
	});

	test( '#with section, no object', t => {
		new Diamond( { 
			template: { fragment }, 
			data: {}, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<!--with-->' );
	});

})();