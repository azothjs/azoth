import { Component, $ } from 'diamond-alpha';
import request from 'superagent';

export class App extends Component {

	$render({ TodoList, AddNewTodo, FilterTodos }) {

		return todos => $`
			<header class="header">
				<h1>todos</h1>
				<${AddNewTodo()} on-add=${task => todos.push({ task, done: false })}/>
			</header>
			<section class="main">
				<input class="toggle-all" type="checkbox">
				<label for="toggle-all">Mark all as complete</label>
				<${TodoList(todos)} 
					filter=*${this.filter}
					on-remove=${i => todos.splice(i, 1)}/>
			</section>
			<footer class="footer">
				<span class="todo-count">*${todos.length}</span>
				<${FilterTodos(this.filter)}/>
				<button class="clear-completed">Clear completed</button>
			</footer>
		`;
	}

	constructor() {
		super( request.get('api/todos') );
		
		this.getListObserver()
			.insert( todo => request.post(`api/todos`).send(todo) )
			.update( todo => request.put(`api/todos/${todo.id}`).send(todo) )
			.remove( todo => request.del(`api/todos/${todo.id}`) );
	}

	completeAll() {
		request.patch(`api/todos`).send({ done: true })
			.then( todos => this.reset( todos ) );
	}
}
export class Todos extends Component {	

	$render() {
		return todos => $`
			<ul>
				*#${todos.filter(this.filter).map((todo, i) => $`
					<li>
						<${Todo(todo)} remove=${() => this.fire('remove', i)}/>
					</li>
				`)}
			<ul>
		`;
	}

	get filter() {
		return this.__filter;
	}
	set filter( filter ) {
		this.__filter = filter;
	}

	__$render() {

		return todos => $`
			<ul>
				*#${todos.filter(this.filter).map((todo, i) => $`
					<li>
						<${Todo(todo)} remove=${() => this.fire('remove', i)}/>
					</li>
				`)}
			<ul>
		`;
	}
}

class Todo extends Component {
	
	$render(){

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
				
				<button on-click=${() => this.remove()}>X</button>
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


export class FilterTodos extends Component {

	static get all() { return this.filters['']; }
	static get filters() {
		return {
			'': { label: 'All' },
			'active': { label: 'Active', filter: t => t.done },
			'completed': { label: 'Completed', filter: t => !t.done }
		};
	}

	$render() {
		return filterOn => $`
			<ul class="filters">
				#${Object.entries( this.filters )
					.map( ([ label, { filter, href } ]) => $`
						<li>
							<a href="#/${href}" on-click=${() => filterOn.set(filter)}>
								${label}
							</a>
						</li>
				`)}
			</ul>
		`;
	}

	constructor( filterOn ){
		filterOn.setDefault( FilterTodos.find( location.hash ) );
		super( filterOn );
		this.filterOn = filterOn;

		window.onhashchange = hash => {
			filterOn.set( FilterTodos.find( hash ) );
		};
	}

	static find( hash ) {
		return this.filters[ hash.replace(/^#/, '') ] || this.all;
	}
}
	
class AddNewTodo extends Component {

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