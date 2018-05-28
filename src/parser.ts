import { Token, TokenType, getTokenTypeName } from "./tokenizer";
import { toArray, filter } from "./utils";
import { Node, Variable, Call, Lambda, StatementList, Assignment, ExpressionStatement, Statement, Expression } from './ast';
import { ParseError } from './parserUtils';

export class Parser {
    private tokens: Token[];
    private idx = -1;

    constructor(
        tokens: Iterable<Token>
    ) {
        this.tokens = toArray(filter(tokens, v => v.type !== TokenType.WHITESPACE));
    }

    parse(): Node | undefined {
        this.next();
        switch (this.token.type) {
            case TokenType.EOF:
                return undefined;
            default:
                return this.parseApply();
        }
    }

    parseStatementList(): StatementList {
        this.next();
        const statements = [];
        while (this.token.type !== TokenType.EOF) {
            statements.push(this.parseStatement());
        }
        return new StatementList(...statements);
    }

    private parseStatement(): Statement {
        const statement = (this.token.type == TokenType.ID && this.LA.type === TokenType.EQUALS)
            ? this.parseAssignmentStatement()
            : this.parseFunctionApplicationStatement();
        this.ensure(TokenType.SEMICOLON);
        return statement;
    }

    private parseAssignmentStatement() {
        const id = this.ensure(TokenType.ID);
        this.ensure(TokenType.EQUALS);
        const value = this.parseApply();
        return new Assignment(id.text, value);
    }

    private parseFunctionApplicationStatement() {
        const application = this.parseApply();
        return new ExpressionStatement(application);
    }

    private parseApply(): Expression {
        let func = this.parsePrimary();
        while (!this.isApplyTerminator()) {
            const arg = this.parsePrimary();
            func = new Call(func, arg);
        }
        return func;
    }

    private isApplyTerminator() {
        return this.token.type === TokenType.RPAREN || this.token.type === TokenType.SEMICOLON || this.token.type === TokenType.EOF
    }

    private parsePrimary(): Expression {
        switch (this.token.type) {
            case TokenType.LPAREN:
                this.consume();
                const term = this.parseApply();
                this.ensure(TokenType.RPAREN);
                return term;
            case TokenType.ID:
                return new Variable(this.consume().text);
            case TokenType.LAMBDA:
                return this.parseFunc();
            default:
                return this.reportError(`Unexpected token type ${getTokenTypeName(this.token.type)}.  Expected ${getTokenTypeName(TokenType.LPAREN)}, ${getTokenTypeName(TokenType.LAMBDA)}, or ${getTokenTypeName(TokenType.ID)}`, this.token);
        }
    }

    private parseFunc(): Expression {
        this.ensure(TokenType.LAMBDA);
        const paramToken = this.ensure(TokenType.ID);
        this.ensure(TokenType.PERIOD);
        const body = this.parseApply();
        return new Lambda(paramToken.text, body);
    }

    private get token() { return this.tokens[this.idx]; }
    private get LA() { return this.tokens[this.idx + 1]; }

    private next() {
        this.consume();
        return this.token;
    }

    private consume() {
        const token = this.token;
        do {
            this.idx++;
        } while (this.tokens[this.idx].type === TokenType.WHITESPACE);
        return token;
    }

    private ensure(tokenType: TokenType) {
        if (this.token.type === tokenType)
            return this.consume();
        return this.reportError(`Unexpected token type ${getTokenTypeName(this.token.type)}.  Expected ${getTokenTypeName(tokenType)}.`, this.token);
    }

    private reportError(message: string, token: Token): never {
        throw new ParseError(`Error: ${message} @ ${token.start}`);
    }
}
