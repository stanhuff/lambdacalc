import { Tokenizer, Token, TokenType } from "../src/tokenizer";
import { toArray } from "tse-utils/itrUtils";
import { ParseError } from '../src/parserUtils';
import { getTokenList } from './testUtils';

describe("tokenizer", () => {

    test("good chars", () => {

        const text = "x yz λa.(s 90 )";
        expect(toArray(new Tokenizer(text).getTokens())).toEqual(
            getTokenList([
                [TokenType.ID],
                [TokenType.WHITESPACE],
                [TokenType.ID, 2],
                [TokenType.WHITESPACE],
                [TokenType.LAMBDA],
                [TokenType.ID],
                [TokenType.PERIOD],
                [TokenType.LPAREN],
                [TokenType.ID],
                [TokenType.WHITESPACE],
                [TokenType.NUM, 2],
                [TokenType.WHITESPACE],
                [TokenType.RPAREN],
                [TokenType.EOF, 0],
            ], text)
        );
    });

    test("bad char", () => {
        const text = `a${String.fromCodePoint(0x10000)}`;
        const tokens = new Tokenizer(text);
        expect(() => toArray(tokens.getTokens())).toThrow(ParseError);
    });

    test("assign", () => {

        const text = "id = λx.x;";
        expect(toArray(new Tokenizer(text).getTokens())).toEqual(
            getTokenList([
                [TokenType.ID, 2],
                [TokenType.WHITESPACE],
                [TokenType.EQUALS],
                [TokenType.WHITESPACE],
                [TokenType.LAMBDA],
                [TokenType.ID],
                [TokenType.PERIOD],
                [TokenType.ID],
                [TokenType.SEMICOLON],
                [TokenType.EOF, 0]
            ], text)
        );

    });

});