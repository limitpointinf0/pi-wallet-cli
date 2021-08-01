const conf = new (require('conf'))()
const chalk = require('chalk')
const Stellar = require('stellar-sdk')
const util = require('util')
const prompt = require('prompt-sync')({ sigint: true });
const config = require('../config.json');
const CLI = require('clui');
const Spinner = CLI.Spinner;

function check () {
    const server = new Stellar.Server(config.server)

    //get account information
    var accountAddress = config.my_address
    if (!accountAddress){
        var accountAddress = prompt(chalk.yellowBright('Account Address: '));
    }

    const checkAccounts = async (accountAddress) => {

        const account = await server.loadAccount(accountAddress);

        return {
            accountId: account.id,
            balances: account.balances.map( balance => ({
                type: balance.asset_type,
                balance: balance.balance
            }))
        }

    }
    const status = new Spinner('Checking account, please wait...');
    status.start();
    checkAccounts(accountAddress)
        .then((accounts) => {
            console.log('\n')
            console.log(util.inspect(accounts, false, null))
            status.stop();
        })
        .catch((e) => { 
            status.stop();
            console.error(e); throw e
        })
}

module.exports = check;