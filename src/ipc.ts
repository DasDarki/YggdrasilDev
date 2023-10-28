import { Yggdrasil } from "./manager";
import { executeCommandLine } from "./console/manager";

import findFreePorts from "find-free-ports";
import hidefile from "hidefile";
import fs from "fs";
import net from "net";

export async function ipcServer(yggdrasil: Yggdrasil) {
    const [port] = await findFreePorts(1, { startPort: 25340 });

    if (!fs.existsSync(".yggdev")) {
        fs.mkdirSync(".yggdev");
        hidefile.hideSync(".yggdev");
    }

    fs.writeFileSync(".yggdev/bifroest", port.toString());

    net.createServer((socket) => {
        socket.on("data", async (data) => {
            const command = data.toString("utf-8").trim();
            if (command.length === 0) {
                return;
            }

            console.log(`[@] Received IPC command: ${command}`);

            if (command.startsWith("EXEC ")) {
                await executeCommandLine(yggdrasil, command.substring(5));
                socket.write("OK");
            } else {
                socket.write("UNKNOWN_COMMAND");
            }
        });
        socket.on("error", () => {});
    }).listen(port);

    process.on("exit", () => {
        try {
            fs.unlinkSync(".yggdev/bifroest");
        } catch {}
    });
}

export function ipcClient(command: string) {
    try {
        if (!fs.existsSync(".yggdev/bifroest")) {
            console.error("No IPC server running!");
            process.exit(1);
        }

        const port = parseInt(fs.readFileSync(".yggdev/bifroest", "utf-8"));
        const socket = net.createConnection(port, "localhost", () => {
            socket.write("EXEC " + command);
        });

        socket.on("data", (data) => {
            const response = data.toString("utf-8").trim();
            if (response === "OK") {
                socket.end();
                process.exit(0);
            } else {
                socket.end();
                console.error("Unknown command!");
                process.exit(1);
            }
        });
    } catch (err) {
        console.error(err);

        process.exit(1);
    }
}