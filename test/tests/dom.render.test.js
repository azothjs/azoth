import Diamond from './Diamond';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };

module( 'dom render' );

const { bound } = Diamond;

test( 'simple node with text', t => {
	
	const t1 = bound.text({ ref: 'foo' });
	
	const template = {
		fragment: Diamond.makeFragment(`
			<div data-bind="t1"></div>
		`),
		bindings: { t1 }
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div>foo</div>' );
});

test( 'nested elements and text', t => {
	
	const t1 = bound.text({ ref: 'foo' });
	const t2 = bound.text({ ref: 'bar' });
	
	const template = {
		fragment: Diamond.makeFragment(`
			<div>
				<span data-bind="t1"></span>
				<span data-bind="t2">label: </span>
			</div>
		`),
		bindings: { t1, t2 }
	};
	
	new Diamond( { 
		template, 
		data: { foo: 'foo', bar: 'bar' }, 
		el: fixture 
	});
	
	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
});


test( '#for section', t => {
	
	const t1 = bound.text( { ref: '.' } );
	const s1 = bound.section( { type: 'for', ref: 'items' }, {
		fragment: Diamond.makeFragment(`
			<li data-bind="t1"></li>
		`),
		bindings: { t1 }
	});
	
	const template = {
		fragment: Diamond.makeFragment( `<for-section data-bind="s1"></for-section>` ),
		bindings: { s1 }
	};
	
	new Diamond( { 
		template, 
		data: { items: [ 1, 2, 3 ] }, 
		el: fixture 
	});	
	
	t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

});

(function () {
	
	const t1 = bound.text({ ref: 'foo' });
	const s1 = bound.section( { type: 'if', ref: 'condition' }, {
		fragment: Diamond.makeFragment(`
			<li data-bind="t1"></li>
		`),
		bindings: { t1 }
	})
		
	const template = {
		fragment: Diamond.makeFragment( `<if-section data-bind="s1"></if-section>` ),
		bindings: { s1 }
	};
		
	test( '#if section true', t => {
		new Diamond( { 
			template, 
			data: { condition: true, foo: 'foo' }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<li>foo</li><!--if-->' );
	});

	
	test( '#if section false', t => {
		new Diamond( { 
			template, 
			data: { condition: false, foo: 'foo' }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<!--if-->' );
	});
	
})();

(function () {
	
	const t1 = bound.text({ ref: 'a' });
	const t2 = bound.text({ ref: 'b' });
	
	const s1 = bound.section( { type: 'with', ref: 'obj' }, {
		fragment: Diamond.makeFragment(`
			<p data-bind="t1,t2"></p>
		`),
		bindings: { t1, t2 }
	})
	
	const template = {
		fragment: Diamond.makeFragment( `<with-section data-bind="s1"></with-section>` ),
		bindings: { s1 }
	};
		
	test( '#with section', t => {
		new Diamond( { 
			template, 
			data: { obj: { a: 'A', b: 'B' } }, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<p>AB</p><!--with-->' );
	});

	test( '#with section, no object', t => {
		new Diamond( { 
			template, 
			data: {}, 
			el: fixture 
		});	
		t.equal( fixture.innerHTML, '<!--with-->' );
	});

})();