import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

// --- Constants and ABIs ---
const COMPTROLLER_PROXY_ADDRESS = '0x369d962418A1B9D3997Df74c16227D39b43eCC99';
const DEPOSIT_TOKEN_ADDRESS = import.meta.env.VITE_ASVT_ADDRESS; // ASVT Token

const COMPTROLLER_ABI = [
    'function getVaultProxy() view returns (address)',
    'function calcGav() view returns (uint256)',
    'function calcGrossShareValue() view returns (uint256)',
    'function buyShares(uint256 _investmentAmount, uint256 _minSharesQuantity)',
    'function buySharesWithEth(uint256 _minSharesQuantity) payable',
    'function getDenominationAsset() view returns (address)'
];

const ERC20_ABI = [
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
];

const FundDetails: React.FC<{ aum: string; nav: string }> = ({ aum, nav }) => (
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
            <div><p className="text-sm text-gray-500">總管理資產 (AUM)</p><p className="text-2xl font-bold">${aum}</p></div>
            <div><p className="text-sm text-gray-500">目前份額淨值 (NAV)</p><p className="text-2xl font-bold">${nav}</p></div>
            <div><p className="text-sm text-gray-500">管理費</p><p className="text-2xl font-bold">2%</p></div>
            <div><p className="text-sm text-gray-500">申購費</p><p className="text-2xl font-bold">1%</p></div>
        </div>
        <div>
            <h3 className="font-semibold text-gray-700 mb-2">投資策略</h3>
            <p className="text-gray-600 leading-relaxed">本基金旨在透過多元化配置於主流加密貨幣（如 BTC、ETH）以及去中心化金融（DeFi）藍籌項目，來實現長期資本增值。我們採用核心-衛星策略，將大部分資金配置於穩健資產，同時利用小部分資金參與高增長潛力的早期項目，以平衡風險與回報。</p>
        </div>
    </div>
);

