import { Yggdrasil } from "@/manager";
import { ConsoleCommand } from "../definition";
import { Project } from "@/project";

export class CmdCommand extends ConsoleCommand {
    
    public constructor() {
        super("cmd", "Executes a command", "c");

        this.arg("project").description("The project to execute the command in").options(["name", "index"]).isValid((value: string) => {
            return value.trim().length > 0;
        }).parse((value: string) => {
            const nrValue = parseInt(value);
            if (!isNaN(nrValue)) {
                return nrValue;
            }

            return value;
        });

        this.arg("command").description("The command to execute").greedy();
    }


    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        let project: Project|undefined;
        if (typeof args[0] === "number") {
            project = yggdrasil.getProjectByIndex(args[0]);
        } else {
            project = yggdrasil.getProjectByName(args[0]);
        }

        if (!project) {
            return `Unknown project: ${args[0]}`;
        }

        const command = args[1];
        if (!command || command.trim().length === 0) {
            return `No command specified`;
        }

        await project.execCommandInCwd(command);
    }
}

export class RestartCommand extends ConsoleCommand {
    
    public constructor() {
        super("restart", "Restarts a project", "r");

        this.arg("project").description("The project to restart").options(["name", "index"]).isValid((value: string) => {
            return value.trim().length > 0;
        }).parse((value: string) => {
            const nrValue = parseInt(value);
            if (!isNaN(nrValue)) {
                return nrValue;
            }

            return value;
        });
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        let project: Project|undefined;
        if (typeof args[0] === "number") {
            project = yggdrasil.getProjectByIndex(args[0]);
        } else {
            project = yggdrasil.getProjectByName(args[0]);
        }

        if (!project) {
            return `Unknown project: ${args[0]}`;
        }

        await project.restart();
    }
}

export class StopCommand extends ConsoleCommand {
        
    public constructor() {
        super("stop", "Stops a project", "s");

        this.arg("project").description("The project to stop").options(["name", "index"]).isValid((value: string) => {
            return value.trim().length > 0;
        }).parse((value: string) => {
            const nrValue = parseInt(value);
            if (!isNaN(nrValue)) {
                return nrValue;
            }

            return value;
        });
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        let project: Project|undefined;
        if (typeof args[0] === "number") {
            project = yggdrasil.getProjectByIndex(args[0]);
        } else {
            project = yggdrasil.getProjectByName(args[0]);
        }

        if (!project) {
            return `Unknown project: ${args[0]}`;
        }

        await project.stop();
    }
}

export class StartCommand extends ConsoleCommand {
            
    public constructor() {
        super("start", "Starts a project", "st");

        this.arg("project").description("The project to start").options(["name", "index"]).isValid((value: string) => {
            return value.trim().length > 0;
        }).parse((value: string) => {
            const nrValue = parseInt(value);
            if (!isNaN(nrValue)) {
                return nrValue;
            }

            return value;
        });
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        let project: Project|undefined;
        if (typeof args[0] === "number") {
            project = yggdrasil.getProjectByIndex(args[0]);
        } else {
            project = yggdrasil.getProjectByName(args[0]);
        }

        if (!project) {
            return `Unknown project: ${args[0]}`;
        }

        await project.start();
    }
}

export class HideCommand extends ConsoleCommand {
            
    public constructor() {
        super("hide", "Hides a project's output from the shared console", "h");

        this.arg("project").description("The project to hide").options(["name", "index"]).isValid((value: string) => {
            return value.trim().length > 0;
        }).parse((value: string) => {
            const nrValue = parseInt(value);
            if (!isNaN(nrValue)) {
                return nrValue;
            }

            return value;
        });
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        let project: Project|undefined;
        if (typeof args[0] === "number") {
            project = yggdrasil.getProjectByIndex(args[0]);
        } else {
            project = yggdrasil.getProjectByName(args[0]);
        }

        if (!project) {
            return `Unknown project: ${args[0]}`;
        }

        project.isSilent = true;
    }
}

export class ShowCommand extends ConsoleCommand {
                
    public constructor() {
        super("show", "Shows a project's output in the shared console", "sh");

        this.arg("project").description("The project to show").options(["name", "index"]).isValid((value: string) => {
            return value.trim().length > 0;
        }).parse((value: string) => {
            const nrValue = parseInt(value);
            if (!isNaN(nrValue)) {
                return nrValue;
            }

            return value;
        });
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        let project: Project|undefined;
        if (typeof args[0] === "number") {
            project = yggdrasil.getProjectByIndex(args[0]);
        } else {
            project = yggdrasil.getProjectByName(args[0]);
        }

        if (!project) {
            return `Unknown project: ${args[0]}`;
        }

        project.isSilent = false;
    }
}

export class ShowOnlyCommand extends ConsoleCommand {
                    
    public constructor() {
        super("showonly", "Shows only this project's output and hides all other. If filter is true, the current console gets cleared and the output of the project gets reprinted once", "so");

        this.arg("project").description("The project to show").options(["name", "index"]).isValid((value: string) => {
            return value.trim().length > 0;
        }).parse((value: string) => {
            const nrValue = parseInt(value);
            if (!isNaN(nrValue)) {
                return nrValue;
            }

            return value;
        });

        this.arg("filter").description("Whether the current console output should be filtered").optional().options(["true", "false"]).parse((value: string) => {
            return value === "true";
        });
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        let project: Project|undefined;
        if (typeof args[0] === "number") {
            project = yggdrasil.getProjectByIndex(args[0]);
        } else {
            project = yggdrasil.getProjectByName(args[0]);
        }

        if (!project) {
            return `Unknown project: ${args[0]}`;
        }

        for (const project of yggdrasil.projects) {
            project.isSilent = true;
        }

        project.isSilent = false;

        if (args[1]) {
            console.clear();
            project.reprintHistory();
        }
    }
}

export class ShowAllCommand extends ConsoleCommand {
    public constructor() {
        super("showall", "Shows all project outputs. When reprint is true, all outputs get reprinted", "sa");

        this.arg("reprint").description("Whether all output should be reprinted").optional().options(["true", "false"]).parse((value: string) => {
            return value === "true";
        });
    }

    public async execute(yggdrasil: Yggdrasil, args: any[]): Promise<string | undefined> {
        const messages = yggdrasil.projects.map(project => project.outputHistory).flat().sort((a, b) => a.timestamp - b.timestamp);

        for (const project of yggdrasil.projects) {
            project.isSilent = false;
        }

        if (args[0]) {
            console.clear();
            for (const message of messages) {
                if (message.isError) {
                    console.error(message.text);
                } else {
                    console.log(message.text);
                }
            }
        }

        return;
    }
}