import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, User, Send, Sparkles, BookOpen, Code2, Database, Cpu, 
  Layers, Terminal, Copy, Check, Lightbulb, MessageSquare, 
  Settings, RefreshCw, ChevronRight, GraduationCap, ShieldCheck,
  Zap, HelpCircle, FileText
} from 'lucide-react';

export default function App() {
  // Application State
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'tutor',
      text: '¡Hola! Soy el **Profe Alex**, tu Tutor Virtual de Ingeniería de Sistemas y Computación. 🚀\n\n¿En qué tema de tu formación universitaria te puedo ayudar hoy? Podemos revisar temas como:\n- **Arquitectura de Software** (Clean Architecture, Microservicios, CQRS)\n- **Programación & Backend** (C#, .NET, Python, OOP)\n- **Bases de Datos** (SQL Server, PostgreSQL, Indexación, Normalización)\n- **Sistemas Operativos & Redes** (Hilos, Procesos, Concurrencia)\n- **Revisión de Código y Buenas Prácticas**\n\n¿Tienes alguna duda de tu proyecto o guía de laboratorio?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorMode, setTutorMode] = useState('explicativo'); // 'explicativo' | 'socratico' | 'code_review'
  const [activeTopic, setActiveTopic] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [apiKey, setApiKey] = useState(''); // Empty defaults to runtime injected key
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Pedagogical modes definitions
  const modes = [
    {
      id: 'explicativo',
      name: 'Modo Explicativo',
      desc: 'Explicaciones claras, paso a paso, diagramas textuales y teoría fundamental.',
      icon: BookOpen,
      color: 'bg-blue-600'
    },
    {
      id: 'socratico',
      name: 'Modo Socrático',
      desc: 'Te guía con preguntas para que descubras la respuesta por ti mismo.',
      icon: HelpCircle,
      color: 'bg-purple-600'
    },
    {
      id: 'code_review',
      name: 'Revisor de Código',
      desc: 'Enfocado en refactorización, Clean Code, patrones y optimización de complejidad O(n).',
      icon: Code2,
      color: 'bg-emerald-600'
    }
  ];

  // Quick preset questions categorized by topic
  const quickPrompts = [
    {
      topic: 'arch',
      label: 'Explicar Clean Architecture',
      icon: Layers,
      query: '¿Puedes explicarme la arquitectura limpia (Clean Architecture) con un diagrama en texto y las responsabilidades de cada capa?'
    },
    {
      topic: 'db',
      label: 'SQL: JOIN vs LEFT JOIN',
      icon: Database,
      query: '¿Cuál es la diferencia técnica entre INNER JOIN y LEFT JOIN en SQL con un ejemplo práctico de tablas Estudiantes y Cursos?'
    },
    {
      topic: 'os',
      label: 'Proceso vs Thread (Hilo)',
      icon: Cpu,
      query: '¿Cuál es la diferencia fundamental entre un Proceso y un Hilo (Thread) a nivel de espacio de memoria y ejecución en el Sistema Operativo?'
    },
    {
      topic: 'code',
      label: 'Ejemplo C# CQRS + MediatR',
      icon: Terminal,
      query: 'Dame un ejemplo limpio y corto de cómo implementar el patrón CQRS en C# con .NET dividiendo Comandos y Consultas.'
    },
    {
      topic: 'hardware',
      label: 'Diseño de Álgebra de Boole',
      icon: Zap,
      query: '¿Cómo simplifico una función lógica de circuito digital usando Mapas de Karnaugh de 4 variables? Dame un ejemplo estructurado.'
    }
  ];

  // Call Gemini API
  const handleSendMessage = async (customQuery = null) => {
    const textToSend = customQuery || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    if (!customQuery) setInputQuery('');
    setIsLoading(true);

    try {
      // Build System Instruction based on pedagogical mode
      let modeInstruction = '';
      if (tutorMode === 'explicativo') {
        modeInstruction = 'Actúa en MODO EXPLICATIVO: Da respuestas claras, estructuradas con títulos, viñetas y ejemplos de código completos con comentarios didácticos.';
      } else if (tutorMode === 'socratico') {
        modeInstruction = 'Actúa en MODO SOCRÁTICO: No des la solución final inmediatamente. Haz preguntas reflexivas que ayuden al estudiante a razonar la lógica, identificar errores de arquitectura o algoritmos paso a paso.';
      } else if (tutorMode === 'code_review') {
        modeInstruction = 'Actúa en MODO REVISOR DE CÓDIGO: Analiza el código buscando errores de compilación, fallos de seguridad, vulnerabilidades, mala nomenclatura, falta de patrones (SOLID) y complejidad computacional O(n). Propón el código refactorizado.';
      }

      const systemPrompt = `Eres el Profe Alex, un apasionado y brillante Profesor Universitario de Ingeniería de Sistemas y Computación con 15 años de experiencia dictando cátedras de Programación (.NET, C#, Python, Java), Bases de Datos (SQL Server, PostgreSQL), Arquitectura de Software, Sistemas Operativos y Redes.

Tu tono debe ser profesional, cercano, motivador, pedagógico y técnicamente riguroso.
Utiliza formato Markdown extenso (negritas, código fuente estilizado con lenguaje explícito como \`\`\`csharp, \`\`\`sql, \`\`\`python, listas y tablas si es conveniente).
${modeInstruction}
Siempre responde en idioma español.`;

      // Build context history for continuous conversation
      const conversationHistory = messages.slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      conversationHistory.push({
        role: 'user',
        parts: [{ text: textToSend }]
      });

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const payload = {
        contents: conversationHistory,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      };

      // Exponential backoff fetch function
      const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
        try {
          const res = await fetch(url, options);
          if (res.status === 429 && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
          }
          return res;
        } catch (err) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
          }
          throw err;
        }
      };

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const botResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
        'Disculpa estimado estudiante, tuve un pequeño problema de conexión con el servidor. ¿Podrías reformular tu pregunta?';

      const newBotMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error('Error fetching Gemini response:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'tutor',
          text: '⚠️ **Error de conexión académica**: No fue posible comunicarme con el motor de IA. Por favor verifica tu conexión a internet o intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (codeText, id) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Basic Markdown Renderer for rich text & code styling
  const renderFormattedMessage = (content, msgId) => {
    // Split text by code blocks ```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    let indexCount = 0;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      const lang = match[1] || 'code';
      const code = match[2].trim();
      const codeSnippetId = `${msgId}-code-${indexCount++}`;

      parts.push({
        type: 'code',
        language: lang,
        code: code,
        id: codeSnippetId
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    return (
      <div className="space-y-3 text-slate-200 leading-relaxed text-sm md:text-base">
        {parts.map((part, idx) => {
          if (part.type === 'code') {
            return (
              <div key={idx} className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-lg">
                <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                    <Terminal size={14} />
                    {part.language.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleCopyCode(part.code, part.id)}
                    className="flex items-center gap-1 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded"
                    title="Copiar código"
                  >
                    {copiedId === part.id ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400 text-xs">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto font-mono text-xs md:text-sm text-emerald-300 leading-relaxed">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }

          // Format regular text (bold, inline code, line breaks)
          const formattedLines = part.content.split('\n').map((line, lIdx) => {
            // Check for markdown headers
            if (line.startsWith('### ')) {
              return <h4 key={lIdx} className="text-base md:text-lg font-bold text-cyan-300 mt-3 mb-1">{line.replace('### ', '')}</h4>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={lIdx} className="text-lg md:text-xl font-bold text-cyan-400 mt-4 mb-2 border-b border-slate-800 pb-1">{line.replace('## ', '')}</h3>;
            }
            if (line.startsWith('# ')) {
              return <h2 key={lIdx} className="text-xl md:text-2xl font-extrabold text-blue-400 mt-4 mb-2">{line.replace('# ', '')}</h2>;
            }

            // Bold parsing (**text**) & Inline Code (`code`)
            const inlineFormatted = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((chunk, cIdx) => {
              if (chunk.startsWith('**') && chunk.endsWith('**')) {
                return <strong key={cIdx} className="font-semibold text-white">{chunk.slice(2, -2)}</strong>;
              }
              if (chunk.startsWith('`') && chunk.endsWith('`')) {
                return (
                  <code key={cIdx} className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700">
                    {chunk.slice(1, -1)}
                  </code>
                );
              }
              return chunk;
            });

            // List items styling
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
              return (
                <div key={lIdx} className="flex items-start gap-2 ml-2 my-0.5">
                  <span className="text-cyan-400 mt-1.5 text-xs">•</span>
                  <span>{inlineFormatted}</span>
                </div>
              );
            }

            return line ? <p key={lIdx} className="min-h-[1.25rem]">{inlineFormatted}</p> : <div key={lIdx} className="h-2" />;
          });

          return <div key={idx} className="space-y-1">{formattedLines}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0 md:w-20'} transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col z-20 relative`}>
        
        {/* Toggle Button for Mobile/Desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-6 bg-cyan-600 hover:bg-cyan-500 text-white p-1 rounded-full shadow-md z-30 transition-transform hidden md:flex"
        >
          <ChevronRight size={16} className={`transform transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30 shrink-0">
              <GraduationCap size={24} />
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <h1 className="font-bold text-sm md:text-base text-white leading-tight">Profe Alex</h1>
                <p className="text-xs text-cyan-400 font-medium truncate">Tutor de Ing. de Sistemas</p>
              </div>
            )}
          </div>
        </div>

        {sidebarOpen ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            {/* Pedagogical Mode Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <Settings size={14} className="text-cyan-400" /> Modo Pedagógico
              </label>
              <div className="space-y-2">
                {modes.map((m) => {
                  const Icon = m.icon;
                  const isSelected = tutorMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setTutorMode(m.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                        isSelected 
                          ? 'bg-slate-800 border-cyan-500/50 text-white shadow-md shadow-cyan-950/40' 
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-2">
                          <span className={`p-1 rounded ${m.color} text-white`}>
                            <Icon size={12} />
                          </span>
                          {m.name}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight pl-6">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Prompts by Subject */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-400" /> Consultas Rápidas
              </label>
              <div className="space-y-1.5">
                {quickPrompts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      disabled={isLoading}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 text-slate-300 hover:text-cyan-300 text-xs transition-colors flex items-center gap-2 group"
                    >
                      <Icon size={14} className="text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Academic Information Card */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <ShieldCheck size={14} /> Cobertura del Plan de Estudios
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Asistencia en Estructuras de Datos, POO, SQL Avanzado, Patrones de Diseño, Redes y Arquitectura de Software.
              </p>
            </div>

          </div>
        ) : (
          /* Collapsed Mini Sidebar Icons */
          <div className="flex-1 py-4 flex flex-col items-center gap-4">
            {modes.map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => { setTutorMode(m.id); setSidebarOpen(true); }}
                  className={`p-2.5 rounded-xl border transition-all ${
                    tutorMode === m.id ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title={m.name}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        )}

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>IA Geminis 3 Flash</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Online
            </span>
          </div>
        )}
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        
        {/* Header Bar */}
        <header className="px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <MessageSquare size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base md:text-lg">Tutor Académico de Ingeniería</h2>
                <span className="bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold">
                  {modes.find(m => m.id === tutorMode)?.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Facultad de Ingeniería y Ciencias Básicas</p>
            </div>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
            title="Reiniciar conversación"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Nueva Sesión</span>
          </button>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => {
            const isTutor = msg.sender === 'tutor';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${isTutor ? 'justify-start' : 'justify-end'}`}
              >
                {/* Tutor Avatar */}
                {isTutor && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/50 shrink-0 mt-1">
                    <Bot size={20} />
                  </div>
                )}

                {/* Message Content Bubble */}
                <div
                  className={`relative group rounded-2xl p-4 md:p-5 max-w-[88%] sm:max-w-[80%] shadow-lg border ${
                    isTutor
                      ? 'bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-sm'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-500/30 text-white rounded-tr-sm'
                  }`}
                >
                  {/* Sender Name & Timestamp */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-slate-800/40 text-[11px]">
                    <span className={`font-semibold ${isTutor ? 'text-cyan-400' : 'text-cyan-100'}`}>
                      {isTutor ? 'Profe Alex' : 'Estudiante'}
                    </span>
                    <span className={isTutor ? 'text-slate-400' : 'text-cyan-100/80'}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Body Text */}
                  {isTutor ? (
                    renderFormattedMessage(msg.text, msg.id)
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</p>
                  )}
                </div>

                {/* Student Avatar */}
                {!isTutor && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                    <User size={20} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator / Loader */}
          {isLoading && (
            <div className="flex gap-3 md:gap-4 max-w-4xl mx-auto justify-start">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Bot size={20} className="animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3 text-slate-400 text-sm">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-xs text-slate-400 font-medium">Profe Alex está redactando la respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 z-10">
          <div className="max-w-4xl mx-auto space-y-2">
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all shadow-inner"
            >
              <textarea
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Escribe tu consulta académica o pega tu código aquí... (Shift + Enter para salto de línea)"
                rows={1}
                className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-400 text-sm focus:outline-none resize-none px-2 max-h-32 min-h-[40px] py-2 custom-scrollbar"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className={`p-3 rounded-lg text-white font-medium transition-all flex items-center justify-center shrink-0 ${
                  inputQuery.trim() && !isLoading
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-950/50 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Send size={18} />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Shift + Enter para enviar varias líneas</span>
              <span className="flex items-center gap-1">
                <Lightbulb size={12} className="text-cyan-400" /> Modo activo: <strong className="text-slate-300">{modes.find(m => m.id === tutorMode)?.name}</strong>
              </span>
            </div>

          </div>
        </div>

      </main>

    </div>
  );
}