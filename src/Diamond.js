import render from './render';
import Context from './Context';
import bound from './bindings/bound';
import { makeFragment, clean } from './parser/domUtil'; 
import parser from './parser/parser';

export default function Diamond( options ) {
	options.context = new Context( options.data );
	render( options );
}

Diamond.parser = parser;
Diamond.bound = bound;
Diamond.makeFragment = makeFragment;
Diamond.clean = clean;