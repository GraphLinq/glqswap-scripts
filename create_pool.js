const { ethers } = require('ethers');
const { abi: IUniswapV3FactoryABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json');
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const univ3prices = require('@thanpolas/univ3prices');

// Configure your wallet and provider
const WALLET_PRIVATE_KEY = '';
const provider = new ethers.providers.JsonRpcProvider(`https://glq-dataseed.graphlinq.io`);
const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

// Uniswap V3 Factory contract address (mainnet)
const UNISWAP_V3_FACTORY_ADDRESS = '0x0E70926aE867D4dE6E056C29FaB16b0896B731Bf';

// Tokens you want to create a pool with
const tokenA = '0xbeED106D0f2e6950BFa1Eec74E1253CA0a643442'; // WETH
const tokenB = '0xEB567ec41738c2bAb2599A1070FC5B727721b3B6'; // WGLQ

const amountA = '5600000000000000000000'; // 5600 GLQ 
const amountB = '100000000000000000'; // 0.1 ETH


// Fee tier, for example, 1% fee tier is 10000
const fee = 10000;

async function deployOrGetPool() {
  // Connect to the Uniswap V3 Factory contract
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY_ADDRESS, IUniswapV3FactoryABI, wallet);

  // Ensure tokenA < tokenB by address to conform to Uniswap's token sorting
  const tokens = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];

  console.log(tokens[0])
  // First, try to get an existing pool
  const existingPoolAddress = await factory.getPool(tokens[0], tokens[1], fee);
  if (existingPoolAddress !== "0x0000000000000000000000000000000000000000") {
    console.log(`Pool already exists at address: ${existingPoolAddress}`);
    const poolContract = new ethers.Contract(existingPoolAddress, IUniswapV3PoolABI, wallet);
    const sqrtPrice = univ3prices.utils.encodeSqrtRatioX96(amountA, amountB);
    const tx = await poolContract.initialize(sqrtPrice.toString());
    await tx.wait();

    console.log(`Pool successfully initialized with base price ${amountA} VS ${amountB} !`)
    return;
  }

  console.log('Deploying pool...');

  // Since no pool exists, attempt to create a new one
  try {
    const tx = await factory.createPool(tokens[0], tokens[1], fee);
    const receipt = await tx.wait();

    // The event "PoolCreated" returns the pool address
    // This approach assumes the event structure doesn't change. Adjust as necessary.
    const poolAddressEvent = receipt.events?.find((e) => e.event === 'PoolCreated');
    if (poolAddressEvent) {
      console.log(`Pool deployed at address: ${poolAddressEvent.args.pool}`);
    } else {
      console.log('PoolCreated event not found in transaction receipt.');
    }
  } catch (error) {
    console.error('Failed to deploy pool:', error);
  }
}

deployOrGetPool();
