const mongoose = require('mongoose');
const { config } = require('dotenv');
const { readFileSync } = require('node:fs')
const { Web3 } = require('web3');
const path = require('node:path');

config({ path: '' })

const configs = {};

configs.initDB = async () => {
    await mongoose.connect(process.env.DB_URI)
}

configs.initBC = async () => {
    try {
        const web3 = new Web3(process.env.GANACHE_URL);

        global.ganache = web3;

        // Leer ABI y dirección del contrato
        const contractABI = JSON.parse(readFileSync('build/contracts/Voting.json')).abi;
        const contractAddress = process.env.CONTRACT_ADDRESS;

        // Crear una instancia del contrato
        global.votingContract = new web3.eth.Contract(contractABI, contractAddress);

        // Dirección desde la que se enviarán las transacciones
        global.account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);
    } catch (error) {
        console.log(error)
    }
    // Configurar Web3
}

module.exports = configs;