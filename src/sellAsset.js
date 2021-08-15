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


function sellToken() {

    console.log(chalk.yellowBright('-----------------------------------------------'))
    console.log(chalk.yellowBright('Pi Wallet CLI'), chalk.magentaBright('Sell Asset'))
    console.log(chalk.yellowBright('-----------------------------------------------'), '\n')

    //get source account information
    var accountAddress = config.my_address
    if (!accountAddress){
        var accountAddress = prompt(chalk.yellowBright('Source Account Address: '));
    }
    const accountPassphrase = prompt(chalk.yellowBright('Source Account Passphrase/PrivateKey: '));

    //get asset information
    const assetName = prompt(chalk.yellowBright('Asset Name to Sell: '));
    const assetAmount = prompt(chalk.yellowBright('Amount of Asset to Sell: '));
    const assetOffer = prompt(chalk.yellowBright('Buying Asset (blank for native): '));
    const assetPrice = prompt(chalk.yellowBright('Price per unit: '));
    const buyIssuerAddress = prompt(chalk.yellowBright('Buy Issuer Account Address: '));
    const sellIssuerAddress = prompt(chalk.yellowBright('Sell Issuer Account Address: '));

    //ask confirmation
    prompt(chalk.yellowBright('Press Enter to Finalize and Submit...'));

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

    //building transaction function
    const transaction = async (keypair) => {

        const customAsset = new Stellar.Asset(assetName, buyIssuerAddress);
        const buyingAsset = (assetOffer) ? new Stellar.Asset(assetOffer, sellIssuerAddress) : Stellar.Asset.native()
        
        const txOptions = {
            fee: await server.fetchBaseFee(),
            networkPassphrase: config.networkPassphrase,
        }
        const changeTrustOpts = {
            asset: buyingAsset
        };
        const manageSellOfferOpts = {
            selling: customAsset,
            buying: buyingAsset,
            amount: assetAmount,
            price: assetPrice
        };

        const sellerAccount = await server.loadAccount(accountAddress)
        const transaction = new Stellar.TransactionBuilder(sellerAccount, txOptions)
            .addOperation(Stellar.Operation.changeTrust(changeTrustOpts))
            .addOperation(Stellar.Operation.manageSellOffer(manageSellOfferOpts))
            .setTimeout(0)
            .build();

        transaction.sign(keypair)

        const response = await server.submitTransaction(transaction)
        return response
    }

    var getKeyPair;
    if (StellarBase.StrKey.isValidEd25519SecretSeed(accountPassphrase)) {
        getKeyPair = getKeyPairFromSecret;
    } 
    else {
        getKeyPair = getKeyPairFromPassphrase;
    }

    getKeyPair(accountPassphrase)
    .then((res) => transaction(res)
        .then((tn) => {
            status.stop();
            if (tn.successful){
                console.log(chalk.yellowBright('\nSell Offer Created'))
            }else{
                console.log(chalk.red('\nTransaction Failed'))
            }
        })
        .catch(fail)
    )
    .catch((e) => {status.stop(); console.error(e); throw e})

}

module.exports = sellToken