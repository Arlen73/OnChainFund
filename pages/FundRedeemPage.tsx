
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
            <div><p className="text-sm text-gray-500">贖回費</p><p className="text-2xl font-bold">0.5%</p></div>
        </div>
    </div>
);


const FundRedeemPage: React.FC = () => {
    const { isConnected } = useWallet();
    const [amount, setAmount] = useState('');
    const [calculations, setCalculations] = useState({ gross: '0.00', fee: '0.00', net: '0.00' });
    const [isRedeeming, setIsRedeeming] = useState(false);

    const NAV = 1.15;
    const EXIT_FEE_RATE = 0.005;
    const SHARE_BALANCE = 8695.65;

    useEffect(() => {
        const numAmount = parseFloat(amount) || 0;
        if (numAmount > 0) {
            const grossValue = numAmount * NAV;
            const fee = grossValue * EXIT_FEE_RATE;
            const netValue = grossValue - fee;
            setCalculations({
                gross: grossValue.toFixed(2),
                fee: fee.toFixed(2),
                net: netValue.toFixed(2),
            });
        } else {
            setCalculations({ gross: '0.00', fee: '0.00', net: '0.00' });
        }
    }, [amount, NAV]);

    const handleRedeem = () => {
        setIsRedeeming(true);
        setTimeout(() => {
            alert(`贖回成功！\n您已成功贖回 ${amount} 份額，資產已發送到您的錢包。`);
            setAmount('');
            setIsRedeeming(false);
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
                    <h2 className="text-2xl font-bold mb-6 text-center">贖回基金</h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-baseline"><label htmlFor="redeemAmount" className="block text-sm font-medium text-gray-700 mb-1">贖回份額數量</label><span className="text-sm text-gray-500">持有份額: {SHARE_BALANCE.toLocaleString()} SGF01</span></div>
                            <div className="relative"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 transition pr-16" /><button onClick={() => setAmount(String(SHARE_BALANCE))} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-blue-600 hover:text-blue-800">最大值</button></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">預計可得資產 (USDC)</span><span className="font-semibold">{calculations.gross} USDC</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">贖回費 (0.5%)</span><span className="font-semibold text-red-500">- {calculations.fee} USDC</span></div>
                            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-800 font-bold">您實際將收到</span><span className="font-bold text-gray-800">{calculations.net} USDC</span></div>
                        </div>
                        <div className="space-y-3 pt-2">
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
