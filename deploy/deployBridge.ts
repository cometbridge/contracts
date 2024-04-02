import { Wallet } from 'zksync-ethers'
import * as ethers from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'

// load env file
import dotenv from 'dotenv'
dotenv.config()

// load wallet private key from env file
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || ''

if (!PRIVATE_KEY) throw '⛔️ Private key not detected! Add it to the .env file!'

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Bridge contract`)

  // Initialize the wallet.
  const wallet = new Wallet(PRIVATE_KEY)

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet)
  const artifact = await deployer.loadArtifact('Bridge')

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, [])

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  const parsedFee = ethers.utils.formatEther(deploymentFee.toString())
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`)

  const bridgeContract = await deployer.deploy(artifact, [])

  // Show the contract info.
  const contractAddress = bridgeContract.address
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`)

  await (await bridgeContract.initialize(true)).wait()
  console.log('bridge contract initialize success')

  //   // verify contract for tesnet & mainnet
  //   if (process.env.NODE_ENV != 'test') {
  //     // Contract MUST be fully qualified name (e.g. path/sourceName:contractName)
  //     const contractFullyQualifedName = 'contracts/Greeter.sol:Greeter'

  //     // Verify contract programmatically
  //     const verificationId = await hre.run('verify:verify', {
  //       address: contractAddress,
  //       contract: contractFullyQualifedName,
  //       constructorArguments: [greeting],
  //       bytecode: artifact.bytecode
  //     })
  //   } else {
  //     console.log(`Contract not verified, deployed locally.`)
  //   }
}
