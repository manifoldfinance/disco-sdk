
import {  defaultAbiCoder } from "@ethersproject/abi";

import { Signer } from "@ethersproject/abstract-signer";
import { ReplayGuard } from "./ReplayGuard";
import { Lock } from "../utils/lock";
// mport { GnosisSafeFactory } from "../../GnosisSafeFactory";

export class MultiSigReplayProtection extends ReplayGuard {
  private readonly lock: Lock;

  private nonce: number;

  /**
   * MultiNonce replay protection maintains N queues of transactions.
   * Implemented strategy appends every new transaction to the N queues in rotation,
   * so we support up to N out-of-order transactions.
   * @param signer Signer's wallet
   * @param forwarderAddress Proxy Account for Gnosis Safe
   */
  constructor(signer: Signer, readonly forwarderAddress: string) {
    super(
      signer,
      forwarderAddress,
      "0x0000000000000000000000000000000000000000"
    );
    this.lock = new Lock();
  }

  /**
   * Fetch latest nonce we can use for the replay protection.
   * We assume that a transaction is immediately broadcasted if this function is called.
   */
  private async getNonce() {
    if (this.nonce == undefined) {


       // @ts-expect-error
      const isDeployed = await this.signer.provider!.getCode(
        this.forwarderAddress
      );

      // Lets verify that gnosis safe is already deployed
      if (isDeployed !== "0x") {

        // @ts-expect-error
        const gnosisSafe = new GnosisSafeFactory(this.signer).attach(
          this.forwarderAddress
        );
        this.nonce = (await gnosisSafe.nonce()).toNumber();
      } else {
        this.nonce = 0;
      }
    } else {
      this.nonce = this.nonce + 1;
    }

    return this.nonce;
  }

  /**
   * Fetch the latest replay protection and encode it.
   */
  public async getEncodedReplayProtection() {
    try {
      await this.lock.acquire();
      return defaultAbiCoder.encode(["uint"], [await this.getNonce()]);
    } finally {
      this.lock.release();
    }
  }
}