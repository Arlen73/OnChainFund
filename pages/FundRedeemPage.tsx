
import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

// --- Constants and ABIs ---
const VAULT_PROXY_ADDRESS = '0xABBf9b6439BB5335C48d80a00d2cDCbA23A942e6';

const VAULT_PROXY_ABI = [
    'function getAccessor() view returns (address)'
];

const COMPTROLLER_ABI = [
    'function calcGrossShareValue() view returns (uint256)',
    'function redeemSharesInKind(address,uint256,address[],address[])',
];

const ERC20_ABI = [
    'function balanceOf(address account) view returns (uint256)',
];


const FundDetails: React.FC<{nav: string}> = ({nav}) => (
    <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">基金詳情</h2>
        <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-2">歷史績效</h3>
            <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-pie w-16 h-16 text-gray-300"></i>
                <span className="ml-4 text-gray-400">圖表數據加載中...</span>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center">
            <div><p className="text-sm text-gray-500">總管理資產 (AUM)</p><p className="text-2xl font-bold">讀取中...</p></div>
            <div><p className="text-sm text-gray-500">目前份額淨值 (NAV)</p><p className="text-2xl font-bold">${nav}</p></div>
            <div><p className="text-sm text-gray-500">管理費</p><p className="text-2xl font-bold">2%</p></div>
            <div><p className="text-sm text-gray-500">贖回費</p><p className="text-2xl font-bold">0.5%</p></div>
        </div>
    </div>
);


const FundRedeemPage: React.FC = () => {
    const { isConnected, provider, signer, address } = useWallet();
    const [amount, setAmount] = useState('');
    
    // State for contract instances
    const [comptrollerContract, setComptrollerContract] = useState<ethers.Contract | null>(null);
    const [sharesContract, setSharesContract] = useState<ethers.Contract | null>(null);
    
    // State for UI
    const [calculations, setCalculations] = useState({ gross: '0.00', fee: '0.00', net: '0.00' });
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [nav, setNav] = useState('0.00');
    const [shareBalance, setShareBalance] = useState('0.00');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Auto-clear success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000); // Clear after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        const initContracts = async () => {
            if (!provider) return;
            setError(null);
            try {
                // The VaultProxy is the ERC20 contract for the fund's shares
                const shares = new ethers.Contract(VAULT_PROXY_ADDRESS, ERC20_ABI, provider);
                setSharesContract(shares);

                // We need the comptroller to call redemption functions
                const vaultProxy = new ethers.Contract(VAULT_PROXY_ADDRESS, VAULT_PROXY_ABI, provider);
                const comptrollerAddress = await vaultProxy.getAccessor();
                const comptroller = new ethers.Contract(comptrollerAddress, COMPTROLLER_ABI, signer || provider);
                setComptrollerContract(comptroller);
            } catch (e) {
                console.error("Error initializing contracts:", e);
                setError("無法載入基金合約。請確認您連接到正確的網路。");
            }
        };

        if (isConnected && provider) {
            initContracts();
        } else {
            setComptrollerContract(null);
            setSharesContract(null);
        }
    }, [isConnected, provider, signer]);

    useEffect(() => {
        const fetchData = async () => {
            if (!comptrollerContract || !sharesContract || !address) return;
            try {
                const [navResult, balanceResult] = await Promise.all([
                    comptrollerContract.calcGrossShareValue(),
                    sharesContract.balanceOf(address),
                ]);

                setNav(ethers.formatUnits(navResult, 18));
                setShareBalance(ethers.formatUnits(balanceResult, 18));
            } catch (e) {
                console.error("Error fetching data:", e);
                setError("讀取鏈上資料時發生錯誤。");
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [comptrollerContract, sharesContract, address]);

    useEffect(() => {
        const numAmount = parseFloat(amount) || 0;
        const currentNav = parseFloat(nav) || 0;
        if (numAmount > 0 && currentNav > 0) {
            const grossValue = numAmount * currentNav;
            const fee = grossValue * 0.005; // Using 0.5% fee from mockup
            const netValue = grossValue - fee;
            setCalculations({
                gross: grossValue.toFixed(4),
                fee: fee.toFixed(4),
                net: netValue.toFixed(4),
            });
        } else {
            setCalculations({ gross: '0.00', fee: '0.00', net: '0.00' });
        }
    }, [amount, nav]);

    const handleRedeem = async () => {
        if (!comptrollerContract || !address || !amount) {
            setError("無法執行贖回：要件不全。");
            return;
        }
        setError(null);
        setSuccessMessage(null);
        setIsRedeeming(true);
        try {
            const parsedAmount = ethers.parseUnits(amount, 18);
            const tx = await comptrollerContract.redeemSharesInKind(
                address,
                parsedAmount,
                [],
                []
            );
            await tx.wait();
            setSuccessMessage("贖回成功！資產已發送到您的錢包。");
            setAmount('');
        } catch (e) {
            console.error("Redemption failed:", e);
            setError("贖回失敗。請查看錢包或控制台以獲取更多資訊。");
        } finally {
            setIsRedeeming(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8 mt-4">
                <h1 className="text-4xl font-bold text-gray-900">穩健增長一號 (SGF01)</h1>
                <p className="text-lg text-gray-500">由 <span className="font-semibold text-blue-600">0xManager...Address</span> 管理</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <FundDetails nav={nav} />
                <div className="bg-white p-8 rounded-2xl shadow-lg h-fit">
                    <h2 className="text-2xl font-bold mb-6 text-center">贖回基金</h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline"><label htmlFor="redeemAmount" className="block text-sm font-medium text-gray-700 mb-1">贖回份額數量</label><span className="text-sm text-gray-500">持有份額: {shareBalance} SGF01</span></div>
                            <div className="relative"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 transition pr-16" /><button onClick={() => setAmount(shareBalance)} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-blue-600 hover:text-blue-800">最大值</button></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">預計可得資產 (ASVT)</span><span className="font-semibold">{calculations.gross} ASVT</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">贖回費 (0.5%)</span><span className="font-semibold text-red-500">- {calculations.fee} ASVT</span></div>
                            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-800 font-bold">您實際將收到</span><span className="font-bold text-gray-800">{calculations.net} ASVT</span></div>
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="h-6 text-center">
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
                            </div>
                            {!isConnected ? <div className="text-center text-gray-500 p-4 bg-gray-100 rounded-lg">請先連接錢包以進行操作</div> : 
                            <button onClick={handleRedeem} disabled={!amount || parseFloat(amount) <= 0 || isRedeeming} className="w-full bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">{isRedeeming ? '交易發送中...' : '確認贖回'}</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FundRedeemPage;
