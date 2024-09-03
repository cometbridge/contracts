import { ethers } from 'hardhat'

async function main() {
  const p = new ethers.JsonRpcProvider('https://rpc.mainnet.taiko.xyz')

  const r = await p.getTransactionReceipt('0xd22ec1b34028eeed78fc064666294b43904616eaadd8dfb82689b573b8327d66')

  console.log(r)
}

main()
