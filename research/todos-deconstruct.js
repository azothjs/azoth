import { Component, $ } from 'diamond-alpha';
import request from 'superagent';

export class Todos extends Component {	

	$render({ Todo, TextInput }) {
		return todos => $`
			<ul>
				${todos.map( (todo, i) => $`
					<li>
						<${Todo(todo)} on-remove=${() => todos.splice(i, 1)}/>
					</li>
				`)}
				
				<li>
					<${TextInput()} on-add=${task => todos.push({ task, done: false })}/>
				</li>
			<ul>
		`;
	}

	__run_f1( todos, i ) {
		( () => todos.splice(i, 1) )();
	}

	__run_f2( task, todos ) {
		( task => todos.push({ task, done: false }) )( task );
	}

	// static get components() {
	// 	return { Todo, TextInput };
	// }
	
	constructor(){
		super( request.get('api/todos') );
		
		this.getListObserver()
			.insert( todo => request.post(`api/todos`).send(todo) )
			.update( todo => request.put(`api/todos/${todo.id}`).send(todo) )
			.remove( todo => request.del(`api/todos/${todo.id}`) );
	}
}