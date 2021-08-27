const axios = require('axios');
const chalk = require('chalk')
const Stellar = require('stellar-sdk')
const prompt = require('prompt-sync')({ sigint: true });
const config = require('../config.json');
const piLib = require('./piLib');
const CLI = require('clui');
const Spinner = CLI.Spinner;

function check () {

    piLib.createBanner('Check Balance');

    const server = new Stellar.Server(config.server)

    //get account information
    const accountAddress = (config.my_address) ? config.my_address : prompt(chalk.yellowBright('Account Address: '));

    const checkBalance = async (accountAddress) => {

        const account = await server.loadAccount(accountAddress);

        return {
            accountId: account.id,
            balances: account.balances.map( balance => ({
                asset: balance.asset_code,
                type: balance.asset_type,
                balance: balance.balance
            }))
        }

    }

    const checkReserve = async (accountAddress) => {
        const reqUrl = config.server + `/accounts/${accountAddress}`;
        const subentryCount = await axios.get(reqUrl);
        return subentryCount;
    }

    const status = new Spinner('Checking balances, please wait...');
    status.start();
    checkBalance(accountAddress)
        .then((account) => {
            status.stop();
            console.log('\n')
            console.log(chalk.yellowBright(`Account ID: ${account.accountId}\n`))
            account.balances.forEach((balance) => {
                console.log(chalk.yellowBright(`Asset: ${balance.type === "native" ? config.currency : balance.asset}`))
                console.log(chalk.yellowBright(`Type: ${balance.type}`))
                console.log(chalk.yellowBright(`Balance: ${balance.balance}`))
                console.log('\n')
            });
            checkReserve(accountAddress).then((res) => {
                const subentryCount = res.data.subentry_count;
                const reserve = config.baseReserve * ( 2 + subentryCount)
                console.log(chalk.yellowBright(`Reserve: ${reserve}`))
            })
        })
        .catch((e) => { 
            status.stop();
            console.error(e); throw e
        })
}

module.exports = check;