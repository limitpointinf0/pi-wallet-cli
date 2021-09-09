#! /usr/bin/env node

const { program } = require('commander')
const check = require('./src/checkAccount')
const payment = require('./src/makePayment')
const assets = require('./src/checkAssets')
const orderbook = require('./src/checkOrderBook')
const purchase = require('./src/purchaseAsset')
const sell = require('./src/sellAsset')
const creatasset = require('./src/createAsset')
const trustline = require('./src/setTrustline')
const createacct = require('./src/createAccount')
const set = require('./src/setAccount')
const unset = require('./src/unsetAccount')
const stream = require('./src/streamActivity')
const uploadFile = require('./src/uploadIPFS')
const config = require('./src/config')
const info = require('./src/info')

program
    .command('config')
    .description('Set Network Configurations')
    .action(config)

program
    .command('set')
    .description('Set an Account')
    .action(set)

program
    .command('unset')
    .description('Unset an Account')
    .action(unset)

program
    .command('check')
    .description('Check Account Balance')
    .action(check)

program
    .command('pay')
    .description('Make a Payment')
    .action(payment)

program
    .command('assets')
    .description('Check all Assets')
    .action(assets) 
    
program
    .command('orderbook')
    .description('Check Order Book')
    .action(orderbook)

program
    .command('trust')
    .description('Create Trustline')
    .action(trustline)

program
    .command('purchase')
    .description('Purchase an Asset')
    .action(purchase)

program
    .command('sell')
    .description('Sell an Asset')
    .action(sell)

program
    .command('createasset')
    .description('Create an Asset')
    .action(creatasset)

program
    .command('createacct')
    .description('Create an Account')
    .action(createacct)

program
    .command('stream')
    .description('Stream Activity')
    .action(stream)

program
    .command('upfile')
    .requiredOption('-f, --file <file>', 'path to file')
    .on("option:file", (file) => {
        process.env["file"] = file;
    })
    .requiredOption('-o, --host <host>', 'host for file [ex. https://ipfs.infura.io:5001]')
    .on("option:host", (host) => {
        process.env["host"] = host;
    })
    .option('-p, --pin', 'pin file')
    .description('Upload a File to IPFS')
    .action(uploadFile)
    
program
    .command('info')
    .description('Info')
    .action(info)

program.parse()