import { IO } from './ast';
import { Tokenizer } from './tokenizer';
import { Parser } from './parser';

export function runScript(script: string, io: IO) {
    const t = new Tokenizer(script);

    const p = new Parser(t.getTokens());

    const sl = p.parseStatementList();

    const scope = {};

    sl.execute(scope, io);

}