require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = 3001;

// Configurar Web3
const web3 = new Web3(process.env.GANACHE_URL);

// Leer ABI y dirección del contrato
const contractABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'build/contracts/Voting.json'))).abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Crear una instancia del contrato
const votingContract = new web3.eth.Contract(contractABI, contractAddress);

// Dirección desde la que se enviarán las transacciones
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Middleware para parsear JSON
app.use(express.json());

// Función para registrar un votante
async function registerVoter(voterAddress) {
    const tx = votingContract.methods.registerVoter(voterAddress);
    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const txData = {
        from: account.address,
        to: contractAddress,
        data: data,
        gas,
        gasPrice
    };

    const receipt = await web3.eth.sendTransaction(txData);
    return receipt;
}

// Función que retorna el número de candidatos
async function getCandidatesCount() {
    const candidateCount = await votingContract.methods.getCandidateCount().call({ from: account.address });
    return candidateCount;
}

// Función para emitir un voto
async function vote(candidateIndex) {
    const tx = votingContract.methods.vote(candidateIndex);
    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const txData = {
        from: account.address,
        to: contractAddress,
        data: data,
        gas,
        gasPrice
    };

    const receipt = await web3.eth.sendTransaction(txData);
    return receipt;
}

// Función para retornar un candidato según su índice
async function getCandidateByIndex(candidateIndex) {
    const result = votingContract.methods.getCandidate(candidateIndex).call();
    return result;
}

// Función para finalizar la votación
async function endVoting() {
    const tx = votingContract.methods.endVoting();
    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const txData = {
        from: account.address,
        to: contractAddress,
        data: data,
        gas,
        gasPrice
    };

    const receipt = await web3.eth.sendTransaction(txData);
    return receipt;
}

// Rutas de la API
app.post('/register', async (req, res) => {
    const { voterAddress } = req.body;
    try {
        await registerVoter(voterAddress);
        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering voter');
    }
});

app.post('/vote', async (req, res) => {
    const { candidateIndex } = req.body;
    try {
        const receipt = await vote(candidateIndex);
        console.log("Voto correcto");
        res.send(receipt);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while voting');
    }
});

app.get('/candidateCount', async (req, res) => {
    try {
        const receipt = await getCandidatesCount();
        res.send(receipt);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error obtaining candidate count');
    }
})

app.get('/getCandidateByIndex', async (req, res) => {
    try {
        const receipt = await getCandidateByIndex(req.query.index);
        res.send(receipt.name);
    } catch (error) {
        res.status(500).send('Error obtaining candidate count');
    }
})

app.post('/endVoting', async (req, res) => {
    try {
        const receipt = await endVoting();
        res.send(receipt);
    } catch (error) {
        res.status(500).send('Error ending voting');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});