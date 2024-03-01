const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://glq-dataseed.graphlinq.io');
const walletAddress = '0x32152293EE2Cd23F72627339707C265949bb4a28';
const nftContractAddress = '0x9527542236724B2D1e54F97FC62375a72Bc950cE'; // NonfungiblePositionManager contract address

// ABI fragments needed to fetch NFTs owned by a wallet
const nftContractABI = [
    "function balanceOf(address owner) external view returns (uint256 balance)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)"
];

async function findAllTokenIds() {
    const contract = new ethers.Contract(nftContractAddress, nftContractABI, provider);
    const balance = await contract.balanceOf(walletAddress); // Get the number of NFTs owned
    const tokenIds = [];

    for (let index = 0; index < balance; index++) {
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, index);
        tokenIds.push(tokenId.toString());
    }

    return tokenIds;
}

// Example usage
findAllTokenIds().then(tokenIds => {
    console.log("Your Uniswap V3 NFT Token IDs are:", tokenIds);
}).catch(error => {
    console.error("An error occurred:", error);
});
