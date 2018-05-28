import { ParseError } from "./parserUtils";

const SPACE = 0x20,
    TAB = 0x9,
    NL = 0xA,
    CR = 0xD,
    UPPER_A = 'A'.charCodeAt(0),
    LOWER_A = 'a'.charCodeAt(0),
    UPPER_Z = 'Z'.charCodeAt(0),
    LOWER_Z = 'z'.charCodeAt(0),
    ZERO = '0'.charCodeAt(0),
    NINE = '9'.charCodeAt(0);

export enum TokenType {
    PERIOD = 46,
    LAMBDA = 0x3bb,
    EOF = -1,
    NUM = -2,
    LPAREN = 40,
    RPAREN = 41,
    WHITESPACE = -3,
    ID = -4,
    EQUALS = '='.charCodeAt(0),
    SEMICOLON = ';'.charCodeAt(0)
}

export class Token {
    constructor(
        public readonly type: TokenType,
        public readonly source: string,
        public readonly start: number,
        public readonly stop: number
    ) { }

    get text() { return this.source.substring(this.start, this.stop); }
}

export function getTokenTypeName(tokenType: TokenType) {
    if (tokenType >= 0)
        return `'${String.fromCodePoint(tokenType)}'`;
    else
        return TokenType[tokenType];
}

abstract class TokenClass {
    abstract tokenType: TokenType;
    abstract isCodePoint(codePoint: number, idx: number): boolean;
}

class IdTokenClass extends TokenClass {
    tokenType = TokenType.ID;
    isCodePoint(codePoint: number) {
        return codePoint >= UPPER_A && codePoint <= UPPER_Z || codePoint >= LOWER_A && codePoint <= LOWER_Z;
    }
}

class NumberTokenClass extends TokenClass {
    tokenType = TokenType.NUM;
    isCodePoint(codePoint: number) {
        return codePoint >= ZERO && codePoint <= NINE;
    }
}

class WhitespaceTokenClass {
    tokenType = TokenType.WHITESPACE;
    isCodePoint(codePoint: number) {
        return codePoint === SPACE || codePoint === TAB || codePoint === NL || codePoint === CR;
    }
}

export class Tokenizer {
    private idx: number = 0;

    constructor(
        private text: string
    ) { }

    private static tokenClasses: TokenClass[] = [new IdTokenClass(), new NumberTokenClass(), new WhitespaceTokenClass()];

    *getTokens() {
        for (; ;) {
            let token = this.getToken();
            if (token === undefined)
                break;
            yield token;
        }
        yield new Token(TokenType.EOF, this.text, this.idx, this.idx);
    }

    private getToken() {
        const codePoint = this.text.codePointAt(this.idx);
        return codePoint === undefined ? undefined : this.lexToken(codePoint);
    }

    private lexToken(codePoint: number) {
        switch (codePoint) {
            case TokenType.PERIOD:
            case TokenType.LAMBDA:
            case TokenType.LPAREN:
            case TokenType.RPAREN:
            case TokenType.EQUALS:
            case TokenType.SEMICOLON:
                const start = this.idx;
                const stop = ++this.idx;
                return new Token(codePoint, this.text, start, stop);
            default:
                const tokenClass = this.getTokenClass(codePoint);
                if (tokenClass)
                    return this.lexTokenClass(tokenClass);
                throw new ParseError(`Unexpected ${String.fromCodePoint(codePoint)}`);
        }
    }

    private getTokenClass(codePoint: number) {
        for (let i = 0; i < Tokenizer.tokenClasses.length; ++i) {
            if (Tokenizer.tokenClasses[i].isCodePoint(codePoint, 0)) {
                return Tokenizer.tokenClasses[i];
            }
        }
        return undefined;
    }

    private lexTokenClass(tokenClass: TokenClass) {
        const start = this.idx;
        let cp = this.text.codePointAt(this.idx);
        while (cp !== undefined && tokenClass.isCodePoint(cp, this.idx - start)) {
            this.idx += (isSurrogatePair(cp) ? 2 : 1);
            cp = this.text.codePointAt(this.idx);
        }
        const stop = this.idx;
        return new Token(tokenClass.tokenType, this.text, start, stop);
    }
}

function isSurrogatePair(codepoint: number) {
    return codepoint > 65535;
}