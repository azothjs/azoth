export default function render(fragment, root) {
    fragment = toFragment(fragment);
    root.appendChild(fragment);
}

export const toFragment = val => typeof val === 'function' ? val() : val;