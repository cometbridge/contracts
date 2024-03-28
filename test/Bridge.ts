import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { createOriginalMetadata, createTargetMetadata } from '../utils/createMetadata'

describe('Bridge', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [owner, otherAccount, cometProvider, user1, user2] = await hre.ethers.getSigners()

    const Bridge = await hre.ethers.getContractFactory('Bridge')
    const bridge = await Bridge.deploy()

    await bridge.initialize(true)

    const GLDToken = await hre.ethers.getContractFactory('GLDToken')
    const token = await GLDToken.deploy(BigInt(1000) * BigInt(10 ** 18))

    return { bridge, token, owner, cometProvider, otherAccount, user1, user2 }
  }

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      const { bridge, owner } = await loadFixture(deployFixture)

      expect(await bridge.owner()).to.equal(owner.address)
    })

    it('Should set the right initialize', async function () {
      const { bridge } = await loadFixture(deployFixture)

      await expect(bridge.initialize(true)).to.revertedWithCustomError(bridge, 'Initialized')
    })

    it('Should set the right change owner', async function () {
      const { bridge, otherAccount } = await loadFixture(deployFixture)

      expect(await bridge.transferOwnership(otherAccount.address)).to.emit(bridge, 'OwnershipTransferred')

      expect(await bridge.owner()).to.equal(otherAccount.address)
    })

    it('Should set the right enabled', async function () {
      const { bridge } = await loadFixture(deployFixture)

      expect(await bridge.setIsEnabled(true))
        .to.emit(bridge, 'EnableChanged')
        .withArgs(true)

      expect(await bridge.isEnabled()).to.equal(true)
    })

    it('Should set the right withdraw token', async function () {
      const { bridge, otherAccount, token } = await loadFixture(deployFixture)

      const amount = hre.ethers.parseEther('0.01')

      // await otherAccount.sendTransaction({
      //   to: bridge.getAddress(),
      //   value: hre.ethers.parseEther('0.01')
      // })
      // expect(await bridge.withdrawEther(otherAccount.address, amount)).to.changeEtherBalances([bridge.getAddress(), otherAccount], [-amount, amount])

      await token.transfer(bridge.getAddress(), amount)
      expect(await bridge.withdrawToken(token.getAddress(), otherAccount.address, amount)).to.changeTokenBalances(
        token,
        [bridge.getAddress(), otherAccount],
        [-amount, amount]
      )
    })
  })

  describe('Bridge', function () {
    const amount = hre.ethers.parseEther('0.01')
    const metadata = createOriginalMetadata({
      targetChain: '1',
      targetAddress: hre.ethers.ZeroAddress
    })

    describe('Validations', async function () {
      it('Should revert with the right error if provider is zore address', async function () {
        const { bridge } = await loadFixture(deployFixture)

        await expect(bridge.bridge(amount, hre.ethers.ZeroAddress, hre.ethers.ZeroAddress, metadata)).to.be.revertedWithCustomError(
          bridge,
          'InvalidProvider'
        )
      })

      it('Should revert with the right error if amount is zore', async function () {
        const { bridge, cometProvider } = await loadFixture(deployFixture)

        await expect(bridge.bridge(0, hre.ethers.ZeroAddress, cometProvider.address, metadata)).to.be.revertedWithCustomError(bridge, 'InvalidAmount')
      })

      it('Should revert with the right error if amount not equal value', async function () {
        const { bridge, cometProvider } = await loadFixture(deployFixture)

        await expect(bridge.bridge(amount, hre.ethers.ZeroAddress, cometProvider.address, metadata)).to.be.revertedWithCustomError(
          bridge,
          'AmountMustEqualValue'
        )
      })

      it('Should revert with the right error if token approve amount is zore', async function () {
        const { bridge, token, cometProvider } = await loadFixture(deployFixture)

        await expect(bridge.bridge(amount, token.getAddress(), cometProvider.address, metadata)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientAllowance'
        )
      })

      it('Should revert with the right error if not enable', async function () {
        const { bridge, cometProvider } = await loadFixture(deployFixture)

        await bridge.setIsEnabled(false)
        await expect(bridge.bridge(amount, hre.ethers.ZeroAddress, cometProvider.address, metadata)).to.be.revertedWithCustomError(
          bridge,
          'OnlyEnabled'
        )
      })
    })

    describe('Events', function () {
      it('Should emit an event on bridge', async function () {
        const { bridge, token, otherAccount, cometProvider } = await loadFixture(deployFixture)

        await expect(
          bridge.connect(otherAccount).bridge(amount, hre.ethers.ZeroAddress, cometProvider.address, metadata, {
            value: amount
          })
        )
          .to.emit(bridge, 'Bridged')
          .withArgs(...[otherAccount.address, cometProvider.address, hre.ethers.ZeroAddress, amount, metadata, 0])

        await token.transfer(otherAccount.address, amount)
        await token.connect(otherAccount).approve(bridge.getAddress(), amount)

        await expect(
          bridge.connect(otherAccount).bridge(amount, token.getAddress(), cometProvider.address, metadata, {
            value: amount
          })
        )
          .to.emit(bridge, 'Bridged')
          .withArgs(...[otherAccount.address, cometProvider.address, token.getAddress(), amount, metadata, 1])
          .to.emit(token, 'Transfer')
          .withArgs(otherAccount, cometProvider, amount)
      })
    })

    describe('Transfers', function () {
      it('Should transfer the funds to the provider', async function () {
        const { bridge, token, otherAccount, cometProvider } = await loadFixture(deployFixture)

        await expect(
          bridge.connect(otherAccount).bridge(amount, hre.ethers.ZeroAddress, cometProvider.address, metadata, {
            value: amount
          })
        ).to.changeEtherBalances([otherAccount, cometProvider], [-amount, amount])

        await token.transfer(otherAccount.address, amount)
        await token.connect(otherAccount).approve(bridge.getAddress(), amount)
        await expect(
          bridge.connect(otherAccount).bridge(amount, token.getAddress(), cometProvider.address, metadata, {
            value: amount
          })
        ).to.changeTokenBalances(token, [otherAccount, cometProvider], [-amount, amount])
      })
    })
  })

  describe('Release', function () {
    const amount = hre.ethers.parseEther('0.01')
    const metadata = createTargetMetadata({
      originalChain: '1',
      originalHash: '0x'
    })

    describe('Validations', async function () {
      it('Should revert with the right error if recipient is zore address', async function () {
        const { bridge } = await loadFixture(deployFixture)

        await expect(
          bridge.release(amount, hre.ethers.ZeroAddress, hre.ethers.ZeroAddress, metadata, {
            value: amount
          })
        ).to.be.revertedWithCustomError(bridge, 'InvalidRecipientAddress')
      })

      it('Should revert with the right error if amount is zore', async function () {
        const { bridge, token } = await loadFixture(deployFixture)

        await expect(bridge.release(0, hre.ethers.ZeroAddress, token.getAddress(), metadata)).to.be.revertedWithCustomError(bridge, 'InvalidAmount')
      })

      it('Should revert with the right error if amount not equal value', async function () {
        const { bridge, cometProvider } = await loadFixture(deployFixture)

        await expect(bridge.release(amount, hre.ethers.ZeroAddress, cometProvider.address, metadata)).to.be.revertedWithCustomError(
          bridge,
          'AmountMustEqualValue'
        )
      })

      it('Should revert with the right error if token approve amount is zore', async function () {
        const { bridge, token, otherAccount } = await loadFixture(deployFixture)

        await expect(bridge.release(amount, token.getAddress(), otherAccount.address, metadata)).to.be.revertedWithCustomError(
          token,
          'ERC20InsufficientAllowance'
        )
      })

      it('Should revert with the right error if not enable', async function () {
        const { bridge, otherAccount } = await loadFixture(deployFixture)

        await bridge.setIsEnabled(false)
        await expect(bridge.release(amount, hre.ethers.ZeroAddress, otherAccount.address, metadata)).to.be.revertedWithCustomError(
          bridge,
          'OnlyEnabled'
        )
      })
    })

    describe('Events', function () {
      it('Should emit an event on release', async function () {
        const { bridge, token, otherAccount, cometProvider } = await loadFixture(deployFixture)

        await expect(
          bridge.connect(cometProvider).release(amount, hre.ethers.ZeroAddress, otherAccount.address, metadata, {
            value: amount
          })
        )
          .to.emit(bridge, 'Released')
          .withArgs(...[otherAccount.address, cometProvider.address, hre.ethers.ZeroAddress, amount, metadata, 0])

        await token.transfer(cometProvider.address, amount)
        await token.connect(cometProvider).approve(bridge.getAddress(), amount)

        await expect(
          bridge.connect(cometProvider).release(amount, token.getAddress(), otherAccount.address, metadata, {
            value: amount
          })
        )
          .to.emit(bridge, 'Released')
          .withArgs(...[otherAccount.address, cometProvider.address, token.getAddress(), amount, metadata, 1])
          .to.emit(token, 'Transfer')
          .withArgs(cometProvider, otherAccount, amount)
      })
    })

    describe('Transfers', function () {
      it('Should transfer the funds to the user', async function () {
        const { bridge, token, otherAccount, cometProvider } = await loadFixture(deployFixture)

        await expect(
          bridge.connect(cometProvider).release(amount, hre.ethers.ZeroAddress, otherAccount.address, metadata, {
            value: amount
          })
        ).to.changeEtherBalances([otherAccount, cometProvider], [amount, -amount])

        await token.transfer(cometProvider.address, amount)
        await token.connect(cometProvider).approve(bridge.getAddress(), amount)
        await expect(
          bridge.connect(cometProvider).bridge(amount, token.getAddress(), otherAccount.address, metadata, {
            value: amount
          })
        ).to.changeTokenBalances(token, [otherAccount, cometProvider], [amount, -amount])
      })
    })

    describe('Multi Release', function () {
      it('Should revert with the right error if args different lengths', async function () {
        const { bridge, otherAccount, cometProvider, user1, user2 } = await loadFixture(deployFixture)

        const args: [bigint[], string[], string[], Buffer[]] = [
          [amount, amount + 123n],
          [hre.ethers.ZeroAddress, hre.ethers.ZeroAddress, hre.ethers.ZeroAddress],
          [otherAccount.address, user2.address],
          [metadata, metadata, metadata]
        ]

        const value = args[0].reduce((t, i) => t + i, 0n)

        await expect(
          bridge.connect(cometProvider).multiRelease(...args, {
            value: value
          })
        ).to.revertedWithCustomError(bridge, 'InvalidArgs')
      })
      it('Should revert with the right error if value not equal value', async function () {
        const { bridge, otherAccount, cometProvider, user1, user2 } = await loadFixture(deployFixture)

        const args: [bigint[], string[], string[], Buffer[]] = [
          [amount, amount + 123n, amount - 123n],
          [hre.ethers.ZeroAddress, hre.ethers.ZeroAddress, hre.ethers.ZeroAddress],
          [otherAccount.address, user1.address, user2.address],
          [metadata, metadata, metadata]
        ]

        const value = args[0].reduce((t, i) => t + i , 0n) - 100n

        await expect(
          bridge.connect(cometProvider).multiRelease(...args, {
            value: value
          })
        ).to.revertedWithCustomError(bridge, 'AmountMustEqualValue')
      })

      it('Should transfer the eth to the users', async function () {
        const { bridge, otherAccount, cometProvider, user1, user2 } = await loadFixture(deployFixture)

        const args: [bigint[], string[], string[], Buffer[]] = [
          [amount, amount + 123n, amount - 123n],
          [hre.ethers.ZeroAddress, hre.ethers.ZeroAddress, hre.ethers.ZeroAddress],
          [otherAccount.address, user1.address, user2.address],
          [metadata, metadata, metadata]
        ]

        const value = args[0].reduce((t, i) => t + i, 0n)

        await expect(
          bridge.connect(cometProvider).multiRelease(...args, {
            value: value
          })
        ).to.changeEtherBalances([cometProvider, otherAccount, user1, user2], [-value, args[0][0], args[0][1], args[0][2]])
      })

      it('Should transfer the token to the users', async function () {
        const { bridge, token, otherAccount, cometProvider, user1, user2 } = await loadFixture(deployFixture)

        const args: [bigint[], string[], string[], Buffer[]] = [
          [amount, amount + 123n, amount - 123n],
          [await token.getAddress(), await token.getAddress(), await token.getAddress()],
          [otherAccount.address, user1.address, user2.address],
          [metadata, metadata, metadata]
        ]

        const amounts = args[0].reduce((t, i) => t + i, 0n)

        await token.transfer(cometProvider.address, amounts)
        await token.connect(cometProvider).approve(bridge.getAddress(), amounts)

        await expect(bridge.connect(cometProvider).multiRelease(...args)).to.changeTokenBalances(
          token,
          [cometProvider, otherAccount, user1, user2],
          [-amounts, args[0][0], args[0][1], args[0][2]]
        )
      })
    })
  })
})
