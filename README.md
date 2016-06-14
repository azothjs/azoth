# 💎 diamond

## Templates

Modelling the flow of data through the template

```js

class Todos extends Component {	

	static template( Todo, AddNew ) {
		return (todos) => $`<ul>
			<# todos.map( (todo, i) => {
				<li>
					<${Todo(todo)} on-remove=${() => todos.splice(i, 1)"/>
				</li>
			}) #>
			<li><AddNew on-add="task=>todos.push({ task, done: false })"/></li>
		<ul>`;	
		};
	};
	
	constructor(){
		fetch('api/todos').then(todos => this.data.todos = todos);
	}
	
	render() {
		
	}
	
};


class Todos extends Component {	

	static template( Todo, AddNew ) {
		return <# (todos) => {
			<ul>
				<# todos.map( (todo, i) => {
					<li>
						<Todo(todo) on-remove="()=>todos.splice(i, 1)"/>
					</li>
				}) #>
				<li><AddNew on-add="task=>todos.push({ task, done: false })"/></li>
			<ul>	
		} #>;
	};
	
	constructor( data ){
		
	}
	
};

	
const Todos = ( Todo, AddNew ) => {
	return <# (todos) => {
		<ul>
			<# todos.map( (todo, i) => {
				<li>
					<Todo(todo) on-remove="()=>todos.splice(i, 1)"/>
				</li>
			}) #>
			<li><AddNew on-add="task=>todos.push({ task, done: false })"/></li>
		<ul>
	} #>;
};
	

const Todo = () => {
	return <# ({ task, done = false }) => {
		
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
	}#>;
}


const AddNew = () => {
	return <# () => {
		<# let newItem = ''; #>

		<form on-submit="()=>{
				this.fire('add', newItem);
				newItem = '';
			}" onsubmit="return false;">
			
			<input value=newItem>
			<button type="submit">add</button>
			
		</form>
	} #>;
};

```

Emphasis on explicit binding required

 string interpolation ###

### `${ ref }` string interpolation ###

On render text nodes and attribute values (one-time binding):

```
<span class="${importance}">TODO: ${task}</span>
```

### `<\# ref \#>` bound interpolation ###

Extended binding text nodes and attribute values 
(like `{{` and `}}` in mustache or handlebars):

```
<span class="<#importance#>"TODO: <#task#></span>
```

## `<\# ref \#>` 

```
hello ${world}
```
# Assignment

```
<


## Running the Project

Currently the project is in research and early development, so a bit lacking on
packaging and deployment (but not tests!).

Start the gobble dev server via `npm start` and go to `http://localhost:4567` 
to runs the tests.

The research directory is also served, checkout   
`localhost:4567/research/diamond.html` for todo example.

If you want to build a stand-alone version of the library, run 
`gobble build dist -f` where `dist` is the name of the destination directory
 (the `-f` flag forces the directory contents to be recreated, so don't try to build
 into an existing directory with other files you need to keep). 


