
export const Loading = () => <p>loading...</p>;

export const Cat = ({ name }) => <p>{name}</p>;

export const CatList = cats => <ul>{cats?.map(Cat)}</ul>;

export const CatCount = cats => <p>{cats?.length || 0} cats</p>;

export const CatName = name => <li>{name}</li>;

export const CatNames = cats => <ul>{cats?.map(CatName)}</ul>;

