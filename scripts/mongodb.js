const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, ".local-data", "mongodb");
const localBinary = path.join(root, ".local-tools", "mongodb", "bin", "mongod");

function findMongod() {
  if (process.env.MONGOD_PATH) return process.env.MONGOD_PATH;
  if (fs.existsSync(localBinary)) return localBinary;
  return "mongod";
}

function run(args) {
  const result = spawnSync(findMongod(), args, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit"
  });

  if (result.error) {
    console.error("Could not run mongod. Install MongoDB Community Server or set MONGOD_PATH.");
    process.exit(1);
  }

  if (result.status !== 0) process.exit(result.status || 1);
}

const action = process.argv[2];

if (action === "start") {
  fs.mkdirSync(dataDir, { recursive: true });
  run([
    "--dbpath", dataDir,
    "--bind_ip", "127.0.0.1",
    "--port", "27017",
    "--fork",
    "--logpath", path.join(dataDir, "mongod.log"),
    "--pidfilepath", path.join(dataDir, "mongod.pid")
  ]);
  console.log("MongoDB is running at mongodb://127.0.0.1:27017/fieldfix");
} else if (action === "stop") {
  run(["--shutdown", "--dbpath", dataDir]);
} else {
  console.error("Usage: node scripts/mongodb.js <start|stop>");
  process.exit(2);
}
