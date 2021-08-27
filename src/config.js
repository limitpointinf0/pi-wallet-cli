const config = require('../config.json');
const prompt = require('prompt-sync')({ sigint: true });
const chalk = require('chalk')
var fs = require('fs');
var path = require('path');
var appDir = path.dirname(require.main.filename);

function configure() {

    const server = prompt(chalk.yellowBright(`Server: `));
    const passphrase = prompt(chalk.yellowBright(`Network Passphrase: `));
    const currency = prompt(chalk.yellowBright(`Currency: `));
    const baseReserve = prompt(chalk.yellowBright(`Base Reserve: `));

    config.server = server;
    config.networkPassphrase = passphrase;
    config.currency = currency;
    config.baseReserve = baseReserve;

    var json = JSON.stringify(config);
    fs.writeFile(appDir + '/config.json', json, 'utf8', (err) => {
        if (err) throw err;
        console.log(chalk.yellowBright(`Config was set successfully!`))
    });

}

module.exports = configure