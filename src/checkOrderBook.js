const conf = new (require('conf'))()
const axios = require('axios');
const config = require('../config.json');
const piLib = require('./piLib');
const prompt = require('prompt-sync')({ sigint: true });
const chalk = require('chalk');

function checkOrderBook() {

    piLib.createBanner('Check Order Book');

    //prompt for query parameters
    var reqUrl = config.server + '/order_book?'
    const sellingAssetType = prompt(chalk.yellowBright('Selling Asset Type (native,credit_alphanum4,credit_alphanum12): '));
    const buyingAssetType = prompt(chalk.yellowBright('Buying Asset Type (native,credit_alphanum4,credit_alphanum12): '));
    const sellingAssetIssuer = prompt(chalk.yellowBright('Selling Asset Issuer (optional): '));
    const sellingAssetCode = prompt(chalk.yellowBright('Selling Asset Code (optional): '));
    const buyingAssetIssuer = prompt(chalk.yellowBright('Buying Asset Issuer (optional): '));
    const buyingAssetCode = prompt(chalk.yellowBright('Buying Asset Code (optional): '));

    //ask confirmation
    prompt(chalk.yellowBright('Press Enter to Finalize and Submit...'));

    //validate
    if (sellingAssetType != 'native' && !(sellingAssetIssuer && sellingAssetCode)){
        console.log(chalk.red('If selling asset type is not native, then you must specify selling asset issuer and selling asset code'))
        process.exit(1);
    }
    if (buyingAssetType != 'native' && !(buyingAssetIssuer && buyingAssetCode)){
        console.log(chalk.red('If selling asset type is not native, then you must specify selling asset issuer and selling asset code'))
        process.exit(1);
    }

    //adjust request URL
    reqUrl += sellingAssetType ? `&selling_asset_type=${sellingAssetType}` : '';
    reqUrl += buyingAssetType ? `&buying_asset_type=${buyingAssetType}` : '';
    reqUrl += sellingAssetIssuer ? `&selling_asset_issuer=${sellingAssetIssuer}` : '';
    reqUrl += sellingAssetCode ? `&selling_asset_code=${sellingAssetCode}` : '';
    reqUrl += buyingAssetIssuer ? `&buying_asset_issuer=${buyingAssetIssuer}` : '';
    reqUrl += buyingAssetCode ? `&buying_asset_code=${buyingAssetCode}` : '';

    const processData = (res) => {
        const bids = res.data.bids;
        const asks = res.data.asks;
        const base = res.data.base;

        console.log(chalk.yellowBright(`\n`));
        console.log(chalk.yellowBright(`Asset Code: ${base.asset_code}`));
        console.log(chalk.yellowBright(`Asset Issuer: ${base.asset_issuer}`));
        console.log(chalk.yellowBright(`Asset Type: ${base.asset_type}`));

        console.log(chalk.magentaBright(`\nBids`));
        bids.forEach((bid) => {
            console.log(chalk.yellowBright(`\n`));
            console.log(chalk.yellowBright(`Price: ${bid.price}`));
            console.log(chalk.yellowBright(`Amount: ${bid.price}`));
            console.log(chalk.yellowBright(`Precise Price Numerator: ${bid.price_r.n}`));
            console.log(chalk.yellowBright(`Precise Price Denominator: ${bid.price_r.d}`));
            console.log(chalk.yellowBright(`\n`));
        })

        console.log(chalk.magentaBright(`\nAsks`));
        asks.forEach((ask) => {
            console.log(chalk.yellowBright(`\n`));
            console.log(chalk.yellowBright(`Price: ${ask.price}`));
            console.log(chalk.yellowBright(`Amount: ${ask.price}`));
            console.log(chalk.yellowBright(`Precise Price Numerator: ${ask.price_r.n}`));
            console.log(chalk.yellowBright(`Precise Price Denominator: ${ask.price_r.d}`));
            console.log(chalk.yellowBright(`\n`));
        })
    }

    const assetsFetch = async (reqUrl) => {
        axios.get(reqUrl)
        .then((res) => {
            var nav = processData(res)
        })
        .catch((e) => {throw e;})
    }

    assetsFetch(reqUrl);
}

module.exports = checkOrderBook;
