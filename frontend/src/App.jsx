import React, { useState, useEffect, useRef } from 'react';
import {
    BarChart3,
    Upload,
    RefreshCw,
    Database,
    Layers,
    Zap,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    TrendingUp,
    MessageSquare,
    Send,
    Table,
    LayoutDashboard,
    X,
    Bot,
    User,
    Activity,
    Cpu,
    ArrowRight,
    Maximize2,
    Trash2,
    BarChart,
    Grid,
    ChevronRight,
    Paperclip,
    Sparkles,
    Minimize2,
    Search,
    Info,
    ArrowUpRight,
    Download,
    Eye,
    Settings,
    ShieldCheck,
    Terminal,
    PieChart,
    ChevronUp,
    Globe,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_URL = 'http://localhost:8000';

const App = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('insights');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [focusedChart, setFocusedChart] = useState(null);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(await response.text());
            const result = await response.json();
            setData(result);
            setChatMessages([{
                role: 'bot',
                content: `**Neural Link Established.** Dataset \`${result.metadata.filename}\` parsed. \n\nFound **${result.metadata.rows.toLocaleString()}** nodes of data. How shall we interrogate the patterns?`
            }]);
            setIsChatOpen(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChatSubmit = async (e, customInput = null) => {
        if (e) e.preventDefault();
        const input = customInput || chatInput;
        if (!input.trim() || !data) return;

        const userMsg = { role: 'user', content: input };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsTyping(true);

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: data,
                    question: input
                }),
            });
            const result = await response.json();
            setChatMessages(prev => [...prev, { role: 'bot', content: result.answer }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'bot', content: "Neural feedback error. Re-link system." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const SuggestedQuestions = [
        "Primary insights?",
        "Anomaly detection",
        "Trend analysis",
    ];

    const ChartRenderer = ({ viz, isFull = false }) => {
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500, easing: 'easeOutQuart' },
            plugins: {
                legend: {
                    display: viz.type === 'pie' || isFull,
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 10, weight: '600', family: 'Plus Jakarta Sans' },
                        usePointStyle: true,
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 10,
                    titleFont: { size: 12, weight: 'bold', family: 'Space Grotesk' },
                    bodyFont: { size: 11, family: 'Plus Jakarta Sans' },
                }
            },
            scales: viz.type === 'pie' ? {} : {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
                    ticks: { color: '#475569', font: { size: 10, family: 'Space Grotesk' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#475569', font: { size: 10, family: 'Space Grotesk' }, maxRotation: 45, minRotation: 0 }
                }
            }
        };

        const vibrantColors = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'];

        const chartData = {
            labels: viz.labels || viz.x,
            datasets: [{
                label: viz.title,
                data: viz.values || viz.y,
                backgroundColor: viz.type === 'pie'
                    ? vibrantColors
                    : viz.type === 'line' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.85)',
                borderColor: '#ef4444',
                borderWidth: viz.type === 'line' ? 2 : 0,
                tension: 0.4,
                fill: viz.type === 'line',
                pointRadius: viz.type === 'scatter' ? 5 : 0,
                borderRadius: 8,
            }]
        };

        return (
            <div className={`${isFull ? 'h-[500px]' : 'h-40'} w-full mt-2 transition-all`}>
                {viz.type === 'bar' && <Bar data={chartData} options={options} />}
                {viz.type === 'line' && <Line data={chartData} options={options} />}
                {viz.type === 'pie' && <Pie data={chartData} options={options} />}
                {viz.type === 'scatter' && <Scatter data={chartData} options={options} />}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] text-[#f8fafc] font-['Plus_Jakarta_Sans'] selection:bg-red-500/20 selection:text-red-200 overflow-hidden flex flex-col dot-pattern-dark mesh-dark">

            {/* Neural Header */}
            <header className="h-14 lg:h-16 shrink-0 glass-panel fixed top-0 w-full z-[100] border-b border-white/5 px-6 lg:px-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <motion.div
                        whileHover={{ rotate: 180 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                        <Terminal className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter flex items-center gap-2">
                            AETHER <span className="text-red-600">CORE</span>
                            <span className="text-[10px] border border-red-500/30 text-red-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">v2.5_PRO</span>
                        </h1>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Encrypted Neural Stream
                        </p>
                    </div>
                </div>

                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="hidden lg:flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10"
                    >
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'insights' ? 'bg-white/10 text-red-500 shadow-lg border border-white/10' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Cpu className="w-4 h-4" /> Logic Board
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-white/10 text-red-500 shadow-lg border border-white/10' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Database className="w-4 h-4" /> Registry
                        </button>
                    </motion.div>
                )}

                <div className="flex items-center gap-6">
                    {data && (
                        <button
                            onClick={() => { setData(null); setChatMessages([]); setIsChatOpen(false); }}
                            className="group text-[10px] font-black uppercase text-slate-500 hover:text-red-500 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Purge Cache
                        </button>
                    )}
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="text-right hidden sm:block">
                            <p className="text-[11px] font-black text-white leading-none">Sys_Admin_01</p>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">Authorized</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center p-1">
                            <div className="w-full h-full rounded-full bg-red-600/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-grow pt-20 overflow-hidden flex relative">

                {/* Main Viewport */}
                <main className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="max-w-[1600px] mx-auto p-10 lg:p-16">

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-10 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-5 text-red-500 glass-panel"
                                >
                                    <AlertCircle className="w-6 h-6 shrink-0" />
                                    <div className="flex-grow">
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Neural Interrupt</p>
                                        <p className="text-base font-bold">{error}</p>
                                    </div>
                                    <button onClick={() => setError(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {!data ? (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="min-h-[60vh] flex flex-col items-center justify-center text-center py-12"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                        className="w-32 h-32 border-2 border-dashed border-red-500/20 rounded-full flex items-center justify-center mb-12 relative"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-24 h-24 bg-red-500/5 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                                        >
                                            <Globe className="w-12 h-12 text-red-600" />
                                        </motion.div>
                                    </motion.div>

                                    <h2 className="text-5xl lg:text-6xl font-black tracking-tightest mb-6">
                                        UNIFIED <span className="gradient-text-vibrant">INTELLIGENCE.</span>
                                    </h2>
                                    <p className="text-lg text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed font-medium">
                                        Proprietary EDA Engine for Automated Data Engineering and Logical Synthesis. Inject datasets to begin interrogation.
                                    </p>

                                    <div className="w-full max-w-xl relative group">
                                        <input type="file" id="dataFile" className="hidden" onChange={handleFileUpload} accept=".csv,.xlsx,.xls,.json" />
                                        <motion.div
                                            whileHover={{ scale: 1.02, translateY: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => document.getElementById('dataFile').click()}
                                            className="cursor-pointer p-12 glass-panel rounded-[3rem] border border-white/5 flex flex-col items-center gap-8 transition-all hover:border-red-500/30"
                                        >
                                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-red-500 transition-all border border-white/5">
                                                <Upload className="w-8 h-8" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-white mb-2">Initialize Ingestion</p>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Supports Multi-Format Pipelines</p>
                                            </div>
                                        </motion.div>

                                        {loading && (
                                            <div className="absolute inset-0 glass-panel rounded-[3rem] z-50 flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 border-4 border-red-600/10 border-t-red-600 rounded-full animate-spin mb-8" />
                                                <h3 className="text-2xl font-black text-white">Synthesizing Core...</h3>
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-3 animate-pulse">Running Batch Statistics</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">

                                    {activeTab === 'insights' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                                            {/* AI Executive Card */}
                                            <div className="col-span-full bento-card mesh-dark relative overflow-hidden group shadow-2xl p-10 border-white/10">
                                                <div className="scanline" />
                                                <div className="relative z-10 flex flex-col lg:flex-row items-start gap-10">
                                                    <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] shrink-0">
                                                        <Sparkles className="w-8 h-8 text-white" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] opacity-80">Synthesized Summary Output</span>
                                                            <div className="h-px flex-grow bg-white/10" />
                                                        </div>
                                                        <p className="text-2xl lg:text-3xl font-black text-white leading-tight tracking-tightest">
                                                            {data.metadata.insights}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => setIsChatOpen(true)} className="lg:mt-8 px-10 py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 active:scale-95 shrink-0">
                                                        <MessageSquare className="w-4 h-4" /> Analyze Stream
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Core Metrics */}
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-1 cyber-card glass-panel p-8 text-center border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Observations</p>
                                                <p className="text-4xl font-black text-white tracking-tighter">{data.metadata.rows.toLocaleString()}</p>
                                                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                                                    <CheckCircle2 className="w-4 h-4" /> Validated
                                                </div>
                                            </motion.div>

                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-1 cyber-card glass-panel p-8 text-center border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Dimensions</p>
                                                <p className="text-4xl font-black text-white tracking-tighter">{data.metadata.columns}</p>
                                                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                                                    <Grid className="w-4 h-4" /> Indexed
                                                </div>
                                            </motion.div>

                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-1 cyber-card glass-panel p-8 text-center border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Complexity</p>
                                                <p className="text-4xl font-black text-white tracking-tighter">ADV_L</p>
                                                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                                                    <TrendingUp className="w-4 h-4" /> Rich Patterns
                                                </div>
                                            </motion.div>

                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-1 cyber-card glass-panel p-8 text-center border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Process Integrity</p>
                                                <p className="text-4xl font-black text-white tracking-tighter">99.9</p>
                                                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-purple-500 bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20">
                                                    <Zap className="w-4 h-4" /> Optimal
                                                </div>
                                            </motion.div>

                                            {/* Visualization Grid */}
                                            {data.visualizations.map((viz, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 40 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    key={i}
                                                    className={`${i === 0 || i === 3 ? 'md:col-span-2' : 'col-span-1'} bento-card p-8 group border-white/5`}
                                                >
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-1">{viz.title}</h4>
                                                            <span className="text-[9px] font-black text-red-500 uppercase opacity-60 flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" /> {viz.type} module
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => setFocusedChart(viz)}
                                                            className="p-3 bg-white/5 text-slate-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white border border-white/5"
                                                        >
                                                            <Maximize2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 mb-6">
                                                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-2">"{viz.reason}"</p>
                                                    </div>
                                                    <div className="flex-grow">
                                                        <ChartRenderer viz={viz} />
                                                    </div>
                                                </motion.div>
                                            ))}

                                        </div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="cyber-card glass-panel border-white/10">
                                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                                                <div>
                                                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                                                        <Database className="w-6 h-6 text-red-600" /> Pattern Registry
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">Active Buffer Index • L1 Cache</p>
                                                </div>
                                                <button className="flex items-center gap-3 px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">
                                                    <Download className="w-4 h-4" /> Dump Records
                                                </button>
                                            </div>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-white/5">
                                                            {Object.keys(data.metadata.preview[0] || {}).map(key => (
                                                                <th key={key} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 px-8 whitespace-nowrap">{key}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.metadata.preview.map((row, i) => (
                                                            <tr key={i} className="hover:bg-red-500/5 transition-colors border-b border-white/5 last:border-0 group">
                                                                {Object.values(row).map((val, j) => (
                                                                    <td key={j} className="p-6 px-8 text-xs font-bold text-slate-400 max-w-[250px] truncate group-hover:text-white">
                                                                        {val === null || val === "" ? <span className="opacity-20 text-red-500">NULL_PTR</span> : val.toString()}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Floating AI Interrogator */}
                <AnimatePresence>
                    {data && (
                        <div className="fixed bottom-10 right-10 flex flex-col items-end gap-6 z-[200]">

                            {isChatOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                                    className="w-[400px] lg:w-[450px] h-[650px] glass-panel border-white/10 rounded-[3rem] flex flex-col overflow-hidden shadow-neon"
                                >
                                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-white tracking-widest uppercase">AETHER_OSv2</h3>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Analysis Live
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsChatOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex-grow overflow-y-auto p-8 space-y-10 no-scrollbar">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-slate-700 text-white' : 'bg-red-600 text-white'}`}>
                                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                </div>
                                                <div className={`max-w-[82%] p-6 rounded-3xl text-sm leading-relaxed font-semibold markdown-content ${msg.role === 'user' ? 'bg-white/10 text-white shadow-xl rounded-tr-none border border-white/5' : 'bg-white/5 text-slate-200 border border-white/10 shadow-xl rounded-tl-none'}`}>
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-5">
                                                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="bg-white/5 p-6 rounded-3xl rounded-tl-none border border-white/10 w-24 h-14 flex items-center justify-center shadow-xl">
                                                    <div className="flex gap-2">
                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <div className="px-8 pb-5 flex flex-wrap gap-2">
                                        {SuggestedQuestions.map((q, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleChatSubmit(null, q)}
                                                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-500 hover:border-red-500 hover:text-white transition-all active:scale-95"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>

                                    <form onSubmit={handleChatSubmit} className="p-8 pt-4 bg-white/[0.02] border-t border-white/5">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder="Decrypt system patterns..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-20 text-sm font-bold focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all placeholder:text-slate-600 shadow-inner"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!chatInput.trim() || isTyping}
                                                className="absolute right-2 top-2 w-14 h-14 bg-red-600 disabled:opacity-50 rounded-xl flex items-center justify-center transition-all text-white shadow-lg active:scale-95 z-20"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-neon transition-all z-[210] relative overflow-hidden group ${isChatOpen ? 'bg-white/10 text-white border border-white/20' : 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}
                            >
                                {isChatOpen ? <Minimize2 className="w-9 h-9" /> : <MessageSquare className="w-9 h-9" />}
                            </motion.button>
                        </div>
                    )}
                </AnimatePresence>

                {/* Focus Interrogation Modal */}
                <AnimatePresence>
                    {focusedChart && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] flex items-center justify-center p-10 lg:p-24 bg-black/60 backdrop-blur-3xl"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-5xl cyber-card glass-panel border-white/10 overflow-hidden flex flex-col"
                            >
                                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-4xl font-black text-white tracking-widest uppercase">{focusedChart.title}</h2>
                                        <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                            <Terminal className="w-4 h-4" /> Pattern Interrogation Mode
                                        </p>
                                    </div>
                                    <button onClick={() => setFocusedChart(null)} className="p-4 bg-white/5 hover:bg-red-600 hover:text-white rounded-2xl transition-all border border-white/5">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-10 min-h-0">
                                    <div className="bg-red-500/5 p-8 rounded-3xl border border-red-500/10 mb-10 text-sm font-bold text-slate-400 italic leading-relaxed">
                                        "Observation: {focusedChart.reason}"
                                    </div>
                                    <ChartRenderer viz={focusedChart} isFull={true} />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* System Presence Indicator */}
            <AnimatePresence>
                {data && !isChatOpen && (
                    <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="fixed bottom-36 right-12 max-w-[200px] text-right pointer-events-none">
                        <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-neon">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                                Neural Stream active. <br /> Ask <span className="text-red-500">Aether</span> for patterns.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default App;
