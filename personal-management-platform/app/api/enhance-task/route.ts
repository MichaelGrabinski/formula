import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { title, description, category, priority, estimatedHours } = await request.json()

    // Create a comprehensive prompt for task enhancement
    const prompt = `You are a professional project management and technical expert. Analyze this task and provide detailed, actionable guidance in JSON format.

Task Details:
- Title: ${title}
- Description: ${description}
- Category: ${category}
- Priority: ${priority}
- Estimated Hours: ${estimatedHours}

Provide a comprehensive analysis with the following structure (respond ONLY with valid JSON):

{
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed step description with specific actions",
      "estimatedTime": "Time estimate (e.g., '2-3 hours')",
      "difficulty": "Easy/Medium/Hard",
      "tools": ["tool1", "tool2"],
      "verification": "How to verify this step is complete"
    }
  ],
  "resources": [
    {
      "title": "Resource title",
      "type": "Video/Manual/Diagram/Guide",
      "url": "https://example.com/resource",
      "description": "What this resource provides"
    }
  ],
  "troubleshooting": [
    {
      "problem": "Common problem description",
      "cause": "Why this problem occurs",
      "solution": "How to fix it",
      "prevention": "How to prevent it"
    }
  ],
  "costs": {
    "materials": [
      {
        "item": "Material name",
        "quantity": "Amount needed",
        "unitCost": "$X.XX",
        "totalCost": "$XX.XX",
        "supplier": "Where to buy",
        "partNumber": "Part number if applicable"
      }
    ],
    "labor": {
      "estimatedHours": "X hours",
      "hourlyRate": "$XX/hour",
      "totalLabor": "$XXX"
    },
    "alternatives": [
      {
        "option": "Alternative approach",
        "cost": "$XXX",
        "pros": ["advantage1", "advantage2"],
        "cons": ["disadvantage1", "disadvantage2"]
      }
    ]
  },
  "safety": {
    "requiredPPE": ["safety equipment needed"],
    "hazards": ["potential dangers"],
    "precautions": ["safety measures"],
    "emergencyProcedures": ["what to do if something goes wrong"]
  },
  "quality": {
    "inspectionPoints": ["what to check"],
    "testingProcedures": ["how to test"],
    "acceptanceCriteria": ["when it's done right"],
    "documentation": ["what to record"]
  }
}

Provide at least 4-8 detailed steps, 3-5 resources with real URLs when possible, 3-4 troubleshooting scenarios, comprehensive cost breakdown, thorough safety information, and quality control measures. Make it professional and actionable.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a professional project management and technical expert. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    // Multiple strategies to extract JSON
    let enhancement = null

    // Strategy 1: Direct JSON parse
    try {
      enhancement = JSON.parse(content)
    } catch (e) {
      console.log("Direct JSON parse failed, trying extraction...")
    }

    // Strategy 2: Extract JSON from markdown code blocks
    if (!enhancement) {
      try {
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
        if (jsonMatch) {
          enhancement = JSON.parse(jsonMatch[1])
        }
      } catch (e) {
        console.log("Markdown JSON extraction failed...")
      }
    }

    // Strategy 3: Find JSON object in text
    if (!enhancement) {
      try {
        const jsonStart = content.indexOf("{")
        const jsonEnd = content.lastIndexOf("}")
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const jsonStr = content.substring(jsonStart, jsonEnd + 1)
          enhancement = JSON.parse(jsonStr)
        }
      } catch (e) {
        console.log("JSON object extraction failed...")
      }
    }

    // Strategy 4: Comprehensive fallback with professional content
    if (!enhancement) {
      console.log("All JSON parsing failed, using comprehensive fallback...")

      // Detect if this is automotive-related
      const isAutomotive =
        /car|auto|vehicle|engine|brake|tire|oil|transmission|battery|alternator|starter|radiator|exhaust|suspension|clutch|differential/i.test(
          `${title} ${description}`,
        )

      enhancement = {
        steps: [
          {
            title: "Initial Assessment and Preparation",
            description: `Begin by thoroughly assessing the ${title.toLowerCase()} requirements. Gather all necessary tools, materials, and documentation. Review safety protocols and ensure workspace is properly prepared. Take photos of current state for reference.`,
            estimatedTime: "30-60 minutes",
            difficulty: "Easy",
            tools: ["Basic hand tools", "Safety equipment", "Camera/phone", "Measuring tools"],
            verification: "All tools are present, workspace is clean and safe, initial documentation is complete",
          },
          {
            title: "System Inspection and Diagnosis",
            description: `Perform detailed inspection of the system or component. Check for obvious signs of wear, damage, or malfunction. Test functionality if applicable. Document findings and compare against specifications.`,
            estimatedTime: "45-90 minutes",
            difficulty: "Medium",
            tools: ["Diagnostic tools", "Multimeter", "Inspection lights", "Measuring instruments"],
            verification: "Complete diagnostic report with measurements and observations documented",
          },
          {
            title: "Component Removal and Disassembly",
            description: `Carefully remove components following proper sequence. Label connections and take photos before disconnection. Clean components as needed and inspect for reusability.`,
            estimatedTime: "1-2 hours",
            difficulty: "Medium",
            tools: ["Wrenches", "Screwdrivers", "Pliers", "Container for parts", "Labels"],
            verification: "All components removed safely, connections labeled, parts organized and clean",
          },
          {
            title: "Repair or Replacement Execution",
            description: `Execute the main repair or replacement work. Follow manufacturer specifications and torque requirements. Apply proper techniques and use correct materials. Work methodically and double-check each step.`,
            estimatedTime: `${Math.max(2, estimatedHours * 0.6)}-${Math.max(3, estimatedHours * 0.8)} hours`,
            difficulty: priority === "High" ? "Hard" : "Medium",
            tools: ["Specialized tools", "New parts/materials", "Torque wrench", "Thread locker", "Gaskets/seals"],
            verification: "New components properly installed, all connections secure, torque specifications met",
          },
          {
            title: "System Reassembly and Connection",
            description: `Reassemble components in reverse order of removal. Ensure all connections are properly made and secured. Replace any worn gaskets, seals, or fasteners. Apply appropriate lubricants or sealants.`,
            estimatedTime: "1-2 hours",
            difficulty: "Medium",
            tools: ["Assembly tools", "New gaskets/seals", "Lubricants", "Sealants", "Torque wrench"],
            verification: "All components reassembled correctly, no loose connections, proper sealing achieved",
          },
          {
            title: "Testing and Calibration",
            description: `Perform comprehensive testing of the repaired system. Check all functions, measure performance parameters, and verify proper operation. Make adjustments as needed to meet specifications.`,
            estimatedTime: "30-60 minutes",
            difficulty: "Medium",
            tools: ["Test equipment", "Measuring tools", "Adjustment tools", "Diagnostic scanner"],
            verification: "All systems functioning properly, performance meets specifications, no error codes present",
          },
          {
            title: "Final Inspection and Documentation",
            description: `Conduct final quality inspection of all work performed. Clean work area and dispose of waste materials properly. Complete documentation including photos, test results, and maintenance records.`,
            estimatedTime: "20-30 minutes",
            difficulty: "Easy",
            tools: ["Camera", "Cleaning supplies", "Documentation forms", "Computer/tablet"],
            verification: "Work area clean, all documentation complete, quality standards met, customer ready",
          },
        ],
        resources: isAutomotive
          ? [
              {
                title: "Automotive Service Manual",
                type: "Manual",
                url: "https://www.alldata.com",
                description: "Comprehensive repair procedures and specifications",
              },
              {
                title: "YouTube Automotive Repair Channel",
                type: "Video",
                url: "https://www.youtube.com/c/ChrisFix",
                description: "Step-by-step video tutorials for common repairs",
              },
              {
                title: "Parts Identification Guide",
                type: "Diagram",
                url: "https://www.rockauto.com",
                description: "Visual parts diagrams and compatibility information",
              },
              {
                title: "Torque Specifications Database",
                type: "Guide",
                url: "https://www.torquespecs.com",
                description: "Proper torque values for fasteners and components",
              },
              {
                title: "Automotive Forums Community",
                type: "Guide",
                url: "https://www.reddit.com/r/MechanicAdvice",
                description: "Community support and troubleshooting advice",
              },
            ]
          : [
              {
                title: "Professional Trade Manual",
                type: "Manual",
                url: "https://www.constructionbook.com",
                description: "Industry standard procedures and best practices",
              },
              {
                title: "Instructional Video Series",
                type: "Video",
                url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(title),
                description: "Visual demonstrations of similar repair procedures",
              },
              {
                title: "Technical Specifications Guide",
                type: "Guide",
                url: "https://www.engineeringtoolbox.com",
                description: "Technical data and calculation tools",
              },
              {
                title: "Safety Data Sheets",
                type: "Guide",
                url: "https://www.osha.gov/sds",
                description: "Material safety information and handling procedures",
              },
              {
                title: "Professional Forum Community",
                type: "Guide",
                url: "https://www.contractortalk.com",
                description: "Expert advice and problem-solving discussions",
              },
            ],
        troubleshooting: [
          {
            problem: "Component won't fit or align properly during installation",
            cause: "Wrong part number, damaged threads, or misalignment during assembly",
            solution:
              "Verify part compatibility, inspect for damage, clean threads, and ensure proper alignment before forcing components together",
            prevention:
              "Always verify part numbers before ordering, handle components carefully, and use proper alignment tools",
          },
          {
            problem: "System doesn't function after repair completion",
            cause: "Loose connections, incorrect installation, or damaged components during repair",
            solution:
              "Systematically check all connections, verify installation sequence, and test components individually to isolate the issue",
            prevention: "Follow proper procedures, use torque specifications, and test at each stage of assembly",
          },
          {
            problem: "Unusual noises or vibrations after repair",
            cause: "Improperly tightened fasteners, misaligned components, or contaminated lubricants",
            solution:
              "Re-check all fastener torques, verify component alignment, and replace lubricants if contaminated",
            prevention:
              "Use proper torque specifications, ensure clean assembly conditions, and use quality lubricants",
          },
          {
            problem: "Premature failure of new components",
            cause: "Poor quality parts, improper installation, or underlying system issues not addressed",
            solution:
              "Use OEM or high-quality aftermarket parts, follow installation procedures exactly, and address root causes",
            prevention:
              "Source parts from reputable suppliers, address all related issues during repair, and follow break-in procedures",
          },
        ],
        costs: {
          materials: [
            {
              item: "Primary Component/Part",
              quantity: "1",
              unitCost: "$" + Math.round(estimatedHours * 25).toString(),
              totalCost: "$" + Math.round(estimatedHours * 25).toString(),
              supplier: "Local Parts Supplier",
              partNumber: "Contact supplier for specific part number",
            },
            {
              item: "Gaskets and Seals Kit",
              quantity: "1 set",
              unitCost: "$15.00",
              totalCost: "$15.00",
              supplier: "Hardware Store",
              partNumber: "Standard kit for application",
            },
            {
              item: "Fasteners and Hardware",
              quantity: "As needed",
              unitCost: "$0.50",
              totalCost: "$5.00",
              supplier: "Hardware Store",
              partNumber: "Various sizes as required",
            },
            {
              item: "Lubricants and Sealants",
              quantity: "1",
              unitCost: "$12.00",
              totalCost: "$12.00",
              supplier: "Auto Parts Store",
              partNumber: "Application-specific grade",
            },
          ],
          labor: {
            estimatedHours: estimatedHours.toString() + " hours",
            hourlyRate: "$75.00",
            totalLabor: "$" + (estimatedHours * 75).toString(),
          },
          alternatives: [
            {
              option: "Professional Service",
              cost: "$" + Math.round(estimatedHours * 125).toString(),
              pros: [
                "Warranty coverage",
                "Professional expertise",
                "Proper tools and equipment",
                "Insurance protection",
              ],
              cons: ["Higher cost", "Scheduling delays", "Less control over process", "Potential upselling"],
            },
            {
              option: "Refurbished Parts",
              cost: "$" + Math.round(estimatedHours * 45).toString(),
              pros: ["Lower cost", "Environmentally friendly", "Often includes warranty", "Readily available"],
              cons: ["Unknown history", "Shorter lifespan", "Limited warranty", "Potential reliability issues"],
            },
            {
              option: "Temporary Repair",
              cost: "$" + Math.round(estimatedHours * 15).toString(),
              pros: ["Very low cost", "Quick solution", "Minimal downtime", "Emergency option"],
              cons: ["Not permanent", "May cause further damage", "Safety concerns", "Requires future proper repair"],
            },
          ],
        },
        safety: {
          requiredPPE: ["Safety glasses", "Work gloves", "Steel-toed boots", "Long pants", "Hearing protection"],
          hazards: [
            "Sharp edges and metal fragments",
            "Heavy components that could fall or shift",
            "Chemical exposure from lubricants and cleaners",
            "Electrical hazards from power tools and systems",
            "Repetitive motion injuries from prolonged work",
          ],
          precautions: [
            "Always disconnect power sources before beginning work",
            "Use proper lifting techniques and get help with heavy components",
            "Ensure adequate ventilation when using chemicals",
            "Keep work area clean and well-lit",
            "Take regular breaks to prevent fatigue",
            "Have first aid kit readily available",
          ],
          emergencyProcedures: [
            "In case of injury, stop work immediately and assess severity",
            "For chemical exposure, flush with water and seek medical attention",
            "If electrical shock occurs, do not touch victim until power is disconnected",
            "Keep emergency contact numbers posted in work area",
            "Know location of nearest hospital or urgent care facility",
          ],
        },
        quality: {
          inspectionPoints: [
            "All fasteners properly tightened to specification",
            "No fluid leaks at connection points",
            "Components properly aligned and seated",
            "All safety devices functioning correctly",
            "Work area clean and free of debris",
          ],
          testingProcedures: [
            "Perform functional test of all repaired systems",
            "Check for proper operation under normal conditions",
            "Verify all adjustments are within specifications",
            "Test safety systems and emergency stops",
            "Run system through complete operational cycle",
          ],
          acceptanceCriteria: [
            "System operates smoothly without unusual noises",
            "All performance parameters meet specifications",
            "No error codes or warning indicators present",
            "Customer satisfaction with repair quality",
            "Work completed within estimated time and budget",
          ],
          documentation: [
            "Before and after photos of repair area",
            "List of parts used with part numbers and sources",
            "Test results and measurement data",
            "Any deviations from standard procedures",
            "Customer sign-off and warranty information",
          ],
        },
      }
    }

    return NextResponse.json({ enhancement })
  } catch (error) {
    console.error("Error in enhance-task API:", error)
    return NextResponse.json(
      { error: "Failed to enhance task", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
