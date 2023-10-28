import { parseConfig } from "./manager";
import { ParseError } from "./util";

import fs from "fs";
import { ipcClient, ipcServer } from "./ipc";

function start(disableSocket: boolean = false) {
    try {
        const yggdrasil = parseConfig();
        yggdrasil.start();

        if (disableSocket || yggdrasil.disableSocket) {
            return;
        }

        ipcServer(yggdrasil).then(() => {
            console.log("[@] IPC running!");
        });
    } catch (err) {
        if (err instanceof ParseError) {
            console.error(err.message);

            process.exit(1);
        }
    }
}

function exec(command: string) {
    try {
        ipcClient(command);
    } catch (err) {
        console.error(err);

        process.exit(1);
    }
}

function createDefaultConfig(withHooks: boolean) {
    const config = withHooks ? {
        "@init": "echo 'todo: init'",
        "@start": "echo 'todo: start'",
        "@stop": "echo 'todo: stop'",
        "@cleanup": "echo 'todo: cleanup'",
        projects: {}
    } : {
        projects: {}
    };

    fs.writeFileSync("yggdev.json", JSON.stringify(config, null, 4));

    if (fs.existsSync(".gitignore")) {
        fs.appendFileSync(".gitignore", "\n\n.yggdev/");
    }
}

export function runCLI() {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        if (args[0] === "exec") {
            exec(args.slice(1).join(" "));
        } else if (args[0] === "init") {
            createDefaultConfig(args[1] === "--with-hooks");
        } else if (args[0] === "--disable-ipc") {
            start(true);
        } else {
            console.error("Unknown command: " + args[0]);
            console.error("Usage: yggdev [exec <command> | init [--with-hooks] | --disable-ipc]");
            process.exit(1);
        }
    } else {
        start();
    }
}