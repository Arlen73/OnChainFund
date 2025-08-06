
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import WalletConnectionPrompt from '../components/WalletConnectionPrompt';

const holdingsData = [
    { id: 1, name: '穩健增長一號', symbol: 'SGF01', shares: 8695.65, nav: 1.15, value: 10000.00, return: 15.2 },
    { id: 2, name: 'DeFi 藍籌精選', symbol: 'BLUCHIP', shares: 5210.50, nav: 2.02, value: 10525.25, return: 25.5 },
    { id: 3, name: '穩定幣套利策略', symbol: 'STBARB', shares: 3000.00, nav: 1.0085, value: 3025.50, return: 0.85 },
];

const transactionsData = [
    { date: '2025-07-28', fund: 'DeFi 藍籌精選', type: '申購', amount: '5,000.00 USDC', status: '已完成' },
    { date: '2025-07-25', fund: '穩健增長一號', type: '贖回', amount: '1,000.00 SGF01', status: '已完成' },
    { date: '2025-07-22', fund: '穩定幣套利策略', type: '申購', amount: '3,000.00 USDC', status: '已完成' },
];

const InvestorDashboardPage: React.FC = () => {
    const { isConnected } = useWallet();
    const navigate = useNavigate();

    if (!isConnected) {
        return <div className="container mx-auto p-4 md:p-8">
            <WalletConnectionPrompt
                roleToConnect="investor"
                message="請連接您的錢包"
                subMessage="連接錢包以查看您的投資組合儀表板。"
            />
        </div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8 mt-4">
                <h1 className="text-4xl font-bold text-gray-900">我的儀表板</h1>
                <p className="text-lg text-gray-500">歡迎回來，查看您的投資組合表現。</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold mb-6">我的持倉</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-100"><th className="py-3 px-4 font-semibold text-sm text-gray-600">基金名稱</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">持有份額</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">目前淨值</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">目前總值</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">總投報率</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-center">操作</th></tr>
                        </thead>
                        <tbody>
                            {holdingsData.map(fund => (
                                <tr key={fund.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-4 px-4"><p className="font-bold">{fund.name}</p><p className="text-xs text-gray-500">{fund.symbol}</p></td>
                                    <td className="py-4 px-4 text-right">{fund.shares.toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right">${fund.nav.toLocaleString()}</td>
                                    <td className="py-4 px-4 font-semibold text-right">${fund.value.toLocaleString()}</td>
                                    <td className="py-4 px-4 font-semibold text-right text-green-500">+{fund.return}%</td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button onClick={() => navigate(`/fund/${fund.id}/deposit`)} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors duration-200 text-sm">申購</button>
                                            <button onClick={() => navigate(`/fund/${fund.id}/redeem`)} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm">贖回</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold mb-6">最近交易紀錄</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-100"><th className="py-3 px-4 font-semibold text-sm text-gray-600">日期</th><th className="py-3 px-4 font-semibold text-sm text-gray-600">基金</th><th className="py-3 px-4 font-semibold text-sm text-gray-600">類型</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">金額 / 份額</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-center">狀態</th></tr>
                        </thead>
                        <tbody>
                            {transactionsData.map((tx, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                    <td className="py-4 px-4 text-sm text-gray-500">{tx.date}</td>
                                    <td className="py-4 px-4 font-semibold">{tx.fund}</td>
                                    <td className="py-4 px-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${tx.type === '申購' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{tx.type}</span></td>
                                    <td className="py-4 px-4 text-right">{tx.amount}</td>
                                    <td className="py-4 px-4 text-center text-sm text-gray-500">{tx.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvestorDashboardPage;
