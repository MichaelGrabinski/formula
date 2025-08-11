"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  Trash2,
  Plus,
  Calendar,
  User,
  Building,
  FolderOpen,
} from "lucide-react"
import { useAzureData } from "@/lib/data-store-azure"
import { UploadDocumentModal } from "@/components/upload-document-modal"
import { DocumentViewerModal } from "@/components/document-viewer-modal"

interface Document {
  id: number
  name: string
  type: string
  category: string
  size: number
  uploadDate: string
  uploadedBy: string
  propertyId?: number
  propertyName?: string
  tags: string[]
  url?: string
}

export default function DocumentsPage() {
  const { properties = [] } = useAzureData()

  // Sample documents data since Azure data store might not have documents yet
  const documents: Document[] = [
    {
      id: 1,
      name: "Property Deed - Main Residence",
      type: "PDF",
      category: "Legal",
      size: 2400000, // 2.4 MB
      uploadDate: "2024-01-15",
      uploadedBy: "John Doe",
      propertyId: 1,
      propertyName: "Main Residence",
      tags: ["deed", "legal", "ownership"],
      url: "/placeholder.pdf",
    },
    {
      id: 2,
      name: "Insurance Policy - State Farm",
      type: "PDF",
      category: "Insurance",
      size: 1800000, // 1.8 MB
      uploadDate: "2024-01-10",
      uploadedBy: "John Doe",
      propertyId: 1,
      propertyName: "Main Residence",
      tags: ["insurance", "policy", "state-farm"],
      url: "/placeholder.pdf",
    },
    {
      id: 3,
      name: "Lease Agreement - Rental Property #1",
      type: "PDF",
      category: "Lease",
      size: 1200000, // 1.2 MB
      uploadDate: "2024-01-01",
      uploadedBy: "John Doe",
      propertyId: 2,
      propertyName: "Rental Property #1",
      tags: ["lease", "rental", "agreement"],
      url: "/placeholder.pdf",
    },
    {
      id: 4,
      name: "Inspection Report - Main Residence",
      type: "PDF",
      category: "Inspection",
      size: 3100000, // 3.1 MB
      uploadDate: "2024-01-15",
      uploadedBy: "Inspector Smith",
      propertyId: 1,
      propertyName: "Main Residence",
      tags: ["inspection", "report", "maintenance"],
      url: "/placeholder.pdf",
    },
    {
      id: 5,
      name: "Tax Assessment 2024",
      type: "PDF",
      category: "Tax",
      size: 856000, // 856 KB
      uploadDate: "2024-02-01",
      uploadedBy: "Tax Office",
      propertyId: undefined,
      propertyName: undefined,
      tags: ["tax", "assessment", "2024"],
      url: "/placeholder.pdf",
    },
  ]

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProperty, setSelectedProperty] = useState("all")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const categories = ["all", "Legal", "Insurance", "Lease", "Inspection", "Tax", "Financial", "Maintenance", "Other"]

  const getDocumentsByCategory = (category: string) => {
    if (category === "all") return documents
    return documents.filter((doc) => doc.category === category)
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    const matchesProperty = selectedProperty === "all" || doc.propertyId === selectedProperty

    return matchesSearch && matchesCategory && matchesProperty
  })

  const getCategoryStats = () => {
    const stats: { [key: string]: number } = {}
    categories.forEach((category) => {
      if (category !== "all") {
        stats[category] = getDocumentsByCategory(category).length
      }
    })
    return stats
  }

  const categoryStats = getCategoryStats()

  const handleDownload = (doc: Document) => {
    // Simulate download
    console.log(`Downloading ${doc.name}`)
  }

  const handleDelete = (docId: number) => {
    // Simulate delete
    console.log(`Deleting document ${docId}`)
  }

  const handleView = (doc: Document) => {
    setSelectedDocument(doc)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center space-x-2">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="by-property">By Property</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                  {category !== "all" && categoryStats[category] > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">({categoryStats[category]})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">{doc.name}</CardTitle>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{doc.category}</span>
                      <span>{doc.size}</span>
                    </div>

                    {doc.propertyName && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span className="truncate">{doc.propertyName}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="truncate">{doc.uploadedBy}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{doc.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handleView(doc)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || selectedCategory !== "all" || selectedProperty !== "all"
                    ? "Try adjusting your search criteria"
                    : "Upload your first document to get started"}
                </p>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents
              .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
              .slice(0, 6)
              .map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-sm font-medium truncate">{doc.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {doc.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{doc.category}</span>
                        <span>{doc.size}</span>
                      </div>

                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleView(doc)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="by-property" className="space-y-4">
          {properties.map((property) => {
            const propertyDocs = documents.filter((doc) => doc.propertyId === property.id.toString())
            if (propertyDocs.length === 0) return null
            return (
              <Card key={property.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>{property.name}</span>
                    <Badge variant="secondary">{propertyDocs.length} documents</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {propertyDocs.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <CardTitle className="text-sm font-medium truncate">{doc.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {doc.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{doc.category}</span>
                              <span>{doc.size}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" onClick={() => handleView(doc)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      <UploadDocumentModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        properties={properties}
      />
      {selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
        />
      )}
    </div>
  )
}
