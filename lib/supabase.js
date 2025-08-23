import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database initialization function
export const initializeDatabase = async () => {
  try {
    // Check if data exists, if not initialize with sample data
    const { data: existingData } = await supabase
      .from('forest_projects')
      .select('id')
      .limit(1)
    
    if (!existingData || existingData.length === 0) {
      await initializeData()
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

export const initializeData = async () => {
  const initialData = [
    {
      id: `project_${Date.now()}_1`,
      project_name: 'Bosque de Alcornoques - Cádiz',
      latitude: 36.1699,
      longitude: -5.6076,
      carbon_tons_fixed: 1250.5,
      carbon_credits_generated: 1200,
      price_per_credit: 45.50,
      contract_date: '2023-03-15T00:00:00.000Z',
      total_amount: 54600,
      hectares: 85.2,
      legal_bureaucracy_status: 'Aprobado'
    },
    {
      id: `project_${Date.now()}_2`,
      project_name: 'Reforestación Sierra Nevada',
      latitude: 37.0954,
      longitude: -3.3986,
      carbon_tons_fixed: 2100.8,
      carbon_credits_generated: 2000,
      price_per_credit: 42.75,
      contract_date: '2023-01-20T00:00:00.000Z',
      total_amount: 85500,
      hectares: 150.7,
      legal_bureaucracy_status: 'En proceso'
    },
    {
      id: `project_${Date.now()}_3`,
      project_name: 'Conservación Pinar Valsaín',
      latitude: 40.8833,
      longitude: -4.0167,
      carbon_tons_fixed: 890.3,
      carbon_credits_generated: 850,
      price_per_credit: 48.20,
      contract_date: '2023-06-10T00:00:00.000Z',
      total_amount: 40970,
      hectares: 62.5,
      legal_bureaucracy_status: 'Aprobado'
    }
  ]

  const { error } = await supabase
    .from('forest_projects')
    .insert(initialData)

  if (error) {
    console.error('Error initializing data:', error)
    throw error
  }
}

// Utility function to calculate time elapsed since contract date
export const calculateTimeElapsed = (contractDate) => {
  const now = new Date()
  const startDate = new Date(contractDate)
  const diffMs = now - startDate
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return { days, hours, minutes, totalMs: diffMs }
}