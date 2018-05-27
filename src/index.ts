import * as fs from "fs";
import { runScript } from './driver';

runScript(
    fs.readFileSync(process.argv[2], "utf-8"),
    {
        output(v: string) {
            process.stdout.write(v);
            process.stdout.write("\n");
        }
    }
);
