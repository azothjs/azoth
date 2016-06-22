import { $ } from './new-parser/parser';

const template = ( place, foo ) => $`<span class="hello" class-foo=${foo} data-custom="custom">hello ${place}</span>`;

export default template;

