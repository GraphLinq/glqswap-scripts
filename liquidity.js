const { ethers } = require('ethers');
const { abi: INonfungiblePositionManager } = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json');
const { NonfungiblePositionManager } = require('@uniswap/v3-sdk');
const { Percent } = require('@uniswap/sdk-core');
const { Token } = require('@uniswap/sdk-core')
const { Position } = require('@uniswap/v3-sdk');
const {CurrencyAmount}  = require('@uniswap/sdk-core');
const { Price } = require('@uniswap/v3-sdk');
const { Pool } = require('@uniswap/v3-sdk');
const { nearestUsableTick } = require('@uniswap/v3-sdk');
const { TickMath } = require('@uniswap/v3-sdk');
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { BigNumber } = require("ethers");

const ERC20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

// Configuration
const providerUrl = 'https://glq-dataseed.graphlinq.io'; // Change to your Infura project ID
const privateKey = '';
const positionManagerAddress = '0x9527542236724B2D1e54F97FC62375a72Bc950cE'; // Uniswap V3 NonfungiblePositionManager address

// Initialize ethers provider and wallet
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const tokenB = new Token(614, "0xbeED106D0f2e6950BFa1Eec74E1253CA0a643442", 18, "WETH", "Wrapped Ethereum");
const tokenA = new Token(614, "0xEB567ec41738c2bAb2599A1070FC5B727721b3B6", 18, "WGLQ", "Wrapped Graphlinq GLQ");

const currentPoolAddress = "0x04391851210bd132ADDe72De7f07ACede7b4AD97"
const amountA = '5000000000000000'; // 0.005 ETH
const amountB = '280000000000000000000'; // 280 GLQ


const getPoolState = async () => {
  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI,
    provider
  )

  const [liquidity, slot, fee, tickSpacing] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
    poolContract.fee(),
    poolContract.tickSpacing(),
  ]);

  return {
    liquidity: BigNumber.from(liquidity),
    tickSpacing: Number(tickSpacing),
    fee: Number(fee),
    sqrtPriceX96: BigNumber.from(slot[0]),
    tick: Number(slot[1]),
  };
};


async function approveToken(tokenAddress, amount) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, wallet);

  // Check current allowance
  const currentAllowance = await tokenContract.allowance(wallet.address, positionManagerAddress);
  console.log(currentAllowance)
  // Only approve if the current allowance is less than the amount needed

    try {
      const tx = await tokenContract.approve(positionManagerAddress, "1000000000000000000000000000000");
      await tx.wait(1); // Wait for transaction confirmation
      console.log(`Approval transaction for token at ${tokenAddress}: ${tx.hash}`);
    } catch (error) {
      console.error("Transaction failed:", error); // Handle potential errors
    }

}

(async () => {
    const [state] = await Promise.all([
      getPoolState(),
    ]);
    const amountToken0 = CurrencyAmount.fromRawAmount(
      tokenA,
      amountA
    )
  
    const amountToken1 = CurrencyAmount.fromRawAmount(
      tokenB,
      amountB
    )

    const pool = new Pool(
      amountToken0.currency,
      amountToken1.currency,
      state.fee,
      state.sqrtPriceX96.toString(),
      state.liquidity.toString(),
      state.tick
    );
    console.log(pool)

    const position = Position.fromAmounts({
        pool,
        tickLower: Number(nearestUsableTick(TickMath.MIN_TICK, state.tickSpacing)),
        tickUpper: Number(nearestUsableTick(TickMath.MAX_TICK, state.tickSpacing)),
        amount0: amountToken0.quotient,
        amount1: amountToken1.quotient,
        useFullPrecision: true,
      });

      const mintOptions = {
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        slippageTolerance: new Percent(50, 10_000), // 0.5% slippage tolerance
      };

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions);
      const transaction = {
        data: calldata,
        to: positionManagerAddress,
        value: value,
        from: wallet.address,
      };

      try {
        await approveToken(tokenA.address, amountA);
        await approveToken(tokenB.address, amountB);
  
        
        const txResponse = await wallet.sendTransaction(transaction);
        const receipt = await txResponse.wait(1);
        console.log(`Transaction successful: ${receipt.transactionHash}`);
      } catch (error) {
        console.error(`Failed to mint position: ${error}`);
      }

})();

