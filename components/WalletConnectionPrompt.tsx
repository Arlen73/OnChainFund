
import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Role } from '../types';

interface WalletConnectionPromptProps {
    roleToConnect: Role;
    message: string;
    subMessage: string;
}

const WalletConnectionPrompt: React.FC<WalletConnectionPromptProps> = ({ roleToConnect, message, subMessage }) => {
    const { connect } = useWallet();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            await connect(roleToConnect);
        } catch (e) {
            // Error is handled and alerted inside the context
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center py-20">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vector-effect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">{message}</h3>
            <p className="mt-1 text-sm text-gray-500">{subMessage}</p>
            <div className="mt-6">
              <button 
                type="button" 
                onClick={handleConnect}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {isLoading ? '連接中...' : '連接錢包'}
              </button>
            </div>
        </div>
    );
};

export default WalletConnectionPrompt;