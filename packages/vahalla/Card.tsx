/// <reference path="../azoth/jsx.d.ts" />

// Separate file to test import behavior
// Same components as inline test, but in separate module

export const Card = (props, slottable) => (
    <div class="card">{slottable}</div>
);

export const CardTitle = ({ title }) => (
    <h2 class="card-title">{title}</h2>
);
