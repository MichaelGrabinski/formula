import React, { useState } from 'react';
import type { Goal } from './GoalsApp';

interface Props {
  goal: Goal;
  onUpdate: (g: Goal) => void;
  onDelete: (id: number) => void;
  showArrow?: boolean;
}

const goalIcon = (type: string | null | undefined) => {
  switch (type) {
    case 'debt':
      return '🚗';
    case 'savings':
      return '🏦';
    default:
      return '🎯';
  }
};

export const GoalCard: React.FC<Props> = ({ goal, onDelete, onUpdate, showArrow }) => {
  const [editing, setEditing] = useState(false);
  const progressRaw = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 100;
  const pct = Math.min(100, Math.round(progressRaw));
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const statusLabel = goal.status === 'completed' ? 'Completed' : goal.status === 'active' ? 'Active' : 'Pending';

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ ...goal, [name]: name.includes('amount') || name.includes('contribution') ? parseFloat(value || '0') : value });
  };

  const saveEdit = () => {
    setEditing(false);
    // TODO: POST changes to backend
  };

  return (
    <div
      className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm w-full relative data-[status=active]:border-primary data-[status=completed]:border-green-500 transition-colors"
      data-status={goal.status}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', goal.id.toString());
      }}
    >
  <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
              <span className="inline-block text-muted-foreground">{goalIcon(goal.goal_type)}</span>
              {goal.title}
            </h3>
            {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
          </div>
          <div className="flex gap-1 text-xs">
            <button className="underline" onClick={() => setEditing(e => !e)}>{editing ? 'Close' : 'Edit'}</button>
            <button className="underline text-destructive" onClick={() => onDelete(goal.id)}>Del</button>
          </div>
        </div>
  <div className="space-y-2 text-center relative">
          <div className="absolute left-0 top-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted/50">
            {statusLabel}
          </div>
          <div className="text-3xl font-bold tracking-tight">${goal.current_amount.toFixed(0)}</div>
          <div className="w-full h-3 bg-muted rounded overflow-hidden">
            <div className="h-3 bg-primary" style={{ width: pct + '%' }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wide px-1">
            <span>0%</span><span className="font-semibold text-foreground">{pct}%</span><span>100%</span>
          </div>
          <div className="text-xs text-muted-foreground">Target: ${goal.target_amount.toFixed(0)}</div>
          <div className="text-[11px] text-muted-foreground">
            {goal.status === 'completed' ? `Finished ${goal.completion_date}` : goal.status === 'active' ? `Est. End ${goal.completion_date}` : `Est. Start ${goal.start_date}`}
          </div>
        </div>
  <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-medium">${remaining.toFixed(0)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Monthly</span><span className="font-medium">${goal.monthly_contribution.toFixed(0)}</span></div>
          <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{goal.status}</span></div>
        </div>
        {editing && (
          <div className="mt-4 space-y-2 text-xs bg-muted/30 p-4 rounded">
            <input name="title" value={goal.title} onChange={handleLocalChange} className="w-full p-1.5 rounded border bg-background" />
            <textarea name="description" value={goal.description || ''} onChange={handleLocalChange} rows={2} className="w-full p-1.5 rounded border bg-background" />
            <div className="grid grid-cols-2 gap-2">
              <input name="target_amount" type="number" value={goal.target_amount} onChange={handleLocalChange} className="p-1.5 rounded border bg-background" />
              <input name="current_amount" type="number" value={goal.current_amount} onChange={handleLocalChange} className="p-1.5 rounded border bg-background" />
              <input name="monthly_contribution" type="number" value={goal.monthly_contribution} onChange={handleLocalChange} className="p-1.5 rounded border bg-background col-span-2" />
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded bg-primary text-primary-foreground" onClick={saveEdit}>Save</button>
              <button className="px-2 py-1 rounded border" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {showArrow && (
        <div className="hidden lg:flex absolute right-0 top-1/2 translate-x-full -translate-y-1/2 px-2 text-gray-300 dark:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </div>
      )}
    </div>
  );
};
