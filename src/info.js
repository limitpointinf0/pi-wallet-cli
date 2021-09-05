const conf = new (require('conf'))()
const fs = require('fs');
const readline = require('readline');
var path = require('path');
var appDir = path.dirname(require.main.filename);
var packageInfo = require('../package.json');
const config = require('../config.json');
const chalk = require('chalk')

async function getInfo() {
    const fileStream = fs.createReadStream( appDir + '/banner.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        console.log(chalk.magentaBright(`${line}`));
    }

    console.log('\n')

    console.log(chalk.yellowBright(`Current Account: ${config.my_address}`))
    console.log(chalk.yellowBright(`Server: ${config.server}`))
    console.log(chalk.yellowBright(`Network Passphrase: ${config.networkPassphrase}`))
    console.log(chalk.yellowBright(`Currency: ${config.currency}`))
    console.log(chalk.yellowBright(`Base Reserve: ${config.baseReserve}`))

    console.log('\n')

    console.log(chalk.yellowBright(`Name: ${packageInfo.name}`))
    console.log(chalk.yellowBright(`Version: ${packageInfo.version}`))
    console.log(chalk.yellowBright(`Description: ${packageInfo.description}`))
    console.log(chalk.yellowBright(`Author: ${packageInfo.author}`))
    console.log(chalk.yellowBright(`License: ${packageInfo.license}`))
}

module.exports = getInfo