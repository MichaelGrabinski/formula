import React, { useEffect, useState, Fragment } from 'react';
import { GoalCard } from './GoalCard';

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  goal_type: string | null;
  progress: number;
  start_date: string; // ISO
  completion_date: string; // ISO
  status: 'pending' | 'active' | 'completed';
  remaining_amount: number;
}

export const GoalsApp: React.FC<{ initialGoals?: Goal[] }> = ({ initialGoals }) => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals || []);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  // Fallback legacy bootstrap element (if present and no initialGoals passed)
  useEffect(() => {
    if (initialGoals && initialGoals.length) return;
    const el = document.getElementById('goals-v2-bootstrap');
    if (!el) return;
    try {
      const payload = JSON.parse(el.textContent || '{}');
      if (Array.isArray(payload.goals)) setGoals(payload.goals);
    } catch (e) {
      console.error('Bootstrap parse error', e);
    }
  }, [initialGoals]);

  const updateGoal = (updated: Goal) => {
    setGoals(g => g.map(x => x.id === updated.id ? updated : x));
  };
  const deleteGoal = (id: number) => setGoals(g => g.filter(x => x.id !== id));

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
    e.preventDefault();
    setDragOverId(targetId);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!draggedId || draggedId === targetId) return;
    const ordered = [...goals];
    const fromIdx = ordered.findIndex(g => g.id === draggedId);
    const toIdx = ordered.findIndex(g => g.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [item] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, item);
    setGoals(ordered);
    setDragOverId(null);
    // TODO: send reorder fetch
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Financial Goals Timeline</h2>
          <p className="text-sm text-muted-foreground">Sequenced plan to financial success.</p>
        </div>
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm">Add New Goal</button>
      </header>
      <main>
        {goals.length ? (
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:space-x-6 space-y-6 lg:space-y-0" >
            {goals.map((g, i) => (
              <div
                key={g.id}
                className="lg:flex-1 w-full relative"
                onDragOver={(e) => onDragOver(e, g.id)}
                onDrop={(e) => onDrop(e, g.id)}
              >
                <GoalCard goal={g} onUpdate={updateGoal} onDelete={deleteGoal} showArrow={i < goals.length - 1} />
                {dragOverId === g.id && <div className="absolute inset-0 ring-2 ring-primary rounded-lg pointer-events-none" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg w-full">
            <h3 className="text-lg font-semibold">No goals yet!</h3>
            <p className="text-muted-foreground mt-2">Click Add New Goal to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
};
