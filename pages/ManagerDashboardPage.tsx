
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import WalletConnectionPrompt from '../components/WalletConnectionPrompt';

const StatCard = ({ title, value, change, changeText, color = 'green' }: { title: string, value: string, change?: string, changeText?: string, color?: 'green' | 'amber' }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-lg transition-transform transform hover:-translate-y-1 ${color === 'amber' ? 'bg-amber-50 border-amber-400 border' : ''}`}>
        <h3 className={`text-sm font-medium ${color === 'amber' ? 'text-amber-700' : 'text-gray-500'}`}>{title}</h3>
        <p className={`mt-1 text-3xl font-semibold ${color === 'amber' ? 'text-amber-900' : 'text-gray-900'}`}>{value}</p>
        {change && changeText && <p className={`mt-1 text-sm flex items-center ${color === 'green' ? 'text-green-500' : 'text-amber-600'}`}>{change}<span className="text-gray-500 ml-2">{changeText}</span></p>}
    </div>
);

const fundsData = [
    { id: 1, name: '穩健增長一號', symbol: 'SGF01', aum: 10000000, nav: 1.15, dailyChange: 1.20, investors: 850, changeType: 'gain' },
    { id: 2, name: 'DeFi 藍籌精選', symbol: 'BLUCHIP', aum: 3525250, nav: 2.02, dailyChange: -0.55, investors: 425, changeType: 'loss' },
    { id: 3, name: '穩定幣套利策略', symbol: 'STBARB', aum: 25500, nav: 1.0085, dailyChange: 0.02, investors: 5, changeType: 'gain' },
];

const ManagerDashboardPage: React.FC = () => {
    const { isConnected } = useWallet();
    const navigate = useNavigate();

    if (!isConnected) {
        return <div className="container mx-auto p-4 md:p-8">
            <WalletConnectionPrompt
                roleToConnect="manager"
                message="請連接您的基金經理錢包"
                subMessage="連接錢包以開始管理您的基金。"
            />
        </div>;
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8 mt-4">
                <h1 className="text-4xl font-bold text-gray-900">基金經理儀表板</h1>
                <p className="text-lg text-gray-500">總覽您所有基金的表現與狀態。</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="管理總資產 (AUM)" value="$13,550,750" change="+2.5%" changeText="近24小時" />
                <StatCard title="旗下基金數量" value="3" change=" " changeText="檔活躍基金" />
                <StatCard title="總投資人數" value="1,280" change="+12" changeText="新進投資人" />
                <StatCard title="待處理動作" value="1" change=" " changeText="策略變更冷卻中" color="amber" />
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">我的基金</h2>
                    <button onClick={() => navigate('/create-fund')} className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors duration-200 text-sm flex items-center">
                        <i className="fas fa-plus mr-2"></i>創建新基金
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead><tr className="border-b-2 border-gray-100"><th className="py-3 px-4 font-semibold text-sm text-gray-600">基金名稱</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">總資產 (AUM)</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">份額淨值 (NAV)</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">日漲跌</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-center">投資人數</th><th className="py-3 px-4 font-semibold text-sm text-gray-600 text-center">操作</th></tr></thead>
                        <tbody>
                            {fundsData.map(fund => (
                                <tr key={fund.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-4 px-4"><p className="font-bold">{fund.name}</p><p className="text-xs text-gray-500">{fund.symbol}</p></td>
                                    <td className="py-4 px-4 font-semibold text-right">${fund.aum.toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right">${fund.nav}</td>
                                    <td className={`py-4 px-4 font-semibold text-right ${fund.changeType === 'gain' ? 'text-green-500' : 'text-red-500'}`}>{fund.changeType === 'gain' ? '+' : ''}{fund.dailyChange.toFixed(2)}%</td>
                                    <td className="py-4 px-4 text-center">{fund.investors}</td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button onClick={() => navigate(`/manage/${fund.id}`)} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm">管理</button>
                                            <button onClick={() => navigate(`/manage/${fund.id}/trade`)} className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm">交易</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboardPage;
