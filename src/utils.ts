
export function panic(message: string): never {
    throw new Error("Panic: " + message);
}

export function* filter<T>(itr: Iterable<T>, predicate: (v: T) => boolean) {
    for (const v of itr) {
        if (predicate(v))
            yield v;
    }
}

export function toArray<T>(itr: Iterable<T>): T[] {
    const ary: T[] = [];
    for (const n of itr)
        ary.push(n);
    return ary;
}

