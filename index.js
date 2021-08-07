#! /usr/bin/env node

const { program } = require('commander')
const check = require('./src/checkAccount')
const txn = require('./src/makeTransfer')
const purchase = require('./src/purchaseToken')
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
    .command('transfer')
    .description('Make a Transfer')
    .action(txn)

program
    .command('trust')
    .description('Create Trustline')
    .action(trustline)

program
    .command('purchase')
    .description('Purchase an Asset')
    .action(purchase)

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