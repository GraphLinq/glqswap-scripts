const { ethers } = require('ethers');

const { Token } = require('@uniswap/sdk-core')
const { abi: SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json');
const { abi: QuoterABI } = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');
const { abi: QuoterV2ABI } = require('@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json');

const { abi: SWAP_ROUTER_ABI } = require('@intrinsic-network/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json')

//const { abi: SwapRouter02ABI } = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json');


const tokenB = new Token(614, "0xbeED106D0f2e6950BFa1Eec74E1253CA0a643442", 18, "WETH", "Wrapped Ethereum");
const tokenA = new Token(614, "0xEB567ec41738c2bAb2599A1070FC5B727721b3B6", 18, "WGLQ", "Wrapped Graphlinq GLQ");

// Configuration
const providerUrl = 'https://glq-dataseed.graphlinq.io'; // Change to your Infura project ID
const privateKey = '';
// Initialize ethers provider and wallet
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const SWAP_ROUTER_ADDRESS = '0x47AB4F709b5C250026C4DA83cde56fc2C81a311c';
const QUOTER_ADDRESS = '0x287a7beF47684D388fa56BFaB859501f9e515B9D';
const fee = 10000 // 1% pool fee

// Example function to quote a swap
async function quoteSwap(inputToken, outputToken, amountIn) {
    const quoter = new ethers.Contract(QUOTER_ADDRESS, QuoterV2ABI, wallet);
    const amountInFormatted = ethers.utils.parseUnits(amountIn.toString(), 'ether'); // Adjust for token decimals
    console.log(amountInFormatted.toString())

    const parameters = {
        tokenIn: inputToken,
        tokenOut: outputToken,
        fee: fee,
        amountIn: amountInFormatted,
        sqrtPriceLimitX96: "0"
    };
    try {
        const amountOut = await quoter.callStatic.quoteExactInputSingle(parameters);
        return ethers.utils.formatEther((amountOut[0]));
    } catch (error) {
        console.error('Failed to quote swap:', error);
    }
}

async function executeSwap(inputToken, outputToken, amountIn, recipient) {
    const swapRouter = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, wallet);
    const amountInFormatted = ethers.utils.parseUnits(amountIn.toString(), 'ether');
  
    const params = {
      tokenIn: inputToken,
      tokenOut: outputToken,
      fee: fee,
      recipient: recipient,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: amountInFormatted,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };
  
    try {
      const tx = await swapRouter.exactInputSingle(params);
      const receipt = await tx.wait();
      console.log(`Swap executed, transaction hash: ${receipt.transactionHash}`);
    } catch (error) {
      console.error('Failed to execute swap:', error);
    }
  }

(async () => {
    const toSwap = 10
    const amount = await quoteSwap(tokenA.address, tokenB.address, toSwap); // Quote for swapping 1 tokenA to tokenB
    console.log(`Swapping ${toSwap} WGLQ will get us ${amount} WETH`)
    //await executeSwap(tokenA.address, tokenB.address, toSwap, wallet.address);
})()

// await executeSwap(tokenA, tokenB, '1', wallet.address); // Exe
