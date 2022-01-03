import { BigNumber } from '@ethersproject/bignumber';
import { keccak256 } from "@ethersproject/keccak256";
import {  defaultAbiCoder } from "@ethersproject/abi";

import { Signer } from "@ethersproject/abstract-signer";
//import { ReplayProtectionFactory } from "../../ReplayProtectionFactory";

export interface Nonces {
  index: BigNumber;
  latestNonce: BigNumber;
}
/**
 * Common functionality for the replay protection authorities.
 */
export abstract class ReplayGuard {
  /**
   * Replay protection is dedicated for a single user
   * @param signer Signer's wallet
   * @param forwarderAddress Address of the forwarder using the replay protection
   * @param address address for the authority.
   */
  constructor(
    protected readonly signer: Signer,
    protected readonly forwarderAddress: string,
    public readonly address: string
  ) {}

  /**
   * @abstract getEncodedReplayProtection
   * Fetch and encode the latest replay protection
   */

  // @ts-expect-error
  abstract async getEncodedReplayProtection(): Promise<string>;

  /**
   * @protected accessNonceStore
   * We try to access the on-chain nonce store to fetch the
   * latest nonce. If the contract is not yet deployed, then
   * it returns 0.
   * @param index Index in Nonce Store
   */
  protected async accessNonceStore(index: BigNumber): Promise<BigNumber> {

    // @TODO EIP3074Protection
    // @assert does the forwarder exist
    const code = await this.signer.provider!.getCode(this.forwarderAddress);
    // @dev Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
    const codeIsEmpty = !code || code === "0x" || code === "0x0";

    if (codeIsEmpty) {
      // Forwarder does not exist (e.g. proxy contract).
      // So we need to use the default nonce of 0

      // @ts-expect-error
      return new BigNumber("0");
    }

    // @ts-expect-error
    const replayProtection = new ReplayProtectionFactory(this.signer).attach(
      this.forwarderAddress
    );

    /**  
     @const onChainId 
     @access ReplayProtection
     @summary  In the ReplayProtection.sol, we use latestNonce == storedNonce then continue.
     Onchain ID = H(signerAddress, index).
     Mostly benefits BitFlip & MultiNonce.
    */
    const onchainId = keccak256(
      defaultAbiCoder.encode(
        ["address", "uint", "address"],
        [await this.signer.getAddress(), index, this.address]
      )
    );

    return await replayProtection.nonceStore(onchainId);
  }
}