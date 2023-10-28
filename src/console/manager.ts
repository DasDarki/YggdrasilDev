import { Yggdrasil } from "@/manager";
import { registerAllCommands } from "./commands";
import { ConsoleCommand } from "./definition";

const cc = require("node-console-colors");

export const commands: ConsoleCommand[] = [];

export function registerCommand<T extends ConsoleCommand>(constructor: new () => T): void {
    const command = new constructor();
    commands.push(command);
}

export function getCommandByName(name: string): ConsoleCommand|undefined {
    name = name.toLowerCase();
    for (const command of commands) {
        if (command.name === name) {
            return command;
        }

        if (command.aliases.includes(name)) {
            return command;
        }
    }

    return undefined;
}

export async function executeCommandLine(yggdrasil: Yggdrasil, line: string) {
    const args = line.split(" ").map(arg => arg.trim()).filter(arg => arg.length > 0);
    const commandName = args.shift();
    if (!commandName) {
        console.log(cc.set("fg_red", "[@] No command specified"));
        return;
    }

    const command = getCommandByName(commandName);
    if (!command) {
        console.log(cc.set("fg_red", `[@] Unknown command: ${commandName} - use 'help' to list all commands`));
        return;
    }

    const commandArgs = command.args;
    const parsedArgs: any[] = [];
    for (let i = 0; i < commandArgs.length; i++) {
        let arg = commandArgs[i];
        let argVal = args[i];
        
        if (!argVal) {
            if (arg.required) {
                console.log(cc.set("fg_red", `[@] Missing argument: ${arg.name} - use 'help ${command.name}' to list the usage`));
                return;
            }

            continue;
        }

        if (arg.greedy) {
            argVal = args.slice(i).join(" ");
        }

        if (!arg.isValid(argVal)) {
            console.log(cc.set("fg_red", `[@] Invalid argument: ${arg.name} - use 'help ${command.name}' to list the usage`));
            return;
        }

        parsedArgs.push(arg.parse(argVal));
    }

    const failMsg = await command.execute(yggdrasil, parsedArgs);
    if (failMsg) {
        console.log(cc.set("fg_red", `[@] Command failed: ${command.name} - Reason: ${failMsg}`));
    }
}

registerAllCommands();