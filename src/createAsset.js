const conf = new (require('conf'))()
const chalk = require('chalk')
const Stellar = require('stellar-sdk')
var StellarBase = require('stellar-base');
const { TimeoutInfinite } = require('stellar-base');
const bip39 = require('bip39')
const ed25519 =  require('@hawkingnetwork/ed25519-hd-key-rn');
const config = require('../config.json');
const piLib = require('./piLib');
const prompt = require('prompt-sync')({ sigint: true });
const CLI = require('clui');
const Spinner = CLI.Spinner;


function main() {
    
    piLib.createBanner('Create Asset');

    var context = {};

    //create server object
    context.server = new Stellar.Server(config.server)

    //get issuer account information
    context.issuerAccountAddress = prompt(chalk.yellowBright('Issuer Account Address: '));
    context.issuerAccountPass = prompt(chalk.yellowBright('Issuer Account Passphrase/PrivateKey: '));

    //get distributor account information
    context.distributorAccountAddress = prompt(chalk.yellowBright('Distributor Account Address: '));
    context.distributorAccountPass = prompt(chalk.yellowBright('Distributor Account Passphrase/PrivateKey: '));

    //get asset information
    context.assetName = prompt(chalk.yellowBright('Asset Name: '));
    context.customAsset = new Stellar.Asset(context.assetName, context.issuerAccountAddress);
    context.assetAmount = prompt(chalk.yellowBright('Asset Amount: '));
    context.assetInfo = prompt(chalk.yellowBright('Asset Info Domain: '));
    context.dataoptsName = prompt(chalk.yellowBright('Asset Data [name]: '));
    context.dataoptsVal = prompt(chalk.yellowBright('Asset Data [value]: '));

    //helper function to return Key Pair from Passphrase
    const getKeyPairFromPassphrase = async function (passphrase) {
        const seed = await bip39.mnemonicToSeed(passphrase)
        const derivedSeed = ed25519.derivePath("m/44'/314159'/0'", seed)
        return Stellar.Keypair.fromRawEd25519Seed(derivedSeed.key)
    }
    //helper function to return KeyPair from Private Key
    const getKeyPairFromSecret = async function (secret) {
        return Stellar.Keypair.fromSecret(secret)
    }
    context.getIssuerKeyPair = (StellarBase.StrKey.isValidEd25519SecretSeed(context.issuerAccountPass)) ? getKeyPairFromSecret : getKeyPairFromPassphrase;
    context.getDistributorKeyPair = (StellarBase.StrKey.isValidEd25519SecretSeed(context.distributorAccountPass)) ? getKeyPairFromSecret : getKeyPairFromPassphrase;
    context.fail = (message) => {
        console.log('\n')
        console.error(chalk.red(message))
        if (message.response && message.response.data && message.response.data.extras && message.response.data.extras.result_codes && message.response.data.extras.result_codes.operations) {
            const reason = message.response.data.extras.result_codes.operations;
            switch(reason) {
                case 'op_underfunded':
                    console.log(chalk.red('reason:', 'Sender account has insufficient funds'));
                    break;
                default:
                    console.log(chalk.red('reason:', reason))
            }
        }
        process.exit(1)
    }
    context.success = (tn) => {
        if (tn.successful){
            console.log(chalk.magentaBright('Ok'))
        }else{
            console.log(chalk.magentaBright('\nSomething went wrong'))
        }
    }

    //steps
    createTrustline(context).then((message) => {
        context.success(message);
        createAsset(context).then((message) => {
            context.success(message);
            lockIssuer(context).then(context.success).catch(context.fail)
        }).catch(context.fail)
    }).catch(context.fail)
}


async function createTrustline(context) {
    prompt(chalk.yellowBright('Press Enter to Create Trustline...'));

    //prepare options for creating trustline
    var changeTrustOpts = {
        asset: context.customAsset
    };

    const txOptions = {
        fee: await context.server.fetchBaseFee(),
        networkPassphrase: config.networkPassphrase,
    };

    const distributorKeypair = await context.getDistributorKeyPair(context.distributorAccountPass)
    const distributorAccount = await context.server.loadAccount(context.distributorAccountAddress);
    const transaction = new Stellar.TransactionBuilder(distributorAccount, txOptions)
        .addOperation(Stellar.Operation.changeTrust(changeTrustOpts))
        .setTimeout(0)
        .build();
    transaction.sign(distributorKeypair);

    const response = await context.server.submitTransaction(transaction)
    return response
}

async function createAsset(context) {
    prompt(chalk.yellowBright('Press Enter to Create Asset...'));

    const txOptions = {
        fee: await context.server.fetchBaseFee(),
        networkPassphrase: config.networkPassphrase,
    };
    const paymentOpts = {
        asset: context.customAsset,
        destination: context.distributorAccountAddress,
        amount: context.assetAmount
    };
    const manageDataOpts = {
        name: context.dataoptsName,
        value: context.dataoptsVal,
    };
    const assetInfo = {
        homeDomain: context.assetInfo
    }

    const issuerKeypair = await context.getIssuerKeyPair(context.issuerAccountPass)
    const issuerAccount = await context.server.loadAccount(context.issuerAccountAddress);
    const transaction = new Stellar.TransactionBuilder(issuerAccount, txOptions)
        .addOperation(Stellar.Operation.setOptions(assetInfo))
        .addOperation(Stellar.Operation.manageData(manageDataOpts))
        .addOperation(Stellar.Operation.payment(paymentOpts))
        .setTimeout(0)
        .build();
    transaction.sign(issuerKeypair);

    const response = await context.server.submitTransaction(transaction)
    return response
}

async function lockIssuer(context) {
    prompt(chalk.yellowBright('Press Enter to Lock Issuer...'));

    const txOptions = {
        fee: await context.server.fetchBaseFee(),
        networkPassphrase: config.networkPassphrase,
    };
    
    const thresholds = {
        masterWeight: 0, // issuing account private key signature counts for 0, no rights :)
        lowThreshold: 0,
        medThreshold: 0,
        highThreshold: 0 // no more transaction on this account anymore !
    };

    const issuerKeypair = await context.getIssuerKeyPair(context.issuerAccountPass)
    const issuerAccount = await context.server.loadAccount(context.issuerAccountAddress);
    const transaction = new Stellar.TransactionBuilder(issuerAccount, txOptions)
        .addOperation(Stellar.Operation.setOptions(thresholds))
        .setTimeout(0)
        .build();
    transaction.sign(issuerKeypair);

    const response = await context.server.submitTransaction(transaction)
    return response
}
module.exports = main