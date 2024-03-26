// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Bridge is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;
  using Address for address payable;

  error OnlyEnabled();
  error InvalidAmount(uint256 amount);
  error InvalidProvider();
  error InvalidRecipientAddress();
  error ParamsError();

  struct BridgeStorage {
    bool isEnabled;
    bool initialized;
    mapping(address => uint256) bridgeIndexs;
    mapping(address => uint256) releaseIndexs;
    mapping(address => mapping(uint256 => bytes)) bridges;
    mapping(address => mapping(uint256 => bytes)) releases;
  }

  function s() internal pure returns (BridgeStorage storage cs) {
    bytes32 position = keccak256('Bridge.contract.storage.v1');
    assembly {
      cs.slot := position
    }
  }

  modifier onlyEnabled() {
    if (!s().isEnabled) {
      revert OnlyEnabled();
    }
    _;
  }

  constructor() Ownable(msg.sender) {}

  function initialize(bool _isEnabled) external onlyOwner {
    s().isEnabled = _isEnabled;
  }

  function setIsEnabled(bool _isEnabled) external onlyOwner {
    s().isEnabled = _isEnabled;
  }

  function bridge(uint256 amount, address token, address payable provider, bytes memory metadata) external payable onlyEnabled nonReentrant {
    if (provider == address(0)) revert InvalidProvider();
    if (amount == 0) revert InvalidAmount(amount);

    address user = msg.sender;

    if (token == address(0)) {
      provider.sendValue(msg.value);
    } else {
      IERC20(token).safeTransferFrom(user, provider, amount);
    }

    storeBridgeMetadata(user, metadata);
    increaseBridgeIndex(user);
  }

  function release(uint256 amount, address token, address payable recipient, bytes memory metadata) external payable onlyEnabled nonReentrant {
    _release(amount, token, recipient, metadata);
  }

  function multiRelease(
    uint256[] memory amounts,
    address[] memory tokens,
    address payable[] memory recipients,
    bytes[] memory metadatas
  ) external payable onlyEnabled nonReentrant {
    for (uint256 i = 0; i < amounts.length; i++) {
      _release(amounts[i], tokens[i], recipients[i], metadatas[i]);
    }
  }

  function _release(uint256 amount, address token, address payable recipient, bytes memory metadata) internal {
    if (recipient == address(0)) revert InvalidRecipientAddress();
    if (amount == 0) revert InvalidAmount(amount);

    address provider = msg.sender;

    if (token == address(0)) {
      recipient.sendValue(msg.value);
    } else {
      IERC20(token).safeTransferFrom(provider, recipient, amount);
    }

    storeReleaseMetadata(provider, metadata);
    increaseReleaseIndex(provider);
  }

  function storeBridgeMetadata(address user, bytes memory metadata) internal {
    s().bridges[user][bridgeIndex(user)] = metadata;
  }

  function storeReleaseMetadata(address provider, bytes memory metadata) internal {
    s().releases[provider][releaseIndex(provider)] = metadata;
  }

  function increaseBridgeIndex(address user) internal {
    s().bridgeIndexs[user] += 1;
  }

  function increaseReleaseIndex(address provider) internal {
    s().releaseIndexs[provider] += 1;
  }

  function releaseIndex(address user) public view returns (uint256) {
    return s().releaseIndexs[user];
  }

  function bridgeIndex(address provider) public view returns (uint256) {
    return s().bridgeIndexs[provider];
  }

  function isEnabled() public view returns (bool) {
    return s().isEnabled;
  }

  fallback() external {}
}
