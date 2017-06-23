import { html as _ } from './diamond';
// import { BehaviorSubject } from 'rxjs-es/BehaviorSubject';
// import { Observable } from 'rxjs-es/Observable';
// import 'rxjs-es/add/observable/of';
// import 'rxjs-es/add/observable/from';
// import 'rxjs-es/add/operator/map';
// import 'rxjs-es/add/operator/mergeMap';
// import 'rxjs-es/add/operator/let';

const names = [];
for(let i = 0; i < 1000; i++) {
    names.push(`Name${i}`);
}

console.time('render');

const template = names => _`
    <h1>Names</h1>
    <ul>${names.map(name => _`
        <li>Hello ${name}</li>
    `)}#
    </ul>
`;



document.body.appendChild(template(names));

console.timeEnd('render');


// console.time('render from');
// const template2 = names => _`
//     <h1>Names</h1>
//     <ul>
//     @${names.map(name => _`
//         <li>Hello ${name}</li>
//     `)}#
//     </ul>
// `;



// document.body.appendChild(template2(Observable.from(names)));

// console.timeEnd('render from');


// const name = new BehaviorSubject('Marty');

// const observed = name => _`
//     <div>Hello @${name}<div>
// `;

// document.body.appendChild(observed(name));

// document.getElementById('change').addEventListener('click', () => name.next('Freddy'));

