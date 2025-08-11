"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Shield,
  ClipboardCheck,
  Wrench,
  Users,
  FileText,
  Lightbulb,
} from "lucide-react"

interface TaskEnhancementModalProps {
  task: any
  enhancement: any
  onClose: () => void
}

export function TaskEnhancementModal({ task, enhancement, onClose }: TaskEnhancementModalProps) {
  const [activeTab, setActiveTab] = useState("steps")

  if (!enhancement) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{task.priority} Priority</Badge>
                <Badge variant="secondary">{task.category}</Badge>
                {enhancement.estimatedTime && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {enhancement.estimatedTime}
                  </Badge>
                )}
                {enhancement.estimatedCost && (
                  <Badge className="bg-green-100 text-green-800">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCurrency(enhancement.estimatedCost)}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="steps" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Steps
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="text-xs">
                <Wrench className="h-3 w-3 mr-1" />
                Issues
              </TabsTrigger>
              <TabsTrigger value="costs" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                Costs
              </TabsTrigger>
              <TabsTrigger value="safety" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Safety
              </TabsTrigger>
              <TabsTrigger value="quality" className="text-xs">
                <ClipboardCheck className="h-3 w-3 mr-1" />
                Quality
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="steps" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Step-by-Step Instructions
                </h3>
                {enhancement.steps?.map((step: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{step.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{step.description}</p>

                          {step.tools && step.tools.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Tools needed:</p>
                              <div className="flex flex-wrap gap-1">
                                {step.tools.map((tool: string, toolIndex: number) => (
                                  <Badge key={toolIndex} variant="outline" className="text-xs">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.verification && (
                            <div className="bg-green-50 p-2 rounded text-sm">
                              <p className="font-medium text-green-800">Verification:</p>
                              <p className="text-green-700">{step.verification}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  Helpful Resources
                </h3>
                {enhancement.resources?.map((resource: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">{resource.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              View Resource <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  Common Issues & Solutions
                </h3>
                {enhancement.troubleshooting?.map((issue: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-orange-800">Issue: {issue.problem}</h4>
                            <p className="text-sm text-muted-foreground">{issue.cause}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-800">Solution:</h4>
                            <p className="text-sm">{issue.solution}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Cost Breakdown
                </h3>

                {enhancement.costs?.materials && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {enhancement.costs.materials.map((material: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{material.item}</span>
                            <span className="font-medium">{formatCurrency(material.cost)}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center font-medium">
                          <span>Materials Total:</span>
                          <span>{formatCurrency(enhancement.costs.materialsTotal || 0)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.costs?.labor && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Labor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Estimated Hours:</span>
                          <span>{enhancement.costs.labor.hours}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Rate per Hour:</span>
                          <span>{formatCurrency(enhancement.costs.labor.rate)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Labor Total:</span>
                          <span>{formatCurrency(enhancement.costs.labor.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.costs?.alternatives && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Cost-Saving Alternatives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {enhancement.costs.alternatives.map((alt: any, index: number) => (
                          <div key={index} className="border rounded p-3">
                            <h4 className="font-medium mb-2">{alt.option}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{alt.description}</p>
                            <div className="flex justify-between text-sm">
                              <span>Estimated Cost:</span>
                              <span className="font-medium">{formatCurrency(alt.cost)}</span>
                            </div>
                            {alt.pros && Array.isArray(alt.pros) && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-green-700">Pros:</p>
                                <ul className="text-xs text-green-600 list-disc list-inside">
                                  {alt.pros.map((pro: string, proIndex: number) => (
                                    <li key={proIndex}>{pro}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {alt.cons && Array.isArray(alt.cons) && (
                              <div className="mt-1">
                                <p className="text-xs font-medium text-red-700">Cons:</p>
                                <ul className="text-xs text-red-600 list-disc list-inside">
                                  {alt.cons.map((con: string, conIndex: number) => (
                                    <li key={conIndex}>{con}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Safety Guidelines
                </h3>

                {enhancement.safety?.requiredPPE && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Required Personal Protective Equipment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {enhancement.safety.requiredPPE.map((ppe: string, index: number) => (
                          <Badge key={index} variant="outline" className="justify-start">
                            {ppe}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.safety?.hazards && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Potential Hazards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {enhancement.safety.hazards.map((hazard: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{hazard}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.safety?.precautions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        Safety Precautions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {enhancement.safety.precautions.map((precaution: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{precaution}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.safety?.emergencyProcedures && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Emergency Procedures
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {enhancement.safety.emergencyProcedures.map((procedure: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm">{procedure}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-purple-600" />
                  Quality Control
                </h3>

                {enhancement.quality?.inspectionPoints && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Inspection Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {enhancement.quality.inspectionPoints.map((point: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <ClipboardCheck className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{point}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.quality?.testingProcedures && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Testing Procedures</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {enhancement.quality.testingProcedures.map((test: string, index: number) => (
                          <div key={index} className="border-l-2 border-purple-200 pl-3">
                            <span className="text-sm">{test}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.quality?.acceptanceCriteria && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Acceptance Criteria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {enhancement.quality.acceptanceCriteria.map((criteria: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{criteria}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {enhancement.quality?.documentation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Required Documentation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {enhancement.quality.documentation.map((doc: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
