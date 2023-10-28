import { parseConfig } from "./manager";
import { ParseError } from "./util";

function start() {
    try {
        const yggdrasil = parseConfig();
        yggdrasil.start();
    } catch (err) {
        if (err instanceof ParseError) {
            console.error(err.message);

            process.exit(1);
        }
    }
}

start();