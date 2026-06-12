// Shared test helpers used by chronos's own test suite.
// These are JSX components and are imported via the chronos package's
// internal test setup. The intent is for chronos tests to depend only on
// platform primitives (Promise, async generators) — not on maya.

export const Loading = () => <p>loading...</p>;

export const Cat = ({ name }) => <p>{name}</p>;

export const CatList = cats => <ul>{cats?.map(Cat)}</ul>;

export const CatCount = cats => <p>{cats?.length || 0} cats</p>;

export const CatName = name => <li>{name}</li>;

export const CatNames = cats => <ul>{cats?.map(CatName)}</ul>;
