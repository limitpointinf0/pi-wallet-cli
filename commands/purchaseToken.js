const conf = new (require('conf'))()
const chalk = require('chalk')
const Stellar = require('stellar-sdk')
var StellarBase = require('stellar-base');
const { TimeoutInfinite } = require('stellar-base');
const bip39 = require('bip39')
const ed25519 =  require('@hawkingnetwork/ed25519-hd-key-rn');
const config = require('../config.json');
const prompt = require('prompt-sync')({ sigint: true });
const CLI = require('clui');
const Spinner = CLI.Spinner;


function purchaseToken() {
    //get source account information
    var accountAddress = config.my_address
    if (!accountAddress){
        var accountAddress = prompt(chalk.yellowBright('Source Account Address: '));
    }
    const accountPassphrase = prompt(chalk.yellowBright('Source Account Passphrase/PrivateKey: '));

    //get asset information
    const assetName = prompt(chalk.yellowBright('Asset Name: '));
    const assetAmount = prompt(chalk.yellowBright('Amount of Asset: '));
    const assetPrice = prompt(chalk.yellowBright('Price of Asset: '));
    const issuerAddress = prompt(chalk.yellowBright('Issuer Account Address: '));

    const status = new Spinner('Making transaction, please wait...');
    status.start();

    //create server object
    const server = new Stellar.Server(config.server)

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

    //building transaction function
    const transaction = async (keypair) => {

        const customAsset = new Stellar.Asset(assetName, issuerAddress);

        const txOptions = {
            fee: await server.fetchBaseFee(),
            networkPassphrase: config.networkPassphrase,
        }
        const changeTrustOpts = {
            asset: customAsset
        };
        const manageSellOfferOpts = {
            selling: Stellar.Asset.native(),
            buying: customAsset,
            amount: assetAmount,
            price: assetPrice
        };
        const buyerAccount = await server.loadAccount(accountAddress)
        const transaction = new Stellar.TransactionBuilder(buyerAccount, txOptions)
            .addOperation(Stellar.Operation.changeTrust(changeTrustOpts))
            .addOperation(Stellar.Operation.manageSellOffer(manageSellOfferOpts))
            .setTimeout(0)
            .build();

        transaction.sign(keypair)

        const response = await server.submitTransaction(transaction)
        return response
    }

    if (StellarBase.StrKey.isValidEd25519SecretSeed(accountPassphrase)) {
        getKeyPairFromSecret(accountPassphrase)
        .then((res) => transaction(res)
            .then((tn) => {
                if (tn.successful){
                    status.stop();
                    console.log(tn)
                }else{
                    status.stop();
                    console.log(chalk.red('\nTransaction Failed'))
                }
            })
            .catch((e) => {status.stop(); console.error(e); throw e})
        )
        .catch((e) => {status.stop(); console.error(e); throw e})
    }else {
        // after getting account passphrase run 
        getKeyPairFromPassphrase(accountPassphrase)
        .then((res) => transaction(res)
            .then((tn) => {
                if (tn.successful){
                    console.log(tn)
                    status.stop();
                }else{
                    console.log(chalk.red('\nTransaction Failed'))
                    status.stop();
                }
            })
            .catch((e) => { status.stop(); console.error(e); throw e})
        )
        .catch((e) => { status.stop(); console.error(e); throw e})
    }

}

module.exports = purchaseToken