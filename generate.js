const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");

const args = process.argv.slice(2);
const chainName = args[0];
const startBlock = args[1];
// # startBlock: 6367157 # erro on 0x00 string
// # startBlock: 5806610 #PoloDod (0x7b70405fba653cc8eff5afad1c5079d7da0a0247)
const template = Handlebars.compile(
  fs.readFileSync(path.join(__dirname, "templates/subgraph.yaml")).toString()
);
const result = template({ chainName, startBlock });
fs.writeFileSync(path.join(__dirname, "subgraph.yaml"), result);
