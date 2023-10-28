import { registerCommand } from "../manager";
import { HelpCommand, ExitCommand } from "./general";
import { CmdCommand, HideCommand, RestartCommand, ShowAllCommand, ShowCommand, ShowOnlyCommand, StartCommand, StopCommand } from "./project_based";

export function registerAllCommands() {
    registerCommand<HelpCommand>(HelpCommand);
    registerCommand<ExitCommand>(ExitCommand);
    registerCommand<CmdCommand>(CmdCommand);
    registerCommand<RestartCommand>(RestartCommand);
    registerCommand<StopCommand>(StopCommand);
    registerCommand<StartCommand>(StartCommand);
    registerCommand<HideCommand>(HideCommand);
    registerCommand<ShowCommand>(ShowCommand);
    registerCommand<ShowOnlyCommand>(ShowOnlyCommand);
    registerCommand<ShowAllCommand>(ShowAllCommand);
}