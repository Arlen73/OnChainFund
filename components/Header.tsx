
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const Header: React.FC = () => {
    const { isConnected, address, role, connect } = useWallet();
    const navigate = useNavigate();

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        isActive
            ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1"
            : "text-gray-600 hover:text-blue-500";

    const handleConnect = async () => {
        // Simple logic for demo: if no role, prompt or default to investor
        if (!role) {
            try {
                await connect('investor');
            } catch (e) {
                console.error("Connection failed on header");
            }
        }
    }

    const getDashboardPath = () => {
        return role === 'manager' ? '/dashboard/manager' : '/dashboard/investor';
    }

    const getCreateFundPath = () => {
        return '/create-fund';
    }

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between p-4">
                <div className="flex items-center space-x-8">
                    <button onClick={() => navigate('/')} className="text-2xl font-bold text-blue-600">{import.meta.env.VITE_SYSTEM_Name}</button>
                    {role === 'manager' ? (
                        <nav className="hidden md:flex items-center space-x-6">
                            <NavLink to={getDashboardPath()} className={navLinkClass}>儀表板</NavLink>
                            <NavLink to={getCreateFundPath()} className={navLinkClass}>創建基金</NavLink>
                        </nav>
                    ) : (
                        <nav className="hidden md:flex items-center space-x-6">
                            <NavLink to="/explore" className={navLinkClass}>探索基金</NavLink>
                            <NavLink to={getDashboardPath()} className={navLinkClass}>儀表板</NavLink>
                        </nav>
                    )
                }
                </div>
                <div id="wallet-section">
                    {!isConnected ? (
                        <button onClick={handleConnect} className="bg-emerald-100 text-emerald-700 font-semibold py-2 px-4 rounded-lg hover:bg-emerald-200 transition-colors duration-300">
                            連接錢包
                        </button>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-700">{address}</p>
                                <p className="text-xs text-gray-500">{role === 'manager' ? '基金經理' : 'Ethereum'}</p>
                            </div>
                            <div className={`w-10 h-10 bg-gradient-to-tr from-blue-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold`}>
                                {role === 'manager' && 'M'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;