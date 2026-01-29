import React, { useState, useEffect, useRef } from 'react';
import {
    BarChart3, Upload, RefreshCw, Database, Layers, Zap, CheckCircle2,
    AlertCircle, FileSpreadsheet, TrendingUp, MessageSquare, Send, Table,
    LayoutDashboard, X, Bot, User, Activity, Cpu, ArrowRight, Maximize2,
    Trash2, BarChart, Grid, ChevronRight, Paperclip, Sparkles, Minimize2,
    Search, Info, ArrowUpRight, Download, Eye, Settings, ShieldCheck,
    Terminal, PieChart, ChevronUp, Globe, Lock, BrainCircuit, Workflow
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement,
    ArcElement, Title, Tooltip, Legend, Filler
);

const API_URL = import.meta.env.VITE_API_;

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

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [chatMessages]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/analyze`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await response.text());
            const result = await response.json();
            setData(result);
            setChatMessages([{
                role: 'bot',
                content: `**Analysis complete.** Dataset \`${result.metadata.filename}\` loaded with **${result.metadata.rows.toLocaleString()}** entries. How can I help you explore this data?`
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
                body: JSON.stringify({ context: data, question: input }),
            });
            const result = await response.json();
            setChatMessages(prev => [...prev, { role: 'bot', content: result.answer }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'bot', content: "Connection lost. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const SuggestedQuestions = ["Primary trends?", "Key anomalies", "Correlation overview"];

    const ChartRenderer = ({ viz, isFull = false }) => {
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: viz.type === 'pie' || isFull,
                    position: 'bottom',
                    labels: { color: '#e2e8f0', font: { size: 10, family: 'Inter' }, usePointStyle: true }
                },
                tooltip: {
                    backgroundColor: '#0a0a0b',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { weight: 'bold', family: 'Inter' },
                    bodyFont: { family: 'Inter' },
                }
            },
            scales: viz.type === 'pie' ? {} : {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    ticks: { color: '#94a3b8', font: { size: 10, family: 'Inter' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 10, family: 'Inter' } }
                }
            }
        };

        const chartColors = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'];
        const chartData = {
            labels: viz.labels || viz.x,
            datasets: [{
                label: viz.title,
                data: viz.values || viz.y,
                backgroundColor: viz.type === 'pie' ? chartColors : 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: viz.type === 'line' ? 2 : 0,
                tension: 0.4,
                fill: viz.type === 'line',
                borderRadius: 4,
            }]
        };

        return (
            <div className={`${isFull ? 'h-[500px]' : 'h-48'} w-full mt-4`}>
                {viz.type === 'bar' && <Bar data={chartData} options={options} />}
                {viz.type === 'line' && <Line data={chartData} options={options} />}
                {viz.type === 'pie' && <Pie data={chartData} options={options} />}
                {viz.type === 'scatter' && <Scatter data={chartData} options={options} />}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white font-['Inter'] selection:bg-indigo-500/30 overflow-hidden flex flex-col grid-lines bg-aurora">

            {/* Premium Navigation */}
            <header className="h-16 shrink-0 glass-surface fixed top-0 w-full z-[100] px-8 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        <Workflow className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-shiny">ANALYTIX</h1>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-500 uppercase tracking-widest">v1.2</span>
                </div>

                {data && (
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setActiveTab('insights')} className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'insights' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}>Dashboard</button>
                        <button onClick={() => setActiveTab('preview')} className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'preview' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}>Registry</button>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {data && (
                        <button onClick={() => { setData(null); setChatMessages([]); setIsChatOpen(false); }} className="text-[10px] font-bold uppercase text-zinc-500 hover:text-rose-500 transition-all flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" /> Reset
                        </button>
                    )}
                    <div className="h-5 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-gentle" /> Live
                    </div>
                </div>
            </header>

            <main className="flex-grow pt-16 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="max-w-[98%] mx-auto p-4 lg:p-8">

                    <AnimatePresence mode="wait">
                        {!data ? (
                            <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-[70vh] flex flex-col items-center justify-center text-center">

                                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">Analyze your data <span className="text-indigo-500">instantly.</span></h1>
                                <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-12">Simply upload your file to get automated insights and beautiful charts in seconds.</p>

                                <div className="w-full max-w-md">
                                    <input type="file" id="dataFile" className="hidden" onChange={handleFileUpload} accept=".csv,.xlsx,.xls,.json" />
                                    <motion.div
                                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        onClick={() => document.getElementById('dataFile').click()}
                                        className="cursor-pointer glass-surface p-10 rounded-2xl border border-white/10 group transition-all"
                                    >
                                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:text-indigo-500 transition-all border border-indigo-500/20 mx-auto mb-6 group-hover:scale-110 duration-500">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Click to upload your file</h3>
                                        <p className="text-xs text-zinc-500 font-medium">Supports CSV, Excel, and JSON</p>
                                    </motion.div>
                                    {loading && (
                                        <div className="mt-8 flex items-center justify-center gap-4 text-zinc-400">
                                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Processing...</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-32">
                                {activeTab === 'insights' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-full card-luxury p-8 flex flex-col lg:flex-row items-center gap-8 bg-aurora border-indigo-500/20">
                                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                                <Sparkles className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Executive Overview</p>
                                                <p className="text-2xl font-semibold leading-snug text-shiny">{data.metadata.insights}</p>
                                            </div>
                                            <button onClick={() => setIsChatOpen(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl active:scale-95 whitespace-nowrap">Ask Analytix</button>
                                        </div>

                                        <div className="card-luxury p-6 text-center">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Rows</p>
                                            <p className="text-4xl font-bold text-shiny tracking-tight">{data.metadata.rows.toLocaleString()}</p>
                                        </div>
                                        <div className="card-luxury p-6 text-center">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Columns</p>
                                            <p className="text-4xl font-bold text-shiny tracking-tight">{data.metadata.columns}</p>
                                        </div>
                                        <div className="card-luxury p-6 text-center">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Integrity Score</p>
                                            <p className="text-4xl font-bold text-indigo-500 tracking-tight">99.8%</p>
                                        </div>
                                        <div className="card-luxury p-6 text-center">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</p>
                                            <p className="text-2xl font-bold text-emerald-500 tracking-tight flex items-center justify-center gap-2 mt-2">OPTIMAL</p>
                                        </div>

                                        {data.visualizations.map((viz, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${i % 3 === 0 ? 'md:col-span-2' : 'col-span-1'} card-luxury p-8 group`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-1">{viz.title}</h4>
                                                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{viz.type} matrix</p>
                                                    </div>
                                                    <button onClick={() => setFocusedChart(viz)} className="p-2.5 bg-white/5 text-zinc-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white border border-white/5"><Maximize2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <p className="mt-4 text-[10px] text-zinc-500 leading-relaxed italic border-l-2 border-indigo-500/30 pl-4">"{viz.reason}"</p>
                                                <ChartRenderer viz={viz} />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card-luxury overflow-hidden border-white/5 shadow-2xl">
                                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                            <h3 className="text-lg font-bold flex items-center gap-3 text-shiny"><Table className="w-5 h-5 text-indigo-500" /> Data Records</h3>
                                            <button className="px-6 py-2 bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">Download Data</button>
                                        </div>
                                        <div className="overflow-x-auto no-scrollbar">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/[0.03] text-[9px] uppercase tracking-widest text-zinc-500">
                                                    <tr>{Object.keys(data.metadata.preview[0] || {}).map(k => <th key={k} className="p-5 border-b border-white/5">{k}</th>)}</tr>
                                                </thead>
                                                <tbody className="text-xs font-medium text-zinc-400">
                                                    {data.metadata.preview.map((r, i) => <tr key={i} className="hover:bg-indigo-500/[0.02] transition-colors border-b border-white/5">{Object.values(r).map((v, j) => <td key={j} className="p-5 truncate max-w-[200px]">{v ?? '—'}</td>)}</tr>)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* AI Chat Window */}
            <AnimatePresence>
                {data && (
                    <>
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsChatOpen(true)} className="fixed bottom-10 right-10 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[200] border border-white/10">
                            <MessageSquare className="w-7 h-7" />
                        </motion.button>
                        {isChatOpen && (
                            <motion.div initial={{ opacity: 0, y: 100, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-32 right-10 w-[420px] h-[600px] glass-surface rounded-3xl flex flex-col overflow-hidden shadow-heavy z-[201] border border-white/10">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="w-5 h-5 text-white" /></div>
                                        <div><h3 className="text-sm font-bold text-shiny">ANALYTIX AI</h3><p className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-2">Online</p></div>
                                    </div>
                                    <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
                                    {chatMessages.map((m, i) => (
                                        <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-zinc-800' : 'bg-indigo-600'}`}>{m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}</div>
                                            <div className={`p-4 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-white/5 text-zinc-200 ml-12' : 'bg-zinc-900/50 text-white mr-12 border border-white/5'}`}>
                                                <ReactMarkdown>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && <div className="flex gap-4"><div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center animate-pulse"><Bot className="w-4 h-4" /></div><div className="px-4 py-2 border border-white/5 bg-zinc-900/50 rounded-lg"><div className="flex gap-1"><span className="w-1 h-1 bg-white/40 rounded-full animate-bounce" /><span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" /><span className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div></div>}
                                    <div ref={chatEndRef} />
                                </div>
                                <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/5 bg-white/[0.02]">
                                    <div className="flex gap-3">
                                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask anything about the data..." className="flex-grow bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium" />
                                        <button type="submit" disabled={!chatInput.trim() || isTyping} className="w-12 h-12 bg-indigo-600 disabled:opacity-50 rounded-xl flex items-center justify-center shadow-lg"><Send className="w-5 h-5" /></button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Focused Modal */}
            <AnimatePresence>
                {focusedChart && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-5xl glass-surface rounded-[2rem] border border-white/10 overflow-hidden">
                            <div className="p-10 border-b border-white/5 flex items-center justify-between">
                                <div><h2 className="text-3xl font-bold text-shiny">{focusedChart.title}</h2><p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-2">{focusedChart.type} analysis output</p></div>
                                <button onClick={() => setFocusedChart(null)} className="p-5 hover:bg-white/10 rounded-full transition-all text-zinc-500"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="p-10 bg-aurora/10">
                                <div className="p-8 rounded-2xl bg-white/5 border border-white/5 mb-8"><p className="text-zinc-400 font-medium italic">"{focusedChart.reason}"</p></div>
                                <ChartRenderer viz={focusedChart} isFull={true} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
