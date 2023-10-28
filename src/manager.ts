import path from "path";
import fs from "fs";

import { Hook, HookType } from "./hook";
import { Project } from "./project";
import { ParseError } from "./util";
import { Command, parseCommand, parseCommands } from "./command";
import { WatcherConfig } from "./watcher";

const cc = require("node-console-colors");

export class Yggdrasil {
    public readonly projects: Project[] = [];
    public readonly watchers: WatcherConfig[] = [];

    public constructor(
        public readonly onInit?: Hook,
        public readonly onStart?: Hook,
        public readonly onStop?: Hook,
        public readonly onCleanup?: Hook
    ) {}

    public async start() {
        if (this.onInit) {
            await this.onInit.run(this);
        }

        for (const project of this.projects) {
            await project.start();
        }

        if (this.onStart) {
            await this.onStart.run(this);
        }

        process.on('SIGINT', this.onSigInt.bind(this));
    }

    private onSigInt = async () => {
        console.log();
        console.log(cc.set("fg_yellow", "Received SIGINT, stopping all projects..."));

        if (this.onStop) {
            await this.onStop.run(this);
        }

        const promises: Promise<void>[] = [];
        for (const project of this.projects) {
            promises.push(project.stop());
        }

        await Promise.all(promises);

        if (this.onCleanup) {
            await this.onCleanup.run(this);
        }

        process.exit(0);
    }
}

export function parseConfig(): Yggdrasil {
    const configPath = path.join(process.cwd(), "yggdev.json");
    if (!fs.existsSync(configPath)) {
        throw new ParseError("Could not find yggdev.json!");
    }

    const configObj = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (typeof configObj !== "object") {
        throw new ParseError("The yggdev.json file must be a valid JSON object!");
    }

    const onInit = parseHook(HookType.Init, configObj);
    const onStart = parseHook(HookType.Start, configObj);
    const onStop = parseHook(HookType.Stop, configObj);
    const onCleanup = parseHook(HookType.Cleanup, configObj);

    const yggdrasil = new Yggdrasil(onInit, onStart, onStop, onCleanup);

    const projectsObj = configObj["projects"];
    if (typeof projectsObj !== "object") {
        throw new ParseError("The projects property must be a valid JSON object!");
    }

    Object.entries(projectsObj as {[key: string]: any}).forEach(([name, projectObj], index) => {
        switch (typeof projectObj) {
            case "string": {
                const project = new Project(yggdrasil, {
                    commands: parseCommands(projectObj),
                    isShallow: false,
                    shouldRestart: true
                }, index, name);
                yggdrasil.projects.push(project);
                break;
            }
            case "object": {
                const cwd = projectObj["cwd"];
                const isShallow = projectObj["shallow"] || false;
                const shouldRestart = projectObj["restart"] || true;
                let commands: Command[];

                if (typeof projectObj["cmd"] === "string") {
                    commands = parseCommands(projectObj["cmd"]);
                } else if (Array.isArray(projectObj["cmd"])) {
                    commands = projectObj["cmd"].map((cmd, i) => {
                        if (typeof cmd !== "string") {
                            throw new ParseError(`The project ${name}'s "cmd" must be an array of strings!`);
                        }

                        return parseCommand(cmd);
                    }).filter(cmd => cmd !== undefined) as Command[];
                } else {
                    throw new ParseError(`The project ${name}'s "cmd" must be a string or an array of strings!`);
                }

                const project = new Project(yggdrasil, {
                    commands,
                    cwd,
                    isShallow,
                    shouldRestart
                }, index, name);
                yggdrasil.projects.push(project);
                break;
            }
            default: {
                if (Array.isArray(projectObj)) {
                    const project = new Project(yggdrasil, {
                        commands: projectObj.map(cmd => {
                            if (typeof cmd !== "string") {
                                throw new ParseError(`The project ${name} must be an array of strings!`);
                            }

                            return parseCommand(cmd);
                        }).filter(cmd => cmd !== undefined) as Command[],
                        isShallow: false,
                        shouldRestart: true
                    }, index, name);
                    yggdrasil.projects.push(project);
                } else {
                    throw new ParseError(`The project ${name} must be a string, an object or an array of strings!`);
                }
            }
        }
    });

    if (configObj["watchers"]) {
        Object.entries(configObj["watchers"] as {[key: string]: any}).forEach(([name, watcherObj]) => {
            const files = watcherObj["files"];
            const ignore = watcherObj["ignore"];
            let commands = watcherObj["cmd"];

            if (!files) {
                throw new ParseError(`The watcher ${name} must have a "files" property!`);
            }

            if (!commands) {
                throw new ParseError(`The watcher ${name} must have a "cmd" property!`);
            }

            if (!Array.isArray(files)) {
                throw new ParseError(`The watcher ${name}'s "files" property must be an array of strings!`);
            }

            if (ignore && !Array.isArray(ignore)) {
                throw new ParseError(`The watcher ${name}'s "ignore" property must be an array of strings!`);
            }

            if (!Array.isArray(commands) && typeof commands !== "string") {
                throw new ParseError(`The watcher ${name}'s "cmd" property must be a string or an array of strings!`);
            }

            if (Array.isArray(commands)) {
                commands.forEach(cmd => {
                    if (typeof cmd !== "string") {
                        throw new ParseError(`The watcher ${name}'s "cmd" property must be a string or an array of strings!`);
                    }
                });
            } else {
                commands = [commands];
            }

            yggdrasil.watchers.push({
                name,
                files,
                ignore,
                commands
            });
        });
    }

    return yggdrasil;
}

function parseHook(type: HookType, obj: any): Hook|undefined {
    const parse = (withBang: boolean) => {
        const hookName = "@" + (withBang ? `${type}!` : type);

        if (typeof obj[hookName] === "string") {
            return new Hook(type, parseCommands(obj[hookName]), withBang);
        }

        if (Array.isArray(obj[hookName])) {
            const arr = obj[hookName] as any[];
            const commands = arr.map((cmd, i) => {
                if (typeof cmd !== "string") {
                    throw new ParseError(`The ${type} hook must be an array of strings!`);
                }

                return parseCommand(cmd);
            }).filter(cmd => cmd !== undefined) as Command[];

            return new Hook(type, commands, withBang);
        }

        throw new ParseError(`The ${type} hook must be a string or an array of strings!`)
    }

    if (obj["@" + type] !== undefined) {
        return parse(false);
    }

    if (obj["@" + type + "!"] !== undefined) {
        return parse(true);
    }

    return undefined;
}