'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Save, MapPin } from 'lucide-react'

const ProjectForm = ({ project, onSubmit, onClose, isEditing = false }) => {
  const [formData, setFormData] = useState({
    project_name: project?.project_name || '',
    latitude: project?.latitude || '',
    longitude: project?.longitude || '',
    carbon_tons_fixed: project?.carbon_tons_fixed || '',
    carbon_credits_generated: project?.carbon_credits_generated || '',
    price_per_credit: project?.price_per_credit || '',
    contract_date: project?.contract_date ? new Date(project.contract_date).toISOString().split('T')[0] : '',
    hectares: project?.hectares || '',
    legal_bureaucracy_status: project?.legal_bureaucracy_status || 'En proceso'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculate total amount automatically
  const calculateTotalAmount = () => {
    const credits = parseFloat(formData.carbon_credits_generated) || 0
    const price = parseFloat(formData.price_per_credit) || 0
    return credits * price
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.project_name.trim()) {
      setError('El nombre del proyecto es obligatorio')
      setLoading(false)
      return
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Las coordenadas son obligatorias')
      setLoading(false)
      return
    }

    if (!formData.contract_date) {
      setError('La fecha de contrato es obligatoria')
      setLoading(false)
      return
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      carbon_tons_fixed: parseFloat(formData.carbon_tons_fixed) || 0,
      carbon_credits_generated: parseInt(formData.carbon_credits_generated) || 0,
      price_per_credit: parseFloat(formData.price_per_credit) || 0,
      hectares: parseFloat(formData.hectares) || 0,
      total_amount: calculateTotalAmount()
    }

    const result = await onSubmit(submitData)
    
    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Error al guardar el proyecto')
    }
    
    setLoading(false)
  }

  const getLocationFromMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }))
        },
        (error) => {
          setError('No se pudo obtener la ubicación actual')
        }
      )
    } else {
      setError('Geolocalización no soportada por el navegador')
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-green-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            {isEditing ? 'Editar Proyecto Forestal' : 'Nuevo Proyecto Forestal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project_name">Nombre del Proyecto *</Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e) => handleChange('project_name', e.target.value)}
              placeholder="Ej: Reforestación Sierra de Gredos"
              required
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                placeholder="40.4637"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                placeholder="-3.7492"
                required
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={getLocationFromMap}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Usar ubicación actual
          </Button>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hectares">Hectáreas</Label>
              <Input
                id="hectares"
                type="number"
                step="0.1"
                value={formData.hectares}
                onChange={(e) => handleChange('hectares', e.target.value)}
                placeholder="150.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbon_tons_fixed">Toneladas CO₂ Fijadas</Label>
              <Input
                id="carbon_tons_fixed"
                type="number"
                step="0.1"
                value={formData.carbon_tons_fixed}
                onChange={(e) => handleChange('carbon_tons_fixed', e.target.value)}
                placeholder="1250.5"
              />
            </div>
          </div>

          {/* Carbon Credits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbon_credits_generated">Créditos de Carbono</Label>
              <Input
                id="carbon_credits_generated"
                type="number"
                value={formData.carbon_credits_generated}
                onChange={(e) => handleChange('carbon_credits_generated', e.target.value)}
                placeholder="1200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_per_credit">Precio por Crédito (€)</Label>
              <Input
                id="price_per_credit"
                type="number"
                step="0.01"
                value={formData.price_per_credit}
                onChange={(e) => handleChange('price_per_credit', e.target.value)}
                placeholder="45.50"
              />
            </div>
          </div>

          {/* Calculated Total */}
          {formData.carbon_credits_generated && formData.price_per_credit && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <Label className="text-green-800 font-medium">Montante Total Calculado</Label>
              <div className="text-2xl font-bold text-green-900">
                €{calculateTotalAmount().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}

          {/* Contract Date */}
          <div className="space-y-2">
            <Label htmlFor="contract_date">Fecha de Firma del Contrato *</Label>
            <Input
              id="contract_date"
              type="date"
              value={formData.contract_date}
              onChange={(e) => handleChange('contract_date', e.target.value)}
              required
            />
          </div>

          {/* Legal Status */}
          <div className="space-y-2">
            <Label htmlFor="legal_bureaucracy_status">Estado Legal/Burocrático</Label>
            <Select
              value={formData.legal_bureaucracy_status}
              onValueChange={(value) => handleChange('legal_bureaucracy_status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Rechazado">Rechazado</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Proyecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectForm