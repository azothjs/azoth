import { Component, $ } from 'diamond-alpha';
import request from 'superagent';

export class Todos extends Component {	

	static render({ Todo, TextInput }) {
		return todos => $`
			<ul>
				*#${todos.map( (todo, i) => $`
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
	
	static render(){

		return ({ task, done = false }) => {

			let editing = false;

			const edit = $`
				<input value=${task} 
					on-render=${({ node }) => node.focus()}
					on-blur-enterKey=${() => editing = false}>
			`;
					
			const view = $`
				<span on-click=${() => editing = true}>${task}</span>
			`;
		
			return $`<div class="todo" class-done=${done}>
				<input type="checkbox" checked=${done}>
				
				*#${editing ? edit : view}
				
				<button on-click=${() => this.fire('remove')}>X</button>
			</div>`;
		};
	}

	_instance() {
		let editing = false;
		const edit = '';
					
		const view = '';

		const updateBlock = fn => {
			return (...args) => {
				const result = fn(...args);
				this.setBlock( 'xyz', editing ? edit : view);
				return result;
			};
		};

		return {
			onViewingClick: updateBlock( () => editing = true ),
			OnInputBlur: updateBlock( () => editing = false )
		};
	}

	_onRemoveClick() {
		this.fire('remove');
	}

	static _onEditRender({ node }) { node.focus(); }
}

	
class TextInput extends Component {

	static render() {
		let newItem = '';

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

	_instance() {
		let newItem = '';

		return {
			onSubmit: () => {
				this.fire( 'add', newItem.trim() );
				newItem = '';
			},

			onValueChange: ({ node }) => {
				newItem = node.value;
			}	
		};
	}
}