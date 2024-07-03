import { resolve } from "path";
import { WalletContractV4 } from "ton";
import { OpenedWallet } from "./utils";

export async function waitSeqno(seqno: number, wallet: OpenedWallet) {
  for (let attemp = 0; attemp < 10; attemp++) {
    await sleep(2000);
    const seqnoAfter = await wallet.contract.getSeqno();
    if (seqnoAfter == seqno + 1) break;
  }
}
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
