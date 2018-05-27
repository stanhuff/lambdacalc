import { runScript } from "../src/driver";

describe("driver", () => {

    test("simple", () => {

        let output = "";
        const io = { output: (v: string) => output += v };

        runScript("tru = λt. λf. t;\n        fls = λt. λf. f;\n        test = λl. λm. λn. l m n;\n\n       tru pass fail;\n        fls fail pass;\n\n        λy.y x;\n        tru;\n        test;\n\n        test tru v w;\n", io);

        expect(output).toMatchSnapshot();

    });

});