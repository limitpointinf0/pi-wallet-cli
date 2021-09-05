const conf = new (require('conf'))()
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server("https://api.testnet.minepi.com");
const config = require('../config.json');
const piLib = require('./piLib');
const prompt = require('prompt-sync')({ sigint: true })
const CLI = require('clui');
const Spinner = CLI.Spinner;
const chalk = require('chalk')

// Get a message any time a payment occurs. Cursor is set to "now" to be notified
// of payments happening starting from when this script runs (as opposed to from
// the beginning of time).

function streamPayments() {

    piLib.createBanner('Stream Payments');

    var accountAddress = config.my_address
    if (!accountAddress){
        var accountAddress = prompt(chalk.yellowBright('Account Address: '));
    }

    const status = new Spinner('Listening...');
    status.start();

    const es = server.payments()
    .cursor('now')
    .stream({
        onmessage: function (message) {
            if ((message.type == 'payment') & ((message.from == accountAddress) | ((message.to == config.accountAddress)))){
                console.log(`\n`);
                console.log(`Asset Type: ${message.asset_type}`);
                console.log(`Amount: ${message.amount}`);
                console.log(`From: ${message.from}`);
                console.log(`To: ${message.to}`);
                console.log(`Created At: ${message.created_at}`);
            }
        }
    })
}

module.exports = streamPayments