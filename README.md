# Yggdrasil Development CLI
Yggdrasil Development CLI or "yggdev" is a simple CLI tool to enhance your development experience in a stack.

## Yggdev Configuration Guide

Yggdev utilizes a configuration file named `yggdev.json` to manage and orchestrate multiple projects simultaneously. This guide will walk you through the structure and functionalities of this configuration.

### Event Listeners

Yggdev allows you to define commands that get executed at specific events. Event listeners are prefixed with the `@` symbol and can be one of the following:

- `@init`: Triggered before any project or process is started.
- `@start`: Triggered after all projects have started.
- `@stop`: Triggered when all projects are being stopped.
- `@cleanup`: Triggered after all projects have been stopped.

To specify the commands to be executed for each event, you can provide:

- **String**: Represents a single command.
  
  ```json
  "@init": "echo 'Initializing...'"
  ```

- **Array of Strings**: Represents multiple commands that will be executed in sequence.
  
  ```json
  "@start": ["echo 'Starting...'", "echo 'All set!'"]
  ```

By appending a `!` to the event name (e.g., `@init!`), Yggdev will wait until all commands associated with that event have finished executing before moving on. This is useful if you have initialization scripts or other tasks that must complete before further actions take place.

### Projects

The `projects` key is mandatory in the configuration and contains a mapping of project names to their respective start commands.

Each project can be configured using:

1. **String**: Directly provides the command to start the project. 

    ```json
    "myProject": "npm start"
    ```

    You can also specify a working directory by using the `->` delimiter:

    ```json
    "myProject": "./path/to/directory->npm start"
    ```

2. **Array of Strings**: Specifies multiple commands for the project. These commands will be executed in sequence.

    ```json
    "myProject": ["cd ./path", "npm install", "npm start"]
    ```

    The `->` delimiter can also be used here to set a working directory for each command:

    ```json
    "myProject": ["./path/to/directory->npm install", "./path/to/directory->npm start"]
    ```

3. **Object**: Offers more flexibility by providing dedicated fields for the command(s) and the working directory.

    ```json
    "myProject": {
        "cwd": "./path/to/directory",
        "cmd": "npm start"
    }
    ```

    or 

    ```json
    "myProject": {
        "cwd": "./path/to/directory",
        "cmd": ["npm install", "npm start"]
    }
    ```

The paths used in the configuration are relative to the directory containing the `yggdev.json` file. Always use forward slashes (`/`) regardless of the operating system, and `.` represents the current directory.

#### Project Configuration Flags

When configuring a project using the object format, there are additional flags you can use to control its behavior:

- **shallow** (boolean, default: `false`): 
    - When set to `true`, the project is treated as a finite task that runs simultaneously with other projects but does not remain alive indefinitely. 
    - Yggdev won't attempt to restart these "shallow" projects if they unexpectedly terminate. 

    ```json
    "finiteTask": {
        "cmd": "npm run build",
        "shallow": true
    }
    ```

- **restart** (boolean, default: `true`): 
    - Indicates whether the project should be restarted by Yggdev if it stops unexpectedly. 
    - If a project is marked as "shallow", this flag is disregarded as shallow projects aren't restarted by default.
    
    ```json
    "persistentService": {
        "cmd": "npm start",
        "restart": false
    }
    ```

- **silent** (boolean, default: `false`): 
    - When set to `true`, the output of the project will not be displayed in the console. 
    - This is beneficial if you want to suppress verbose logs or output from certain projects while monitoring others.
    - By employing the `silent` flag, you can ensure a neater console display, focusing solely on the outputs you consider essential.

    ```json
    "quietService": {
        "cmd": "npm start",
        "silent": true
    }
    ```

Utilize these flags to tailor the behavior of each project in your configuration to your specific needs.

### Watchers

With "Watchers", you can automatically monitor code changes and take actions in response. A Watcher consists of a set of files to be watched and commands to be executed when those files are modified.

```json
"watchers": {
    "myWatcher": {
        "files": [
            "./*.go",
            "./*.*",
            "./**/*.*"
        ],
        "ignore": [
            "./temp/*.*"
        ],
        "cmd": [
            "go build",
            "go test"
        ]
    }
}
```

- **files** (array of strings): Specify the file paths you want to monitor. Wildcards can be utilized to determine file patterns.
  
- **ignore** (array of strings, optional): Here you can add paths that should be excluded from the watch process. 

- **cmd** (string or array of strings): The commands to be executed upon detecting a file change.

---

#### Integrating Watchers into Project Definitions

To associate a Watcher with a project, use the `#watch <watchername>` directive within the `cmd` field. The `#` prefix denotes an integrated command, signifying that it's a special instruction built into Yggdev and not merely a shell command to be executed.

```json
"myProject": {
    "cmd": "#watch myWatcher"
}
```

When Yggdev encounters `#watch <watchername>`, it will set up the specified Watcher for the project and monitor the defined files. If any of the watched files change, Yggdev will execute the associated commands.

---

#### Oneliner Watcher Solution

For projects that might need just a simple and quick setup without defining a separate Watcher, Yggdev provides an oneliner solution using a special syntax:

```json
"mySimpleProject": {
    "cmd": "#watch {files: ['./*.go', './**/*.ts'], cmd: 'go build'}"
}
```

In this oneliner solution:
- Enclose the watcher configurations within curly braces `{}`.
- `files`: Defines the files or patterns to watch.
- `cmd`: Specifies the command to run when changes are detected.

This offers a concise way to set up a Watcher directly within the project definition while maintaining readability.

Ah, I understand better now. I'll make the corrections. Here's the adjusted documentation:

