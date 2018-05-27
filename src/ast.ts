import { ParseError } from './parserUtils';

export abstract class Node {
}

export abstract class Expression extends Node {
    abstract substitute(variables: { [index: string]: Expression }): Expression;
    reduce(): Expression { return this; }
    abstract format(): string;
}

export class Variable extends Expression {
    constructor(
        readonly name: string,
    ) { super(); }

    substitute(variables: { [index: string]: Expression }): Expression {
        const newNode = variables[this.name];
        return (newNode === undefined) ? this : newNode;
    }

    format() {
        return this.name;
    }
}

export class Abstraction extends Expression {
    constructor(
        readonly variable: string,
        readonly body: Expression,
    ) { super(); }

    substitute(variables: { [index: string]: Expression }): Expression {
        const newBody = this.body.substitute(this.excludeBoundVariables(variables));
        return (newBody == this.body) ? this : new Abstraction(this.variable, newBody);
    }

    apply(value: Expression) {
        const variables = { [this.variable]: value };
        return this.body.substitute(variables);
    }

    private excludeBoundVariables(variables: { [index: string]: Expression }): { [index: string]: Expression } {
        if (this.variable in variables) {
            const newVariables = Object.assign({}, variables);
            delete newVariables[this.variable];
            return newVariables;
        }
        return variables;
    }

    format() {
        return `(λ${this.variable}.${this.body.format()})`;
    }
}

export class FunctionApplication extends Expression {
    constructor(
        readonly func: Expression,
        readonly arg: Expression,
    ) { super(); }

    substitute(variables: { [index: string]: Expression }): Expression {
        const newFunc = this.func.substitute(variables);
        const newArg = this.arg.substitute(variables);
        return (newFunc === this.func && newArg === this.arg) ? this : new FunctionApplication(newFunc, newArg);
    }

    reduce(): Expression {
        const func = this.func.reduce();
        if (func instanceof Abstraction)
            return func.apply(this.arg.reduce());
        return this;
    }

    format() {
        return `(${this.func.format()}) (${this.func.format()})`;
    }
}

export interface IO {
    output(text: string): void;
}

export abstract class Statement extends Node {
    abstract execute(scope: { [index: string]: Expression }, io: IO): void;
}

export class StatementList extends Statement {
    statements: Statement[];
    constructor(...statements: Statement[]) {
        super();
        this.statements = statements.slice();
    }

    execute(scope: { [index: string]: Expression }, io: IO) {
        this.statements.forEach(v => v.execute(scope, io));
    }
}

export class Assignment extends Statement {
    constructor(
        readonly variable: string,
        readonly initializer: Expression
    ) { super(); }

    execute(scope: { [index: string]: Expression }, io: IO) {
        scope[this.variable] = this.initializer;
    }
}

export class ExpressionStatement extends Statement {
    constructor(
        readonly node: Expression
    ) { super(); }

    execute(scope: { [index: string]: Expression }, io: IO): void {
        const substituted = this.node.substitute(scope);
        io.output(substituted.reduce().format());
    }
}

export class AstError extends Error {
}