import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Calendar, Save, CheckCircle2 } from 'lucide-react';

const Phases = () => {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const { user } = useAuth();
  const canEdit = ['admin', 'manager'].includes(user?.role);

  const fetchPhases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/phases');
      setPhases(res.data);
    } catch (error) {
      console.error('Error fetching phases', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  const handleEdit = (phase) => {
    setEditingId(phase.id);
    setEditForm({
      start_date: phase.start_date || '',
      end_date: phase.end_date || ''
    });
  };

  const handleSave = async (phase) => {
    try {
      await api.put(`/phases/${phase.id}`, {
        ...phase,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null
      });
      setEditingId(null);
      fetchPhases();
    } catch (error) {
      console.error('Failed to update phase', error);
      alert('Failed to update phase dates.');
    }
  };

  // Gantt Chart Calculations
  const validStarts = phases.map(p => p.start_date).filter(Boolean);
  const validEnds = phases.map(p => p.end_date).filter(Boolean);
  
  const minDateStr = validStarts.sort()[0];
  const maxDateStr = validEnds.sort().reverse()[0];

  const minDate = minDateStr ? new Date(minDateStr) : new Date();
  const maxDate = maxDateStr ? new Date(maxDateStr) : new Date(minDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  let totalDuration = maxDate - minDate;
  if (totalDuration === 0) totalDuration = 24 * 60 * 60 * 1000; // avoid div by zero

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Construction Phases</h1>
          <p className="text-muted text-sm mt-1">Track project timeline and costs incurred across construction stages.</p>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider w-1/4">Phase Name</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider w-1/6">Cost Incurred</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider w-1/6">Timeline</th>
                <th className="p-4 text-xs font-bold text-muted uppercase tracking-wider">Gantt Visualization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="4" className="p-6 text-center text-muted">Loading timeline...</td></tr>
              ) : phases.map((phase, i) => {
                const isEditing = editingId === phase.id;
                
                // Calculate Gantt bar
                let left = 0;
                let width = 0;
                if (phase.start_date) {
                  const s = new Date(phase.start_date);
                  left = Math.max(0, ((s - minDate) / totalDuration) * 100);
                  if (phase.end_date) {
                    const e = new Date(phase.end_date);
                    width = Math.max(1, ((e - s) / totalDuration) * 100);
                  } else {
                    width = 2; // small indicator
                  }
                }

                // Make sure it doesn't overflow 100%
                if (left + width > 100) width = 100 - left;

                return (
                  <tr key={phase.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-xs">{i + 1}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-text">{phase.name.replace(/^\d+\./, '')}</p>
                          <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mt-0.5">{phase.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-text tracking-tight">{formatCurrency(phase.total_cost)}</span>
                    </td>
                    <td className="p-4">
                      {isEditing && canEdit ? (
                        <div className="flex flex-col gap-2">
                          <input type="date" value={editForm.start_date} onChange={e => setEditForm({...editForm, start_date: e.target.value})} className="bg-input border border-border rounded-md px-2 py-1 text-xs text-text focus:ring-1 focus:ring-primary outline-none" />
                          <input type="date" value={editForm.end_date} onChange={e => setEditForm({...editForm, end_date: e.target.value})} className="bg-input border border-border rounded-md px-2 py-1 text-xs text-text focus:ring-1 focus:ring-primary outline-none" />
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => handleSave(phase)} className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md font-bold flex items-center"><Save size={12} className="mr-1" /> Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs bg-muted text-text px-2 py-1 rounded-md font-bold">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="group/time relative">
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <Calendar size={12} />
                            <span>
                              {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : 'TBD'} - {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'TBD'}
                            </span>
                          </div>
                          {canEdit && (
                            <button onClick={() => handleEdit(phase)} className="text-[10px] text-primary font-bold mt-1 opacity-0 group-hover/time:opacity-100 transition-opacity">Edit Dates</button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 relative min-w-[200px]">
                      <div className="w-full h-8 bg-muted/20 rounded-lg relative overflow-hidden border border-border">
                        {phase.start_date && (
                          <div 
                            className="absolute top-0 bottom-0 bg-primary/80 border border-primary/20 rounded-md transition-all duration-500 flex items-center justify-center overflow-hidden"
                            style={{ left: `${left}%`, width: `${width}%` }}
                          >
                            {width > 10 && <span className="text-[10px] text-primary-foreground font-bold truncate px-1">Phase {i+1}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Phases;
