const fs = require("fs-extra");
const Handlebars = require("handlebars");

const args = process.argv.slice(2);
const pathArg = args[0];

if (!pathArg) {
  console.error(`please provide the path to contracts info, either a directory of deployemnt or a single export file`);
}
if (!fs.existsSync(pathArg)) {
  console.error(`file ${pathArg} doest not exits`);
}

const contractsInfo = JSON.parse(fs.readFileSync(pathArg).toString());
const template = Handlebars.compile(fs.readFileSync("./templates/subgraph.yaml").toString());
const result = template(contractsInfo);
fs.writeFileSync("./subgraph.yaml", result);


fs.writeFileSync('./abis/Emitter.json', JSON.stringify(contractsInfo.contracts.Emitter.abi, null, '  '));