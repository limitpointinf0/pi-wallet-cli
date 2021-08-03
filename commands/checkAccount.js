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
        .then((account) => {
            status.stop();
            console.log('\n')
            console.log(chalk.yellowBright(`Account ID: ${account.accountId}\n`))
            account.balances.forEach((balance) => {
                console.log(chalk.yellowBright(`Type: ${balance.type}`))
                console.log(chalk.yellowBright(`Balance: ${balance.balance}`))
                console.log('\n')
            });
        })
        .catch((e) => { 
            status.stop();
            console.error(e); throw e
        })
}

module.exports = check;