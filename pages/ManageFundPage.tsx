
import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Switch from '../components/Switch';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

const chartData = {
    labels: ['WETH', 'USDC', 'stETH', 'aUSDC'],
    datasets: [{
        data: [40, 30, 25, 5],
        backgroundColor: ['#3b82f6', '#38bdf8', '#10b981', '#9ca3af'],
        borderWidth: 0,
    }]
};
const chartOptions = {
    responsive: true,
    cutout: '70%',
    plugins: { legend: { display: false } }
};


const ManageFundPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('fees');
    const [lockupPeriod, setLockupPeriod] = useState("72");
    const [showCooldownWarning, setShowCooldownWarning] = useState(false);
    const initialLockup = useRef("72");

    useEffect(() => {
        if (lockupPeriod !== initialLockup.current) {
            setShowCooldownWarning(true);
        } else {
            setShowCooldownWarning(false);
        }
    }, [lockupPeriod]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('設定變更已送出！請在您的錢包中確認交易。');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8 mt-4">
                <NavLink to="/dashboard/manager" className="text-sm text-blue-600 hover:underline flex items-center mb-2"><i className="fas fa-arrow-left mr-2"></i>返回儀表板</NavLink>
                <h1 className="text-4xl font-bold text-gray-900">管理基金：穩健增長一號</h1>
                <p className="text-lg text-gray-500">在此頁面檢視基金狀態並調整策略。</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">核心指標</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline"><span className="text-gray-600">總管理資產 (AUM)</span><span className="font-semibold text-lg">$10,000,000</span></div>
                            <div className="flex justify-between items-baseline"><span className="text-gray-600">份額淨值 (NAV)</span><span className="font-semibold text-lg">$1.15</span></div>
                            <div className="flex justify-between items-baseline"><span className="text-gray-600">總發行份額</span><span className="font-semibold text-lg">8,695,652</span></div>
                            <div className="flex justify-between items-baseline"><span className="text-gray-600">投資人數</span><span className="font-semibold text-lg">850</span></div>
                            <div className="flex justify-between items-baseline"><span className="text-gray-600">計價資產</span><span className="font-semibold text-lg">USDC</span></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">資產配置</h2>
                        <div className="w-full max-w-xs mx-auto mb-4"><Doughnut data={chartData} options={chartOptions} /></div>
                        <div className="space-y-2 text-sm">{chartData.labels.map((label, i) => (<div key={label} className="flex justify-between items-center"><span><i className="fas fa-circle mr-2" style={{ color: chartData.datasets[0].backgroundColor[i] }}></i>{label}</span><span className="font-medium">{chartData.datasets[0].data[i]}%</span></div>))}</div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-lg">
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('fees')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'fees' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>費用設定</button>
                            <button onClick={() => setActiveTab('policies')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'policies' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>策略設定</button>
                            <button onClick={() => setActiveTab('management')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'management' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>資產管理</button>
                        </nav>
                    </div>
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'fees' && <div className="space-y-6">...</div>}
                        {activeTab === 'policies' && <div className="space-y-6"><div className="p-4 border rounded-lg bg-gray-50 border-l-4 border-amber-400 pl-4"><h3 className="text-lg font-semibold">份額鎖倉期 (Shares Lock-Up)</h3><p className="text-xs text-amber-600 font-semibold my-1">半永久性設定</p><div className="mt-2"><label className="block text-sm font-medium text-gray-700">鎖倉時間 (小時)</label><input type="number" value={lockupPeriod} onChange={e => setLockupPeriod(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg"/></div></div></div>}
                        {activeTab === 'management' && <div className="space-y-6">...</div>}

                        {showCooldownWarning && <div className="mt-6 p-4 bg-amber-100 border-l-4 border-amber-500 text-amber-700"><div className="flex"><div className="flex-shrink-0"><i className="fas fa-exclamation-triangle"></i></div><div className="ml-3"><h3 className="text-sm font-medium">注意：半永久性設定變更</h3><div className="mt-2 text-sm"><p>您正在修改一項或多項半永久性設定。儲存後將觸發為期 7 天的冷卻期，期間將暫停新的申購，以保障現有投資人權益。</p></div></div></div></div>}
                        
                        <div className="mt-8 pt-5 border-t border-gray-200"><div className="flex justify-end"><button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">儲存變更</button></div></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ManageFundPage;
