import { Yggdrasil } from "@/manager";

export interface ConsoleCommandArg {
    name: string;
    description: string;
    required: boolean;
    greedy: boolean;
    options: string[];

    parse(value: string): any;
    isValid(value: string): boolean;
}

export class ConsoleCommandArgBuilder {
    private readonly arg: ConsoleCommandArg;

    constructor(name: string) {
        this.arg = {
            name,
            description: "",
            required: true,
            greedy: false,
            options: [],
            parse: (value: string) => value,
            isValid: () => true
        };
    }

    description(description: string): ConsoleCommandArgBuilder {
        this.arg.description = description;
        return this;
    }

    optional(): ConsoleCommandArgBuilder {
        this.arg.required = false;
        return this;
    }

    greedy(): ConsoleCommandArgBuilder {
        this.arg.greedy = true;
        return this;
    }

    options(options: string[]): ConsoleCommandArgBuilder {
        this.arg.options = options;
        return this;
    }

    parse(parse: (value: string) => any): ConsoleCommandArgBuilder {
        this.arg.parse = parse;
        return this;
    }

    isValid(isValid: (value: string) => boolean): ConsoleCommandArgBuilder {
        this.arg.isValid = isValid;
        return this;
    }

    arg_(): ConsoleCommandArg {
        return this.arg;
    }
}

export abstract class ConsoleCommand {
    public readonly name: string;
    public readonly aliases: string[];
    public readonly args: ConsoleCommandArg[];

    constructor(
        name: string,
        public readonly description: string,
        ...aliases: string[]
    ) {
        this.name = name.toLowerCase();
        this.aliases = aliases.map(alias => alias.toLowerCase());
        this.args = [];
    }

    protected arg(name: string): ConsoleCommandArgBuilder {
        if (this.args.length > 0 && this.args[this.args.length - 1].greedy) {
            throw new Error("Cannot add more arguments after a greedy argument!");
        }

        const builder = new ConsoleCommandArgBuilder(name);
        this.args.push(builder.arg_());
        return builder;
    }

    /**
     * @returns A string if the command failed, undefined otherwise
     */
    public abstract execute(yggdrasil: Yggdrasil, args: any[]): Promise<string|undefined>;

    public get usage(): string {
        const args = this.args.map(arg => {
            const name = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
            return arg.options.length > 0 ? `${name} (${arg.options.join("|")})` : name;
        });

        return `${[this.name, ...this.aliases].join(",")} ${args.join(" ")}`;
    }
}