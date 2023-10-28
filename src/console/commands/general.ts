import { Yggdrasil } from "@/manager";
import { ConsoleCommand } from "../definition";
import { commands, getCommandByName } from "../manager";

export class HelpCommand extends ConsoleCommand {
    
    public constructor() {
        super("help", "Displays all commands or the usage of a specific command", "h");

        this.arg("command").optional().description("The command to display the usage for");
    }
    
    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        console.log();
        if (args.length === 0) {
            console.log("Available commands:");
            for (const command of commands) {
                const name = command.aliases.length > 1 ? `${command.name} (${command.aliases.join("|")})` : command.name;
                console.log(` - ${name}`);
            }
            return;
        }

        const command = getCommandByName(args[0]);
        if (!command) {
            return `Unknown command: ${args[0]}`;
        }

        console.log(`Usage for ${args[0]}: ${command.usage}`);
        console.log(` - ${command.description}`);
        console.log("Arguments:");
        for (const arg of command.args) {
            const name = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
            const options = arg.options.length > 0 ? `(${arg.options.join("|")})` : "";
            console.log(` - ${name} ${options} - ${arg.description}`);
        }
        console.log();
    }
}

export class ExitCommand extends ConsoleCommand {
    public constructor() {
        super("exit", "Exits the current runtime", "q", "quit");
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        await yggdrasil.onSigInt();

        return;
    }
}