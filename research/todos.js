import { Component, $, when } from 'diamond-alpha';
import request from 'superagent';

export class Todos extends Component {	

	template({ Todo, TextInput }) {
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

	static get components() {
		return { Todo, TextInput };
	}
	
	constructor(){
		super( request.get('api/todos') );
		
		this.getListObserver()
			.insert( todo => request.post(`api/todos`).send(todo) )
			.update( todo => request.put(`api/todos/${todo.id}`).send(todo) )
			.remove( todo => request.del(`api/todos/${todo.id}`) );
	}
}

class Todo extends Component {
	
	static get state() {
		return { 
			editing: false
		};
	}

	static template(){

		return ({ task, done = false }) => $`
			<div class="todo" class-done=${done}>
							
				<input type="checkbox" checked=${done}>
				
				${when( this.editing, () => $`
					<input value="${task}" 
						on-render=${({ node }) => node.focus()}
						on-blur-enterKey=${({ node }) => {
							task = node.value;
							this.editing = false;
						}}>`, 
					() => $`
						<span on-click=${() => this.editing = true}>${task}</span>
				`)}
				
				<button on-click=${() => this.fire('remove')}>X</button>
			</div>
		`;
	}
}

	
class TextInput extends Component {

	static get state() {
		return  { 
			editing: false
		};
	}

	static template() {

		return () => $`
			<form on-submit=${() => {
				this.fire( 'add', this.newItem.trim() );
				this.newItem = '';
			}} onsubmit="return false;">
				
				<input value=${this.newItem}>
				<button type="submit">add</button>
			</form>
		`;
	}
}