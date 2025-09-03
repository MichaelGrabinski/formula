"use client"

import type React from "react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import type { Goal } from "@/app/types"

interface EditGoalDialogProps {
  children: ReactNode
  goal: Goal
  onUpdateGoal: (updatedGoal: Goal) => void
}

export function EditGoalDialog({ children, goal, onUpdateGoal }: EditGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(goal.name)
  const [description, setDescription] = useState(goal.description)
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString())
  const [currentAmount, setCurrentAmount] = useState(goal.currentAmount.toString())
  const [monthlyContribution, setMonthlyContribution] = useState(goal.monthlyContribution.toString())
  const [type, setType] = useState<"savings" | "debt">(goal.type)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedGoal = {
      ...goal,
      name,
      description,
      targetAmount: Number.parseFloat(targetAmount) || 0,
      currentAmount: Number.parseFloat(currentAmount) || 0,
      monthlyContribution: Number.parseFloat(monthlyContribution) || 0,
      type,
    }

    onUpdateGoal(updatedGoal)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Financial Goal</DialogTitle>
            <DialogDescription>Make changes to your goal. The timeline will update automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetAmount" className="text-right">
                Target
              </Label>
              <Input
                id="targetAmount"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentAmount" className="text-right">
                Current
              </Label>
              <Input
                id="currentAmount"
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monthlyContribution" className="text-right">
                Monthly
              </Label>
              <Input
                id="monthlyContribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
              <RadioGroup
                value={type}
                onValueChange={(value: "savings" | "debt") => setType(value)}
                className="col-span-3 flex gap-4"
              >
                <div>
                  <RadioGroupItem value="savings" id="edit-savings" className="peer sr-only" />
                  <Label
                    htmlFor="edit-savings"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Savings
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="debt" id="edit-debt" className="peer sr-only" />
                  <Label
                    htmlFor="edit-debt"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Debt
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
