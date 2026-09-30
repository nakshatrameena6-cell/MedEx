import React, { useState } from 'react';
import { Bot, Send, Sparkles, FileText, Database, ShieldAlert, AlertTriangle, User, Loader2 } from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { useAuthRole } from '../../context/AuthRoleContext';
import { CopilotAskResponse, Language } from '../../types/api';
import { askCopilot } from '../../services/copilotService';

interface CopilotDrawerShellProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  response?: CopilotAskResponse;
}

export const CopilotDrawerShell: React.FC<CopilotDrawerShellProps> = ({
  isOpen,
  onClose,
}) => {
  const { role, district, user, isMockMode } = useAuthRole();

  const [question, setQuestion] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en-IN');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quickQuestions = [
    'Which PHCs in my district run out of ORS in 10 days?',
    'Summarize current stockout risk for Paracetamol 500mg',
    'Show pending redistribution proposals for Block-A',
    'Explain recent resilience score drop in TN-D01',
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorMessage(null);
    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    const headers: Record<string, string> = {
      'X-Role': role,
      'X-District': district,
      'X-User': user,
    };
    if (isMockMode) {
      headers['X-Mock'] = 'true';
    }

    try {
      const res = await askCopilot(
        {
          question: textToSend.trim(),
          language: selectedLanguage,
        },
        headers
      );

      const botMsg: MessageItem = {
        id: res.query_id || `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response: res,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Copilot error:', err);
      setErrorMessage(err.message || 'Failed to communicate with Copilot service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="MEDEx Gemini Copilot"
      subtitle="Guarded natural-language assistant over approved SQL views"
      width="lg"
    >
      <div className="flex flex-col h-[calc(100vh-7rem)] justify-between font-sans text-left">
        {/* Guardrail Banner */}
        <div className="p-3 bg-medex-cyan/10 border border-medex-cyan/30 rounded-md text-2xs text-medex-cyan-light mb-3 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-medex-cyan" />
          <div>
            <span className="font-semibold block font-mono">GUARDED QUERY POLICY</span>
            Gemini reads approved views only (`v_risk_current`, `v_stock_latest`, `v_forecast_daily`, `v_transfers`, `v_resilience_weekly`). Out-of-scope prompts trigger HTTP 200 refusals.
          </div>
        </div>

        {/* Conversation Log */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Welcome Banner */}
          <div className="medex-panel p-4 bg-medex-surface/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-medex-cyan/15 text-medex-cyan shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-medex-primary">
                  MEDEx Operational Copilot
                </span>
                <span className="text-2xs font-mono text-medex-muted">Ready · {role}</span>
              </div>
              <p className="text-xs text-medex-secondary mt-1 leading-relaxed">
                Ask operational questions about medicine stock, demand forecasts, stock-out probabilities, or transfer recommendations in your assigned district scope.
              </p>
            </div>
          </div>

          {/* Quick Questions Chips if conversation empty */}
          {messages.length === 0 && (
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
                    onClick={() => handleSend(q)}
                    className="text-left p-2.5 rounded-md bg-medex-surface border border-medex-border text-xs text-medex-secondary hover:text-medex-primary hover:border-medex-cyan/40 transition-all font-mono text-2xs"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages History */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="p-2 rounded-lg bg-medex-cyan/15 text-medex-cyan shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 space-y-2 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-medex-cyan text-medex-bg font-semibold rounded-tr-none'
                    : 'bg-medex-surface border border-medex-border text-medex-primary rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-2xs opacity-80 font-mono">
                  <span>{msg.sender === 'user' ? 'You' : 'Gemini Copilot'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="leading-relaxed font-sans">{msg.text}</p>

                {/* Refusal Notice */}
                {msg.response?.refused && (
                  <div className="p-2.5 bg-medex-amber/15 border border-medex-amber/40 rounded text-2xs text-medex-amber-light flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>REFUSED:</strong> {msg.response.refusal_reason || 'Query out of scope.'}
                    </span>
                  </div>
                )}

                {/* Sources List */}
                {msg.response?.sources && msg.response.sources.length > 0 && (
                  <div className="pt-2 border-t border-medex-border/40 text-2xs font-mono text-medex-muted">
                    <span className="font-semibold text-medex-cyan block mb-1">CITED SOURCES:</span>
                    <div className="flex flex-wrap gap-1">
                      {msg.response.sources.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-medex-bg border border-medex-border">
                          {s.view} ({new Date(s.as_of).toLocaleTimeString()})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Returned Data Table */}
                {msg.response?.table && (
                  <div className="pt-2 border-t border-medex-border/40 overflow-x-auto">
                    <table className="w-full text-2xs font-mono text-medex-primary border-collapse">
                      <thead>
                        <tr className="border-b border-medex-border text-medex-muted">
                          {msg.response.table.columns.map((col, idx) => (
                            <th key={idx} className="p-1 text-left uppercase">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.response.table.rows.map((r, rIdx) => (
                          <tr key={rIdx} className="border-b border-medex-border/30">
                            {r.map((cell: any, cIdx: number) => (
                              <td key={cIdx} className="p-1">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="p-2 rounded-lg bg-medex-surface border border-medex-border text-medex-secondary shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-medex-cyan p-3 bg-medex-surface/40 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking... Querying approved SQL views</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-medex-red/15 border border-medex-red/30 rounded-lg text-xs text-medex-red-light flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-medex-border mt-3 space-y-2">
          {/* Language Selector */}
          <div className="flex items-center justify-between text-2xs font-mono text-medex-muted">
            <span>Query Language:</span>
            <div className="flex gap-1">
              {(['en-IN', 'ta-IN', 'hi-IN'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2 py-0.5 rounded ${
                    selectedLanguage === lang
                      ? 'bg-medex-cyan text-medex-bg font-bold'
                      : 'bg-medex-surface text-medex-secondary'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(question);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question (e.g. Which PHCs need ORS?)..."
              disabled={isLoading}
              className="w-full bg-medex-surface border border-medex-border text-medex-primary text-xs rounded-lg pl-3 pr-10 py-2.5 placeholder:text-medex-muted focus:outline-none focus:border-medex-cyan/50"
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="absolute right-2 p-1.5 rounded-md bg-medex-cyan text-medex-bg disabled:opacity-30 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-2xs font-mono text-medex-muted px-1">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-medex-cyan" />
              API: POST /copilot/ask
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Logged to Audit Trail
            </span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