### OS Conditional Commands

In `Yggdev`, you can conditionally run commands based on the operating system. This is especially useful when you have platform-specific operations or utilities.

To use OS conditional commands, prepend your command string with `?<os>:`. Depending on the OS where `Yggdev` is running, only the matching commands will be executed. 

Here are the valid OS identifiers:
- `win`: Windows
- `mac`: MacOS
- `linux`: Linux
- `unix`: Both MacOS and Linux

#### Examples:

1. **Running a Command Only on Windows**
   ```json
   "?win:echo This will only run on Windows"
   ```

2. **Using Multiple OS Conditional Commands**
   Suppose you want to execute different commands for Windows and Linux. You can define them like this:
   ```json
   {
       "cmd": [
           "?win:echo Running on Windows!",
           "?linux:echo Running on Linux!"
       ]
   }
   ```

3. **Using with Watchers (Inline Syntax)**
   You can also combine OS conditional commands with the watcher directives in an inline manner:
   ```json
   {
       "cmd": "#watch {files: ['./*.go', './**/*.ts'], cmd: '?win:go build -o output.exe', '?linux:go build -o output'}"
   }
   ```

4. **A Command for UNIX-like Systems**
   ```json
   "?unix:echo Running on a UNIX-like system!"
   ```

Note: When using OS conditional commands, ensure the rest of your configuration accounts for any potential differences in behavior or output. Always test your setup on all target OSs to ensure consistent behavior.

## Interactive Console Commands

Once `Yggdev` is up and running, you can interact with it directly through the console. This suite of commands allows you to control, manage, and debug your projects without stopping `Yggdev`. The commands can target specific projects either by their name (`project_name`) or by their temporary index (`project_index`). Here's a comprehensive list of the available commands:

1. **`help [command]`**
   - **Description**: Displays a list of all available commands. Optionally, you can specify a command to get more information about it.
   - **Usage**: `help` or `help cmd`

2. **`exit`**
   - **Description**: Gracefully stops `Yggdev` and halts all running projects.
   - **Usage**: `exit`

3. **`cmd <project_name|project_index> <your_command>`**
   - **Description**: Sends a command to a running project. The command is executed within the working directory of the targeted project.
   - **Usage**: `cmd 1 npm install` or `cmd frontend npm install`
   - **Example**: To run a migration on the backend project, use: `cmd backend npx sequelize-cli db:migrate`

4. **`restart <project_name|project_index>`**
   - **Description**: Restarts the targeted project.
   - **Usage**: `restart 2` or `restart frontend`

5. **`stop <project_name|project_index>`**
   - **Description**: Stops the targeted project.
   - **Usage**: `stop 3` or `stop backend`

6. **`start <project_name|project_index>`**
   - **Description**: Starts the targeted project if it was previously stopped.
   - **Usage**: `start 1` or `start backend`

7. **`hide <project_name|project_index>`**
   - **Description**: Suppresses the console output of the targeted project. The project remains running; only its output is hidden.
   - **Usage**: `hide 2` or `hide frontend`

8. **`show <project_name|project_index>`**
   - **Description**: Resumes the display of console output for a previously hidden project.
   - **Usage**: `show 3` or `show backend`

9. **`showonly <project_name|project_index> [filter]`**
   - **Description**: Displays the console output solely for the targeted project, hiding outputs from all other projects. Optionally, use the `filter` flag to clear the console and reprint only the output of this project.
   - **Usage**: `showonly 1 filter` or `showonly frontend filter`

10. **`showall [reprint]`**
    - **Description**: Resumes displaying console outputs for all projects. Optionally, use the `reprint` flag to clear the console and reprint outputs from all projects.
    - **Usage**: `showall reprint`

Leverage these commands for a flexible and dynamic development experience in `Yggdev`. If in doubt, the `help` command is always there to guide you through each command's functionality.

Absolutely, I'll document this information for you. Here's how it could be written:

## Yggdev CLI Arguments

### Basic Execution

To execute `Yggdev`:

```bash
yggdev [--disable-ipc]
```

This command runs `Yggdev` in the current directory. The directory must contain a `yggdev.json` configuration file. The optional flag `--disable-ipc` prevents the starting of an IPC (Inter-Process Communication) server. If this flag is set or the `yggdev.json` contains `"ipc": false` (though by default it's `true`), the IPC server won't be initialized. A downside of disabling IPC is that the `yggdev exec` feature becomes unavailable.

### Initialization

To create a default configuration:

```bash
yggdev init [--with-hooks]
```

This command initializes a default `yggdev.json` configuration in the current directory. By adding the optional flag `--with-hooks`, dummy hooks will also be included in the default configuration.

Understood. Let's adjust the documentation to reflect that:

### Exec Command with Interactive Console Commands

When you have a running `Yggdev` instance with IPC enabled:

```bash
yggdev exec <interactive_command>
```

The `yggdev exec <interactive_command>` sends one of the previously mentioned interactive console commands (like `help`, `exit`, `cmd`, etc.) to the `Yggdev` instance running in the current directory, provided there's an instance operating within this folder. This allows you to interface with a running instance without directly being in its console. 

This feature relies on the IPC server to communicate between processes. Make sure IPC is enabled in your `yggdev.json` or not disabled via the `--disable-ipc` flag when starting Yggdev to use this feature.

### Yggdev Runtime Folder

Upon starting with IPC, `Yggdev` creates a runtime folder named `.yggdev`. If this directory isn't already listed in the `.gitignore` file (which it should be if initialized with `yggdev init`), it's advisable to add `.yggdev` to your `.gitignore` to ensure runtime data doesn't get versioned in your Git repository.