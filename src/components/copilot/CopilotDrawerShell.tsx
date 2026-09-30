import React, { useState } from 'react';
import { Bot, Send, Sparkles, FileText, Database, ShieldAlert } from 'lucide-react';
import { Drawer } from '../common/Drawer';

interface CopilotDrawerShellProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CopilotDrawerShell: React.FC<CopilotDrawerShellProps> = ({
  isOpen,
  onClose,
}) => {
  const [question, setQuestion] = useState('');

  const quickQuestions = [
    'Which PHCs in my district run out of ORS in 10 days?',
    'Summarize current stockout risk for Paracetamol 500mg',
    'Show pending redistribution proposals for Block-A',
    'Explain recent resilience score drop in TN-D01',
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="MEDEx Gemini Copilot"
      subtitle="Guarded natural-language assistant over approved SQL views"
      width="lg"
    >
      <div className="flex flex-col h-[calc(100vh-7rem)] justify-between font-sans">
        {/* Guardrail Banner */}
        <div className="p-3 bg-medex-cyan/10 border border-medex-cyan/30 rounded-md text-2xs text-medex-cyan-light mb-4 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-medex-cyan" />
          <div>
            <span className="font-semibold block font-mono">GUARDED QUERY POLICY</span>
            Gemini reads approved views only (`v_risk_current`, `v_stock_latest`, `v_forecast_daily`, `v_transfers`, `v_resilience_weekly`). Out-of-scope prompts trigger HTTP 200 refusals.
          </div>
        </div>

        {/* Conversation Log Shell */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Welcome Message */}
          <div className="medex-panel p-4 bg-medex-surface/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-medex-cyan/15 text-medex-cyan shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-medex-primary">
                  MEDEx Intelligence Copilot
                </span>
                <span className="text-2xs font-mono text-medex-muted">Ready</span>
              </div>
              <p className="text-xs text-medex-secondary mt-1 leading-relaxed">
                Hello Meenachi! Ask me any operational question about medicine stock, demand forecasts, stock-out probabilities, or transfer recommendations in your assigned district scope.
              </p>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5 text-2xs font-mono font-semibold uppercase text-medex-muted">
              <Sparkles className="w-3 h-3 text-medex-cyan" />
              <span>Suggested Operational Questions</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="text-left p-2.5 rounded-md bg-medex-surface border border-medex-border text-xs text-medex-secondary hover:text-medex-primary hover:border-medex-cyan/40 transition-all font-mono text-2xs"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Bar Shell */}
        <div className="pt-4 border-t border-medex-border mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!question.trim()) return;
              setQuestion('');
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question (e.g. Which PHCs need ORS?)..."
              className="w-full bg-medex-surface border border-medex-border text-medex-primary text-xs rounded-lg pl-3 pr-10 py-2.5 placeholder:text-medex-muted focus:outline-none focus:border-medex-cyan/50 focus:ring-1 focus:ring-medex-cyan/30"
            />
            <button
              type="submit"
              disabled={!question.trim()}
              className="absolute right-2 p-1.5 rounded-md bg-medex-cyan text-medex-bg disabled:opacity-30 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-2xs font-mono text-medex-muted mt-2 px-1">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-medex-cyan" />
              API: POST /copilot/ask
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Logged to Audit Log
            </span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
