import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, projectData, context } = await request.json()

    // Create a comprehensive system prompt for project management
    const systemPrompt = `You are an expert Project Management AI Assistant. You help users manage their projects, analyze performance, optimize workflows, and provide strategic recommendations.

Current Project Data:
- Total Projects: ${projectData.projects.length}
- Active Projects: ${projectData.projects.filter((p: any) => p.status === "In Progress").length}
- Total Tasks: ${projectData.tasks.length}
- Properties: ${projectData.properties.length}

Project Details:
${JSON.stringify(projectData.projects, null, 2)}

Task Details:
${JSON.stringify(projectData.tasks, null, 2)}

Property Details:
${JSON.stringify(projectData.properties, null, 2)}

You should:
1. Provide actionable insights and recommendations
2. Help with project planning, scheduling, and resource allocation
3. Analyze project performance and identify bottlenecks
4. Suggest improvements for efficiency and cost optimization
5. Help prioritize tasks and projects based on business impact
6. Provide realistic timelines and budget estimates
7. Identify risks and mitigation strategies

Be concise, practical, and focus on actionable advice.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      content: data.choices[0].message.content,
    })
  } catch (error) {
    console.error("Project AI API error:", error)
    return NextResponse.json({ error: "Failed to process project AI request" }, { status: 500 })
  }
}
