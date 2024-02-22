const { ethers } = require('ethers');
// Assuming you've already set up your wallet and provider as in your initial code snippet

const SWAP_ROUTER_ADDRESS = '0x70dF9df551CFce152ca89941a659E1A9c3eC9d37';
const QUOTER_ADDRESS = '0x22B24982cc0562C0DDfF92986617e550Bc38A8Db';

const { abi: SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json');
const { abi: QuoterABI } = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');

// Example function to quote a swap
async function quoteSwap(inputToken, outputToken, amountIn) {
    const quoter = new ethers.Contract(QUOTER_ADDRESS, QuoterABI, provider);
    const amountInFormatted = ethers.utils.parseUnits(amountIn.toString(), 'ether'); // Adjust for token decimals

    try {
        const amountOut = await quoter.quoteExactInputSingle(
            inputToken,
            outputToken,
            fee,
            amountInFormatted,
            0
        );
        console.log(`Quoted Output Amount: ${ethers.utils.formatUnits(amountOut.toString(), 'ether')}`); // Adjust for token decimals
        return amountOut;
    } catch (error) {
        console.error('Failed to quote swap:', error);
    }
}

// Example function to execute a swap
async function executeSwap(inputToken, outputToken, amountIn, recipient) {
    const swapRouter = new ethers.Contract(SWAP_ROUTER_ADDRESS, SwapRouterABI, wallet);
    const amountInFormatted = ethers.utils.parseUnits(amountIn.toString(), 'ether'); // Adjust for token decimals

    // Specify parameters for the swap, such as deadline and slippage tolerance
    const params = {
        tokenIn: inputToken,
        tokenOut: outputToken,
        fee: fee,
        recipient: recipient,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current time
        amountIn: amountInFormatted,
        amountOutMinimum: 0, // Set to a minimum amount of output tokens you would accept
        sqrtPriceLimitX96: 0, // No price limit
    };

    try {
        const tx = await swapRouter.exactInputSingle(params, {
            gasLimit: "500000", // Set an appropriate gas limit
        });
        const receipt = await tx.wait();
        console.log(`Swap executed, transaction hash: ${receipt.transactionHash}`);
    } catch (error) {
        console.error('Failed to execute swap:', error);
    }
}

// Example usage
// await quoteSwap(tokenA, tokenB, '1'); // Quote for swapping 1 tokenA to tokenB
// await executeSwap(tokenA, tokenB, '1', wallet.address); // Exe
