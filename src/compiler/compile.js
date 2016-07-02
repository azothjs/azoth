import findTemplates from './findTemplates';
import astring from 'astring';

export default function compileAll( source ) {
	const templates = findTemplates( source );
	return templates.map( compile );
}

function compile( { html, bindings, scope } ) {
	let code = '';

	code = `return (${scope.params.map(astring)}) => {
		const nodes = render();
	};`;


	return { html, code };
}