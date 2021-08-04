#! /usr/bin/env node

const { program } = require('commander')
const check = require('./commands/checkAccount')
const txn = require('./commands/makeTransfer')
const purchase = require('./commands/purchaseToken')
const create = require('./commands/createAccount')
const set = require('./commands/setAccount')
const unset = require('./commands/unsetAccount')
const stream = require('./commands/streamActivity')

program
    .command('check')
    .description('Check Account Balance')
    .action(check)

program
    .command('transfer')
    .description('Make a Transfer')
    .action(txn)

program
    .command('purchase')
    .description('Purchase an Asset')
    .action(purchase)

program
    .command('create')
    .description('Create an Account')
    .action(create)

program
    .command('set')
    .description('Set an Account')
    .action(set)

program
    .command('unset')
    .description('Unset an Account')
    .action(unset)

program
    .command('stream')
    .description('Stream Activity')
    .action(stream)

program.parse()