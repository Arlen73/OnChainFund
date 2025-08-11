
import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

const FundDetails: React.FC = () => (
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
            <div><p className="text-sm text-gray-500">總管理資產 (AUM)</p><p className="text-2xl font-bold">$1,234,567</p></div>
            <div><p className="text-sm text-gray-500">目前份額淨值 (NAV)</p><p className="text-2xl font-bold">$1.15</p></div>
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
    const { isConnected } = useWallet();
    const [amount, setAmount] = useState('');
    const [asset, setAsset] = useState('USDC');
    const [calculations, setCalculations] = useState({ fee: '0.00', shares: '0.00', total: '0.00' });
    const [isApproved, setIsApproved] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);

    const NAV = 1.15;
    const ENTRANCE_FEE_RATE = 0.01;

    useEffect(() => {
        const numAmount = parseFloat(amount) || 0;
        if (numAmount > 0) {
            const fee = numAmount * ENTRANCE_FEE_RATE;
            const netAmount = numAmount - fee;
            const shares = netAmount / NAV;
            setCalculations({
                fee: fee.toFixed(2),
                shares: shares.toFixed(4),
                total: numAmount.toFixed(2),
            });
        } else {
            setCalculations({ fee: '0.00', shares: '0.00', total: '0.00' });
        }
    }, [amount, NAV]);

    const handleApprove = () => {
        setIsApproving(true);
        setTimeout(() => {
            setIsApproved(true);
            setIsApproving(false);
            alert('資產授權成功！現在可以進行申購。');
        }, 1500);
    };

    const handleDeposit = () => {
        setIsDepositing(true);
        setTimeout(() => {
            alert('申購成功！您的份額已發送到您的錢包。');
            setAmount('');
            setIsApproved(false);
            setIsDepositing(false);
        }, 2000);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8 mt-4">
                <h1 className="text-4xl font-bold text-gray-900">穩健增長一號 (SGF01)</h1>
                <p className="text-lg text-gray-500">由 <span className="font-semibold text-blue-600">0xManager...Address</span> 管理</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <FundDetails />
                <div className="bg-white p-8 rounded-2xl shadow-lg h-fit">
                    <h2 className="text-2xl font-bold mb-6 text-center">申購基金</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="depositAsset" className="block text-sm font-medium text-gray-700 mb-1">選擇投資資產</label>
                            <select id="depositAsset" value={asset} onChange={e => setAsset(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 transition"><option value="USDC">USDC</option><option value="WETH">WETH</option><option value="USDT">USDT</option></select>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline"><label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">投資金額</label><span className="text-sm text-gray-500">餘額: 10,000.00 {asset}</span></div>
                            <div className="relative"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 transition pr-16" /><button onClick={() => setAmount('10000')} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-blue-600 hover:text-blue-800">最大值</button></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">您將收到約</span><span className="font-semibold">{calculations.shares} SGF01 份額</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">申購費 (1%)</span><span className="font-semibold">{calculations.fee} {asset}</span></div>
                            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-800 font-bold">總花費</span><span className="font-bold text-gray-800">{calculations.total} {asset}</span></div>
                        </div>
                        <div className="space-y-3 pt-2">
                            {!isConnected ? <div className="text-center text-gray-500 p-4 bg-gray-100 rounded-lg">請先連接錢包以進行操作</div> : 
                            (<>
                                <button onClick={handleApprove} disabled={isApproved || isApproving || !amount} className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-300 ${isApproved ? 'bg-gray-300 text-gray-500 cursor-default' : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400'}`}>{isApproving ? '授權中...' : (isApproved ? '✓ 已授權' : `1. 授權 ${asset}`)}</button>
                                <button onClick={handleDeposit} disabled={!isApproved || isDepositing || !amount} className="w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">{isDepositing ? '交易發送中...' : '2. 確認申購'}</button>
                            </>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FundDepositPage;
