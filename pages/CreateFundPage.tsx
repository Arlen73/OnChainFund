
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Switch from '../components/Switch';
import { useWallet } from '../contexts/WalletContext';
import WalletConnectionPrompt from '../components/WalletConnectionPrompt';

// --- Contract Details (for demonstration) ---
// In a real-world app, this would come from a config file or environment variables.
const FUND_FACTORY_ADDRESS = import.meta.env.VITE_FUND_FACTORY_ADDRESS; // Example address
const DENOMINATION_ASSET_ADDRESSES: { [key: string]: string } = {
    'USDC': import.meta.env.VITE_USDC_ADDRESS,
    'WETH': import.meta.env.VITE_WETH_ADDRESS,
    'ASVT': import.meta.env.VITE_ASVT_ADDRESS,
};
const FUND_FACTORY_ABI = [
    { "inputs": [], "name": "deployedFunds", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "fundAddress", "type": "address" }, { "indexed": true, "internalType": "address", "name": "manager", "type": "address" }, { "internalType": "string", "name": "fundName", "type": "string" }, { "indexed": false, "internalType": "address", "name": "denominationAsset", "type": "address" }], "name": "FundCreated", "type": "event" },
    { "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_symbol", "type": "string" }, { "internalType": "address", "name": "_denominationAsset", "type": "address" }], "name": "createFund", "outputs": [{ "internalType": "address", "name": "newFundAddress", "type": "address" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "getDeployedFunds", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" }
];
// ----------------------------------------------


const stepsConfig = [
    { id: 1, title: '基礎設定' },
    { id: 2, title: '費用設定' },
    { id: 3, title: '申購策略' },
    { id: 4, title: '份額轉讓性' },
    { id: 5, title: '贖回策略' },
    { id: 6, title: '資產管理' },
    { id: 7, title: '預覽及確認' },
];

const StepIndicator = ({ currentStep, goToStep }: { currentStep: number; goToStep: (step: number) => void }) => {
    return (
        <nav>
            {stepsConfig.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                let stateClasses = 'text-gray-500';
                let circleClasses = 'bg-gray-200 text-gray-600';
                if (isCompleted) {
                    stateClasses = 'text-blue-500';
                    circleClasses = 'bg-blue-500 text-white';
                } else if (isCurrent) {
                    stateClasses = 'text-emerald-500';
                    circleClasses = 'bg-emerald-500 text-white';
                }

                return (
                    <a href="#" key={step.id} onClick={(e) => { e.preventDefault(); goToStep(step.id); }} className={`flex items-center mb-6 relative ${stateClasses}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 transition-colors ${circleClasses}`}>{step.id}</div>
                        <span className="font-semibold">{step.title}</span>
                        {index < stepsConfig.length - 1 && <div className="absolute left-4 top-10 w-0.5 h-[calc(100%-1rem)] bg-gray-200 -z-10"></div>}
                    </a>
                );
            })}
        </nav>
    );
};

const FeeSetting = ({ title, description, isEnabled, onToggle, children }: { title: string; description: string; isEnabled: boolean; onToggle: (enabled: boolean) => void; children: React.ReactNode }) => (
    <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Switch checked={isEnabled} onChange={onToggle} />
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        {isEnabled && <div className="mt-4 space-y-4">{children}</div>}
    </div>
);

const CreateFundPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const { signer, isConnected, role } = useWallet();
    const navigate = useNavigate();

    // Form State
    const [fundName, setFundName] = useState('');
    const [fundSymbol, setFundSymbol] = useState('');
    const [denominationAsset, setDenominationAsset] = useState('USDC');
    const [fees, setFees] = useState({
        management: { enabled: false, rate: 2 },
        performance: { enabled: false, rate: 20 },
        entrance: { enabled: false, rate: 1 },
        exit: { enabled: false, rate: 1 },
    });
    const [policies, setPolicies] = useState({
        depositorWhitelist: { enabled: false, list: '' },
        depositLimits: { enabled: false, min: 0, max: 10000 },
        shareTransferWhitelist: { enabled: false, list: '' },
    });

    // Transaction State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');


    const totalSteps = stepsConfig.length;

    const goToStep = (stepNumber: number) => {
        if (stepNumber >= 1 && stepNumber <= totalSteps) {
            setCurrentStep(stepNumber);
        }
    };

    const handleNext = () => goToStep(currentStep + 1);
    const handlePrev = () => goToStep(currentStep - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signer) {
            alert('請先連接您的基金經理錢包。');
            return;
        }
        if (!fundName.trim() || !fundSymbol.trim()) {
            alert('請填寫基金名稱和代號。');
            goToStep(1);
            return;
        }

        setError('');
        setTxHash('');
        setIsSubmitting(true);

        try {
            const factoryContract = new ethers.Contract(FUND_FACTORY_ADDRESS, FUND_FACTORY_ABI, signer);
            const assetAddress = DENOMINATION_ASSET_ADDRESSES[denominationAsset];

            if (!assetAddress) {
                throw new Error(`不支援的計價資產: ${denominationAsset}`);
            }

            const tx = await factoryContract.createFund(fundName, fundSymbol, assetAddress);
            setTxHash(tx.hash);

            await tx.wait(); // Wait for transaction to be mined

            alert('基金創建成功！');
            navigate('/dashboard/manager');

        } catch (err: any) {
            const errorMessage = err.reason || err.message || '發生未知錯誤';
            setError(errorMessage);
            console.error('基金創建失敗:', err);
            alert(`基金創建失敗: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isConnected || role !== 'manager') {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <WalletConnectionPrompt
                    roleToConnect="manager"
                    message="請連接您的基金經理錢包"
                    subMessage="您必須以基金經理身份登入才能創建新基金。"
                />
            </div>
        );
    }


    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="md:flex">
                    <div className="w-full md:w-1/4 p-8 bg-gray-50 border-r border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-800 mb-8">創建您的基金</h1>
                        <StepIndicator currentStep={currentStep} goToStep={goToStep} />
                    </div>

                    <div className="w-full md:w-3/4 p-8 md:p-12">
                        <form onSubmit={handleSubmit}>
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">基礎設定</h2>
                                    <p className="text-gray-500 mb-8">為您的基金設定基本資料。這些是投資人第一眼會看到的資訊。</p>
                                    <div>
                                        <label htmlFor="fundName" className="block text-sm font-medium text-gray-700 mb-1">基金名稱 (Name)</label>
                                        <input type="text" id="fundName" value={fundName} onChange={e => setFundName(e.target.value)} required placeholder="例如：穩健增長一號" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition" />
                                        <p className="text-xs text-gray-500 mt-1">基金的顯示名稱。</p>
                                    </div>
                                    <div>
                                        <label htmlFor="fundSymbol" className="block text-sm font-medium text-gray-700 mb-1">基金代號 (Symbol)</label>
                                        <input type="text" id="fundSymbol" value={fundSymbol} onChange={e => setFundSymbol(e.target.value)} required placeholder="例如：SGF01" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition" />
                                        <p className="text-xs text-gray-500 mt-1">基金份額代幣的代號，建議 3-5 個英文字母。</p>
                                    </div>
                                    <div>
                                        <label htmlFor="denominationAsset" className="block text-sm font-medium text-gray-700 mb-1">計價資產 (Denomination Asset)</label>
                                        <select id="denominationAsset" value={denominationAsset} onChange={e => setDenominationAsset(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition">
                                            <option value="USDC">USDC - USD Coin</option>
                                            <option value="WETH">WETH - Wrapped Ether</option>
                                            <option value="ASVT">ASVT - ASVT Token</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">用於衡量基金淨值和績效的基礎資產。 <span className="font-semibold text-amber-600">此為半永久性設定。</span></p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">費用設定</h2>
                                    <p className="text-gray-500 mb-8">設定基金的各項費用結構。開啟的費用將會自動從基金資產中收取。</p>
                                    <FeeSetting title="管理費 (Management Fee)" description="按年化費率從總管理資產 (AUM) 中持續收取。" isEnabled={fees.management.enabled} onToggle={v => setFees(f => ({ ...f, management: { ...f.management, enabled: v } }))}>
                                        <div><label htmlFor="managementFeeRate" className="block text-sm font-medium text-gray-700">年化費率 (%)</label><input type="number" id="managementFeeRate" value={fees.management.rate} onChange={e => setFees(f => ({ ...f, management: { ...f.management, rate: +e.target.value } }))} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                    </FeeSetting>
                                    <FeeSetting title="績效費 (Performance Fee)" description="基於「高水位線」原則，從已實現的利潤中收取。" isEnabled={fees.performance.enabled} onToggle={v => setFees(f => ({ ...f, performance: { ...f.performance, enabled: v } }))}>
                                        <div><label htmlFor="performanceFeeRate" className="block text-sm font-medium text-gray-700">費率 (%)</label><input type="number" id="performanceFeeRate" value={fees.performance.rate} onChange={e => setFees(f => ({ ...f, performance: { ...f.performance, rate: +e.target.value } }))} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                    </FeeSetting>
                                    <FeeSetting title="申購費 (Entrance Fee)" description="在每次申購時收取固定比例的費用。" isEnabled={fees.entrance.enabled} onToggle={v => setFees(f => ({ ...f, entrance: { ...f.entrance, enabled: v } }))}>
                                        <div><label htmlFor="entranceFeeRate" className="block text-sm font-medium text-gray-700">費率 (%)</label><input type="number" id="entranceFeeRate" value={fees.entrance.rate} onChange={e => setFees(f => ({ ...f, entrance: { ...f.entrance, rate: +e.target.value } }))} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                    </FeeSetting>
                                    <FeeSetting title="贖回費 (Exit Fee)" description="在每次贖回時收取固定比例的費用。" isEnabled={fees.exit.enabled} onToggle={v => setFees(f => ({ ...f, exit: { ...f.exit, enabled: v } }))}>
                                        <div><label htmlFor="exitFeeRate" className="block text-sm font-medium text-gray-700">費率 (%)</label><input type="number" id="exitFeeRate" value={fees.exit.rate} onChange={e => setFees(f => ({ ...f, exit: { ...f.exit, rate: +e.target.value } }))} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                    </FeeSetting>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">申購策略</h2>
                                    <p className="text-gray-500 mb-8">設定誰可以投資您的基金，以及投資的額度限制。</p>
                                    <FeeSetting title="投資人白名單" description="開啟後，只有白名單內的錢包地址才能申購基金份額。" isEnabled={policies.depositorWhitelist.enabled} onToggle={v => setPolicies(p => ({ ...p, depositorWhitelist: { ...p.depositorWhitelist, enabled: v } }))}>
                                        <div><label htmlFor="depositorWhitelist" className="block text-sm font-medium text-gray-700">錢包地址列表</label><textarea id="depositorWhitelist" rows={3} placeholder="每行一個地址，例如：0x..." className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg"></textarea></div>
                                    </FeeSetting>
                                    <FeeSetting title="申購限額" description="設定單次申購的最低和最高金額限制。" isEnabled={policies.depositLimits.enabled} onToggle={v => setPolicies(p => ({ ...p, depositLimits: { ...p.depositLimits, enabled: v } }))}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label htmlFor="minDeposit" className="block text-sm font-medium text-gray-700">最低申購金額</label><input type="number" id="minDeposit" placeholder="0" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                            <div><label htmlFor="maxDeposit" className="block text-sm font-medium text-gray-700">最高申購金額</label><input type="number" id="maxDeposit" placeholder="10000" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                        </div>
                                    </FeeSetting>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">份額轉讓性</h2>
                                    <p className="text-gray-500 mb-8">控制您基金的份額是否可以在二級市場自由流動。</p>
                                    <FeeSetting title="限制份額轉讓" description="開啟後，只有白名單內的地址才能接收基金份額的轉讓。" isEnabled={policies.shareTransferWhitelist.enabled} onToggle={v => setPolicies(p => ({ ...p, shareTransferWhitelist: { ...p.shareTransferWhitelist, enabled: v } }))}>
                                        <div><label htmlFor="shareTransferWhitelist" className="block text-sm font-medium text-gray-700">接收方白名單地址</label><textarea id="shareTransferWhitelist" rows={3} placeholder="每行一個地址" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg"></textarea></div>
                                    </FeeSetting>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">贖回策略</h2>
                                    <p className="text-gray-500 mb-8">設定投資人如何以及何時可以贖回他們的資產。</p>
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h3 className="text-lg font-semibold">份額鎖倉期</h3>
                                        <p className="text-sm text-gray-600 mt-1">設定投資人申購後，其份額需要鎖定一段時間後才能贖回。 <span className="font-semibold text-amber-600">此為半永久性設定。</span></p>
                                        <div className="mt-4"><label htmlFor="lockupPeriod" className="block text-sm font-medium text-gray-700">鎖倉時間 (小時)</label><input type="number" id="lockupPeriod" defaultValue="0" placeholder="例如：72" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 6 && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">資產管理策略</h2>
                                    <p className="text-gray-500 mb-8">定義基金經理可以投資哪些資產以及與哪些 DeFi 協議互動。</p>
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h3 className="text-lg font-semibold">資產白名單</h3>
                                        <p className="text-sm text-gray-600 mt-1">基金經理只能購買和持有在此白名單中的資產。</p>
                                        <div className="mt-4"><label htmlFor="assetWhitelist" className="block text-sm font-medium text-gray-700">資產地址列表</label><textarea id="assetWhitelist" rows={3} placeholder="每行一個資產合約地址" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg"></textarea></div>
                                    </div>
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h3 className="text-lg font-semibold">協議白名單</h3>
                                        <p className="text-sm text-gray-600 mt-1">基金經理只能與在此白名單中的 DeFi 協議進行互動。</p>
                                        <div className="mt-4"><label htmlFor="protocolWhitelist" className="block text-sm font-medium text-gray-700">協議合約地址列表</label><textarea id="protocolWhitelist" rows={3} placeholder="每行一個協議合約地址" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg"></textarea></div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 pt-5 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <button type="button" onClick={handlePrev} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentStep === 1}>上一步</button>
                                    {currentStep < totalSteps ? (
                                        <button type="button" onClick={handleNext} className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition">下一步</button>
                                    ) : (
                                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed" disabled={isSubmitting || !fundName || !fundSymbol}>
                                            {isSubmitting ? '交易處理中...' : '創建基金'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 text-center text-sm">
                                {isSubmitting && !txHash && <p className="text-gray-600">正在送出交易，請在您的錢包中確認...</p>}
                                {txHash && <p className="text-blue-600">交易已送出！等待區塊鏈確認中...</p>}
                                {txHash && (
                                    <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                                        在 Etherscan 上查看交易
                                    </a>
                                )}
                                {error && <p className="text-red-600 font-semibold mt-2">錯誤: {error}</p>}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateFundPage;