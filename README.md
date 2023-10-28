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