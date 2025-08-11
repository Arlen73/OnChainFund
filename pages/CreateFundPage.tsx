import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type WalletClient, createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';
import { parseUnits, parseAbi, Address } from 'viem';
import { LifeCycle, Configuration, Policies } from "@enzymefinance/sdk";
import { getContracts, getAssets, Network } from "@enzymefinance/environment";

import Switch from '../components/Switch';
import { useWallet } from '../contexts/WalletContext';
import WalletConnectionPrompt from '../components/WalletConnectionPrompt';

// Helper to convert ethers.js Signer to a Viem WalletClient
const getWalletClient = (signer: any): WalletClient => {
    const provider = signer.provider;
    const account = signer.address;

    if (!provider || !account) {
        throw new Error("Signer must have a provider and an address.");
    }

    return createWalletClient({
        account,
        chain: mainnet, // Assuming mainnet, adjust if your app is multi-chain
        transport: custom(provider.provider), // Use the underlying EIP-1193 provider
    });
};


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
        depositLimits: { enabled: false, min: 1000, max: 100000 },
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
            const walletClient = getWalletClient(signer);
            const network = Network.ETHEREUM; // Assuming Ethereum Mainnet
            const contracts = getContracts(network);
            const assets = getAssets(network);

            // 1. Denomination Asset
            const selectedDenominationAsset = (assets as any)[denominationAsset.toLowerCase()];
            if (!selectedDenominationAsset) {
                throw new Error(`Unsupported denomination asset: ${denominationAsset}`);
            }

            // 2. Fee Configuration
            const feeSettings = [];
            if (fees.management.enabled) {
                feeSettings.push({
                    address: contracts.ManagementFee,
                    settings: Configuration.Fees.Management.encodeSettings({
                        rate: parseUnits(String(fees.management.rate / 100), 18),
                        scaledRate: parseUnits(String(fees.management.rate / 100), 18),
                    }),
                });
            }
            if (fees.performance.enabled) {
                feeSettings.push({
                    address: contracts.PerformanceFee,
                    settings: Configuration.Fees.Performance.encodeSettings({
                        rate: parseUnits(String(fees.performance.rate / 100), 18),
                        scaledRate: parseUnits(String(fees.performance.rate / 100), 18),
                        highWaterMark: parseUnits("1.0", 18),
                    }),
                });
            }
            if (fees.entrance.enabled) {
                feeSettings.push({
                    address: contracts.EntranceFee,
                    settings: Configuration.Fees.Entrance.encodeSettings({
                        rate: parseUnits(String(fees.entrance.rate / 100), 18),
                        scaledRate: parseUnits(String(fees.entrance.rate / 100), 18),
                    }),
                });
            }
            if (fees.exit.enabled) {
                feeSettings.push({
                    address: contracts.ExitFee,
                    settings: Configuration.Fees.Exit.encodeSettings({
                        rate: parseUnits(String(fees.exit.rate / 100), 18),
                        scaledRate: parseUnits(String(fees.exit.rate / 100), 18),
                    }),
                });
            }
            const feeManagerConfig = Configuration.Fees.encodeSettings({ fees: feeSettings });


            // 3. Policy Configuration
            const policySettings = [];
            if (policies.depositLimits.enabled) {
                policySettings.push({
                    address: contracts.MinMaxInvestmentPolicy,
                    settings: Policies.MinMaxInvestment.encodeSettings({
                        minInvestmentAmount: parseUnits(String(policies.depositLimits.min), selectedDenominationAsset.decimals),
                        maxInvestmentAmount: parseUnits(String(policies.depositLimits.max), selectedDenominationAsset.decimals),
                    }),
                });
            }
            if (policies.depositorWhitelist.enabled) {
                const addresses = policies.depositorWhitelist.list.split('\n').filter(addr => addr.startsWith('0x')).map(addr => addr.trim() as Address);
                policySettings.push({
                    address: contracts.AllowedDepositRecipientsPolicy,
                    settings: Policies.AllowedDepositRecipients.encodeSettings({
                        existingListIds: [],
                        newListsArgs: [{ updateType: 0n, initialItems: addresses }],
                    }),
                });
            }
             if (policies.shareTransferWhitelist.enabled) {
                const addresses = policies.shareTransferWhitelist.list.split('\n').filter(addr => addr.startsWith('0x')).map(addr => addr.trim() as Address);
                policySettings.push({
                    address: contracts.AllowedSharesTransferRecipientsPolicy,
                    settings: Policies.AllowedSharesTransferRecipients.encodeSettings({
                        existingListIds: [],
                        newListsArgs: [{ updateType: 0n, initialItems: addresses }],
                    }),
                });
            }
            const policyManagerConfig = Configuration.Policies.encodeSettings(policySettings);

            // 4. Create Vault Transaction
            const { request } = LifeCycle.createVault({
                fundDeployer: contracts.FundDeployer,
                owner: signer.address,
                name: fundName,
                symbol: fundSymbol,
                denominationAsset: selectedDenominationAsset.address,
                sharesActionTimelockInSeconds: 0n, // No timelock for simplicity
                feeManagerConfigData: feeManagerConfig,
                policyManagerConfigData: policyManagerConfig,
            });

            // 5. Send Transaction
            const hash = await walletClient.sendTransaction(request);
            setTxHash(hash);

            alert('基金創建成功！交易已送出，正在等待區塊鏈確認。');
            navigate('/dashboard/manager');

        } catch (err: any) {
            const errorMessage = err.shortMessage || err.message || '發生未知錯誤';
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
                                        <div>
                                            <label htmlFor="depositorWhitelist" className="block text-sm font-medium text-gray-700">錢包地址列表</label>
                                            <textarea id="depositorWhitelist" value={policies.depositorWhitelist.list} onChange={e => setPolicies(p => ({ ...p, depositorWhitelist: { ...p.depositorWhitelist, list: e.target.value } }))} rows={3} placeholder="每行一個地址，例如：0x..." className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                                        </div>
                                    </FeeSetting>
                                    <FeeSetting title="申購限額" description="設定單次申購的最低和最高金額限制。" isEnabled={policies.depositLimits.enabled} onToggle={v => setPolicies(p => ({ ...p, depositLimits: { ...p.depositLimits, enabled: v } }))}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label htmlFor="minDeposit" className="block text-sm font-medium text-gray-700">最低申購金額</label><input type="number" id="minDeposit" value={policies.depositLimits.min} onChange={e => setPolicies(p => ({ ...p, depositLimits: { ...p.depositLimits, min: +e.target.value } }))} placeholder="0" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                            <div><label htmlFor="maxDeposit" className="block text-sm font-medium text-gray-700">最高申購金額</label><input type="number" id="maxDeposit" value={policies.depositLimits.max} onChange={e => setPolicies(p => ({ ...p, depositLimits: { ...p.depositLimits, max: +e.target.value } }))} placeholder="10000" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" /></div>
                                        </div>
                                    </FeeSetting>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">份額轉讓性</h2>
                                    <p className="text-gray-500 mb-8">控制您基金的份額是否可以在二級市場自由流動。</p>
                                     <FeeSetting title="限制份額轉讓" description="開啟後，只有白名單內的地址才能接收基金份額的轉讓。" isEnabled={policies.shareTransferWhitelist.enabled} onToggle={v => setPolicies(p => ({ ...p, shareTransferWhitelist: { ...p.shareTransferWhitelist, enabled: v } }))}>
                                        <div>
                                            <label htmlFor="shareTransferWhitelist" className="block text-sm font-medium text-gray-700">接收方白名單地址</label>
                                            <textarea id="shareTransferWhitelist" value={policies.shareTransferWhitelist.list} onChange={e => setPolicies(p => ({ ...p, shareTransferWhitelist: { ...p.shareTransferWhitelist, list: e.target.value } }))} rows={3} placeholder="每行一個地址" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                                        </div>
                                    </FeeSetting>
                                </div>
                            )}

                            {/* Steps 5, 6, 7 are not implemented yet */}
                            {currentStep >= 5 && (
                                <div className="space-y-6">
                                     <h2 className="text-3xl font-bold text-gray-900 mb-2">功能開發中</h2>
                                     <p className="text-gray-500 mb-8">此功能仍在開發中，敬請期待。</p>
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