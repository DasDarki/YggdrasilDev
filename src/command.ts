import { ChildProcess, exec } from "child_process";
import { ParseError, waitForChildProcess } from "./util";
import { Yggdrasil } from "./manager";
import { Watcher, parseOnelineWatcherConfig } from "./watcher";
import path from "path";

const cc = require("node-console-colors");

export class Command {
    public constructor(
        public readonly value: string,
        public readonly cwd?: string
    ) {}
}

export interface CommandRunner {
    get isRunning(): boolean;
    start(): Promise<void>;
    wait(): Promise<void>;
    stop(): Promise<void>;
    onExit(callback: () => any): void;
}

export function parseCommand(str: string, cwd?: string): Command|undefined {
    const parts = str.split('->').filter((part) => part.trim().length > 0).map((part) => part.trim());
    let command = parts[0];
    
    if (parts.length === 2) {
        command = parts[1];
        cwd = parts[0];
    } else if (parts.length > 2) {
        throw new ParseError('The command string must not contain more than one "->"!');
    }

    if (command.length === 0) {
        throw new ParseError('The command string must not be empty!');
    }

    if (cwd && cwd.trim().length <= 0) {
        cwd = undefined;
    }

    command = resolveCommandText(command);
    if (command.length === 0) {
        return undefined;
    }

    return new Command(command, cwd);
}

export function parseCommands(str: string): Command[] {
    const commandStrs = str.split('&&').filter((part) => part.trim().length > 0).map((part) => part.trim());
    return commandStrs.map((commandStr) => parseCommand(commandStr)).filter((command) => command !== undefined) as Command[];
}

export async function runCommand(yggdrasil: Yggdrasil, command: Command, cwd: string, outputEvent: (msg: string) => void, errorEvent: (msg: string) => void, await_: boolean): Promise<CommandRunner> {
    cwd = cwd || process.cwd();
    if (cwd) {
        cwd = path.resolve(cwd);
    }

    const runner = startCommandRunner(yggdrasil, command.value, cwd, outputEvent, errorEvent);
    await runner.start();

    if (await_) {
        await runner.wait();
    }
    
    return runner;
}

export function resolveCommandText(cmd: string): string {
    if (cmd.startsWith("?")) {
        if (cmd.startsWith("?win:")) {
            if (process.platform === "win32") {
                return cmd.substring("?win:".length);
            } else {
                return "";
            }
        } else if (cmd.startsWith("?linux:")) {
            if (process.platform === "linux") {
                return cmd.substring("?linux:".length);
            } else {
                return "";
            }
        } else if (cmd.startsWith("?mac:")) {
            if (process.platform === "darwin") {
                return cmd.substring("?mac:".length);
            } else {
                return "";
            }
        } else if (cmd.startsWith("?unix:")) {
            if (process.platform !== "win32") {
                return cmd.substring("?unix:".length);
            } else {
                return "";
            }
        } else {
            throw new ParseError(`Got conditional command "${cmd}" but no valid OS condition was specified!`);
        }
    } else {
        return cmd;
    }
}

function startCommandRunner(yggdrasil: Yggdrasil, command: string, cwd: string, outputEvent: (msg: string) => void, errorEvent: (msg: string) => void): CommandRunner {
    if (command.startsWith('#')) {
        if (command.startsWith('#watch')) {
            const watchCommand = command.substring('#watch'.length).trim();
            if (watchCommand.startsWith("{")) {
                if (watchCommand.endsWith("}")) {
                    return new Watcher(cwd, parseOnelineWatcherConfig(watchCommand.substring(1, watchCommand.length - 1)), outputEvent, errorEvent)
                } else {
                    throw new ParseError(`Invalid watcher config: ${watchCommand}`);
                }
            } else {
                const watcherConf = yggdrasil.watchers.find((watcher) => watcher.name === watchCommand);
                if (!watcherConf) {
                    throw new ParseError(`Unknown watcher: ${watchCommand}`);
                }

                return new Watcher(cwd, watcherConf, outputEvent, errorEvent);
            }
        } else {
            throw new ParseError(`Unknown integrated command: ${command}`);
        }
    } else {
        const proc = exec(command, {
            cwd,
            windowsHide: true
        });
    
        proc.stdout?.on('data', (data) => {
            if (data.endsWith('\n')) {
                data = data.substring(0, data.length - 1);
            }
    
            outputEvent(data);
        });
    
        proc.stderr?.on('data', (data) => {
            if (data.endsWith('\n')) {
                data = data.substring(0, data.length - 1);
            }
    
            errorEvent(cc.set("fg_red", data));
        });

        return new ProcessCommandRunnder(proc);
    }
}

class ProcessCommandRunnder implements CommandRunner {
    public constructor(
        public readonly process: ChildProcess
    ) {}

    public get isRunning(): boolean {
        return this.process.exitCode === null;
    }

    public async start() {
    }

    public async wait() {
        await waitForChildProcess(this.process);
    }

    public async stop() {
        this.process.kill("SIGINT");
    }

    public onExit(callback: () => any): void {
        this.process.on('exit', callback);
    }
}