'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, MapPin, Clock, Euro, Leaf, FileText } from 'lucide-react'
import ProjectForm from '@/components/ProjectForm'
import ProjectDetails from '@/components/ProjectDetails'
import { calculateTimeElapsed } from '@/lib/supabase'

// Dynamic import for the map to avoid SSR issues
const ForestMap = dynamic(() => import('@/components/ForestMap'), {
  loading: () => <div className="flex items-center justify-center h-96 bg-muted rounded-lg">Cargando mapa...</div>,
  ssr: false
})

export default function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute for chronometers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/forest-projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        console.error('Error fetching projects:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch('/api/forest-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (response.ok) {
        const result = await response.json()
        setProjects(prev => [result.data, ...prev])
        setShowProjectForm(false)
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      console.error('Error creating project:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const handleUpdateProject = async (projectId, projectData) => {
    try {
      const response = await fetch(`/api/forest-projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (response.ok) {
        const result = await response.json()
        setProjects(prev => prev.map(p => p.id === projectId ? result.data : p))
        setEditingProject(null)
        setSelectedProject(result.data)
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      console.error('Error updating project:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const handleDeleteProject = async (projectId) => {
    try {
      const response = await fetch(`/api/forest-projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId))
        setSelectedProject(null)
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const totalStats = projects.reduce((acc, project) => ({
    totalProjects: acc.totalProjects + 1,
    totalCarbonTons: acc.totalCarbonTons + parseFloat(project.carbon_tons_fixed || 0),
    totalCredits: acc.totalCredits + parseInt(project.carbon_credits_generated || 0),
    totalAmount: acc.totalAmount + parseFloat(project.total_amount || 0),
    totalHectares: acc.totalHectares + parseFloat(project.hectares || 0)
  }), { totalProjects: 0, totalCarbonTons: 0, totalCredits: 0, totalAmount: 0, totalHectares: 0 })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-green-700">Cargando proyectos forestales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-900">Mapa Forestal España</h1>
                <p className="text-sm text-green-700">Proyectos de carbono y reforestación</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowProjectForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Proyectos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{totalStats.totalProjects}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <Leaf className="h-4 w-4 mr-2" />
                Toneladas CO₂
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{totalStats.totalCarbonTons.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Créditos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{totalStats.totalCredits.toLocaleString('es-ES')}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <Euro className="h-4 w-4 mr-2" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">€{totalStats.totalAmount.toLocaleString('es-ES')}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Hectáreas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{totalStats.totalHectares.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-green-200 h-[600px]">
              <CardHeader>
                <CardTitle className="text-green-900">Mapa de Proyectos</CardTitle>
              </CardHeader>
              <CardContent className="h-[520px] p-0">
                <ForestMap 
                  projects={projects}
                  selectedProject={selectedProject}
                  onProjectSelect={setSelectedProject}
                />
              </CardContent>
            </Card>
          </div>

          {/* Project Details / List */}
          <div className="space-y-4">
            {selectedProject ? (
              <ProjectDetails
                project={selectedProject}
                onEdit={() => setEditingProject(selectedProject)}
                onDelete={() => handleDeleteProject(selectedProject.id)}
                onClose={() => setSelectedProject(null)}
                currentTime={currentTime}
              />
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">Proyectos Recientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
                  {projects.slice(0, 10).map((project) => {
                    const elapsed = calculateTimeElapsed(project.contract_date)
                    return (
                      <div
                        key={project.id}
                        className="p-3 border border-green-200 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-green-900 text-sm">{project.project_name}</h4>
                            <p className="text-xs text-green-600 mt-1">
                              {project.carbon_tons_fixed} t CO₂ • €{project.total_amount.toLocaleString('es-ES')}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-green-700">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="chronometer">
                                {elapsed.days}d {elapsed.hours}h {elapsed.minutes}m
                              </span>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            project.legal_bureaucracy_status === 'Aprobado' 
                              ? 'bg-green-100 text-green-800' 
                              : project.legal_bureaucracy_status === 'En proceso'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {project.legal_bureaucracy_status}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onClose={() => setShowProjectForm(false)}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectForm
          project={editingProject}
          onSubmit={(data) => handleUpdateProject(editingProject.id, data)}
          onClose={() => setEditingProject(null)}
          isEditing={true}
        />
      )}
    </div>
  )
}