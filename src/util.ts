import { ChildProcess } from "child_process";

export class ParseError extends Error {
    public constructor(
        public readonly message: string
    ) {
        super(message);
    }    
}

export function waitForChildProcess(proc: ChildProcess): Promise<number> {
    return new Promise((resolve, reject) => {
        proc.on('exit', () => {
            resolve(proc.exitCode || 0);
        });
        proc.on('error', (err) => {
            reject(err);
        });
    });
}