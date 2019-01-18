export type Group<T> = {
    [key: string]: T[];
}

export function groupBy<T>(list: T[], func: (x:T) => string): Group<T> {
    return list.reduce((p: Group<T>, c: T, i: number, arr: T[]) => {
        const key = func(c);
        const elems = p[key];
        if(elems === undefined){
            p[key] = [c];
        }
        else {
            p[key] = elems.concat([c]);
        }
        return p;
    }, {} as Group<T>);
}