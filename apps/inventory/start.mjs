import { spawn } from "node:child_process";

const processes = [
  spawn(
    "/opt/venv/bin/uvicorn",
    ["app.main:app", "--app-dir", "/app/backend", "--host", "127.0.0.1", "--port", "8000"],
    { stdio: "inherit" },
  ),
  spawn("node", ["server.js"], { stdio: "inherit" }),
];

let stopping = false;
let exitCode = 0;
let exitedProcesses = 0;

function stop(signal = "SIGTERM") {
  stopping = true;
  for (const child of processes) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  }
}

for (const child of processes) {
  child.on("error", (error) => {
    console.error(`Unable to start ${child.spawnfile}`, error);
    exitCode = 1;
    stop();
  });

  child.on("exit", (code, signal) => {
    exitedProcesses += 1;
    console.log(
      `${child.spawnfile} exited code=${code ?? "none"} signal=${signal ?? "none"}`,
    );

    if (!stopping) {
      exitCode = code ?? 1;
      stop();
    }

    if (exitedProcesses === processes.length) {
      process.exit(exitCode);
    }
  });
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
