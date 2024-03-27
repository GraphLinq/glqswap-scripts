const { ethers } = require('ethers');
const { abi: INonfungiblePositionManagerABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json')

// Setup your provider
const provider = new ethers.providers.JsonRpcProvider('https://glq-dataseed.graphlinq.io');
const walletPrivateKey = ''; 
const wallet = new ethers.Wallet(walletPrivateKey, provider);

// NonfungiblePositionManager address and ABI
const nftContractAddress = '0x9527542236724B2D1e54F97FC62375a72Bc950cE'; // The actual address for NonfungiblePositionManager
const nftContractABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)",
    "function positions(uint256 tokenId) external view returns (uint96 nonce, uint256 operator, uint256 token0, uint256 token1, uint256 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
    "function decreaseLiquidity(uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline) external returns (uint256 amount0, uint256 amount1)",
    "function collect(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max) external returns (uint256 amount0, uint256 amount1)"
];

const poolABI = [
    // Function to remove liquidity (replace with the specific function for your pool)
    "function removeLiquidity(uint256 tokenId, uint256 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline) external returns (uint256 amount0, uint256 amount1)",
    // Additional function(s) as needed, e.g., for getting pool information
  ];

async function withdrawAllLiquidity() {
    const contract = new ethers.Contract(nftContractAddress, INonfungiblePositionManagerABI, wallet);
    const poolContract = new ethers.Contract("0x2f734ea5474792513b4EC73B38A2A6c103A12a6f", poolABI, wallet);

    const walletAddress = wallet.address;
    const balance = await contract.balanceOf(walletAddress);


    for (let index = 0; index < balance; index++) {
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, index);
        const position = await contract.positions(tokenId);
        const liquidity = position.liquidity;
        console.log(`Position id ${tokenId} have ${liquidity.toString()} liquidity left, removing...`)
        const parsed = parseInt(liquidity.toString())
        if (parsed === 0) { console.log("LP token empty, moving to next one..."); continue }


        try {
        // Decrease liquidity
        const txDecrease = await contract.decreaseLiquidity({
            tokenId: tokenId,
            liquidity: liquidity,
            amount0Min: 0,
            amount1Min: 0,
            deadline: Math.floor(Date.now() / 1000) + 60 * 10, // deadline: 10 minutes from now
            },
            { from: walletAddress, gasLimit: 5000000 }
        );
        console.log(`Decreasing liquidity for tokenId ${tokenId}: transaction hash ${txDecrease.hash}`);
        //await txDecrease.wait();
        console.log(txDecrease)
        } catch (error) {
            console.error(`Simulation failed for tokenId ${tokenId}:`, error.message);
        }

        // // Collect fees
        // const txCollect = await contract.collect(
        //     tokenId,
        //     walletAddress, // Recipient of the fees
        //     ethers.constants.MaxUint256, // amount0Max
        //     ethers.constants.MaxUint256, // amount1Max
        //     { gasLimit: 5000000 }
        // );
        // console.log(`Collecting fees for tokenId ${tokenId}: transaction hash ${txCollect.hash}`);
        // await txCollect.wait();
    }

    console.log("Liquidity withdrawn and fees collected for all positions.");
}

// Example usage
withdrawAllLiquidity().then(() => {
    console.log("Completed.");
}).catch(error => {
    console.error("An error occurred:", error);
});
