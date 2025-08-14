import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const Header: React.FC = () => {
    const { isConnected, address, role, connect, disconnect } = useWallet();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        isActive
            ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1"
            : "text-gray-600 hover:text-blue-500";

    const handleConnect = async () => {
        if (!role) {
            try {
                await connect('investor');
            } catch (e) {
                console.error("Connection failed on header");
            }
        }
    };

    const handleSwitchWallet = async () => {
        setIsDropdownOpen(false);
        if (role) {
            try {
                await connect(role);
            } catch (e) {
                console.error("Switching wallet failed");
            }
        }
    };

    const handleDisconnect = () => {
        setIsDropdownOpen(false);
        disconnect();
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getDashboardPath = () => {
        return role === 'manager' ? '/dashboard/manager' : '/dashboard/investor';
    };

    const getCreateFundPath = () => {
        return '/create-fund';
    };

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
                        <div className="relative">
                            <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center space-x-4 cursor-pointer">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-700">{address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}</p>
                                    <p className="text-xs text-gray-500">{role === 'manager' ? '基金經理' : '投資人'}</p>
                                </div>
                                <div className={`w-10 h-10 bg-gradient-to-tr from-blue-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold`}>
                                    {role === 'manager' ? 'M' : 'I'}
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                                    <button
                                        onClick={handleSwitchWallet}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        切換錢包
                                    </button>
                                    <button
                                        onClick={handleDisconnect}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        中斷連結
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;