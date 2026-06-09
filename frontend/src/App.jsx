import { useState, useRef, useEffect } from 'react';
import { UploadCloud, MessageSquare, Send, Loader2, FileText, CheckCircle2, AlertCircle, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [uploadMessage, setUploadMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Upload your PDFs in the sidebar and ask me anything about them.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef(null);

  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok && !data.error) {
        setUploadStatus('success');
        setUploadMessage('Files processed successfully! You can now ask questions.');
      } else {
        setUploadStatus('error');
        setUploadMessage(data.error || data.message || 'Error processing files.');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Failed to connect to the server.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isAsking) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAsking(true);

    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMsg }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error: ' + (data.error || 'Unknown error'), isError: true }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to the server.', isError: true }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 w-80 bg-slate-800 border-r border-slate-700 flex flex-col shadow-xl z-30 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            MultiPDF RAG
          </h1>
          <button 
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Document Upload
          </h2>
          
          <div 
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
              ${files.length > 0 ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className={`w-10 h-10 mb-3 ${files.length > 0 ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="text-sm font-medium text-slate-300">
              {files.length > 0 ? `${files.length} file(s) selected` : 'Click to select PDFs'}
            </span>
            <input 
              type="file" 
              multiple 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className={`mt-6 w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg
              ${files.length === 0 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
              }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit & Process'
            )}
          </button>

          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
              uploadStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {uploadStatus === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{uploadMessage}</span>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
          Powered by Gemini & Langchain
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900 relative min-w-0">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-slate-200">Chat</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm leading-relaxed text-sm md:text-base prose prose-sm md:prose-base max-w-none break-words overflow-hidden ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white' 
                    : msg.isError
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-tl-sm prose-invert prose-p:text-rose-300'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm prose-invert'
                }`}
              >
                {msg.isError ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      System Error
                    </div>
                    <div className="text-xs md:text-sm font-mono whitespace-pre-wrap opacity-90">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-3 md:p-4 text-sm md:text-base text-slate-400 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-800">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 md:py-4 pl-4 md:pl-6 pr-12 md:pr-14 text-sm md:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              disabled={isAsking}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isAsking}
              className="absolute right-2 p-2 md:p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full transition-colors"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}

export default App;
