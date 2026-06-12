import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';

const ImportModal = ({ isOpen, onClose, type, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = `/import/${type}`;
      const res = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult({ type: 'success', data: res.data });
      if (onSuccess) onSuccess();
    } catch (error) {
      setResult({ 
        type: 'error', 
        message: error.response?.data?.message || 'Import failed. Please check the file format.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(`/import/template/${type}`, {
        responseType: 'blob'
      });
      console.log('Template response:', res);
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      console.log('Created blob:', blob);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      console.log('Download triggered');
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download failed', error);
      let message = 'Check connection';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errData = JSON.parse(text);
          message = errData.message || message;
        } catch (e) {
          message = 'Server error';
        }
      } else {
        message = error.response?.data?.message || error.message || message;
      }
      alert(`Failed to download template: ${message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl overflow-hidden relative shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div>
            <h2 className="text-xl font-bold text-text uppercase tracking-tight">Import {type}</h2>
            <p className="text-muted text-xs mt-1">Upload your spreadsheet to bulk add data.</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!result ? (
            <div className="space-y-8">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                  file 
                    ? "border-primary bg-primary/5 shadow-inner" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileUpload').click()}
              >
                <input 
                  type="file" 
                  id="fileUpload" 
                  className="hidden" 
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                  file ? "bg-primary text-primary-foreground scale-110 rotate-3" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">
                  {file ? file.name : "Choose a file to import"}
                </h3>
                <p className="text-xs text-muted max-w-xs leading-relaxed">
                  {file 
                    ? `Size: ${(file.size / 1024).toFixed(1)} KB` 
                    : "Drag and drop your .xlsx or .xls file here, or click to browse your computer."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-all uppercase tracking-widest group"
                >
                  <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                  Get Sample Template
                </button>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border text-text font-bold text-xs uppercase tracking-widest hover:bg-muted transition-all">
                    Cancel
                  </button>
                  <button 
                    onClick={handleImport}
                    disabled={!file || loading}
                    className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {loading ? 'Processing...' : 'Upload Now'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {result.type === 'success' ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-in zoom-in-50 duration-300">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-text mb-2">Import Successful!</h3>
                  <div className="bg-muted/30 rounded-2xl p-4 mb-8">
                    <div className="flex justify-around">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Created</p>
                        <p className="text-2xl font-bold text-green-600">{result.data.successCount}</p>
                      </div>
                      <div className="w-px bg-border h-10 self-center"></div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Skipped</p>
                        <p className="text-2xl font-bold text-amber-500">{result.data.errorCount}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                    Done & View Records
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-500/10 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-in zoom-in-50 duration-300">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-text mb-2">Import Error</h3>
                  <p className="text-sm text-muted mb-8 max-w-sm mx-auto leading-relaxed">{result.message}</p>
                  <button onClick={() => setResult(null)} className="w-full py-3.5 rounded-2xl border border-border text-text font-bold text-sm uppercase tracking-widest transition-all hover:bg-muted">
                    Retry Upload
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
