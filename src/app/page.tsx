"use client";

import { useState, useRef, useEffect } from "react";
import { AgentLog } from "../agent/agent-controller";

export default function Home() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [userInput, setUserInput] = useState("Hi, I'm Rahul M. (Customer CUST-001). I want a refund for my order ORD-1234 please.");
  
  // Refs for auto-scrolling all 3 panels
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const stateEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    stateEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const startAgent = async () => {
    if (!userInput.trim()) return;
    setLogs([]);
    setIsRunning(true);
    
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6)) as AgentLog;
            setLogs(prev => [...prev, data]);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case "GATHERING": return "text-[#0A84FF]";
      case "CHECKING_FRAUD": return "text-[#BF5AF2]";
      case "CHECKING_POLICY": return "text-[#FF9F0A]";
      case "EXECUTING": return "text-[#FF375F]";
      case "ADAPTING": return "text-[#FFD60A]";
      case "RESOLVED": return "text-[#32D74B]";
      case "ESCALATED": return "text-[#FF453A]";
      default: return "text-[#8E8E93]";
    }
  };

  const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
  );
  
  const EscalateIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  );

  return (
    <main className="h-screen p-4 md:p-6 flex flex-col items-center justify-center relative z-10 selection:bg-white/20 overflow-hidden">
      
      <div className="w-full max-w-[98vw] 2xl:max-w-[90vw] flex flex-col h-full">
        {/* HEADER SECTION (Made smaller) */}
        <header className="mb-6 text-center flex flex-col items-center mt-2 flex-shrink-0">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white mb-2">
            Autonomous Resolution.
          </h1>
          <p className="text-base text-[#EBEBF5]/60 tracking-tight font-light max-w-2xl mb-4">
            The next generation of agentic intelligence. Capable of reasoning, adapting, and resolving enterprise support requests in real-time.
          </p>
          
          <div className="flex flex-col items-center gap-3 w-full max-w-4xl">
            <div className="relative w-full group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff2a4a] to-[#ff0055] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <textarea
                className="relative w-full bg-[#1C1C1E]/80 backdrop-blur-xl text-base text-white rounded-2xl border border-white/10 p-4 focus:outline-none focus:border-white/30 min-h-[90px] resize-none shadow-2xl transition-all"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask the agent to resolve an issue..."
                disabled={isRunning}
              />
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 w-full">
              <button
                onClick={() => setUserInput("Hi, I'm Rahul M. (Customer CUST-001). I want a refund for my order ORD-1234 please.")}
                className="px-5 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:border-[#ff2a4a] hover:shadow-[0_0_15px_rgba(255,42,74,0.3)] transition-all"
              >
                Standard Flow
              </button>
              <button
                onClick={() => setUserInput("Hi, I am Steve (Customer CUST-007). I want a refund for order ORD-9999.")}
                className="px-5 py-2 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:border-[#ff2a4a] hover:shadow-[0_0_15px_rgba(255,42,74,0.3)] transition-all"
              >
                Fraud Flow
              </button>
              <div className="flex-1"></div>
              <button
                onClick={startAgent}
                disabled={isRunning || !userInput.trim()}
                className={`px-8 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isRunning 
                    ? 'bg-[#2C2C2E] text-[#8E8E93] cursor-not-allowed' 
                    : 'bg-white text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(255,42,74,0.4)] shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                }`}
              >
                {isRunning ? 'Processing...' : 'Resolve Issue'}
              </button>
            </div>
          </div>
        </header>

        {/* 3-PANEL ARCHITECTURE (Now much taller) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 w-full mb-4">
          
          {/* PANEL 1: Chat Interface */}
          <div className="glass-panel flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-center flex-shrink-0">
              <h2 className="font-medium text-xs tracking-widest uppercase text-white/50">Request Context</h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6 flex flex-col">
              {isRunning || logs.length > 0 ? (
                <div className="stagger-enter self-end max-w-[85%]">
                  <div className="msg-bubble-user p-4 text-[15px] leading-relaxed">
                    {userInput}
                  </div>
                </div>
              ) : (
                <div className="m-auto text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="text-[#8E8E93] text-sm">Awaiting prompt</p>
                </div>
              )}
              
              {logs.length > 0 && (
                <div className="stagger-enter self-start max-w-[85%]" style={{animationDelay: '0.2s'}}>
                  <div className="msg-bubble-agent p-4 text-[15px] leading-relaxed flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff2a4a] to-[#ff0055] flex-shrink-0 mt-0.5"></div>
                    <div>Analyzing request and fetching context...</div>
                  </div>
                </div>
              )}

              {logs.some(l => l.state === "RESOLVED" || l.state === "ESCALATED") && (
                <div className="stagger-enter self-start max-w-[85%]" style={{animationDelay: '0.4s'}}>
                  <div className="msg-bubble-agent p-4 text-[15px] leading-relaxed flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff2a4a] to-[#ff0055] flex-shrink-0 mt-0.5"></div>
                    <div>
                      {logs[logs.length-1].state === "RESOLVED" 
                        ? "I've successfully resolved this issue. The state has been verified."
                        : "I am unable to safely proceed. I have escalated this case to a human specialist for review."}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* PANEL 2: Reasoning Engine (Terminal) */}
          <div className="glass-panel flex flex-col h-full overflow-hidden relative">
            {isRunning && (
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff2a4a] to-transparent animate-pulse"></div>
            )}
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center flex-shrink-0">
              <h2 className="font-medium text-xs tracking-widest uppercase text-white/50">Reasoning Engine</h2>
              {isRunning && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2a4a] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff2a4a]"></span></span>}
            </div>
            <div className="p-5 flex-1 overflow-y-auto font-mono text-[13px] space-y-4 bg-[#050505]">
              {logs.length === 0 && (
                <div className="text-[#8E8E93] text-center mt-10">Standby</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="stagger-enter flex flex-col gap-1 border-l-2 pl-4 py-1" style={{borderColor: log.state === 'ESCALATED' ? '#FF453A' : '#333'}}>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold tracking-wider text-[10px] uppercase ${getStatusColor(log.state)}`}>
                      {log.state}
                    </span>
                    <span className="text-[#8E8E93] text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                  </div>
                  <span className="text-[#D1D1D6]">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* PANEL 3: Intelligence State */}
          <div className="glass-panel flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-center flex-shrink-0">
              <h2 className="font-medium text-xs tracking-widest uppercase text-white/50">Intelligence State</h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {logs.length > 0 ? (
                <>
                  {/* Widget 1 */}
                  {logs.some(l => l.state === "GATHERING") && (
                    <div className="stagger-enter bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <h3 className="font-medium text-sm text-white">Data Retrieval</h3>
                      </div>
                      <div className="flex justify-between text-sm py-1 border-b border-white/5">
                        <span className="text-[#8E8E93]">Status</span>
                        <span className="text-white">Complete</span>
                      </div>
                      <div className="flex justify-between text-sm py-1 pt-2">
                        <span className="text-[#8E8E93]">Source</span>
                        <span className="text-white">Enterprise DB</span>
                      </div>
                    </div>
                  )}

                  {/* Widget 2 */}
                  {logs.some(l => l.state === "CHECKING_FRAUD" || l.state === "RESOLVED" || l.state === "ESCALATED") && (
                    <div className="stagger-enter bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]" style={{animationDelay: '0.1s'}}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#BF5AF2]/20 flex items-center justify-center text-[#BF5AF2]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <h3 className="font-medium text-sm text-white">Security & Fraud</h3>
                      </div>
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-[#8E8E93]">Evaluation</span>
                        <span className="text-white">Checked</span>
                      </div>
                    </div>
                  )}

                  {/* Widget 3 */}
                  {logs.some(l => l.state === "RESOLVED" || l.state === "ESCALATED") && (
                    <div className="stagger-enter bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]" style={{animationDelay: '0.2s'}}>
                      <div className="flex items-center gap-3 mb-3">
                        {logs[logs.length-1].state === "RESOLVED" ? (
                          <div className="w-8 h-8 rounded-full bg-[#32D74B]/20 flex items-center justify-center text-[#32D74B]">
                            <CheckIcon />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#FF453A]/20 flex items-center justify-center text-[#FF453A]">
                            <EscalateIcon />
                          </div>
                        )}
                        <h3 className="font-medium text-sm text-white">Resolution</h3>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[13px]">
                        {logs[logs.length-1].state === "RESOLVED" ? (
                          <span className="text-[#32D74B]">The objective was successfully accomplished.</span>
                        ) : (
                          <span className="text-[#FF453A]">Action blocked by constraints. Human intervention required.</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="m-auto text-center h-full flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-white/30">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <p className="text-[#8E8E93] text-sm">Dashboard idle</p>
                </div>
              )}
              <div ref={stateEndRef} />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
