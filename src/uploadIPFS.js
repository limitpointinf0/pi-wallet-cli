const fs = require("fs");
const { create } = require('ipfs-http-client');
const prompt = require('prompt-sync')({ sigint: true });
const chalk = require('chalk');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const piLib = require('./piLib');

function uploadFile(options) {

    piLib.createBanner('IPFS Upload');

    const pin = options.pin ? true : false;
    
    console.log(chalk.yellowBright(`File: ${options.file}`));
    console.log(chalk.yellowBright(`Host: ${options.host}`));
    console.log(chalk.yellowBright(`Pin: ${pin}`));
    console.log('\n');
    //ask confirmation
    prompt(chalk.yellowBright('Press Enter to Finalize and Submit...'));

    const client = create(options.host);
    const file = fs.readFileSync(options.file)

    const status = new Spinner('Uploading to IPFS');
    status.start();

    client.add(file, { pin: pin })
    .then(result => {
        console.log('\n');
        console.log(chalk.yellowBright(`Path: ${result.path}`));
        console.log(chalk.yellowBright(`URL: https://ipfs.io/ipfs/${result.path}`));
        console.log(chalk.yellowBright(`Size: ${result.size}`));
        status.stop();
    })
    .catch(error => {
        console.log('\n');
        console.error(error); 
        status.stop();
    })
}
  
module.exports = uploadFile