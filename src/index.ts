import { Parser } from "./parser";
import { Tokenizer } from "./tokenizer";
import { } from "./ast";
import * as fs from "fs";

const filename = process.argv[2];

const file = fs.readFileSync(filename, "utf-8");

const t = new Tokenizer(file);

const p = new Parser(t.getTokens());

const sl = p.parseStatementList();

const scope = {};
const io = {
    output(v:string) {
        process.stdout.write(v);
        process.stdout.write("\n");
    }
};

sl.execute(scope, io);
