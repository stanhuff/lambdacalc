import { Variable, Abstraction, FunctionApplication, AstError, Assignment, ExpressionStatement, StatementList } from "../src/ast";
import { pipeline } from 'stream';

describe("ast", () => {

    test("subsitute into variable", () => {

        expect(new Variable("x").substitute({ x: new Variable("y") })).toEqual(new Variable("y"));

    });

    test("substitute into lambda", () => {
        const node = new Abstraction("x", new FunctionApplication(new Variable("x"), new Variable("y")));
        expect(node.substitute({ x: new Variable("a"), y: new Variable("b") })).toEqual(
            new Abstraction("x",
                new FunctionApplication(
                    new Variable("x"),  // left the bounded "x"
                    new Variable("b")   // swapped the "y" for "b"
                )
            )
        );
    });

    test("substitute unto function application", () => {
        const node = new FunctionApplication(new Variable("x"), new Variable("y"));
        expect(node.substitute({ x: new Variable("a") })).toEqual(
            new FunctionApplication(new Variable("a"), new Variable("y"))
        );
    });

    test("no free variable on lambda is no substitution", () => {
        const node = new Abstraction("x", new FunctionApplication(new Variable("x"), new Variable("y")));
        expect(node.substitute({ z: new Variable("a") })).toEqual(
            node
        );
    });

    test("function application", () => {
        const node = new Abstraction("x", new FunctionApplication(new Variable("x"), new Variable("y")));
        expect(node.apply(new Variable("b"))).toEqual(
            new FunctionApplication(
                new Variable("b"),
                new Variable("y")
            )
        );
    });

    test("function application reduction - truApp", () => {
        const tru = new Abstraction(
            "t",
            new Abstraction(
                "f",
                new Variable("t")
            )
        );

        const truApp = new FunctionApplication(new FunctionApplication(tru, new Variable('a')), new Variable('b'));

        expect(truApp.reduce()).toEqual(
            new Variable("a")
        );
    });

    test("function application reduction - flsApp", () => {
        const tru = new Abstraction(
            "t",
            new Abstraction(
                "f",
                new Variable("f")
            )
        );

        const flsApp = new FunctionApplication(new FunctionApplication(tru, new Variable('a')), new Variable('b'));

        expect(flsApp.reduce()).toEqual(
            new Variable("b")
        );
    });

    test("application of non-func", () => {

        const expr = new FunctionApplication(new Variable('a'), new Variable('b'));
        expect(expr.reduce()).toEqual(expr);

    });

    test("execute assignment", () => {

        const stat = new Assignment("a", new Variable("x"));
        const scope = {};
        const io = { output: jest.fn() };
        stat.execute(scope, io);
        expect(scope).toEqual({ a: new Variable("x") });
        expect(io.output).not.toBeCalled();
    });

    test("execute expression", () => {

        const stat = new ExpressionStatement(
            new FunctionApplication(
                new Abstraction(
                    "x",
                    new Variable("x")
                ),
                new Variable("a")
            )
        );

        const scope = {},
            io = { output: jest.fn() };
        stat.execute(scope, io);
        expect(io.output).toBeCalledWith("a");

    });

    test("execute statement list", () => {
        const sl = new StatementList(
            new Assignment("tru",
                new Abstraction("t",
                    new Abstraction("f",
                        new Variable("t")
                    )
                )
            ),
            new ExpressionStatement(
                new FunctionApplication(
                    new FunctionApplication(
                        new Variable("tru"),
                        new Variable("true")
                    ),
                    new Variable("false")
                )
            )
        );

        const scope = {},
            io = { output: jest.fn() };
        sl.execute(scope, io);

        expect(io.output).toBeCalledWith("true");
    });
});