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

function create() {

    piLib.createBanner('Create Account');

    //prepare keypairs for new wallet
    const newKeypair = Stellar.Keypair.random()
    const newWallet =  {
        secretSeed: newKeypair.secret(),
        publicKey: newKeypair.publicKey(),
    }
    //get source account information
    var accountAddress = config.my_address
    if (!accountAddress){
        var accountAddress = prompt(chalk.yellowBright('Source Account Address: '));
    }
    const accountPassphrase = prompt(chalk.yellowBright('Source Account Passphrase/PrivateKey: '));
    const fundAmt = prompt(chalk.yellowBright('Funding Amt: '));

    //ask confirmation
    prompt(chalk.yellowBright('Press Enter to Finalize and Submit...'));

    const status = new Spinner('Creating account, please wait...');
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
        if (message.response && message.response.data && message.response.data.extras && message.response.data.extras.result_codes && (message.response.data.extras.result_codes.operations || message.response.data.extras.result_codes.transaction)) {
            const reason = message.response.data.extras.result_codes.operations;
            const txnreason = message.response.data.extras.result_codes.transaction;
            switch(reason) {
                case 'op_underfunded':
                    console.log(chalk.red('reason:', 'Sender account has insufficient funds'));
                    break;
                default:
                    console.log(chalk.red('reason:', reason))
                    console.log(chalk.red('txn reason:', txnreason))
            }
        }
        process.exit(1)
    }

    //building transaction function
    const transaction = async (keypair) => {

        const createAccountB = {
            destination: newWallet.publicKey,
            startingBalance: fundAmt,
        }
        const txOptions = {
            fee: await server.fetchBaseFee(),
            networkPassphrase: config.networkPassphrase,
        }
        const accountA = await server.loadAccount(accountAddress)
        const transaction = new Stellar.TransactionBuilder(accountA, txOptions)
            .addOperation(Stellar.Operation.createAccount(createAccountB))
            .addMemo(Stellar.Memo.text('Create New Wallet'))
            .setTimeout(TimeoutInfinite)
            .build()
        
        transaction.sign(keypair)

        await server.submitTransaction(transaction)

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
        .then(() => {
            console.log(chalk.yellowBright(`\nNew Wallet Created!\nPrivate Key: ${newWallet.secretSeed}\nPublic Key: ${newWallet.publicKey}`))
            status.stop();
        })
        .catch(fail)
    )
    .catch((e) => { status.stop(); console.error(e); throw e})

}

module.exports = create