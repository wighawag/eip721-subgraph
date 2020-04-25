#!/usr/bin/env node
const graphCLI = require("@graphprotocol/graph-cli");
const path = require('path');

(async () => {
    process.chdir(path.join(__dirname, '/..'));
    graphCLI.run(process.argv.slice(2));
})();
