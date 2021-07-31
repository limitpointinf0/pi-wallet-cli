#! /usr/bin/env node

const { program } = require('commander')
const check = require('./commands/checkAccount')
const txn = require('./commands/makeTransfer')
const create = require('./commands/createAccount')

program
    .command('check')
    .description('Check Account Balance')
    .action(check)

program
    .command('transfer')
    .description('Make a Transfer')
    .action(txn)

program
    .command('create')
    .description('Create an Account')
    .action(create)


program.parse()