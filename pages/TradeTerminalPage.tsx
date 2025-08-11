
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const MOCK_RATES: { [key: string]: number } = { 'WETH-USDC': 3500, 'USDC-WETH': 1 / 3500, 'WETH-stETH': 0.99, 'stETH-WETH': 1 / 0.99, 'USDC-stETH': 1 / 3510, 'stETH-USDC': 3510 };
const MOCK_BALANCES: { [key: string]: number } = { 'WETH': 400.00, 'USDC': 3000000.00, 'stETH': 2500.00, 'aUSDC': 500000.00 };
const ASSETS = [
    { symbol: 'WETH', name: 'Wrapped Ether', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=032' },
    { symbol: 'USDC', name: 'USD Coin', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=032' },
    { symbol: 'stETH', name: 'Lido Staked ETH', logo: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png?v=032' },
    { symbol: 'aUSDC', name: 'Aave USDC', logo: 'https://cryptologos.cc/logos/aave-aave-logo.png?v=032' },
];

const TradeTerminalPage: React.FC = () => {
    const [payAmount, setPayAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('');
    const [payAsset, setPayAsset] = useState('WETH');
    const [receiveAsset, setReceiveAsset] = useState('USDC');
    const [exchangeRate, setExchangeRate] = useState('');

    useEffect(() => {
        const numPayAmount = parseFloat(payAmount) || 0;
        if (numPayAmount > 0 && payAsset !== receiveAsset) {
            const rateKey = `${payAsset}-${receiveAsset}`;
            const rate = MOCK_RATES[rateKey] || 0;
            setReceiveAmount((numPayAmount * rate).toFixed(4));
            setExchangeRate(`1 ${payAsset} ≈ ${rate.toFixed(4)} ${receiveAsset}`);
        } else {
            setReceiveAmount('');
            setExchangeRate(payAsset === receiveAsset ? '請選擇不同資產' : '請輸入金額');
        }
    }, [payAmount, payAsset, receiveAsset]);
    
    const swapAssets = () => {
        setPayAsset(receiveAsset);
        setReceiveAsset(payAsset);
        setPayAmount(receiveAmount);
    };

    const handleExecute = () => {
        if(!payAmount || !receiveAmount) { alert('請輸入有效金額。'); return; }
        const confirmation = confirm(`您確定要執行此交易嗎？\n\n支付: ${payAmount} ${payAsset}\n收到: 約 ${receiveAmount} ${receiveAsset}`);
        if (confirmation) { alert('交易已送出！'); setPayAmount(''); }
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8 mt-4">
                <NavLink to="/manage/1" className="text-sm text-blue-600 hover:underline flex items-center mb-2"><i className="fas fa-arrow-left mr-2"></i>返回管理頁面</NavLink>
                <h1 className="text-4xl font-bold text-gray-900">交易終端：穩健增長一號</h1>
                <p className="text-lg text-gray-500">與白名單協議互動以執行交易策略。</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">Uniswap 兌換</h2>
                    <p className="text-gray-500 mb-6">從基金持倉中選擇資產進行兌換。</p>
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between items-end mb-1"><label className="text-sm font-medium text-gray-700">您支付</label><span className="text-xs text-gray-500">基金持有: {MOCK_BALANCES[payAsset]?.toLocaleString()} {payAsset}</span></div>
                        <div className="flex items-center gap-4"><input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="0.0" className="w-full text-2xl font-bold bg-transparent focus:outline-none" /><select value={payAsset} onChange={e=>setPayAsset(e.target.value)} className="text-xl font-bold bg-white border border-gray-200 rounded-lg p-2 focus:outline-none">{ASSETS.map(a=><option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}</select></div>
                    </div>
                    <div className="flex justify-center my-4"><button onClick={swapAssets} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"><i className="fas fa-arrow-down"></i></button></div>
                     <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between items-end mb-1"><label className="text-sm font-medium text-gray-700">您收到 (預估)</label><span className="text-xs text-gray-500">基金持有: {MOCK_BALANCES[receiveAsset]?.toLocaleString()} {receiveAsset}</span></div>
                        <div className="flex items-center gap-4"><input type="number" value={receiveAmount} placeholder="0.0" className="w-full text-2xl font-bold bg-transparent focus:outline-none" readOnly /><select value={receiveAsset} onChange={e=>setReceiveAsset(e.target.value)} className="text-xl font-bold bg-white border border-gray-200 rounded-lg p-2 focus:outline-none">{ASSETS.map(a=><option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}</select></div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2 mt-6">
                        <div className="flex justify-between"><span>預估匯率</span><span className="font-medium text-gray-800">{exchangeRate}</span></div>
                        <div className="flex justify-between"><span>滑價容忍度</span><span className="font-medium text-blue-600 cursor-pointer">0.5%</span></div>
                    </div>
                    <div className="mt-8"><button onClick={handleExecute} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">執行兌換</button></div>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4 flex items-center"><i className="fas fa-wallet mr-3 text-blue-500"></i>基金資產</h2>
                        <div className="space-y-4">
                            {ASSETS.map(asset => (
                                <div key={asset.symbol} className="flex items-center">
                                    <img src={asset.logo} className="w-8 h-8 mr-3" alt={`${asset.name} Logo`} />
                                    <div className="flex-grow"><p className="font-bold">{asset.symbol}</p><p className="text-sm text-gray-500">{MOCK_BALANCES[asset.symbol]?.toLocaleString()}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeTerminalPage;
