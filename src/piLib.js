const Stellar = require('stellar-sdk')
const chalk = require('chalk')
const bip39 = require('bip39')
const ed25519 =  require('@hawkingnetwork/ed25519-hd-key-rn');

/**
 * Console logs banner.
 *
 * @param {String} title The title for the banner.
 */
const createBanner = function(title){
    console.log(chalk.yellowBright('-----------------------------------------------'))
    console.log(chalk.yellowBright('Pi Wallet CLI'), chalk.magentaBright(title))
    console.log(chalk.yellowBright('-----------------------------------------------'), '\n')
}

/**
 * Takes passphrase and returns Ed25519 keypair.
 *
 * @param {String} passphrase Passphrase to convert to keypair
 */
const getKeyPairFromPassphrase = async function (passphrase) {
    const seed = await bip39.mnemonicToSeed(passphrase)
    const derivedSeed = ed25519.derivePath("m/44'/314159'/0'", seed)
    return Stellar.Keypair.fromRawEd25519Seed(derivedSeed.key)
}

/**
 * Returns keypair from secret.
 *
 * @param {String} passphrase Passphrase to convert to keypair
 */
const getKeyPairFromSecret = async function (passphrase) {
    return Stellar.Keypair.fromSecret(passphrase)
}

/**
 * Logs failure reasons from Horizon.
 *
 * @param {Object} message Returned message from Horizon
 */
const txnFail = (message) => {
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

/**
 * Logs success from Horizon.
 *
 * @param {Object} tn Logs success from Horizon
 */
const txnSuccess = (tn) => {
    if (tn.successful){
        console.log(chalk.magentaBright(`\nTransaction succeeded!\nDestination: ${destAccountAddress}\nAmt: ${transferAmt}\nMemo: ${transferMemo}\nLink: ${tn._links.transaction.href}`))
    }else{
        console.log(chalk.red('\nTransaction Failed'))
    }
}


module.exports = {
    createBanner:               createBanner,
    getKeyPairFromPassphrase:   getKeyPairFromPassphrase,
    getKeyPairFromSecret:       getKeyPairFromSecret,
    txnFail:                    txnFail,
    txnSuccess:                 txnSuccess
};