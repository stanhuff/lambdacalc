import { runScript } from "../src/driver";
import { IO } from '../src/ast';

describe("driver", () => {

    test("simple", () => {

        let output = "";
        const io = { output: (v: string) => output += v };

        runScript("tru = λt. λf. t;\n        fls = λt. λf. f;\n        test = λl. λm. λn. l m n;\n\n       tru pass fail;\n        fls fail pass;\n\n        λy.y x;\n        tru;\n        test;\n\n        test tru v w;\n", io);

        expect(output).toMatchSnapshot();

    });

    test("steps", () => {

        let output = "";
        const io = { output: (v: string) => output += v, showSteps: true } as IO;

        runScript("tru = λt. λf. t;\n        fls = λt. λf. f;\n        test = λl. λm. λn. l m n;\n\n       tru pass fail;\n        fls fail pass;\n\n        λy.y x;\n        tru;\n        test;\n\n        test tru v w;\n", io);

        expect(output).toMatchSnapshot();

    });

    /* when lambda simplification enabled
    test("simplify lambda result", () => {
        let output = "";
        const io = { output: (v: string) => output += v, showSteps: true } as IO;

        runScript("scc = λn. λs. λz. s (n s z); c0 = λs. λz. z; scc c0;", io);

        expect(output).toMatchSnapshot();
    });
    */
});