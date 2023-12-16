import './style.css';
import html from '/package.json';

document.querySelector('pre').textContent = JSON.stringify(html, null, 4);

