import { Variable, Lambda, Call, AstError, Assignment, ExpressionStatement, StatementList, Expression, Evaluation, EvaluationType } from "../src/ast";
import { pipeline } from 'stream';

describe("ast", () => {

    test("subsitute into variable", () => {

        expect(new Variable("x").substitute({ x: new Variable("y") })).toEqual(new Variable("y"));

    });

    test("substitute into lambda", () => {
        const node = new Lambda("x", new Call(new Variable("x"), new Variable("y")));
        expect(node.substitute({ x: new Variable("a"), y: new Variable("b") })).toEqual(
            new Lambda("x",
                new Call(
                    new Variable("x"),  // left the bounded "x"
                    new Variable("b")   // swapped the "y" for "b"
                )
            )
        );
    });

    test("substitute unto function application", () => {
        const node = new Call(new Variable("x"), new Variable("y"));
        expect(node.substitute({ x: new Variable("a") })).toEqual(
            new Call(new Variable("a"), new Variable("y"))
        );
    });

    test("no free variable on lambda is no substitution", () => {
        const node = new Lambda("x", new Call(new Variable("x"), new Variable("y")));
        expect(node.substitute({ z: new Variable("a") })).toEqual(
            node
        );
    });

    test("function application", () => {
        const node = new Lambda("x", new Call(new Variable("x"), new Variable("y")));
        expect(node.apply(new Variable("b"))).toEqual(
            new Call(
                new Variable("b"),
                new Variable("y")
            )
        );
    });

    test("function application reduction - truApp", () => {
        const tru = new Lambda(
            "t",
            new Lambda(
                "f",
                new Variable("t")
            )
        );

        const truApp = new Call(new Call(tru, new Variable('a')), new Variable('b'));

        expect(truApp.reduce()).toEqual(
            new Variable("a")
        );
    });

    test("function application reduction - flsApp", () => {
        const tru = new Lambda(
            "t",
            new Lambda(
                "f",
                new Variable("f")
            )
        );

        const flsApp = new Call(new Call(tru, new Variable('a')), new Variable('b'));

        expect(flsApp.reduce()).toEqual(
            new Variable("b")
        );
    });

    test("application of non-func", () => {

        const expr = new Call(new Variable('a'), new Variable('b'));
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
            new Call(
                new Lambda(
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
                new Lambda("t",
                    new Lambda("f",
                        new Variable("t")
                    )
                )
            ),
            new ExpressionStatement(
                new Call(
                    new Call(
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

    test("execute statementlist 2", () => {
        const sl = new StatementList(
            new ExpressionStatement(
                new Call(
                    new Lambda(
                        "y",
                        new Variable("y")
                    ),
                    new Variable("x")
                )
            )
        );

        const scope = {},
            io = { output: jest.fn() };
        sl.execute(scope, io);
        expect(io.output).toBeCalledWith("x");

    });

    test("substitute on demand", () => {
        const expr = new ExpressionStatement(new Variable("tru"));
        const scope = {
            tru: new Lambda("t",
                new Lambda("f",
                    new Variable("t")
                )
            )
        },
            io = { output: jest.fn() };
        expr.execute(scope, io);
        expect(io.output).toBeCalledWith("tru");
    });

    function formatTest(text: string, tree: () => Expression) {
        test("format - " + text, () => {
            const t = tree();
            expect(t.format()).toBe(text);
        });
    }

    formatTest("(λt. λf. t) v w", () =>
        new Call(
            new Call(
                new Lambda("t",
                    new Lambda("f",
                        new Variable("t")
                    )
                ),
                new Variable("v")
            ),
            new Variable("w")
        )
    );

    formatTest("(λx. x z) λy. y", () =>
        new Call(
            new Lambda("x",
                new Call(
                    new Variable("x"),
                    new Variable("z")
                )
            ),
            new Lambda("y",
                new Variable("y")
            )
        )
    );

    formatTest("x (y z)", () =>
        new Call(
            new Variable("x"),
            new Call(
                new Variable("y"),
                new Variable("z")
            )
        )
    );

    formatTest("x y z", () =>
        new Call(
            new Call(
                new Variable("x"),
                new Variable("y")
            ),
            new Variable("z"),
        )
    );

    formatTest("a λy. y", () =>
        new Call(
            new Variable("a"),
            new Lambda("y",
                new Variable("y")
            )
        )
    );

    formatTest("a (λy. y) z", () =>
        new Call(
            new Call(
                new Variable("a"),
                new Lambda("y",
                    new Variable("y")
                )
            ),
            new Variable("z")
        )
    );

    test("evaluate unresolved call", () => {
        const expr = new Call(new Variable("a"), new Variable("b"));

        expect(expr.evaluate({})).toBe(expr);
    });

    test("evaluateOnce unresolved call", () => {
        const expr = new Call(new Variable("a"), new Variable("b"));

        expect(expr.evaluateOnce({})).toEqual(new Evaluation(EvaluationType.none, expr));
    });

    test("evaluate partly unresolved call", () => {
        const expr = new Call(new Variable("a"), new Variable("b"));

        expect(expr.evaluate({ a: new Variable("c") })).toEqual(
            new Call(new Variable("c"), new Variable("b"))
        );
    });

    test("evaluate - a ((λx.x) c)", () => {

        const expr = new Call(
            new Variable("a"),
            new Call(
                new Lambda("x",
                    new Variable("x")
                ),
                new Variable("c")
            )
        )

        expect(expr.evaluate({})).toEqual(
            new Call(
                new Variable("a"),
                new Variable("c")
            )
        );
    });

    /*  for when lambdas are simplified
    test("evaluateOnce - λx. (λy. y) t", () => {

        const expr = new Lambda("x",
            new Call(
                new Lambda("y",
                    new Variable("y")
                ),
                new Variable("t")
            )
        );

        expect(expr.evaluateOnce({})).toEqual(new Evaluation(EvaluationType.reduction, new Lambda("x", new Variable("t"))));
    });
    */

    test("evaluate pair", () => {

        const scope = {
            pair: new Lambda("f",
                new Lambda("s",
                    new Lambda("b",
                        new Call(
                            new Call(
                                new Variable("b"),
                                new Variable("f")
                            ),
                            new Variable("s")
                        )
                    )
                )
            ),
            fst: new Lambda("p",
                new Call(
                    new Variable("p"),
                    new Variable("tru")
                )
            ),
            tru: new Lambda("t",
                new Lambda("f",
                    new Variable("t")
                )
            )
        };

        let expr = new Call(
            new Variable("fst"),
            new Call(
                new Call(
                    new Variable("pair"),
                    new Variable("v")
                ),
                new Variable("w")
            )
        );

        let evaluation = expr.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.substitute,
                new Call(
                    new Variable("fst"),
                    new Call(
                        new Call(
                            new Lambda("f",
                                new Lambda("s",
                                    new Lambda("b",
                                        new Call(
                                            new Call(
                                                new Variable("b"),
                                                new Variable("f")
                                            ),
                                            new Variable("s")
                                        )
                                    )
                                )
                            ),
                            new Variable("v")
                        ),
                        new Variable("w")
                    )
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.reduction,
                new Call(
                    new Variable("fst"),
                    new Call(
                        new Lambda("s",
                            new Lambda("b",
                                new Call(
                                    new Call(
                                        new Variable("b"),
                                        new Variable("v")
                                    ),
                                    new Variable("s")
                                )
                            )
                        ),
                        new Variable("w")
                    )
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.reduction,
                new Call(
                    new Variable("fst"),
                    new Lambda("b",
                        new Call(
                            new Call(
                                new Variable("b"),
                                new Variable("v")
                            ),
                            new Variable("w")
                        )
                    )
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.substitute,
                new Call(
                    new Lambda("p",
                        new Call(
                            new Variable("p"),
                            new Variable("tru")
                        )
                    ),
                    new Lambda("b",
                        new Call(
                            new Call(
                                new Variable("b"),
                                new Variable("v")
                            ),
                            new Variable("w")
                        )
                    )
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.reduction,
                new Call(
                    new Lambda("b",
                        new Call(
                            new Call(
                                new Variable("b"),
                                new Variable("v")
                            ),
                            new Variable("w")
                        )
                    ),
                    new Variable("tru")
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.reduction,
                new Call(
                    new Call(
                        new Variable("tru"),
                        new Variable("v")
                    ),
                    new Variable("w")
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.substitute,
                new Call(
                    new Call(
                        new Lambda("t",
                            new Lambda("f",
                                new Variable("t")
                            )
                        ),
                        new Variable("v")
                    ),
                    new Variable("w")
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.reduction,
                new Call(
                    new Lambda("f",
                        new Variable("v")
                    ),
                    new Variable("w")
                )
            )
        );

        evaluation = evaluation.result.evaluateOnce(scope);
        expect(evaluation).toEqual(
            new Evaluation(EvaluationType.reduction,
                new Variable("v")
            )
        );
    });
});