'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MapPin, 
  Leaf, 
  Euro, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  FileText,
  TrendingUp,
  X
} from 'lucide-react'
import { calculateTimeElapsed } from '@/lib/supabase'

const ProjectDetails = ({ project, onEdit, onDelete, onClose, currentTime }) => {
  const [timeElapsed, setTimeElapsed] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (project?.contract_date) {
      setTimeElapsed(calculateTimeElapsed(project.contract_date))
    }
  }, [project?.contract_date, currentTime])

  const handleDelete = async () => {
    const result = await onDelete(project.id)
    if (result?.success) {
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'En proceso':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Pendiente':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Suspendido':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!project) return null

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-green-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-green-900 text-lg leading-tight">
              {project.project_name}
            </CardTitle>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <MapPin className="h-4 w-4 mr-1" />
              {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.legal_bureaucracy_status)}`}>
            {project.legal_bureaucracy_status}
          </span>
        </div>

        {/* Chronometer */}
        {timeElapsed && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Tiempo desde contrato</span>
              </div>
              <div className="chronometer text-2xl font-bold text-green-900">
                {timeElapsed.days}d {timeElapsed.hours}h {timeElapsed.minutes}m
              </div>
              <div className="text-xs text-green-600 mt-1">
                Iniciado el {formatDate(project.contract_date)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 p-3 rounded-lg border border-green-100">
            <div className="flex items-center text-green-700 mb-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Hectáreas</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              {project.hectares} ha
            </div>
          </div>

          <div className="bg-white/60 p-3 rounded-lg border border-green-100">
            <div className="flex items-center text-green-700 mb-1">
              <Leaf className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">CO₂ Fijado</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              {project.carbon_tons_fixed} t
            </div>
          </div>

          <div className="bg-white/60 p-3 rounded-lg border border-green-100">
            <div className="flex items-center text-green-700 mb-1">
              <FileText className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Créditos</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              {project.carbon_credits_generated.toLocaleString('es-ES')}
            </div>
          </div>

          <div className="bg-white/60 p-3 rounded-lg border border-green-100">
            <div className="flex items-center text-green-700 mb-1">
              <Euro className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Precio/Crédito</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              €{project.price_per_credit}
            </div>
          </div>
        </div>

        {/* Total Value */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Euro className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Valor Total del Proyecto</span>
            </div>
            <div className="text-3xl font-bold">
              €{project.total_amount.toLocaleString('es-ES')}
            </div>
          </CardContent>
        </Card>

        {/* Contract Date */}
        <div className="bg-white/60 p-3 rounded-lg border border-green-100">
          <div className="flex items-center text-green-700 mb-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Fecha de Contrato</span>
          </div>
          <div className="text-sm text-green-900">
            {formatDate(project.contract_date)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onEdit}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          
          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
              >
                Confirmar
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Calculation Details */}
        <div className="bg-white/40 p-3 rounded-lg border border-green-100 text-xs space-y-1">
          <div className="font-medium text-green-800 mb-2">Detalles del Cálculo:</div>
          <div className="text-green-700">
            {project.carbon_credits_generated.toLocaleString('es-ES')} créditos × €{project.price_per_credit} = €{project.total_amount.toLocaleString('es-ES')}
          </div>
          <div className="text-green-600">
            Ratio: {(project.carbon_tons_fixed / project.hectares).toFixed(2)} t CO₂/ha
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectDetails