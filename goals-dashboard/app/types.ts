export interface Goal {
  id: string
  name: string
  description: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  type: "debt" | "savings"
  startDate?: Date
  completionDate?: Date
}
