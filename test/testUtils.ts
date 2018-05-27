import { TokenType, Token } from '../src/tokenizer';

export function getTokenList(specs: ([TokenType, number] | [TokenType])[], text: string) {
    let idx = 0;
    return specs.map(v => {
        const start = idx,
            stop = idx += v[1] === undefined ? 1 : v[1];
        return new Token(v[0], text, start, stop);
    });
}
