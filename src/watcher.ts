import { ChildProcess, exec } from "child_process";
import { CommandRunner, resolveCommandText } from "./command";
import { ParseError, waitForChildProcess } from "./util";

import {watch, FSWatcher} from "chokidar";
import pidtree from "pidtree";

const cc = require("node-console-colors");

export interface WatcherConfig {
    readonly name: string;
    readonly files: string[];
    readonly ignore?: string[];
    readonly commands: string[];
}

export function parseOnelineWatcherConfig(oneline: string): WatcherConfig {
    const props = oneline.split(',').map((prop) => prop.trim());
    
    let files: string[] = undefined!;
    let ignore: string[]|undefined = undefined;
    let commands: string[] = undefined!;

    props.forEach((prop) => {
        const [key, value] = prop.split(':').map((part) => part.trim());
        if (key.toLowerCase() === "files") {
            if (files) {
                throw new ParseError(`Watcher Parser "${oneline}": The files property was already set!`);
            }

            if (value.startsWith('[') && value.endsWith(']')) {
                files = JSON.parse(value.split("'").join('"'));
            } else {
                throw new ParseError(`Watcher Parser "${oneline}": The files property must be an array of strings!`);
            }
        } else if (key.toLowerCase() === "ignore") {
            if (ignore) {
                throw new ParseError(`Watcher Parser "${oneline}": The ignore property was already set!`);
            }

            if (value.startsWith('[') && value.endsWith(']')) {
                ignore = JSON.parse(value.split("'").join('"'));
            } else {
                throw new ParseError(`Watcher Parser "${oneline}": The files property must be an array of strings!`);
            }
        } else if (key.toLowerCase() === "cmd") {
            if (commands) {
                throw new ParseError(`Watcher Parser "${oneline}": The cmd property was already set!`);
            }

            if (value.startsWith('[') && value.endsWith(']')) {
                commands = JSON.parse(value.split("'").join('"'));
            } else if (value.startsWith("'") && value.endsWith("'")) {
                commands = [value.substring(1, value.length - 1)];
            } else {
                throw new ParseError(`Watcher Parser "${oneline}": The cmd property must be a string or an array of strings!`);
            }
        }
    });

    if (!files) {
        throw new ParseError(`Watcher Parser "${oneline}": The files property is required!`);
    }

    if (!commands) {
        throw new ParseError(`Watcher Parser "${oneline}": The cmd property is required!`);
    }

    return {
        name: "",
        files,
        ignore,
        commands
    };
}

export class Watcher implements CommandRunner {

    private _lastProcess: ChildProcess|undefined = undefined;
    private _watcher: FSWatcher|undefined = undefined;

    public constructor(
        public readonly cwd: string,
        public readonly config: WatcherConfig,
        private readonly _outputCallback: (msg: string) => void,
        private readonly _errorCallback: (msg: string) => void
    ) {}

    get isRunning(): boolean {
        return this._watcher !== undefined;
    }

    async start(): Promise<void> {
        await this.startWatcher();
        this.startCommands();
    }

    async wait(): Promise<void> {
        
    }

    async stop(): Promise<void> {
        await this.stopWatcher();
        await this.stopCommands();
    }

    onExit(callback: () => any): void {
    }

    private async startWatcher() {
        this._watcher = watch(this.config.files, {
            cwd: this.cwd,
            ignored: this.config.ignore,
            ignoreInitial: true
        });

        this._watcher.on('add', async () => {
            this._outputCallback(cc.set("fg_green", "WATCHER: File added, restarting..."));

            await this.stopCommands();
            await this.startCommands();
        });
        this._watcher.on('change', async () => {
            this._outputCallback(cc.set("fg_green", "WATCHER: File changed, restarting..."));

            await this.stopCommands();
            await this.startCommands();
        });
        this._watcher.on('unlink', async () => {
            this._outputCallback(cc.set("fg_green", "WATCHER: File removed, restarting..."));

            await this.stopCommands();
            await this.startCommands();
        });
    }

    private async stopWatcher() {
        if (this._watcher) {
            await this._watcher.close();

            this._watcher = undefined;
        }
    }

    private async startCommands() {
        const inst = this;

        for (let cmd of this.config.commands) {
            cmd = resolveCommandText(cmd);
            if (!cmd || cmd.trim().length <= 0) {
                continue;
            }

            const cp = await exec(cmd, {
                cwd: this.cwd,
                windowsHide: false
            });

            cp.stdout?.on('data', (data) => {
                if (data.endsWith('\n')) {
                    data = data.substring(0, data.length - 1);
                }
        
                inst._outputCallback(data);
            });
        
            cp.stderr?.on('data', (data) => {
                if (data.endsWith('\n')) {
                    data = data.substring(0, data.length - 1);
                }
        
                this._errorCallback(cc.set("fg_red", data));
            });

            this._lastProcess = cp;
            
            await waitForChildProcess(cp);
        }
    }

    private async stopCommands() {
        if (this._lastProcess) {
            const pid = this._lastProcess.pid;
            if (pid) {
                try {
                    const pidList = await pidtree(pid, {root: true});
                    for (const pid of pidList) {
                        process.kill(pid, 'SIGINT');
                    }
                } catch {
                    this._lastProcess.kill();
                }
            } else {
                this._lastProcess.kill();
            }
        }
    }
}