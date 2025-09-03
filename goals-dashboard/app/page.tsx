"use client"

import { useState, useEffect, Fragment } from "react"
import type { Goal } from "@/app/types"
import { GoalCard } from "@/components/goal-card"
import { AddGoalDialog } from "@/components/add-goal-dialog"
import { PlusCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const initialGoals: Goal[] = [
  {
    id: "1",
    name: "Pay Off Auto Loan",
    description: "Clear the $9,000 loan on the car.",
    targetAmount: 9000,
    currentAmount: 1250,
    monthlyContribution: 800, // 350 regular + 450 extra
    type: "debt",
  },
  {
    id: "2",
    name: "Save for Tesla Down Payment",
    description: "After selling the old car for ~$4k, save an additional $6k.",
    targetAmount: 6000,
    currentAmount: 0,
    monthlyContribution: 800, // Assuming the car payment rolls into savings
    type: "savings",
  },
  {
    id: "3",
    name: "Emergency Fund Top-up",
    description: "Finish building a 3-month emergency fund.",
    targetAmount: 15000,
    currentAmount: 3000,
    monthlyContribution: 500,
    type: "savings",
  },
]

export default function GoalsDashboard() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [sequencedGoals, setSequencedGoals] = useState<Goal[]>([])

  useEffect(() => {
    let lastCompletionDate = new Date() // Start timeline from today

    const processedGoals = goals.map((goal) => {
      const startDate = new Date(lastCompletionDate)

      const remainingAmount = goal.targetAmount - goal.currentAmount
      const monthsToCompletion =
        remainingAmount > 0 && goal.monthlyContribution > 0 ? remainingAmount / goal.monthlyContribution : 0

      const completionDate = new Date(startDate)
      if (monthsToCompletion > 0) {
        completionDate.setMonth(completionDate.getMonth() + monthsToCompletion)
      }

      lastCompletionDate = completionDate

      return {
        ...goal,
        startDate,
        completionDate,
      }
    })

    setSequencedGoals(processedGoals)
  }, [goals])

  const addGoal = (newGoal: Omit<Goal, "id" | "startDate" | "completionDate">) => {
    setGoals((prevGoals) => [...prevGoals, { ...newGoal, id: crypto.randomUUID() }])
  }

  const updateGoal = (updatedGoal: Goal) => {
    setGoals((prevGoals) => prevGoals.map((g) => (g.id === updatedGoal.id ? { ...g, ...updatedGoal } : g)))
  }

  const deleteGoal = (goalId: string) => {
    setGoals((prevGoals) => prevGoals.filter((g) => g.id !== goalId))
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Financial Goals Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your sequenced plan to financial success.</p>
          </div>
          <AddGoalDialog onAddGoal={addGoal}>
            <Button className="mt-4 sm:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Goal
            </Button>
          </AddGoalDialog>
        </header>

        <main>
          {sequencedGoals.length > 0 ? (
            <div className="flex flex-col lg:flex-row lg:items-stretch lg:space-x-4 space-y-6 lg:space-y-0">
              {sequencedGoals.map((goal, index) => (
                <Fragment key={goal.id}>
                  <div className="lg:flex-1 w-full">
                    <GoalCard goal={goal} onUpdate={updateGoal} onDelete={deleteGoal} />
                  </div>
                  {index < sequencedGoals.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center self-center rotate-90 lg:rotate-0">
                      <ChevronRight className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h2 className="text-xl font-semibold">No goals yet!</h2>
              <p className="text-muted-foreground mt-2">Click "Add New Goal" to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
