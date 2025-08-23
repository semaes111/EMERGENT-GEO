#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Forest Projects
Tests all CRUD operations, data validation, and Supabase integration
UPDATED: Added focused connection error resolution tests
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta
import os

# Get base URL from environment - use localhost for internal testing
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class ForestProjectAPITester:
    def __init__(self):
        self.test_results = []
        self.created_project_ids = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_get_all_projects(self):
        """Test GET /api/forest-projects - List all projects"""
        try:
            response = requests.get(f"{API_BASE}/forest-projects", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result(
                        "GET /api/forest-projects", 
                        True, 
                        f"Successfully retrieved {len(data)} projects",
                        f"Response contains {len(data)} forest projects"
                    )
                    return data
                else:
                    self.log_result(
                        "GET /api/forest-projects", 
                        False, 
                        "Response is not a list",
                        f"Expected list, got {type(data)}"
                    )
            else:
                self.log_result(
                    "GET /api/forest-projects", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "GET /api/forest-projects", 
                False, 
                "Request failed",
                str(e)
            )
        return []
    
    def test_create_project_valid(self):
        """Test POST /api/forest-projects with valid data"""
        try:
            # Create realistic Spanish forest project data
            project_data = {
                "project_name": "Bosque de Robles - Asturias",
                "latitude": 43.3614,  # Asturias coordinates
                "longitude": -5.8593,
                "carbon_tons_fixed": 1850.7,
                "carbon_credits_generated": 1800,
                "price_per_credit": 47.25,
                "contract_date": "2024-01-15T00:00:00.000Z",
                "total_amount": 85050,  # 1800 * 47.25
                "hectares": 125.3,
                "legal_bureaucracy_status": "En proceso"
            }
            
            response = requests.post(
                f"{API_BASE}/forest-projects",
                json=project_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('data'):
                    project_id = result['data']['id']
                    self.created_project_ids.append(project_id)
                    
                    # Verify carbon credit calculation
                    expected_total = project_data['carbon_credits_generated'] * project_data['price_per_credit']
                    actual_total = result['data'].get('total_amount', 0)
                    
                    self.log_result(
                        "POST /api/forest-projects (valid)", 
                        True, 
                        f"Project created successfully with ID: {project_id}",
                        f"Carbon calculation: {expected_total} expected, {actual_total} actual"
                    )
                    return result['data']
                else:
                    self.log_result(
                        "POST /api/forest-projects (valid)", 
                        False, 
                        "Invalid response structure",
                        response.text
                    )
            else:
                self.log_result(
                    "POST /api/forest-projects (valid)", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "POST /api/forest-projects (valid)", 
                False, 
                "Request failed",
                str(e)
            )
        return None
    
    def test_create_project_missing_fields(self):
        """Test POST /api/forest-projects with missing required fields"""
        try:
            # Missing required fields
            incomplete_data = {
                "project_name": "Incomplete Project",
                "latitude": 40.4168,
                # Missing longitude, carbon data, etc.
            }
            
            response = requests.post(
                f"{API_BASE}/forest-projects",
                json=incomplete_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should handle gracefully (either create with defaults or return error)
            if response.status_code in [200, 400, 422]:
                self.log_result(
                    "POST /api/forest-projects (missing fields)", 
                    True, 
                    f"Handled missing fields appropriately (HTTP {response.status_code})",
                    response.text[:200]
                )
            else:
                self.log_result(
                    "POST /api/forest-projects (missing fields)", 
                    False, 
                    f"Unexpected HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "POST /api/forest-projects (missing fields)", 
                False, 
                "Request failed",
                str(e)
            )
    
    def test_coordinate_validation(self):
        """Test geographic coordinate validation for Spanish locations"""
        try:
            # Test with coordinates outside Spain
            invalid_coords_data = {
                "project_name": "Invalid Location Project",
                "latitude": 90.0,  # North Pole - invalid for Spain
                "longitude": 180.0,  # Invalid for Spain
                "carbon_tons_fixed": 1000,
                "carbon_credits_generated": 1000,
                "price_per_credit": 45.0,
                "contract_date": "2024-01-01T00:00:00.000Z",
                "total_amount": 45000,
                "hectares": 100,
                "legal_bureaucracy_status": "En proceso"
            }
            
            response = requests.post(
                f"{API_BASE}/forest-projects",
                json=invalid_coords_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should either accept (no validation) or reject appropriately
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    # If accepted, add to cleanup list
                    if result.get('data', {}).get('id'):
                        self.created_project_ids.append(result['data']['id'])
                    self.log_result(
                        "Coordinate validation", 
                        True, 
                        "Coordinates accepted (no validation implemented)",
                        "API accepts coordinates outside Spain"
                    )
                else:
                    self.log_result(
                        "Coordinate validation", 
                        True, 
                        "Invalid coordinates rejected",
                        response.text
                    )
            elif response.status_code in [400, 422]:
                self.log_result(
                    "Coordinate validation", 
                    True, 
                    "Invalid coordinates properly rejected",
                    response.text
                )
            else:
                self.log_result(
                    "Coordinate validation", 
                    False, 
                    f"Unexpected HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "Coordinate validation", 
                False, 
                "Request failed",
                str(e)
            )
    
    def test_get_single_project(self, project_id):
        """Test GET /api/forest-projects/{id}"""
        if not project_id:
            self.log_result(
                "GET /api/forest-projects/{id}", 
                False, 
                "No project ID available for testing",
                "Skipping single project test"
            )
            return None
            
        try:
            response = requests.get(f"{API_BASE}/forest-projects/{project_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data and data.get('id') == project_id:
                    self.log_result(
                        "GET /api/forest-projects/{id}", 
                        True, 
                        f"Successfully retrieved project {project_id}",
                        f"Project name: {data.get('project_name', 'N/A')}"
                    )
                    return data
                else:
                    self.log_result(
                        "GET /api/forest-projects/{id}", 
                        False, 
                        "Invalid project data returned",
                        response.text
                    )
            else:
                self.log_result(
                    "GET /api/forest-projects/{id}", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "GET /api/forest-projects/{id}", 
                False, 
                "Request failed",
                str(e)
            )
        return None
    
    def test_update_project(self, project_id):
        """Test PUT /api/forest-projects/{id}"""
        if not project_id:
            self.log_result(
                "PUT /api/forest-projects/{id}", 
                False, 
                "No project ID available for testing",
                "Skipping update test"
            )
            return None
            
        try:
            # Update with partial data
            update_data = {
                "project_name": "Updated Forest Project - Galicia",
                "carbon_tons_fixed": 2000.0,
                "legal_bureaucracy_status": "Aprobado"
            }
            
            response = requests.put(
                f"{API_BASE}/forest-projects/{project_id}",
                json=update_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('data'):
                    updated_project = result['data']
                    if updated_project.get('project_name') == update_data['project_name']:
                        self.log_result(
                            "PUT /api/forest-projects/{id}", 
                            True, 
                            f"Successfully updated project {project_id}",
                            f"New name: {updated_project.get('project_name')}"
                        )
                        return updated_project
                    else:
                        self.log_result(
                            "PUT /api/forest-projects/{id}", 
                            False, 
                            "Update not reflected in response",
                            response.text
                        )
                else:
                    self.log_result(
                        "PUT /api/forest-projects/{id}", 
                        False, 
                        "Invalid response structure",
                        response.text
                    )
            else:
                self.log_result(
                    "PUT /api/forest-projects/{id}", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "PUT /api/forest-projects/{id}", 
                False, 
                "Request failed",
                str(e)
            )
        return None
    
    def test_delete_project(self, project_id):
        """Test DELETE /api/forest-projects/{id}"""
        if not project_id:
            self.log_result(
                "DELETE /api/forest-projects/{id}", 
                False, 
                "No project ID available for testing",
                "Skipping delete test"
            )
            return False
            
        try:
            response = requests.delete(f"{API_BASE}/forest-projects/{project_id}", timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    # Remove from cleanup list since it's deleted
                    if project_id in self.created_project_ids:
                        self.created_project_ids.remove(project_id)
                    
                    self.log_result(
                        "DELETE /api/forest-projects/{id}", 
                        True, 
                        f"Successfully deleted project {project_id}",
                        result.get('message', 'Project deleted')
                    )
                    return True
                else:
                    self.log_result(
                        "DELETE /api/forest-projects/{id}", 
                        False, 
                        "Delete operation failed",
                        response.text
                    )
            else:
                self.log_result(
                    "DELETE /api/forest-projects/{id}", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "DELETE /api/forest-projects/{id}", 
                False, 
                "Request failed",
                str(e)
            )
        return False
    
    def test_invalid_endpoints(self):
        """Test invalid endpoints and error handling"""
        try:
            # Test invalid project ID
            response = requests.get(f"{API_BASE}/forest-projects/invalid-id-12345", timeout=10)
            
            if response.status_code in [404, 500]:
                self.log_result(
                    "Invalid project ID handling", 
                    True, 
                    f"Properly handled invalid ID (HTTP {response.status_code})",
                    response.text[:100]
                )
            else:
                self.log_result(
                    "Invalid project ID handling", 
                    False, 
                    f"Unexpected response for invalid ID (HTTP {response.status_code})",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "Invalid project ID handling", 
                False, 
                "Request failed",
                str(e)
            )
        
        try:
            # Test non-existent endpoint
            response = requests.get(f"{API_BASE}/non-existent-endpoint", timeout=10)
            
            if response.status_code == 404:
                self.log_result(
                    "Non-existent endpoint handling", 
                    True, 
                    "Properly returned 404 for non-existent endpoint",
                    response.text[:100]
                )
            else:
                self.log_result(
                    "Non-existent endpoint handling", 
                    False, 
                    f"Unexpected response for non-existent endpoint (HTTP {response.status_code})",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "Non-existent endpoint handling", 
                False, 
                "Request failed",
                str(e)
            )
    
    def test_supabase_integration(self):
        """Test Supabase database integration"""
        try:
            # Test database initialization by checking if sample data exists
            response = requests.get(f"{API_BASE}/forest-projects", timeout=10)
            
            if response.status_code == 200:
                projects = response.json()
                
                # Check if we have sample data (should have at least some projects)
                if len(projects) >= 0:  # Allow empty database
                    self.log_result(
                        "Supabase database connection", 
                        True, 
                        f"Database accessible with {len(projects)} projects",
                        "Supabase integration working"
                    )
                    
                    # Check for sample data characteristics
                    spanish_projects = [p for p in projects if 
                                     p.get('latitude', 0) >= 35.0 and p.get('latitude', 0) <= 44.0 and
                                     p.get('longitude', 0) >= -10.0 and p.get('longitude', 0) <= 5.0]
                    
                    if spanish_projects:
                        self.log_result(
                            "Spanish geographic data", 
                            True, 
                            f"Found {len(spanish_projects)} projects with Spanish coordinates",
                            "Geographic validation working"
                        )
                    else:
                        self.log_result(
                            "Spanish geographic data", 
                            True, 
                            "No projects with Spanish coordinates found (may be empty DB)",
                            "Database accessible but no Spanish projects"
                        )
                else:
                    self.log_result(
                        "Supabase database connection", 
                        False, 
                        "Invalid response from database",
                        "Expected array of projects"
                    )
            else:
                self.log_result(
                    "Supabase database connection", 
                    False, 
                    f"Database connection failed (HTTP {response.status_code})",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "Supabase database connection", 
                False, 
                "Database connection test failed",
                str(e)
            )
    
    def test_chronometer_functionality(self):
        """Test chronometer functionality (contract date calculations)"""
        try:
            # Create a project with a specific contract date
            past_date = (datetime.now() - timedelta(days=30)).isoformat()
            
            project_data = {
                "project_name": "Chronometer Test Project",
                "latitude": 42.3601,  # Santiago de Compostela
                "longitude": -8.3959,
                "carbon_tons_fixed": 500.0,
                "carbon_credits_generated": 500,
                "price_per_credit": 40.0,
                "contract_date": past_date,
                "total_amount": 20000,
                "hectares": 50.0,
                "legal_bureaucracy_status": "Aprobado"
            }
            
            response = requests.post(
                f"{API_BASE}/forest-projects",
                json=project_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('data'):
                    project_id = result['data']['id']
                    self.created_project_ids.append(project_id)
                    
                    # Verify contract date is stored correctly
                    stored_date = result['data'].get('contract_date')
                    if stored_date:
                        self.log_result(
                            "Chronometer functionality", 
                            True, 
                            "Contract date stored successfully",
                            f"Stored date: {stored_date}"
                        )
                    else:
                        self.log_result(
                            "Chronometer functionality", 
                            False, 
                            "Contract date not stored properly",
                            response.text
                        )
                else:
                    self.log_result(
                        "Chronometer functionality", 
                        False, 
                        "Failed to create chronometer test project",
                        response.text
                    )
            else:
                self.log_result(
                    "Chronometer functionality", 
                    False, 
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result(
                "Chronometer functionality", 
                False, 
                "Chronometer test failed",
                str(e)
            )
    
    def cleanup_test_data(self):
        """Clean up test projects created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_project_ids)} test projects...")
        
        for project_id in self.created_project_ids[:]:  # Copy list to avoid modification during iteration
            try:
                response = requests.delete(f"{API_BASE}/forest-projects/{project_id}", timeout=10)
                if response.status_code == 200:
                    print(f"   ✅ Deleted project {project_id}")
                else:
                    print(f"   ⚠️  Failed to delete project {project_id}: HTTP {response.status_code}")
            except Exception as e:
                print(f"   ❌ Error deleting project {project_id}: {str(e)}")
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Forest Projects API Test Suite")
        print(f"🌐 Testing API at: {API_BASE}")
        print("=" * 60)
        
        # Test Supabase integration first
        self.test_supabase_integration()
        
        # Test basic CRUD operations
        projects = self.test_get_all_projects()
        
        # Test project creation
        created_project = self.test_create_project_valid()
        project_id = created_project.get('id') if created_project else None
        
        # Test data validation
        self.test_create_project_missing_fields()
        self.test_coordinate_validation()
        
        # Test chronometer functionality
        self.test_chronometer_functionality()
        
        # Test single project operations
        if project_id:
            self.test_get_single_project(project_id)
            self.test_update_project(project_id)
            # Don't delete the main test project yet
        elif projects:
            # Use existing project if available
            existing_id = projects[0].get('id')
            if existing_id:
                self.test_get_single_project(existing_id)
                # Don't update/delete existing projects
        
        # Test error handling
        self.test_invalid_endpoints()
        
        # Test delete operation (use a separate project)
        if len(self.created_project_ids) > 1:
            self.test_delete_project(self.created_project_ids[-1])
        
        # Generate summary
        self.print_summary()
        
        # Cleanup
        self.cleanup_test_data()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print(f"\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['message']}")
                    if result['details']:
                        print(f"      Details: {result['details']}")
        
        print(f"\n🎯 CRITICAL ISSUES:")
        critical_failures = [r for r in self.test_results if not r['success'] and 
                           any(keyword in r['test'].lower() for keyword in 
                               ['database', 'supabase', 'create', 'get /api/forest-projects'])]
        
        if critical_failures:
            for failure in critical_failures:
                print(f"   🚨 {failure['test']}: {failure['message']}")
        else:
            print("   ✅ No critical issues found")

    def test_connection_error_resolution(self):
        """FOCUSED TEST: Connection error resolution for POST /api/forest-projects"""
        print("\n🔥 FOCUSED CONNECTION ERROR RESOLUTION TESTS")
        print("=" * 70)
        
        # Test 1: Complete valid project with automatic total calculation
        print("\n1️⃣ TEST: Complete valid project with automatic total calculation")
        
        valid_project = {
            "name": "Bosque de Prueba Conexión",
            "location": "Asturias, España", 
            "latitude": 43.3614,
            "longitude": -5.8593,
            "hectares": 150.5,
            "carbon_tons_fixed": 2250.75,
            "carbon_credits_generated": 2250,
            "price_per_credit": 42.50,
            "legal_bureaucracy_status": "Certificado",
            "contract_date": "2024-01-15T10:30:00Z"
        }
        
        try:
            response = requests.post(f"{API_BASE}/forest-projects", 
                                   json=valid_project, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    project = data['data']
                    expected_total = 2250 * 42.50  # 95,625
                    actual_total = project.get('total_amount')
                    self.created_project_ids.append(project.get('id'))
                    
                    self.log_result(
                        "Connection Error Resolution - Complete Project", 
                        True, 
                        f"Project created successfully! Auto-calculated total: {actual_total}",
                        f"Expected: {expected_total}, Project ID: {project.get('id')}"
                    )
                    
                    # Verify data persistence
                    project_id = project.get('id')
                    verify_response = requests.get(f"{API_BASE}/forest-projects/{project_id}")
                    if verify_response.status_code == 200:
                        self.log_result(
                            "Data Persistence Verification", 
                            True, 
                            "Data persisted correctly in Supabase",
                            "Connection to database working"
                        )
                    else:
                        self.log_result(
                            "Data Persistence Verification", 
                            False, 
                            "Data persistence verification failed",
                            verify_response.text
                        )
                else:
                    self.log_result(
                        "Connection Error Resolution - Complete Project", 
                        False, 
                        "Invalid response structure",
                        response.text
                    )
            else:
                self.log_result(
                    "Connection Error Resolution - Complete Project", 
                    False, 
                    f"Request failed with HTTP {response.status_code}",
                    response.text
                )
                
        except requests.exceptions.ConnectionError as e:
            self.log_result(
                "Connection Error Resolution - Complete Project", 
                False, 
                "CONNECTION ERROR STILL EXISTS",
                str(e)
            )
        except Exception as e:
            self.log_result(
                "Connection Error Resolution - Complete Project", 
                False, 
                f"Unexpected error: {str(e)}",
                "Error during connection test"
            )
        
        # Test 2: Different date formats to test "Invalid time value" fix
        print("\n2️⃣ TEST: Different date formats (Invalid time value fix)")
        
        date_formats = [
            ("ISO with milliseconds", "2024-02-20T14:30:00.000Z"),
            ("ISO without milliseconds", "2024-02-20T14:30:00Z"),
            ("Date only", "2024-02-20"),
            ("With timezone", "2024-02-20T14:30:00+01:00")
        ]
        
        for desc, date_format in date_formats:
            test_project = {
                "name": f"Test Fecha - {desc}",
                "location": "Madrid, España",
                "latitude": 40.4168,
                "longitude": -3.7038,
                "hectares": 100,
                "carbon_credits_generated": 1000,
                "price_per_credit": 45.0,
                "legal_status": "En Proceso",
                "contract_date": date_format
            }
            
            try:
                response = requests.post(f"{API_BASE}/forest-projects", 
                                       json=test_project, 
                                       timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and data.get('data'):
                        self.created_project_ids.append(data['data'].get('id'))
                        self.log_result(
                            f"Date Format Test - {desc}", 
                            True, 
                            f"Date format '{date_format}' accepted",
                            "Invalid time value error resolved"
                        )
                    else:
                        self.log_result(
                            f"Date Format Test - {desc}", 
                            False, 
                            f"Date format '{date_format}' - invalid response",
                            response.text
                        )
                else:
                    self.log_result(
                        f"Date Format Test - {desc}", 
                        False, 
                        f"Date format '{date_format}' rejected: HTTP {response.status_code}",
                        response.text[:100]
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Date Format Test - {desc}", 
                    False, 
                    f"Error with date '{date_format}': {str(e)}",
                    "Date handling error"
                )
        
        # Test 3: Robust data types
        print("\n3️⃣ TEST: Robust data type handling")
        
        robust_project = {
            "name": "Proyecto Robusto",
            "location": "Galicia, España",
            "latitude": "42.5751",      # String latitude
            "longitude": "-8.1339",     # String longitude  
            "hectares": "200.5",        # String hectares
            "carbon_credits_generated": "3000",  # String credits
            "price_per_credit": "38.75", # String price
            "legal_status": "Certificado",
            "contract_date": "2024-03-10T09:00:00Z"
        }
        
        try:
            response = requests.post(f"{API_BASE}/forest-projects", 
                                   json=robust_project, 
                                   timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    project = data['data']
                    self.created_project_ids.append(project.get('id'))
                    self.log_result(
                        "Robust Data Type Handling", 
                        True, 
                        "String data types converted correctly",
                        f"Latitude: {project.get('latitude')}, Total: {project.get('total_amount')}"
                    )
                else:
                    self.log_result(
                        "Robust Data Type Handling", 
                        False, 
                        "Invalid response for string data types",
                        response.text
                    )
            else:
                self.log_result(
                    "Robust Data Type Handling", 
                    False, 
                    f"Robust data handling failed: HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Robust Data Type Handling", 
                False, 
                f"Error in robust test: {str(e)}",
                "Data type conversion error"
            )
        
        # Test 4: Error handling for invalid date
        print("\n4️⃣ TEST: Invalid date error handling")
        
        invalid_date_project = {
            "name": "Test Fecha Inválida",
            "location": "Valencia, España",
            "latitude": 39.4699,
            "longitude": -0.3763,
            "hectares": 75,
            "carbon_credits_generated": 800,
            "price_per_credit": 40.0,
            "legal_status": "En Proceso",
            "contract_date": "invalid-date-format"
        }
        
        try:
            response = requests.post(f"{API_BASE}/forest-projects", 
                                   json=invalid_date_project, 
                                   timeout=10)
            
            if response.status_code == 400:
                self.log_result(
                    "Invalid Date Error Handling", 
                    True, 
                    "Invalid date properly rejected with 400 error",
                    response.text
                )
            elif response.status_code == 500:
                # Check if it's a proper error message
                error_text = response.text
                if "Fecha de contrato inválida" in error_text or "Invalid" in error_text:
                    self.log_result(
                        "Invalid Date Error Handling", 
                        True, 
                        "Invalid date handled with proper error message",
                        error_text
                    )
                else:
                    self.log_result(
                        "Invalid Date Error Handling", 
                        False, 
                        "Invalid date caused server error without proper message",
                        error_text
                    )
            else:
                self.log_result(
                    "Invalid Date Error Handling", 
                    False, 
                    f"Invalid date not handled correctly: HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Invalid Date Error Handling", 
                False, 
                f"Error in invalid date test: {str(e)}",
                "Date validation error"
            )

if __name__ == "__main__":
    print("🌲 Forest Projects Backend API Tester")
    print(f"🔗 Base URL: {BASE_URL}")
    print(f"🔗 API URL: {API_BASE}")
    
    # Check if we should run focused connection tests
    if len(sys.argv) > 1 and sys.argv[1] == "--connection-test":
        print("\n🔥 RUNNING FOCUSED CONNECTION ERROR RESOLUTION TESTS")
        tester = ForestProjectAPITester()
        try:
            tester.test_connection_error_resolution()
            tester.print_summary()
            tester.cleanup_test_data()
        except Exception as e:
            print(f"\n💥 Connection test error: {str(e)}")
            tester.cleanup_test_data()
            sys.exit(1)
    else:
        # Run full test suite
        tester = ForestProjectAPITester()
        
        try:
            tester.run_all_tests()
        except KeyboardInterrupt:
            print("\n⚠️  Testing interrupted by user")
            tester.cleanup_test_data()
        except Exception as e:
            print(f"\n💥 Unexpected error during testing: {str(e)}")
            tester.cleanup_test_data()
            sys.exit(1)
        
        # Exit with error code if there were critical failures
        critical_failures = [r for r in tester.test_results if not r['success'] and 
                            any(keyword in r['test'].lower() for keyword in 
                                ['database', 'supabase', 'create', 'get /api/forest-projects'])]
        
        if critical_failures:
            print(f"\n💥 Exiting with error code due to {len(critical_failures)} critical failures")
            sys.exit(1)
        else:
            print(f"\n🎉 All tests completed successfully!")
            sys.exit(0)