import { Command, CommandRunner, runCommand } from "./command";
import { Yggdrasil } from "./manager";

export interface Message {
    readonly timestamp: number;
    readonly text: string;
    readonly isError: boolean;
}

export interface ProjectConfig {
    readonly commands: Command[];
    readonly cwd?: string;
    readonly isShallow: boolean;
    readonly shouldRestart: boolean;
}

export class Project {
    public runningProcess?: CommandRunner;
    public cwd: string;
    public isSilent: boolean = false;
    public readonly outputHistory: Message[] = [];

    private _shouldStop: boolean = false;

    public constructor(
        public readonly yggdrasil: Yggdrasil,
        public readonly config: ProjectConfig,
        public readonly index: number,
        public readonly name: string
    ) {
        this.cwd = "";
    }
    
    public get isRunning(): boolean {
        return this.runningProcess !== undefined && this.runningProcess.isRunning;
    }

    public async start() {
        if (this.isRunning) {
            return;
        }

        console.log(`[${this.index} | ${this.name}] Starting...`);

        this._shouldStop = false;

        for (let i = 0; i < this.config.commands.length; i++) {
            const cmd = this.config.commands[i];
            const cwd = cmd.cwd || this.config.cwd || process.cwd();
            const isLast = i === this.config.commands.length - 1;

            this.cwd = cwd;
            this.runningProcess = await runCommand(this.yggdrasil, cmd, cwd, this.outputCallback.bind(this), this.errorCallback.bind(this), !isLast);

            if (isLast && !this.config.isShallow) {
                this.runningProcess.onExit(this.onProcessExit.bind(this));
            }
        }
    }

    public async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log(`[${this.index} | ${this.name}] Stopping...`);

        this._shouldStop = true;
        
        if (this.runningProcess) {
            await this.runningProcess.stop();
        }
    }

    public async restart() {
        if (!this.isRunning) {
            return;
        }

        await this.stop();
        await this.start();
    }

    public async execCommandInCwd(command: string) {
        if (this.cwd) {
            await runCommand(this.yggdrasil, new Command(command), this.cwd, this.outputCallback.bind(this), this.errorCallback.bind(this), true);
        }
    }

    public reprintHistory() {
        for (const msg of this.outputHistory) {
            if (msg.isError) {
                console.error(msg.text);
            } else {
                console.log(msg.text);
            }
        }
    }

    private onProcessExit = () => {
        this.runningProcess = undefined;
        
        if (this._shouldStop) {
            return;
        }

        console.error(`[${this.index} | ${this.name}] Process exited unexpectedly!`);

        if (!this.config.isShallow && this.config.shouldRestart) {
            console.log(`[${this.index} | ${this.name}] Restarting...`);
            this.start();
        }
    }

    private outputCallback = (output: string) => {
        const msg = output.split('\n').map((line) => `[${this.index} | ${this.name}] ${line}`).join('\n');

        this.outputHistory.push({
            timestamp: Date.now(),
            text: msg,
            isError: false
        });

        if (!this.isSilent) {
            console.log(msg);
        }
    }

    private errorCallback = (err: string) => {
        const msg = err.split('\n').map((line) => `[${this.index} | ${this.name}] ${line}`).join('\n');

        this.outputHistory.push({
            timestamp: Date.now(),
            text: msg,
            isError: true
        });

        if (!this.isSilent) {
            console.error(msg);
        }
    }
}