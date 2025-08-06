
import { ethers } from 'ethers';

export type Role = 'investor' | 'manager' | null;

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  role: Role;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export interface WalletContextType extends WalletState {
  connect: (role: Role) => Promise<void>;
  disconnect: () => void;
}