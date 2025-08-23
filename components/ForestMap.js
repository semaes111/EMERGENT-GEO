'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom forest marker icon
const createForestIcon = (status) => {
  const color = status === 'Aprobado' ? '#16a34a' : status === 'En proceso' ? '#eab308' : '#dc2626'
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
        </svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  })
}

const ForestMap = ({ projects, selectedProject, onProjectSelect }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map centered on Spain
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [40.4637, -3.7492], // Madrid, Spain
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    })

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(mapInstanceRef.current)

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when projects change
  useEffect(() => {
    if (!mapInstanceRef.current || !projects) return

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = {}

    // Add markers for each project
    projects.forEach(project => {
      if (project.latitude && project.longitude) {
        const marker = L.marker([project.latitude, project.longitude], {
          icon: createForestIcon(project.legal_bureaucracy_status)
        })

        // Create popup content
        const popupContent = `
          <div class="custom-popup">
            <h3 style="font-weight: bold; color: #065f46; margin: 0 0 8px 0; font-size: 14px;">
              ${project.project_name}
            </h3>
            <div style="font-size: 12px; color: #047857; line-height: 1.4;">
              <div style="margin: 4px 0;">
                <strong>Carbono fijado:</strong> ${project.carbon_tons_fixed} t CO₂
              </div>
              <div style="margin: 4px 0;">
                <strong>Créditos:</strong> ${project.carbon_credits_generated.toLocaleString('es-ES')}
              </div>
              <div style="margin: 4px 0;">
                <strong>Valor:</strong> €${project.total_amount.toLocaleString('es-ES')}
              </div>
              <div style="margin: 4px 0;">
                <strong>Hectáreas:</strong> ${project.hectares} ha
              </div>
              <div style="margin: 8px 0 4px 0;">
                <span style="
                  background-color: ${project.legal_bureaucracy_status === 'Aprobado' ? '#dcfce7' : 
                                     project.legal_bureaucracy_status === 'En proceso' ? '#fef3c7' : '#fee2e2'};
                  color: ${project.legal_bureaucracy_status === 'Aprobado' ? '#166534' : 
                           project.legal_bureaucracy_status === 'En proceso' ? '#92400e' : '#991b1b'};
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 11px;
                  font-weight: 500;
                ">
                  ${project.legal_bureaucracy_status}
                </span>
              </div>
            </div>
            <button 
              onclick="window.selectProject('${project.id}')"
              style="
                background-color: #16a34a;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 11px;
                cursor: pointer;
                margin-top: 8px;
                width: 100%;
              "
            >
              Ver detalles
            </button>
          </div>
        `

        marker.bindPopup(popupContent, {
          maxWidth: 250,
          className: 'custom-popup'
        })

        // Add click handler
        marker.on('click', () => {
          onProjectSelect(project)
        })

        marker.addTo(mapInstanceRef.current)
        markersRef.current[project.id] = marker
      }
    })

    // Make selectProject function available globally for popup buttons
    window.selectProject = (projectId) => {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        onProjectSelect(project)
      }
    }

  }, [projects, onProjectSelect])

  // Highlight selected project
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedProject) return

    const marker = markersRef.current[selectedProject.id]
    if (marker) {
      // Center map on selected project
      mapInstanceRef.current.setView([selectedProject.latitude, selectedProject.longitude], 10, {
        animate: true,
        duration: 1
      })
      
      // Open popup
      marker.openPopup()
    }
  }, [selectedProject])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  )
}

export default ForestMap