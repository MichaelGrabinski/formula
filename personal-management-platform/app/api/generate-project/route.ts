import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { description, projectType = "general" } = await request.json()

    if (!description) {
      return NextResponse.json({ error: "Project description is required" }, { status: 400 })
    }

    console.log("Generating project for:", description, "Type:", projectType)

    // --- OVERHAUL: Robust category mapping and fallback ---
    const categoryMap: Record<string, string> = {
      automotive: "Automotive",
      "home-improvement": "Home Improvement",
      maintenance: "Maintenance",
      renovation: "Renovation",
      landscaping: "Landscaping",
      electrical: "Electrical Work",
      plumbing: "Plumbing",
      hvac: "HVAC",
      general: "General",
    }
    const normalizedType = (projectType || "general").toLowerCase()
    const category = categoryMap[normalizedType] || "General"

    const systemPrompt = `You are an expert project manager and technical specialist. Create a comprehensive project plan with detailed tasks for a ${category} project.\n\nFor ${category} projects: Include detailed planning, execution steps, safety protocols, quality control, and professional best practices.\n\nCRITICAL: Return ONLY valid JSON in this exact structure - no markdown, no extra text, no code blocks:`

    const prompt = `${systemPrompt}\n\n{\n  "title": "Specific descriptive project title",\n  "description": "Comprehensive project description with objectives and scope",\n  "category": "${category}",\n  "priority": "High/Medium/Low",\n  "estimatedCost": "$X - $Y",\n  "estimatedDuration": "X days/weeks",\n  "difficulty": "Beginner/Intermediate/Advanced",\n  "tasks": [\n    {\n      "title": "Specific task title",\n      "description": "Detailed task description with specific procedures, measurements, and requirements",\n      "priority": "High/Medium/Low",\n      "estimatedHours": X,\n      "category": "Planning/Execution/Testing/Documentation",\n      "status": "pending"\n    }\n  ]\n}\n\nProject Description: "${description}"\n\nCreate a professional ${category.toLowerCase()} project with 4-6 detailed, actionable tasks. Include specific procedures, safety considerations, and professional techniques.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    console.log("AI Response:", text)

    // Enhanced JSON extraction
    let projectData
    try {
      let cleanedText = text.trim()

      // Remove any markdown code blocks
      if (cleanedText.includes("```")) {
        const jsonMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          cleanedText = jsonMatch[1]
        } else {
          // Try to extract JSON between first { and last }
          const firstBrace = cleanedText.indexOf("{")
          const lastBrace = cleanedText.lastIndexOf("}")
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanedText = cleanedText.substring(firstBrace, lastBrace + 1)
          }
        }
      }

      // Try to find JSON object in the text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedText = jsonMatch[0]
      }

      projectData = JSON.parse(cleanedText)
      console.log("Successfully parsed project data:", projectData)

      // Validate required fields
      if (!projectData.title || !projectData.tasks || !Array.isArray(projectData.tasks)) {
        throw new Error("Invalid project structure")
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.log("Failed to parse text:", text)

      // --- OVERHAUL: Fallback logic for all categories ---
      if (parseError) {
        projectData = {
          title: `${category} Project: ${description}`,
          description: `Comprehensive ${category.toLowerCase()} project for ${description}. Includes planning, execution, safety, and best practices for ${category.toLowerCase()}.`,
          category,
          priority: "Medium",
          estimatedCost: "$100 - $500",
          estimatedDuration: "1-3 weeks",
          difficulty: "Intermediate",
          tasks: [
            {
              title: `Initial Planning for ${category}`,
              description: `Define scope, requirements, and safety for ${category.toLowerCase()} project.`,
              priority: "High",
              estimatedHours: 2,
              category: "Planning",
              status: "pending",
            },
            {
              title: `Execution Phase for ${category}`,
              description: `Carry out main work for ${category.toLowerCase()} project, following best practices and safety protocols.`,
              priority: "High",
              estimatedHours: 6,
              category: "Execution",
              status: "pending",
            },
            {
              title: `Quality Control for ${category}`,
              description: `Inspect and test completed work for ${category.toLowerCase()} project.`,
              priority: "Medium",
              estimatedHours: 2,
              category: "Testing",
              status: "pending",
            },
            {
              title: `Documentation and Cleanup for ${category}`,
              description: `Document results and clean up after ${category.toLowerCase()} project.`,
              priority: "Low",
              estimatedHours: 1,
              category: "Documentation",
              status: "pending",
            },
          ],
        }
      }
    }

    // Remove projectId: null from fallback and AI-generated tasks
    projectData.tasks = projectData.tasks.map((task: any, index: number) => ({
      id: `task-${Date.now()}-${index}`,
      title: task.title || `Task ${index + 1}`,
      description: task.description || "Task description",
      priority: task.priority || "Medium",
      estimatedHours: task.estimatedHours || 2,
      category: task.category || category,
      status: task.status || "pending"
      // Do not set projectId here; it will be set when tasks are created in the frontend
    }))

    console.log("Final project data:", projectData)
    return NextResponse.json({ project: projectData })
  } catch (error) {
    console.error("Error generating project:", error)
    return NextResponse.json(
      {
        error: "Failed to generate project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
