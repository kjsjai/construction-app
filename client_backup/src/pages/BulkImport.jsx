import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Download, Upload, Clock, AlertTriangle, CheckCircle2, XCircle, FileSpreadsheet, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BulkImport = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('download'); // 'download', 'upload', 'history'
  
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isAdminOrManager = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/imports/history');
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.get('/imports/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Swastik_Expense_Entry_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error downloading template');
    }
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    // Auto-preview
    const formData = new FormData();
    formData.append('file', selectedFile);

    setPreviewing(true);
    try {
      const res = await api.post('/imports/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing file preview');
      setPreviewData([]);
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    const validCount = previewData.filter(r => r.isValid).length;
    if (validCount === 0) {
      alert('No valid rows to import.');
      return;
    }

    if (!window.confirm(`Are you sure you want to import ${validCount} valid record(s)?`)) return;

    setImporting(true);
    try {
      const res = await api.post('/imports/confirm', {
        filename: file?.name || 'Imported File',
        records: previewData
      });
      alert(`${res.data.message}\nImported: ${res.data.imported}\nSkipped: ${res.data.skipped}`);
      setFile(null);
      setPreviewData([]);
      setActiveTab('history');
    } catch (error) {
      alert(error.response?.data?.message || 'Error importing records');
    } finally {
      setImporting(false);
    }
  };

  const handleRollback = async (id) => {
    if (!window.confirm('WARNING: This will permanently delete all expenses associated with this import batch. Proceed?')) return;
    
    try {
      await api.post(`/imports/${id}/rollback`);
      fetchHistory();
      alert('Rollback successful. Expenses have been removed.');
    } catch (error) {
      alert(error.response?.data?.message || 'Error rolling back import');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Bulk Import</h1>
          <p className="text-muted text-sm mt-1">Download templates, bulk import expenses, and manage import history.</p>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/10">
          <button 
            onClick={() => setActiveTab('download')} 
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'download' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted hover:bg-muted/20 hover:text-text'}`}
          >
            <Download size={18} /> Download Template
          </button>
          <button 
            onClick={() => setActiveTab('upload')} 
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'upload' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted hover:bg-muted/20 hover:text-text'}`}
          >
            <Upload size={18} /> Upload Expenses
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`flex-1 py-4 px-6 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted hover:bg-muted/20 hover:text-text'}`}
          >
            <Clock size={18} /> Import History
          </button>
        </div>

        <div className="p-8">
          {/* TAB 1: DOWNLOAD */}
          {activeTab === 'download' && (
            <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <FileSpreadsheet size={40} />
              </div>
              <h2 className="text-2xl font-bold text-text mb-4">Expense Entry Template</h2>
              <p className="text-muted mb-8">
                Download a pre-formatted Excel template (.xlsx) with embedded dropdowns synced to your active categories, stages, and funds. Fill out your offline expenses, and re-upload the file on the next tab.
              </p>
              
              <button 
                onClick={handleDownload}
                className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all text-lg"
              >
                <Download size={24} className="mr-3" /> Download .xlsx Template
              </button>

              <div className="mt-12 text-left bg-muted/20 p-6 rounded-2xl w-full border border-border">
                <h3 className="font-bold flex items-center gap-2 text-text mb-2"><AlertCircle size={18} className="text-warning" /> Template Instructions</h3>
                <ul className="list-disc list-inside text-sm text-muted space-y-2">
                  <li>Do not delete or rename the column headers.</li>
                  <li>Columns highlighted in <span className="text-warning font-bold">Yellow</span> are mandatory.</li>
                  <li>Dropdown lists automatically pull your current active options.</li>
                  <li>You can enter up to 100 rows per file.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-8">
              {!previewData.length && !previewing && (
                <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:bg-muted/10 transition-colors flex flex-col items-center justify-center relative">
                  <input 
                    type="file" 
                    accept=".xlsx" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-16 h-16 bg-muted/20 text-muted rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-text mb-2">Drag & Drop or Click to Upload</h3>
                  <p className="text-muted text-sm">Accepts the official .xlsx template format only.</p>
                </div>
              )}

              {previewing && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted font-medium">Parsing Excel file...</p>
                </div>
              )}

              {previewData.length > 0 && !previewing && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileSpreadsheet size={18} className="text-primary" /> {file?.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="bg-success/20 text-success px-2 py-1 rounded-md font-bold">
                          {previewData.filter(r => r.isValid).length} Valid
                        </span>
                        <span className="bg-danger/20 text-danger px-2 py-1 rounded-md font-bold">
                          {previewData.filter(r => !r.isValid).length} Invalid
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setPreviewData([]); setFile(null); }}
                        className="px-4 py-2 border border-border text-muted font-medium rounded-lg hover:bg-muted/30 transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleConfirmImport}
                        disabled={importing || previewData.filter(r => r.isValid).length === 0}
                        className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 flex items-center shadow-lg shadow-primary/20 transition-all text-sm disabled:opacity-50"
                      >
                        {importing ? 'Importing...' : 'Confirm Import'}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-border rounded-xl shadow-sm">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/30 text-muted uppercase text-xs font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Row</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Stage</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className={`border-b border-border last:border-0 ${row.isValid ? 'hover:bg-muted/10' : 'bg-danger/5'}`}>
                            <td className="px-4 py-3">
                              {row.isValid ? (
                                <CheckCircle2 size={18} className="text-success" />
                              ) : (
                                <div className="flex items-center gap-1 text-danger cursor-help" title={row.errors.join(', ')}>
                                  <AlertTriangle size={18} />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted">#{row.row}</td>
                            <td className="px-4 py-3 font-medium text-text">{row.date}</td>
                            <td className="px-4 py-3 text-text truncate max-w-[200px]">{row.description}</td>
                            <td className="px-4 py-3 text-muted">{row.stage}</td>
                            <td className="px-4 py-3 text-muted">{row.category}</td>
                            <td className="px-4 py-3 font-bold text-text">₹{row.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted">
                  <Clock size={40} className="mx-auto mb-4 opacity-50" />
                  <p>No import history found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(item => (
                    <div key={item.id} className="flex flex-col md:flex-row items-center justify-between p-5 bg-card border border-border rounded-xl hover:shadow-md transition-all gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <FileSpreadsheet size={24} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-text truncate">{item.filename}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted mt-1">
                            <span>{new Date(item.import_date).toLocaleString()}</span>
                            <span>•</span>
                            <span>{item.row_count} rows imported</span>
                            <span>•</span>
                            <span className="font-semibold text-text">₹{Number(item.total_amount).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          item.status === 'Success' ? 'bg-success/20 text-success' : 
                          item.status === 'Rolled Back' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                        }`}>
                          {item.status}
                        </span>
                        
                        {isAdminOrManager && item.status !== 'Rolled Back' && (
                          <button 
                            onClick={() => handleRollback(item.id)}
                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                            title="Rollback Import"
                          >
                            <RotateCcw size={16} /> Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
