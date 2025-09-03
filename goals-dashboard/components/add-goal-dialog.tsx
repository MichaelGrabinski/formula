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

interface AddGoalDialogProps {
  children: ReactNode
  onAddGoal: (newGoal: Omit<Goal, "id" | "startDate" | "completionDate">) => void
}

export function AddGoalDialog({ children, onAddGoal }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("0")
  const [monthlyContribution, setMonthlyContribution] = useState("")
  const [type, setType] = useState<"savings" | "debt">("savings")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newGoal = {
      name,
      description,
      targetAmount: Number.parseFloat(targetAmount) || 0,
      currentAmount: Number.parseFloat(currentAmount) || 0,
      monthlyContribution: Number.parseFloat(monthlyContribution) || 0,
      type,
    }

    onAddGoal(newGoal)

    // Reset form and close dialog
    setName("")
    setDescription("")
    setTargetAmount("")
    setCurrentAmount("0")
    setMonthlyContribution("")
    setType("savings")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a New Financial Goal</DialogTitle>
            <DialogDescription>What's your next big financial milestone? Fill out the details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Vacation Fund"
                required
              />
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
                placeholder="e.g., Trip to Japan"
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
                placeholder="e.g., 5000"
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
                placeholder="e.g., 500"
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
                placeholder="e.g., 250"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
              <RadioGroup
                defaultValue="savings"
                value={type}
                onValueChange={(value: "savings" | "debt") => setType(value)}
                className="col-span-3 flex gap-4"
              >
                <div>
                  <RadioGroupItem value="savings" id="savings" className="peer sr-only" />
                  <Label
                    htmlFor="savings"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Savings
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="debt" id="debt" className="peer sr-only" />
                  <Label
                    htmlFor="debt"
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
            <Button type="submit">Add Goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
