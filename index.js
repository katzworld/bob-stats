//IMPORTS
const express = require('express')
const app = express()
const PORT = 8080
const { readFile } = require('fs').promises;
const fs = require('fs')
const jsonfile = require('jsonfile');
const Web3 = require('web3');
const Contract = require('web3-eth-contract');
const request = require('request');
const response = require('express');
const { nextTick } = require('process');

//SETTINGS
const beginUnlockBlock = 14945840;
const faucetsFile = './faucet.json'
const justIdfile = './id.json'

const ApiCurrentBlock = "https://www.ethercluster.com/etc/mainnet/api?module=block&action=eth_block_number"
const RPC_LINK = "https://www.ethercluster.com/etc";
const web3 = new Web3(RPC_LINK);
const contract_addr = "0x271dc2DF1390a7b319CAE1711A454fa416D6A309";
const sol_abi = [{ "type": "constructor", "stateMutability": "nonpayable", "inputs": [] }, { "type": "event", "name": "Approval", "inputs": [{ "type": "address", "name": "_owner", "internalType": "address", "indexed": true }, { "type": "address", "name": "_spender", "internalType": "address", "indexed": true }, { "type": "uint256", "name": "_value", "internalType": "uint256", "indexed": false }], "anonymous": false }, { "type": "event", "name": "Tokens_returned", "inputs": [{ "type": "address", "name": "_from", "internalType": "address", "indexed": false }, { "type": "uint256", "name": "_value", "internalType": "uint256", "indexed": false }], "anonymous": false }, { "type": "event", "name": "Transfer", "inputs": [{ "type": "address", "name": "_from", "internalType": "address", "indexed": true }, { "type": "address", "name": "_to", "internalType": "address", "indexed": true }, { "type": "uint256", "name": "_value", "internalType": "uint256", "indexed": false }], "anonymous": false }, { "type": "event", "name": "Unlock_Faucet", "inputs": [{ "type": "uint16", "name": "faucet_id", "internalType": "uint16", "indexed": true }, { "type": "uint8", "name": "daily_supply", "internalType": "uint8", "indexed": false }], "anonymous": false }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "add_claim_routers", "inputs": [{ "type": "address[]", "name": "those_addresses", "internalType": "address[]" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "allowance", "inputs": [{ "type": "address", "name": "_owner", "internalType": "address" }, { "type": "address", "name": "_spender", "internalType": "address" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "approve", "inputs": [{ "type": "address", "name": "_spender", "internalType": "address" }, { "type": "uint256", "name": "_value", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "balanceOf", "inputs": [{ "type": "address", "name": "_account", "internalType": "address" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "change_creator", "inputs": [{ "type": "address", "name": "_this_address", "internalType": "address" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "check_tokens", "inputs": [{ "type": "uint16", "name": "_faucet_id", "internalType": "uint16" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "claim_resource", "inputs": [{ "type": "address", "name": "_to", "internalType": "address" }, { "type": "uint16", "name": "_faucet_id", "internalType": "uint16" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "contract_balance", "inputs": [] }, { "type": "function", "stateMutability": "pure", "outputs": [{ "type": "uint8", "name": "", "internalType": "uint8" }], "name": "decimals", "inputs": [] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "string", "name": "", "internalType": "string" }], "name": "name", "inputs": [] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "return_tokens", "inputs": [{ "type": "uint256", "name": "_value", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "string", "name": "", "internalType": "string" }], "name": "symbol", "inputs": [] }, { "type": "function", "stateMutability": "view", "outputs": [{ "type": "uint256", "name": "", "internalType": "uint256" }], "name": "totalSupply", "inputs": [] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "transfer", "inputs": [{ "type": "address", "name": "_to", "internalType": "address" }, { "type": "uint256", "name": "_value", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "transferFrom", "inputs": [{ "type": "address", "name": "_from", "internalType": "address" }, { "type": "address", "name": "_to", "internalType": "address" }, { "type": "uint256", "name": "_value", "internalType": "uint256" }] }, { "type": "function", "stateMutability": "nonpayable", "outputs": [], "name": "unlock_faucet", "inputs": [{ "type": "uint16", "name": "_faucet_id", "internalType": "uint16" }, { "type": "uint256", "name": "_rand_seed", "internalType": "uint256" }] }];
Contract.setProvider(RPC_LINK);
var main_contract = new Contract(sol_abi, contract_addr);

let unlocks = []
    //CALL FUNCTION  --- start and end blocks for needed data ,,, and name of event ("Transref, Unlock_Faucet, etc")
let blocksIDcurrent;


var options = {
    url: ApiCurrentBlock
};

function callApi(error, response, body) {
    if (!error && response.statusCode == 200) {
        blocksIDcurrent = body.result;
        // console.log(blocksIDcurrent);
    }
}


//function that gets events/logs
async function get_events(from_block, to_block, event_name) {
    cleandId = [];
    numers = []
    main_contract.getPastEvents(event_name, {
            fromBlock: from_block,
            toBlock: to_block
        })
        .then(function(events) {
            if (events.length > 0) {
                unlocks = events;
                for (i = 0; i < unlocks.length - 1; i++) {
                    cleandId.push({ "id": parseFloat(unlocks[i].returnValues.faucet_id), "supply": parseFloat(unlocks[i].returnValues.daily_supply), "block": unlocks[i].blockNumber, "txHash": unlocks[i].transactionHash })
                    numers.push(parseFloat(unlocks[i].returnValues.faucet_id))

                    //JSON.parse(fs.readFileSync('./faucet.json', utf8))
                }
                //  jsonfile.writeFile("./unlockedPlots.json", unlocks);
                jsonfile.writeFile(justIdfile, numers);
                jsonfile.writeFile(faucetsFile, cleandId);
            }

        })
}



async function cleanUp() {
    fs.unlinkSync(faucetsFile)
    fs.unlinkSync(justIdfile)

}


//14945840 start #35 london
// get_events(parseFloat(blocksIDcurrent - 5500), blocksIDcurrent, "Unlock_Faucet"); //latest last 
request(options, callApi);
get_events(beginUnlockBlock, blocksIDcurrent, "Unlock_Faucet"); //first => now block


app.get('/', async(request, response) => { //just the plots 
    //  request(options, callApi);
    await get_events(beginUnlockBlock, blocksIDcurrent, "Unlock_Faucet"); //first => now block
    // response.send(await readFile('./faucet.json', 'utf8'));
    response.send(await readFile(justIdfile, 'utf8'));
    await cleanUp()
});

app.get('/full', async(request, response) => { // full dump id plot tx has and block # 
    //  request(options, callApi);
    await get_events(beginUnlockBlock, blocksIDcurrent, "Unlock_Faucet"); //first => now block
    // response.send(await readFile('./faucet.json', 'utf8'));
    response.send(await readFile(faucetsFile, 'utf8'));
    await cleanUp()
});


app.listen(
    PORT,
    () => console.log(`you up on the block ${PORT}`)

)
