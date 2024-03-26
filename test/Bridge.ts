import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'

describe('Bridge', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners()

    const Bridge = await hre.ethers.getContractFactory('Bridge')
    const bridge = await Bridge.deploy()

    const GLDToken = await hre.ethers.getContractFactory('GLDToken')
    const token = await GLDToken.deploy(BigInt(1000) * BigInt(10 ** 18))

    return { bridge, token, owner, otherAccount }
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { bridge, owner } = await loadFixture(deployFixture)

      expect(await bridge.owner()).to.equal(owner.address)
    })
  })
})
