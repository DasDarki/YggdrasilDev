import { Command, runCommand } from "./command";
import { Yggdrasil } from "./manager";

export enum HookType {
    Init = "init",
    Start = "start",
    Stop = "stop",
    Cleanup = "cleanup"
}

export class Hook {

    private _wasRun: boolean = false;

    public constructor(
        public readonly type: HookType,
        public readonly commands: Command[],
        public readonly await: boolean = false
    ) {}

    public async run(yggdrasil: Yggdrasil) {
        if (this._wasRun) {
            return;
        }

        this._wasRun = true;

        for (let i = 0; i < this.commands.length; i++) {
            const cmd = this.commands[i];
            const shouldAwait = this.await && i === this.commands.length - 1;

            await runCommand(yggdrasil, cmd, cmd.cwd || process.cwd(), msg => {
                console.log(`[@ | ${this.type}] ${msg}`);
            }, err => {
                console.error(`[@ | ${this.type}] ${err}`);
            }, shouldAwait);
        }
    }
}