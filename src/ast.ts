import { ParseError } from './parserUtils';
import { panic } from "tse-utils/assertUtils";

export abstract class Node {
}

export enum EvaluationType {
    substitute,
    reduction,
    none
}

export class Evaluation {
    constructor(
        readonly type: EvaluationType,
        readonly result: Expression,
    ) { }
}

export abstract class Expression extends Node {
    abstract substitute(variables: Scope): Expression;
    reduce(): Expression { return this; }
    abstract format(): string;
    abstract evaluateOnce(variables: Scope): Evaluation;
    abstract evaluate(variables: Scope): Expression;
}

export class Variable extends Expression {
    constructor(
        readonly name: string,
    ) { super(); }

    substitute(variables: Scope): Expression {
        const newNode = variables[this.name];
        return newNode ? newNode : this;
    }

    format() {
        return this.name;
    }

    evaluateOnce(variables: Scope): Evaluation {
        return new Evaluation(EvaluationType.none, this);
    }

    evaluate(variables: Scope): Expression {
        return this;
    }
}

export class Lambda extends Expression {
    constructor(
        readonly variable: string,
        readonly body: Expression,
    ) { super(); }

    substitute(variables: Scope): Expression {
        const newBody = this.body.substitute(this.excludeBoundVariables(variables));
        return (newBody == this.body) ? this : new Lambda(this.variable, newBody);
    }

    apply(value: Expression) {
        const variables = { [this.variable]: value };
        return this.body.substitute(variables);
    }

    private excludeBoundVariables(variables: Scope): Scope {
        if (this.variable in variables) {
            const newVariables = Object.assign({}, variables);
            delete newVariables[this.variable];
            return newVariables;
        }
        return variables;
    }

    evaluateOnce(variables: Scope): Evaluation {
        /* simplify lambda
        if (!(this.body instanceof Variable)) {
            const evaluation = this.body.evaluateOnce(variables);
            if (evaluation.result !== this.body)
                return new Evaluation(evaluation.type, new Lambda(this.variable, evaluation.result));
        }
        */
        return new Evaluation(EvaluationType.none, this);
    }

    evaluate(variables: Scope) {
        return this;
    }

    format() {
        return `λ${this.variable}. ${this.body.format()}`;
    }
}

export interface Scope {
    [index: string]: Expression;
}

export class Call extends Expression {
    constructor(
        readonly func: Expression,
        readonly arg: Expression,
    ) { super(); }

    evaluateOnce(variables: Scope): Evaluation {
        if (this.arg instanceof Call) {
            const evaluation = this.arg.evaluateOnce(variables);
            return new Evaluation(evaluation.type, new Call(this.func, evaluation.result));
        }

        if (this.func instanceof Call) {
            const evaluation = this.func.evaluateOnce(variables);
            return new Evaluation(evaluation.type, new Call(evaluation.result, this.arg));
        }
        else if (this.func instanceof Lambda) {
            return new Evaluation(EvaluationType.reduction, this.func.apply(this.arg));
        }
        else {
            const newFunc = this.func.substitute(variables);
            return (newFunc === this.func)
                ? new Evaluation(EvaluationType.none, this)
                : new Evaluation(EvaluationType.substitute, new Call(newFunc, this.arg));
        }
    }

    evaluate(variables: Scope): Expression {
        const arg = this.evaluateArg(variables);

        const func = this.evaluateFunc(variables);

        if (func instanceof Lambda)
            return func.apply(arg);
        else
            return func === this.func && arg === this.arg ? this : new Call(func, arg);
    }

    private evaluateArg(variables: Scope) {
        let arg = this.arg;
        while (arg instanceof Call)
            arg = arg.evaluate(variables);
        return arg;
    }

    private evaluateFunc(variables: Scope) {
        let func = this.func;
        while (!(func instanceof Lambda)) {
            const next = func instanceof Call ? func.evaluate(variables) : func.substitute(variables);
            if (next === func)
                break;
            func = next;
        }
        return func;
    }

    substitute(variables: Scope): Expression {
        const newFunc = this.func.substitute(variables);
        const newArg = this.arg.substitute(variables);
        return (newFunc === this.func && newArg === this.arg) ? this : new Call(newFunc, newArg);
    }

    reduce(): Expression {
        const func = this.func.reduce();
        if (func instanceof Lambda)
            return func.apply(this.arg.reduce());
        return this;
    }

    format(hasRight?: boolean) {
        const left = this.formatChild(this.func, true);
        const right = this.formatChild(this.arg, hasRight || false);
        return this.arg instanceof Call ? `${left} (${right})` : `${left} ${right}`;
    }

    private formatChild(expr: Expression, hasRight: boolean): string {
        if (expr instanceof Call)
            return expr.format(hasRight);
        else
            return hasRight && expr instanceof Lambda ? `(${expr.format()})` : expr.format();
    }
}

export interface IO {
    output(text: string): void;
    showSteps?: boolean;
}

export abstract class Statement extends Node {
    abstract execute(scope: Scope, io: IO): void;
}

export class StatementList extends Statement {
    statements: Statement[];
    constructor(...statements: Statement[]) {
        super();
        this.statements = statements.slice();
    }

    execute(scope: Scope, io: IO) {
        this.statements.forEach(v => v.execute(scope, io));
    }
}

export class Assignment extends Statement {
    constructor(
        readonly variable: string,
        readonly initializer: Expression
    ) { super(); }

    execute(scope: Scope, io: IO) {
        scope[this.variable] = this.initializer;
    }
}

export class ExpressionStatement extends Statement {
    constructor(
        readonly node: Expression
    ) { super(); }

    execute(scope: Scope, io: IO): void {
        if (io.showSteps) {
            let last = this.node;
            io.output(this.getStepType(EvaluationType.none) + last.format());
            while (true) {
                const evaluation = last.evaluateOnce(scope);
                if (evaluation.type === EvaluationType.none)
                    break;
                last = evaluation.result;
                io.output(this.getStepType(evaluation.type) + last.format());
            }
        }
        else {
            let last = this.node;
            while (true) {
                const next = last.evaluate(scope);
                if (next === last)
                    break;
                last = next;
            }
            io.output(last.format());
        }
    }

    private getStepType(evaluationType: EvaluationType): string {
        switch (evaluationType) {
            case EvaluationType.none:
                return "    ";
            case EvaluationType.reduction:
                return "--> ";
            case EvaluationType.substitute:
                return " =  ";
            /* istanbul ignore next */
            default:
                return panic(`Unexpected EvaluationType: ${EvaluationType[evaluationType]}`)
        }
    }
}

export class AstError extends Error {
}