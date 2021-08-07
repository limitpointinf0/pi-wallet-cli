const conf = new (require('conf'))()
const config = require('../config.json');
const prompt = require('prompt-sync')({ sigint: true });
const chalk = require('chalk')
var fs = require('fs');
var StellarBase = require('stellar-base');
var path = require('path');
var appDir = path.dirname(require.main.filename);

function set() {

    const address = prompt(chalk.yellowBright(`Account Address: `));

    if (StellarBase.StrKey.isValidEd25519PublicKey(address)) {
        config.my_address = address;
        var json = JSON.stringify(config);
        fs.writeFile(appDir + '/config.json', json, 'utf8', (err) => {
            if (err) throw err;
            console.log(chalk.yellowBright(`Account was set successfully!`))
        });
    }else{
        console.log(chalk.red(`Invalid Address`))
    }

}

module.exports = set