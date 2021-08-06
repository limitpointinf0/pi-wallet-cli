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

function txn() {
    //get source account information
    var accountAddress = config.my_address
    if (!accountAddress){
        var accountAddress = prompt(chalk.yellowBright('Source Account Address: '));
    }
    const accountPassphrase = prompt(chalk.yellowBright('Source Account Passphrase/PrivateKey: '));

    //get destination account information
    const destAccountAddress = prompt(chalk.yellowBright('Destination Account Address: '));

    //get asset to transfer
    const assetName = prompt(chalk.yellowBright('Asset (blank for native): '));
    const issuerAddress = prompt(chalk.yellowBright('Asset Issuer (blank for native): '));
    var transferAsset;
    if(assetName && issuerAddress) {
        transferAsset = new Stellar.Asset(assetName, issuerAddress);
    }else if ((assetName && !issuerAddress) || (!assetName && issuerAddress)) {
        throw "For sending assets, both asset name and issuer address must be set!"
    }else{
        transferAsset = Stellar.Asset.native();
    }

    //get amount to transfer
    const transferAmt = prompt(chalk.yellowBright('Transfer Amt: '));

    //get memo to transfer
    const transferMemo = prompt(chalk.yellowBright('Memo: '));

    
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

        const paymentToDest = {
            destination: destAccountAddress,
            asset: transferAsset,
            amount: transferAmt, // Notice the use of the type string here
        }
        const txOptions = {
            fee: await server.fetchBaseFee(),
            networkPassphrase: config.networkPassphrase,
        }
        const accountA = await server.loadAccount(accountAddress)
        const transaction = new Stellar.TransactionBuilder(accountA, txOptions)
            .addOperation(Stellar.Operation.payment(paymentToDest))
            .addMemo(Stellar.Memo.text(transferMemo))
            .setTimeout(TimeoutInfinite)
            .build()

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
                    console.log(chalk.green(`\nTransaction succeeded!\nDestination: ${destAccountAddress}\nAmt: ${transferAmt}\nMemo: ${transferMemo}\nLink: ${tn._links.transaction.href}`))
                }else{
                    status.stop();
                    console.log(chalk.red('\nTransaction Failed'))
                }
            })
            .catch((e) => {
                status.stop();
                if (e.response){
                    var displayError = e.response.statusText
                    console.log(e.response.data.extras.result_codes);
                    throw displayError;
                }
            })
        )
        .catch((e) => {status.stop(); console.error(e); throw e})
    }else {
        // after getting account passphrase run 
        getKeyPairFromPassphrase(accountPassphrase)
        .then((res) => transaction(res)
            .then((tn) => {
                if (tn.successful){
                    console.log(chalk.green(`\nTransaction succeeded!\nDestination: ${destAccountAddress}\nAmt: ${transferAmt}\nMemo: ${transferMemo}\nLink: ${tn._links.transaction.href}`))
                    status.stop();
                }else{
                    console.log(chalk.red('\nTransaction Failed'))
                    status.stop();
                }
            })
            .catch((e) => { 
                status.stop();
                if (e.response){
                    var displayError = e.response.statusText
                    console.log(e.response.data.extras.result_codes);
                    throw displayError;
                }
            })
        )
        .catch((e) => { status.stop(); console.error(e); throw e})
    }

}

module.exports = txn