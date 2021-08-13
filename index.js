#! /usr/bin/env node

const { program } = require('commander')
const check = require('./src/checkAccount')
const payment = require('./src/makePayment')
const assets = require('./src/checkAssets')
const orderbook = require('./src/checkOrderBook')
const purchase = require('./src/purchaseAsset')
const sell = require('./src/sellAsset')
const trustline = require('./src/setTrustline')
const create = require('./src/createAccount')
const set = require('./src/setAccount')
const unset = require('./src/unsetAccount')
const stream = require('./src/streamActivity')
const info = require('./src/info')

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
    .command('create')
    .description('Create an Account')
    .action(create)

program
    .command('stream')
    .description('Stream Activity')
    .action(stream)

program
    .command('info')
    .description('Info')
    .action(info)

program.parse()