
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Role } from '../types';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { connect } = useWallet();

    const handleNavigation = async (path: string, role: Role) => {
        try {
            await connect(role);
            navigate(path);
        } catch (e) {
            console.error("Connection failed from home page.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-blue-600">{import.meta.env.VITE_SYSTEM_Name}</h1>
                <p className="mt-4 text-xl text-gray-600">在區塊鏈上建立、管理和投資基金。</p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center text-center">
                    <div className="text-5xl text-emerald-500 mb-4">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">投資人</h2>
                    <p className="mt-2 text-gray-500 mb-6">探索基金、追蹤您的投資組合並增加您的資產。</p>
                    <button 
                        onClick={() => handleNavigation('/dashboard/investor', 'investor')}
                        className="w-full max-w-xs px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
                    >
                        前往投資人儀表板
                    </button>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center text-center">
                    <div className="text-5xl text-blue-500 mb-4">
                        <i className="fas fa-tasks"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">基金經理人</h2>
                    <p className="mt-2 text-gray-500 mb-6">創建您的基金、定義策略，並運用強大的工具來管理資產。</p>
                    <button 
                        onClick={() => handleNavigation('/dashboard/manager', 'manager')}
                        className="w-full max-w-xs px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                        前往經理人儀表板
                    </button>
                </div>
            </div>
             <footer className="mt-16 text-gray-500 text-sm">
                <p>&copy; 2024 ASVT. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default HomePage;