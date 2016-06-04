import { Component } from 'diamond-alpha';
import request from 'superagent';

class Todos extends Component {	

	static template({ Todo, TextInput }) {
		return `<# (todos) => {
			<ul>
				<# todos.map( (todo, i) => {
					<li>
						<Todo(todo) remove="()=>this.splice(i, 1)"/>
					</li>
				}) #>
				<li><TextInput add="task=>todos.push({ task, done: false })"/></li>
			<ul>
			
		} #>`;	

	}
	
	constructor(){
		request.get('api/todos').then(todos => this.reset(todos));
		
		this.getListObserver()
			.insert(newTodo => request.post(`api/todos`).send(newTodo))
			.update(todo => request.put(`api/todos/${todo.id}`))
			.remove(todo => request.del(`api/todos/${todo.id}`))
			.finally(err => this.error = err);
	}
	
	
	
};

class Todos extends Component {	

	static template({ Todo, TextInput }) {
		return `<# (todos) => {
			<ul>
				<# todos.map( (todo, i) => {
					<li>
						<Todo(todo) on-remove="()=>this.splice(i, 1)"/>
					</li>
				}) #>
				<li><TextInput on-add="task=>todos.push({ task, done: false })"/></li>
			<ul>	
		} #>`;
	}
	
	constructor(){
		fetch('api/todos').then(todos => this.data.todos = todos);
	}
	
	
	
};


class Todo extends Component {
	
	static template(){
		return `<# ({ task, done = false }) => {
			
			<div class="todo" class-done={done}>
			
				<# let editing = false #>
				
				<input type="checkbox" checked=done>
				
				<# when ( editing ) {
					<input value="${task}" 
							on-render="({ node }) => node.focus()"
							on-blur-enterKey="({ node }) => {
								task = node.value;
								editing = false;
							}">
				}# else {
					<span on-click="()=>editing = true">${task}</span>
				}#>
				
				<button on-click="()=>this.fire('remove')">X</button>
				
			</div>
		}#>`;
	}
}

	
class TextInput extends Component {
	static template() {
		return `<# () => {
			<# let newItem = ''; #>

			<form on-submit="()=>{
					this.add(newItem);
					newItem = '';
				}" onsubmit="return false;">
				
				<input value=newItem>
				<button type="submit">add</button>
				
			</form>
		} #>`;
	}
}