const FundDepositPage: React.FC = () => {
    const { isConnected, provider, signer, address } = useWallet();
    const [amount, setAmount] = useState('');
    
    // Contract and data states
    const [comptrollerContract, setComptrollerContract] = useState<ethers.Contract | null>(null);
    const [depositTokenContract, setDepositTokenContract] = useState<ethers.Contract | null>(null);
    const [vaultProxyAddress, setVaultProxyAddress] = useState<string | null>(null);
    const [fundData, setFundData] = useState({ nav: '0.00', aum: '0.00' });
    const [userData, setUserData] = useState({ tokenBalance: '0.00', allowance: '0' });

    // UI states
    const [calculations, setCalculations] = useState({ fee: '0.00', shares: '0.00', total: '0.00' });
    const [isApproved, setIsApproved] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Function to clear messages and start a new action
    const startAction = (action: React.Dispatch<React.SetStateAction<boolean>>) => {
        setError(null);
        setSuccessMessage(null);
        action(true);
    };

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
                const comptroller = new ethers.Contract(COMPTROLLER_PROXY_ADDRESS, COMPTROLLER_ABI, signer || provider);
                setComptrollerContract(comptroller);

                const vaultAddress = await comptroller.getVaultProxy();
                setVaultProxyAddress(vaultAddress);
                
                const depositToken = new ethers.Contract(DEPOSIT_TOKEN_ADDRESS, ERC20_ABI, signer || provider);
                setDepositTokenContract(depositToken);
            } catch (e) {
                console.error("Error initializing contracts: ", e);
                setError("無法載入基金合約。請確認您連接到正確的網路。");
            }
        };

        if (isConnected && provider) {
            initContracts();
        } else {
            setComptrollerContract(null);
            setDepositTokenContract(null);
            setVaultProxyAddress(null);
            setError(null);
        }
    }, [isConnected, provider, signer]);

    useEffect(() => {
        const fetchData = async () => {
            if (!comptrollerContract || !depositTokenContract || !address || !vaultProxyAddress) return;
            try {
                const [navResult, gavResult, balanceResult, allowanceResult] = await Promise.all([
                    comptrollerContract.calcGrossShareValue(),
                    comptrollerContract.calcGav(),
                    depositTokenContract.balanceOf(address),
                    depositTokenContract.allowance(address, vaultProxyAddress),
                ]);

                const nav = parseFloat(ethers.formatUnits(navResult, 18)).toFixed(4);
                const aum = parseFloat(ethers.formatUnits(gavResult, 18)).toFixed(2);
                const tokenBalance = parseFloat(ethers.formatUnits(balanceResult, 18)).toFixed(4);
                
                setFundData({ nav, aum });
                setUserData({ tokenBalance, allowance: allowanceResult.toString() });
                
                if (amount) {
                    const inputAmount = ethers.parseUnits(amount, 18);
                    if (allowanceResult >= inputAmount) {
                        setIsApproved(true);
                    } else {
                        setIsApproved(false);
                    }
                } else {
                    setIsApproved(false);
                }

            } catch (e) {
                console.error("Error fetching data:", e);
                setError("讀取鏈上資料時發生錯誤。");
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [comptrollerContract, depositTokenContract, address, vaultProxyAddress, amount]);

    useEffect(() => {
        const numAmount = parseFloat(amount) || 0;
        const nav = parseFloat(fundData.nav) || 0;
        if (numAmount > 0 && nav > 0) {
            const fee = numAmount * 0.01; // 1% fee
            const netAmount = numAmount - fee;
            const shares = netAmount / nav;
            setCalculations({
                fee: fee.toFixed(4),
                shares: shares.toFixed(4),
                total: numAmount.toFixed(2),
            });
        } else {
            setCalculations({ fee: '0.00', shares: '0.00', total: '0.00' });
        }
    }, [amount, fundData.nav]);


    const handleApprove = async () => {
        if (!depositTokenContract || !COMPTROLLER_PROXY_ADDRESS || !amount) {
            setError("無法執行授權：要件不全。");
            return;
        }
        startAction(setIsApproving);
        try {
            const parsedAmount = ethers.parseUnits(amount, 18);
            const tx = await depositTokenContract.approve(COMPTROLLER_PROXY_ADDRESS, parsedAmount);
            await tx.wait();
            setIsApproved(true);
            setSuccessMessage("ASVT 授權成功！");
        } catch (e) {
            console.error("Approval failed:", e);
            setError("授權失敗。請查看錢包或控制台以獲取更多資訊。");
        } finally {
            setIsApproving(false);
        }
    };

    const handleDeposit = async () => {
        if (!comptrollerContract || !amount) {
            setError("無法執行申購：要件不全。");
            return;
        }
        startAction(setIsDepositing);
        
        try {
            const parsedAmount = ethers.parseUnits(amount, 18);
            
            // Slippage protection: 0.5%
            //const expectedShares = parseFloat(calculations.shares);
            //const minShares = expectedShares * 0.995;
            //const minSharesQuantity = ethers.parseUnits(minShares.toFixed(18), 18);
            const minSharesQuantity = 1;

            const tx = await comptrollerContract.buyShares(parsedAmount, minSharesQuantity);
            await tx.wait();

            setSuccessMessage("申購成功！您的份額已到帳。");
            setAmount('');
        } catch (e) {
            console.error("ASVT deposit failed:", e);
            setError("申購失敗。請查看錢包或控制台以獲取更多資訊。");
        } finally {
            setIsDepositing(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8 mt-4">
                <h1 className="text-4xl font-bold text-gray-900">穩健增長一號 (SGF01)</h1>
                <p className="text-lg text-gray-500">由 <span className="font-semibold text-blue-600">0xManager...Address</span> 管理</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <FundDetails nav={fundData.nav} aum={fundData.aum} />
                <div className="bg-white p-8 rounded-2xl shadow-lg h-fit">
                    <h2 className="text-2xl font-bold mb-6 text-center">申購基金</h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline"><label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">投資金額</label><span className="text-sm text-gray-500">餘額: {userData.tokenBalance} ASVT</span></div>
                            <div className="relative"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 transition pr-16" /><button onClick={() => setAmount(userData.tokenBalance)} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-blue-600 hover:text-blue-800">最大值</button></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">您將收到約</span><span className="font-semibold">{calculations.shares} SGF01 份額</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">申購費 (1%)</span><span className="font-semibold">{calculations.fee} ASVT</span></div>
                            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-800 font-bold">總花費</span><span className="font-bold text-gray-800">{calculations.total} ASVT</span></div>
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="h-6 text-center">
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
                            </div>
                            {!isConnected ? <div className="text-center text-gray-500 p-4 bg-gray-100 rounded-lg">請先連接錢包以進行操作</div> : 
                            (<>
                                <button onClick={handleApprove} disabled={isApproved || isApproving || !amount} className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-300 ${isApproved ? 'bg-gray-300 text-gray-500 cursor-default' : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400'}`}>{isApproving ? '授權中...' : (isApproved ? '✓ 已授權' : `1. 授權 ASVT`)}</button>
                                <button 
                                    onClick={handleDeposit} 
                                    disabled={!isApproved || isDepositing || !amount} 
                                    className="w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isDepositing ? '交易發送中...' : `2. 確認申購`}
                                </button>
                            </>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FundDepositPage;
