import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BridgeModule = buildModule("BridgeModule", (m) => {

  const bridge = m.contract("Bridge");

  return { bridge };
});

export default BridgeModule;
