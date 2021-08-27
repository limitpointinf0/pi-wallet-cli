const chalk = require('chalk')
const Stellar = require('stellar-sdk')
var StellarBase = require('stellar-base');
const config = require('../config.json');
const piLib = require('./piLib');
const prompt = require('prompt-sync')({ sigint: true });
const CLI = require('clui');
const Spinner = CLI.Spinner;

function makePayment() {

    piLib.createBanner('Make Payment');

    //get source account information
    const accountAddress = (config.my_address) ? config.my_address : prompt(chalk.yellowBright('Source Account Address: '));
    const accountPassphrase = prompt(chalk.yellowBright('Source Account Passphrase/PrivateKey: '));
    //get destination account information
    const destAccountAddress = prompt(chalk.yellowBright('Destination Account Address: '));
    //get asset to transfer
    const assetName = prompt(chalk.yellowBright('Asset (blank for native): '));
    const issuerAddress = prompt(chalk.yellowBright('Asset Issuer (blank for native): '));
    //get amount to transfer
    const transferAmt = prompt(chalk.yellowBright('Transfer Amt: '));
    //get memo to transfer
    const transferMemo = prompt(chalk.yellowBright('Memo (optional): '));
    //ask confirmation
    prompt(chalk.yellowBright('Press Enter to Finalize and Submit...'));

    //validate
    if (!StellarBase.StrKey.isValidEd25519PublicKey(destAccountAddress)) {
        console.log(chalk.red('Not a valid destination address'))
        process.exit(1);
    }
    var transferAsset;
    if(assetName && issuerAddress) {
        transferAsset = new Stellar.Asset(assetName, issuerAddress);
    }else if ((assetName && !issuerAddress) || (!assetName && issuerAddress)) {
        throw "For sending assets, both asset name and issuer address must be set!"
    }else{
        transferAsset = Stellar.Asset.native();
    }
    
    const status = new Spinner('Making transaction, please wait...');
    status.start();

    //create server object
    const server = new Stellar.Server(config.server)

    const getKeyPair = (StellarBase.StrKey.isValidEd25519SecretSeed(accountPassphrase)) ? piLib.getKeyPairFromSecret : piLib.getKeyPairFromPassphrase;

    const fail = (message) => {
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

    const success = (tn) => {
        status.stop();
        if (tn.successful){
            console.log(chalk.magentaBright(`\nTransaction succeeded!\nDestination: ${destAccountAddress}\nAmt: ${transferAmt}\nMemo: ${transferMemo}\nLink: ${tn._links.transaction.href}`))
        }else{
            console.log(chalk.red('\nTransaction Failed'))
        }
    }

    //building transaction function
    const transaction = async () => {

        const keypair = await getKeyPair(accountPassphrase)

        const paymentToDest = {
            destination: destAccountAddress,
            asset: transferAsset,
            amount: transferAmt,
        }
        const txOptions = {
            fee: await server.fetchBaseFee(),
            networkPassphrase: config.networkPassphrase,
        }
        const accountA = await server.loadAccount(accountAddress)
        const transaction = new Stellar.TransactionBuilder(accountA, txOptions)
            .addOperation(Stellar.Operation.payment(paymentToDest))
            .addMemo(Stellar.Memo.text(transferMemo))
            .setTimeout(StellarBase.TimeoutInfinite)
            .build()

        transaction.sign(keypair)

        const response = await server.submitTransaction(transaction)
        return response

    }
    
    transaction().then(success).catch(fail)

}

module.exports = makePayment;