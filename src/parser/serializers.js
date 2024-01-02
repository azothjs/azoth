
export function addSerializers(expect, types) {
    expect.addSnapshotSerializer({
        test(val) {
            return !Array.isArray(val) && typeof val === 'object' && types?.includes(val?.type);
        },
        serialize(object, config, indent, deps, refs, printer) {
            const serialized = JSON
                .stringify(object, null, '')
                .replace(/[,|:|{](?!$)|[^\s](?=})/gm, match => `${match} `);
            return printer(serialized, config, indent, deps, refs);
        }
    });
    expect.addSnapshotSerializer({
        test(val) {
            return typeof val === 'string' && val.startsWith('{ ');
        },
        serialize(val, config, indent, deps, refs, printer) {
            return val;
        }
    });
    expect.addSnapshotSerializer({
        test(val) {
            return Array.isArray(val) && val.length && typeof val[0] === 'string';
        },
        serialize(array, config, indent, deps, refs, printer) {
            let out = `${indent}[`;
            out += array
                .map(item => {
                    return `\n${indent + config.indent}${printer(item, config, '', deps, refs)}`;
                })
                .join('');
            out += `\n${indent}]`;
            return out;
        }
    });
}