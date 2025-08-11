"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Bot, User, Settings, Plus, Trash2, Copy, Download, RefreshCw } from "lucide-react"
import { useAzureData } from "@/lib/data-store-azure"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  model?: string
}

interface CustomPrompt {
  id: string
  name: string
  description: string
  prompt: string
  category: string
}

export default function AIChatPage() {
  const {
    properties = [],
    assets = [],
    projects = [],
    repairs = [],
    incomeEntries = [],
    expenseEntries = [],
  } = useAzureData()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [selectedPrompt, setSelectedPrompt] = useState("property-assistant")
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([
    {
      id: "property-assistant",
      name: "Property Management Assistant",
      description: "AI assistant with access to all your property, financial, and project data",
      prompt:
        "You are a professional property management assistant with access to the user's complete property portfolio data. You can help with financial analysis, property management decisions, project planning, maintenance scheduling, and investment strategies. Always provide specific, actionable advice based on the actual data provided. Format your responses clearly with proper headings, bullet points, and mathematical formulas when needed.",
      category: "Property Management",
    },
    {
      id: "general-purpose",
      name: "General Purpose Assistant",
      description: "General AI assistant for any questions or tasks",
      prompt:
        "You are a helpful, knowledgeable AI assistant. Provide accurate, helpful responses to any questions or tasks. Be concise but thorough in your explanations. Format your responses clearly with proper structure and formatting.",
      category: "General",
    },
  ])
  const [newPromptName, setNewPromptName] = useState("")
  const [newPromptDescription, setNewPromptDescription] = useState("")
  const [newPromptContent, setNewPromptContent] = useState("")
  const [newPromptCategory, setNewPromptCategory] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const models = [
    { id: "gpt-4o", name: "GPT-4o", description: "Most capable model" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and efficient" },
    { id: "o3-mini", name: "o3-mini", description: "Latest reasoning model with advanced problem-solving" },
    { id: "o1-mini", name: "o1-mini", description: "Reasoning model for complex tasks" },
    { id: "o1-preview", name: "o1-preview", description: "Advanced reasoning preview" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "High performance" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and cost-effective" },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Helper functions to calculate totals from Azure data
  const getTotalPropertyValue = () => {
    return properties.reduce((total, property) => total + (property.currentValue || property.value || 0), 0)
  }

  const getTotalAssetValue = () => {
    return assets.reduce((total, asset) => total + (asset.currentValue || asset.value || 0), 0)
  }

  const getTotalMonthlyIncome = () => {
    return incomeEntries.reduce((total, entry) => total + (entry.amount || 0), 0)
  }

  const getTotalMonthlyExpenses = () => {
    return expenseEntries.reduce((total, entry) => total + (entry.amount || 0), 0)
  }

  const getPropertyData = () => {
    return {
      properties: (properties || []).map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        type: p.type,
        value: p.currentValue || p.value,
        purchasePrice: p.purchasePrice,
        purchaseDate: p.purchaseDate,
        status: p.status,
      })),
      assets: (assets || []).map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        value: a.currentValue || a.value,
        condition: a.condition,
        location: a.location,
      })),
      projects: (projects || []).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        priority: p.priority,
        estimatedCost: p.estimatedCost,
        actualCost: p.actualCost,
      })),
      repairs: (repairs || []).map((r) => ({
        id: r.id,
        title: r.title,
        priority: r.priority,
        status: r.status,
        estimatedCost: r.estimatedCost,
        category: r.category,
      })),
      financials: {
        totalPropertyValue: getTotalPropertyValue(),
        totalAssetValue: getTotalAssetValue(),
        monthlyIncome: getTotalMonthlyIncome(),
        monthlyExpenses: getTotalMonthlyExpenses(),
        recentIncome: (incomeEntries || []).slice(-5),
        recentExpenses: (expenseEntries || []).slice(-5),
      },
    }
  }

  const formatAIResponse = (content: string) => {
    // Convert LaTeX-style math to more readable format
    const formatted = content
      .replace(/\\\[([^\]]+)\\\]/g, "\n\n**$1**\n\n") // Block math
      .replace(/\\$$([^)]+)\\$$/g, "**$1**") // Inline math
      .replace(/\*\*([^*]+)\*\*/g, "**$1**") // Keep bold formatting
      .replace(/(\d+)\.\s\*\*([^*]+)\*\*/g, "\n$1. **$2**") // Numbered lists with bold
      .replace(/•\s/g, "\n• ") // Bullet points
      .replace(/=== ([^=]+) ===/g, "\n\n### $1\n") // Section headers
      .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks

    return formatted
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      model: selectedModel,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const selectedPromptData = customPrompts.find((p) => p.id === selectedPrompt)
      const systemPrompt = selectedPromptData?.prompt || customPrompts[0].prompt

      // Prepare the messages for the API
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: input },
      ]

      // Add property data context if using property assistant
      if (selectedPrompt === "property-assistant") {
        const propertyData = getPropertyData()
        apiMessages[0].content += `\n\nCurrent Property Data:\n${JSON.stringify(propertyData, null, 2)}`
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        model: selectedModel,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error while processing your request. Please make sure your OpenAI API key is configured correctly.",
        timestamp: new Date(),
        model: selectedModel,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const exportChat = () => {
    const chatContent = messages
      .map((m) => `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n")

    const blob = new Blob([chatContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-chat-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const addCustomPrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return

    const newPrompt: CustomPrompt = {
      id: Date.now().toString(),
      name: newPromptName,
      description: newPromptDescription,
      prompt: newPromptContent,
      category: newPromptCategory || "Custom",
    }

    setCustomPrompts((prev) => [...prev, newPrompt])
    setNewPromptName("")
    setNewPromptDescription("")
    setNewPromptContent("")
    setNewPromptCategory("")
  }

  const deleteCustomPrompt = (id: string) => {
    if (id === "property-assistant" || id === "general-purpose") return // Protect default prompts
    setCustomPrompts((prev) => prev.filter((p) => p.id !== id))
    if (selectedPrompt === id) {
      setSelectedPrompt("property-assistant")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-xl font-semibold">AI Assistant</h1>
        <div className="ml-auto flex items-center gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customPrompts.map((prompt) => (
                <SelectItem key={prompt.id} value={prompt.id}>
                  <div className="flex flex-col">
                    <span>{prompt.name}</span>
                    <span className="text-xs text-muted-foreground">{prompt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI Assistant Settings</DialogTitle>
                <DialogDescription>Manage your AI models and custom prompts</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="prompts" className="mt-4">
                <TabsList>
                  <TabsTrigger value="prompts">Custom Prompts</TabsTrigger>
                  <TabsTrigger value="models">Models</TabsTrigger>
                </TabsList>
                <TabsContent value="prompts" className="space-y-4">
                  <div className="grid gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Create Custom Prompt</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              placeholder="Prompt name"
                              value={newPromptName}
                              onChange={(e) => setNewPromptName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Input
                              placeholder="Category"
                              value={newPromptCategory}
                              onChange={(e) => setNewPromptCategory(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="Brief description"
                            value={newPromptDescription}
                            onChange={(e) => setNewPromptDescription(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>System Prompt</Label>
                          <Textarea
                            placeholder="Enter your custom system prompt..."
                            value={newPromptContent}
                            onChange={(e) => setNewPromptContent(e.target.value)}
                            rows={6}
                          />
                        </div>
                        <Button onClick={addCustomPrompt} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Custom Prompt
                        </Button>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <h3 className="font-medium">Existing Prompts</h3>
                      {customPrompts.map((prompt) => (
                        <Card key={prompt.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{prompt.name}</h4>
                                  <Badge variant="outline">{prompt.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{prompt.description}</p>
                                <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                                  {prompt.prompt.substring(0, 150)}...
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" onClick={() => copyMessage(prompt.prompt)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {prompt.id !== "property-assistant" && prompt.id !== "general-purpose" && (
                                  <Button size="sm" variant="outline" onClick={() => deleteCustomPrompt(prompt.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="models" className="space-y-4">
                  <div className="grid gap-4">
                    {models.map((model) => (
                      <Card key={model.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{model.name}</h4>
                              <p className="text-sm text-muted-foreground">{model.description}</p>
                            </div>
                            <Badge variant={selectedModel === model.id ? "default" : "outline"}>
                              {selectedModel === model.id ? "Selected" : "Available"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={exportChat}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {customPrompts.find((p) => p.id === selectedPrompt)?.name || "AI Assistant"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {customPrompts.find((p) => p.id === selectedPrompt)?.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Current Model:</span>
                    <Badge>{models.find((m) => m.id === selectedModel)?.name}</Badge>
                  </div>

                  {selectedPrompt === "property-assistant" && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Available Data:</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Properties:</span>
                            <span>{properties?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Assets:</span>
                            <span>{assets?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Projects:</span>
                            <span>{projects?.length || 0}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Repairs:</span>
                            <span>{repairs?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Income Entries:</span>
                            <span>{incomeEntries?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expense Entries:</span>
                            <span>{expenseEntries?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Example questions:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {selectedPrompt === "property-assistant" ? (
                        <>
                          <li>• "What's my current portfolio performance?"</li>
                          <li>• "Which properties need the most maintenance?"</li>
                          <li>• "Analyze my cash flow for this month"</li>
                          <li>• "What projects should I prioritize?"</li>
                          <li>• "Create a maintenance schedule for my properties"</li>
                        </>
                      ) : (
                        <>
                          <li>• "Help me write a professional email"</li>
                          <li>• "Explain a complex topic in simple terms"</li>
                          <li>• "Generate ideas for a project"</li>
                          <li>• "Review and improve my writing"</li>
                          <li>• "Answer questions on any topic"</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user" ? "bg-blue-500" : "bg-green-500"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-4 ${
                        message.role === "user" ? "bg-blue-500 text-white" : "bg-background border shadow-sm"
                      }`}
                    >
                      <div className="prose prose-sm max-w-none">
                        {message.role === "assistant" ? (
                          <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html: formatAIResponse(message.content)
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .replace(/### (.*?)(\n|$)/g, "<h3 class='font-semibold text-lg mt-4 mb-2'>$1</h3>")
                                .replace(/\n• /g, "\n<br/>• ")
                                .replace(/\n(\d+)\. /g, "\n<br/>$1. ")
                                .replace(/\n\n/g, "<br/><br/>"),
                            }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-opacity-20">
                        <div className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                          {message.model && ` • ${models.find((m) => m.id === message.model)?.name}`}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-background border shadow-sm rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                placeholder={`Ask ${customPrompts.find((p) => p.id === selectedPrompt)?.name || "AI Assistant"} anything...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading} size="lg">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>Model: {models.find((m) => m.id === selectedModel)?.name}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
