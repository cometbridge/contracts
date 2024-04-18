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
  error InvalidArgs();
  error InvalidValue();
  error AmountMustEqualValue();
  error ParamsError();
  error Initialized();

  event Bridged(address sender, address provider, address token, uint256 amount, bytes metadata);
  event Released(address recipient, address provider, address token, uint256 amount, bytes metadata);
  event EnableChanged(bool isEnabled);

  struct BridgeStorage {
    bool isEnabled;
    bool initialized;
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
    if (s().initialized) revert Initialized();

    s().isEnabled = _isEnabled;
    s().initialized = true;
  }

  function setIsEnabled(bool _isEnabled) external onlyOwner {
    s().isEnabled = _isEnabled;

    emit EnableChanged(_isEnabled);
  }

  function bridge(uint256 amount, address token, address payable provider, bytes memory metadata) external payable onlyEnabled nonReentrant {
    if (provider == address(0)) revert InvalidProvider();
    if (amount == 0) revert InvalidAmount(amount);
    if (token == address(0) && amount != msg.value) revert AmountMustEqualValue();

    address user = msg.sender;

    if (token == address(0)) {
      provider.sendValue(msg.value);
    } else {
      IERC20(token).safeTransferFrom(user, provider, amount);
    }

    emit Bridged(msg.sender, provider, token, amount, metadata);
  }

  function release(uint256 amount, address token, address payable recipient, bytes memory metadata) external payable onlyEnabled nonReentrant {
    if (token == address(0) && amount != msg.value) revert AmountMustEqualValue();

    _release(amount, token, recipient, metadata);
  }

  function multiRelease(
    uint256[] memory amounts,
    address[] memory tokens,
    address payable[] memory recipients,
    bytes[] memory metadatas
  ) external payable onlyEnabled nonReentrant {
    if (amounts.length != tokens.length || amounts.length != recipients.length || amounts.length != metadatas.length) revert InvalidArgs();

    uint256 tAmount;

    for (uint256 i = 0; i < amounts.length; i++) {
      if (tokens[i] == address(0)) {
        tAmount += amounts[i];
      }
    }

    if (tAmount != msg.value) revert AmountMustEqualValue();

    for (uint256 i = 0; i < amounts.length; i++) {
      _release(amounts[i], tokens[i], recipients[i], metadatas[i]);
    }
  }

  function _release(uint256 amount, address token, address payable recipient, bytes memory metadata) internal {
    if (recipient == address(0)) revert InvalidRecipientAddress();
    if (amount == 0) revert InvalidAmount(amount);

    address provider = msg.sender;

    if (token == address(0)) {
      recipient.sendValue(amount);
    } else {
      IERC20(token).safeTransferFrom(provider, recipient, amount);
    }

    emit Released(recipient, provider, token, amount, metadata);
  }

  function isEnabled() public view returns (bool) {
    return s().isEnabled;
  }

  // to help users who accidentally send their tokens to this contract
  function withdrawToken(address token, address account, uint256 amount) external onlyOwner {
    IERC20(token).safeTransfer(account, amount);
  }

  // to help users who accidentally send their ether to this contract
  function withdrawEther(address payable account, uint256 amount) external onlyOwner {
    account.sendValue(amount);
  }

  // fallback() external payable {}
}
