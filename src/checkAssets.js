const conf = new (require('conf'))()
const axios = require('axios');
const config = require('../config.json');
const piLib = require('./piLib');
const prompt = require('prompt-sync')({ sigint: true });
const chalk = require('chalk');

function checkAssets() {

    piLib.createBanner('Check Assets');

    var reqUrl = config.server + '/assets?limit=3'
    const assetCode = prompt(chalk.yellowBright('Asset Code (optional): '));
    const assetIssuer = prompt(chalk.yellowBright('Asset Issuer (optional): '));

    reqUrl += assetCode ? `&asset_code=${assetCode}` : '';
    reqUrl += assetIssuer ? `&asset_issuer=${assetIssuer}` : '';

    const processData = (res) => {
        const assetRecords = res.data._embedded.records;
        assetRecords.forEach((asset) => {
            console.log(chalk.yellowBright(`\n`));
            console.log(chalk.yellowBright(`Asset Code: ${asset.asset_code}`));
            console.log(chalk.yellowBright(`Asset Type: ${asset.asset_type}`));
            console.log(chalk.yellowBright(`Asset Issuer: ${asset.asset_issuer}`));
            console.log(chalk.yellowBright(`Amount: ${asset.amount}`));
            console.log(chalk.yellowBright(`Num Accounts: ${asset.num_accounts}`));
            console.log(chalk.yellowBright(`Toml: ${asset._links.toml.href}`));
            console.log(chalk.yellowBright(`\n`));
        })
        return {
            next: res.data._links.next.href,
            prev: res.data._links.prev.href,
            self: res.data._links.self.href
        }
    }

    const assetsFetch = async (reqUrl) => {
        axios.get(reqUrl)
        .then((res) => {
            var nav = processData(res)
            const choice = prompt(chalk.yellowBright('n (next), b (back): '));
            if (choice == 'n') {
                assetsFetch(nav.next)
            }
            else if (choice == 'b') {
                assetsFetch(nav.prev)
            }
            else {
                assetsFetch(nav.self)
            }
        })
        .catch((e) => {throw e;})
    }

    assetsFetch(reqUrl);
}

module.exports = checkAssets;
