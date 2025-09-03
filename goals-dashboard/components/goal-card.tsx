"use client"

import type { Goal } from "@/app/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PiggyBank, Car, CheckCircle, Hourglass, PlayCircle, MoreVertical, Trash2, Pencil } from "lucide-react"
import { EditGoalDialog } from "./edit-goal-dialog"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
})

interface GoalCardProps {
  goal: Goal
  onUpdate: (goal: Goal) => void
  onDelete: (id: string) => void
}

export function GoalCard({ goal, onUpdate, onDelete }: GoalCardProps) {
  const { name, description, targetAmount, currentAmount, monthlyContribution, type, startDate, completionDate } = goal

  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 100
  const remainingAmount = targetAmount - currentAmount

  const today = new Date()
  const isCompleted = progress >= 100
  const isActive = !isCompleted && startDate && startDate <= today

  let status: "Completed" | "Active" | "Pending" = "Pending"
  if (isCompleted) status = "Completed"
  else if (isActive) status = "Active"

  const StatusIcon = status === "Completed" ? CheckCircle : status === "Active" ? PlayCircle : Hourglass
  const GoalIcon = type === "debt" ? Car : PiggyBank

  return (
    <Card
      className="flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow duration-300 border-t-4 border-transparent data-[status=active]:border-primary data-[status=completed]:border-green-500"
      data-status={status.toLowerCase()}
    >
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <GoalIcon className="h-6 w-6 text-muted-foreground" />
            {name}
          </CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 -mt-1 -mr-2">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditGoalDialog goal={goal} onUpdateGoal={onUpdate}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
            </EditGoalDialog>
            <DropdownMenuItem
              onClick={() => onDelete(goal.id)}
              className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center text-center space-y-4 py-6">
        <div className="text-4xl font-bold tracking-tighter text-foreground">
          {currencyFormatter.format(currentAmount)}
        </div>
        <div className="relative w-full px-4">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className="font-bold text-foreground">{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Target: {currencyFormatter.format(targetAmount)}</div>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-3 bg-muted/30 dark:bg-black/20 p-4">
        <div className="flex items-center gap-2 text-sm w-full">
          <Badge
            variant={status === "Active" ? "default" : "outline"}
            className={
              status === "Completed"
                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
                : status === "Active"
                  ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground"
                  : ""
            }
          >
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
            {status}
          </Badge>
          <p className="text-muted-foreground text-xs">
            {status === "Pending" && startDate && `Est. Start: ${dateFormatter.format(startDate)}`}
            {status === "Active" && completionDate && `Est. End: ${dateFormatter.format(completionDate)}`}
            {status === "Completed" && completionDate && `Finished: ${dateFormatter.format(completionDate)}`}
          </p>
        </div>
        <div className="w-full space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium text-foreground">{currencyFormatter.format(remainingAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly</span>
            <span className="font-medium text-foreground">{currencyFormatter.format(monthlyContribution)}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
