import { NextResponse } from 'next/server';
import { supabase, initializeDatabase } from '../../../lib/supabase.js';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    // Initialize database on first request
    await initializeDatabase();
    
    if (path === 'forest-projects' || path === 'forest-projects/') {
      const { data, error } = await supabase
        .from('forest_projects')
        .select('*')
        .order('contract_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching forest projects:', error);
        return NextResponse.json({ error: 'Failed to fetch forest projects' }, { status: 500 });
      }
      
      return NextResponse.json(data || []);
    }
    
    if (path.startsWith('forest-projects/')) {
      const id = path.split('/')[1];
      const { data, error } = await supabase
        .from('forest_projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching forest project:', error);
        return NextResponse.json({ error: 'Failed to fetch forest project' }, { status: 500 });
      }
      
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    if (path === 'forest-projects' || path === 'forest-projects/') {
      const body = await request.json();
      
      // Generate unique ID and calculate totals
      const projectData = {
        ...body,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Calculate total_amount if not provided
      if (!projectData.total_amount && projectData.carbon_credits_generated && projectData.price_per_credit) {
        projectData.total_amount = parseFloat(projectData.carbon_credits_generated) * parseFloat(projectData.price_per_credit);
      }
      
      // Helper function to safely convert to number with default
      const safeParseFloat = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '' || isNaN(value)) {
          return defaultValue;
        }
        return parseFloat(value);
      };
      
      const safeParseInt = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '' || isNaN(value)) {
          return defaultValue;
        }
        return parseInt(value);
      };
      
      // Ensure numeric fields are properly converted with defaults
      projectData.latitude = safeParseFloat(projectData.latitude, 0);
      projectData.longitude = safeParseFloat(projectData.longitude, 0);
      projectData.carbon_tons_fixed = safeParseFloat(projectData.carbon_tons_fixed, 0);
      projectData.carbon_credits_generated = safeParseInt(projectData.carbon_credits_generated, 0);
      projectData.price_per_credit = safeParseFloat(projectData.price_per_credit, 0);
      projectData.hectares = safeParseFloat(projectData.hectares, 0);
      projectData.total_amount = safeParseFloat(projectData.total_amount, 0);
      
      // Handle contract_date conversion safely
      if (body.contract_date) {
        try {
          projectData.contract_date = new Date(body.contract_date).toISOString();
        } catch (error) {
          console.error('Invalid contract_date:', body.contract_date);
          return NextResponse.json({ error: 'Fecha de contrato inválida' }, { status: 400 });
        }
      }
      
      const { data, error } = await supabase
        .from('forest_projects')
        .insert([projectData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating forest project:', error);
        return NextResponse.json({ error: 'Failed to create forest project' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data });
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    if (path.startsWith('forest-projects/')) {
      const id = path.split('/')[1];
      const body = await request.json();
      
      // Convert contract_date to ISO string if provided
      if (body.contract_date) {
        try {
          body.contract_date = new Date(body.contract_date).toISOString();
        } catch (error) {
          console.error('Invalid contract_date:', body.contract_date);
          return NextResponse.json({ error: 'Fecha de contrato inválida' }, { status: 400 });
        }
      }
      
      const { data, error } = await supabase
        .from('forest_projects')
        .update(body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating forest project:', error);
        return NextResponse.json({ error: 'Failed to update forest project' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data });
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    if (path.startsWith('forest-projects/')) {
      const id = path.split('/')[1];
      
      const { error } = await supabase
        .from('forest_projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting forest project:', error);
        return NextResponse.json({ error: 'Failed to delete forest project' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Project deleted successfully' });
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}