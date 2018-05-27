import { Parser } from "../src/parser";
import { ParseError } from "../src/parserUtils";
import { getTokenList } from './testUtils';
import { TokenType } from '../src/tokenizer';
import { Variable, FunctionApplication, Abstraction, StatementList, Assignment, ExpressionStatement } from '../src/ast';

describe("parser", () => {

    test("variable", () => {

        const tokens = getTokenList([
            [TokenType.ID, 1],
            [TokenType.EOF, 0]
        ], "x");
        const p = new Parser(tokens);

        expect(p.parse()).toEqual(
            new Variable("x")
        );

    });

    test("application", () => {
        const tokens = getTokenList([
            [TokenType.ID],
            [TokenType.WHITESPACE],
            [TokenType.ID],
            [TokenType.EOF, 0]
        ], "x y");
        const p = new Parser(tokens);

        expect(p.parse()).toEqual(
            new FunctionApplication(new Variable("x"), new Variable("y"))
        );
    });

    test("lambda", () => {
        const tokens = getTokenList([
            [TokenType.LAMBDA],
            [TokenType.ID],
            [TokenType.PERIOD],
            [TokenType.ID],
            [TokenType.WHITESPACE],
            [TokenType.ID],
            [TokenType.EOF, 0]
        ], "λx.x y");
        const p = new Parser(tokens);

        expect(p.parse()).toEqual(
            new Abstraction("x", new FunctionApplication(new Variable("x"), new Variable("y")))
        );
    });

    test("empty input", () => {

        const tokens = getTokenList([
            [TokenType.EOF, 0]
        ], "");
        const p = new Parser(tokens);

        expect(p.parse()).toBeUndefined();

    });

    test("parens", () => {

        const tokens = getTokenList([
            [TokenType.ID],
            [TokenType.WHITESPACE],
            [TokenType.LPAREN],
            [TokenType.ID],
            [TokenType.WHITESPACE],
            [TokenType.ID],
            [TokenType.RPAREN],
            [TokenType.EOF, 0],
        ], "a (b c)");

        const p = new Parser(tokens);
        expect(p.parse()).toEqual(
            new FunctionApplication(
                new Variable("a"),
                new FunctionApplication(
                    new Variable("b"),
                    new Variable("c")
                )
            )
        );

    });

    test("unbalanced paren", () => {
        const tokens = getTokenList([
            [TokenType.RPAREN],
            [TokenType.EOF, 0],
        ], ")");

        const p = new Parser(tokens);
        expect(() => p.parse()).toThrow(ParseError);

    });

    test("invalid lambda - missing variable", () => {
        const tokens = getTokenList([
            [TokenType.LAMBDA],
            [TokenType.PERIOD],
            [TokenType.ID],
            [TokenType.EOF, 0],
        ], ")");

        const p = new Parser(tokens);
        expect(() => p.parse()).toThrow(ParseError);

    });

    test("invalid lambda - missing period", () => {
        const tokens = getTokenList([
            [TokenType.LAMBDA],
            [TokenType.ID],
            [TokenType.ID],
            [TokenType.EOF, 0],
        ], ")");

        const p = new Parser(tokens);
        expect(() => p.parse()).toThrow(ParseError);

    });

    test("invalid lambda - missing body", () => {
        const tokens = getTokenList([
            [TokenType.LAMBDA],
            [TokenType.ID],
            [TokenType.PERIOD],
            [TokenType.EOF, 0],
        ], ")");

        const p = new Parser(tokens);
        expect(() => p.parse()).toThrow(ParseError);

    });

    test("assignment", () => {
        const tokens = getTokenList([
            [TokenType.ID, 2],
            [TokenType.WHITESPACE],
            [TokenType.EQUALS],
            [TokenType.WHITESPACE],
            [TokenType.LPAREN],
            [TokenType.LAMBDA],
            [TokenType.ID],
            [TokenType.PERIOD],
            [TokenType.ID],
            [TokenType.RPAREN],
            [TokenType.SEMICOLON],
            [TokenType.EOF, 0]
        ], "id = (λx.x);");
        const p = new Parser(tokens);
        expect(p.parseStatementList()).toEqual(
            new StatementList(
                new Assignment("id",
                    new Abstraction(
                        "x",
                        new Variable("x")
                    )
                )
            )
        );
    });

    test("expression statement", () => {
        const tokens = getTokenList([
            [TokenType.ID],
            [TokenType.WHITESPACE],
            [TokenType.ID],
            [TokenType.SEMICOLON],
            [TokenType.EOF, 0]
        ], "x y;");

        const p = new Parser(tokens);
        expect(p.parseStatementList()).toEqual(
            new StatementList(
                new ExpressionStatement(
                    new FunctionApplication(
                        new Variable("x"),
                        new Variable("y")
                    )
                )
            )
        );
    });

});