import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletState, WalletContextType, Role } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    role: null,
    provider: null,
    signer: null,
  });

  const connect = async (role: Role) => {
    if (typeof window.ethereum === 'undefined') {
      alert('請安裝 MetaMask!');
      throw new Error('MetaMask not installed');
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet({
        isConnected: true,
        address,
        role,
        provider,
        signer,
      });
      alert(`${role === 'manager' ? '基金經理' : '投資人'}錢包已連接！`);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("錢包連接失敗。");
      throw error;
    }
  };

  const disconnect = () => {
    setWallet({
      isConnected: false,
      address: null,
      role: null,
      provider: null,
      signer: null,
    });
  };
  
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnect();
        } else if (wallet.address !== accounts[0]) {
            if (wallet.role) {
                connect(wallet.role).catch(console.error);
            }
        }
    };

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
        if (window.ethereum?.removeListener) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
    };
  }, [wallet.address, wallet.role]);

  return (
    <WalletContext.Provider value={{ ...wallet, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
