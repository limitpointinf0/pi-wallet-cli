const conf = new (require('conf'))()
const chalk = require('chalk')
const Stellar = require('stellar-sdk')
var StellarBase = require('stellar-base');
const { TimeoutInfinite } = require('stellar-base');
const bip39 = require('bip39')
const ed25519 =  require('@hawkingnetwork/ed25519-hd-key-rn');
const config = require('../config.json');
const prompt = require('prompt-sync')({ sigint: true });

function txn() {
    //get source account information
    const accountAddress = prompt(chalk.yellowBright('Source Account Address: '));
    const accountPassphrase = prompt(chalk.yellowBright('Source Account Passphrase/PrivateKey: '));

    //get destination account information
    const destAccountAddress = prompt(chalk.yellowBright('Destination Account Address: '));

    //get amount to transfer
    const transferAmt = prompt(chalk.yellowBright('Transer Amt: '));

    //get amount to transfer
    const transferMemo = prompt(chalk.yellowBright('Memo: '));

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
            asset: Stellar.Asset.native(),
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
                    console.log(chalk.green(`Transaction succeeded!\nDestination: ${destAccountAddress}\nAmt: ${transferAmt}\nMemo: ${transferMemo}\nLink: ${tn._links.transaction.href}`))
                }else{
                    console.log(chalk.red('Transaction Failed'))
                }
            })
            .catch((e) => { console.error(e); throw e})
        )
        .catch((e) => { console.error(e); throw e})
    }else {
        // after getting account passphrase run 
        getKeyPairFromPassphrase(accountPassphrase)
        .then((res) => transaction(res)
            .then((tn) => {
                if (tn.successful){
                    console.log(chalk.green(`Transaction succeeded!\nDestination: ${destAccountAddress}\nAmt: ${transferAmt}\nMemo: ${transferMemo}\nLink: ${tn._links.transaction.href}`))
                }else{
                    console.log(chalk.red('Transaction Failed'))
                }
            })
            .catch((e) => { console.error(e); throw e})
        )
        .catch((e) => { console.error(e); throw e})
    }

}

module.exports = txn