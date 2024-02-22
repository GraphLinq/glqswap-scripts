const { ethers } = require('ethers');
const NonfungiblePositionManagerABI = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json').abi;

// Configuration
const providerUrl = 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';
const privateKey = 'YOUR_WALLET_PRIVATE_KEY';
const positionManagerAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'; // Address for the NonfungiblePositionManager

const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const positionManager = new ethers.Contract(positionManagerAddress, NonfungiblePositionManagerABI, wallet);

const tokenId = 'YOUR_NFT_TOKEN_ID'; // The tokenId of your NFT representing the liquidity position

async function collectFees() {
    const collectParams = {
        tokenId: tokenId,
        recipient: wallet.address, // Address to receive the fees
        amount0Max: ethers.constants.MaxUint256, // Collect all available fees for token0
        amount1Max: ethers.constants.MaxUint256, // Collect all available fees for token1
    };

    try {
        const tx = await positionManager.collect(collectParams);
        const receipt = await tx.wait();
        console.log(`Fees collected. Transaction hash: ${receipt.transactionHash}`);
    } catch (error) {
        console.error(`Failed to collect fees: ${error.message}`);
    }
}

collectFees();