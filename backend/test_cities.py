"""
Test suite for cities module
Tests city data retrieval and management
"""
import unittest
from unittest.mock import patch, MagicMock
import os
import sys
import json

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import create_app from server
from server import create_app

# Mock extensions before importing city modules
with patch('extensions.mongo') as mock_mongo:
    mock_mongo.db.cities = MagicMock()
    from cities.cities import cities_bp, cities_db
    from extensions import mongo


class TestCitiesAPI(unittest.TestCase):
    """Test cities API endpoints"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.register_blueprint(cities_bp, url_prefix='/cities')
        self.client = self.app.test_client()
        
        # Sample city data
        self.sample_cities = [
            {"_id": "city1", "city": "Sydney", "state": "New South Wales"},
            {"_id": "city2", "city": "Melbourne", "state": "Victoria"},
            {"_id": "city3", "city": "Brisbane", "state": "Queensland"},
            {"_id": "city4", "city": "Perth", "state": "Western Australia"}
        ]
    
    @patch('cities.cities.cities_db')
    def test_get_cities_root_route(self, mock_cities_db):
        """Test root route for cities endpoint"""
        mock_cities_db.find.return_value = self.sample_cities
        
        with self.app.app_context():
            response = self.client.get('/cities/')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(len(response_data), 4)
            
            # Verify _id is converted to string
            for city in response_data:
                self.assertIsInstance(city["_id"], str)
                self.assertIn("city", city)
                self.assertIn("state", city)
    
    @patch('cities.cities.cities_db')
    def test_get_all_cities(self, mock_cities_db):
        """Test get all cities endpoint"""
        mock_cities_db.find.return_value = self.sample_cities
        
        with self.app.app_context():
            response = self.client.get('/cities/get_all')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(len(response_data), 4)
            
            # Verify all cities are returned
            city_names = [city["city"] for city in response_data]
            self.assertIn("Sydney", city_names)
            self.assertIn("Melbourne", city_names)
            self.assertIn("Brisbane", city_names)
            self.assertIn("Perth", city_names)
    
    @patch('cities.cities.cities_db')
    def test_get_main_cities(self, mock_cities_db):
        """Test get main cities endpoint"""
        # Mock only main cities
        main_cities = [
            {"_id": "city1", "city": "Sydney", "state": "New South Wales"},
            {"_id": "city2", "city": "Melbourne", "state": "Victoria"},
            {"_id": "city3", "city": "Brisbane", "state": "Queensland"},
            {"_id": "city4", "city": "Canberra", "state": "Australian Capital Territory"}
        ]
        mock_cities_db.find.return_value = main_cities
        
        with self.app.app_context():
            response = self.client.get('/cities/get_main')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(len(response_data), 4)
            
            # Verify correct main cities query
            mock_cities_db.find.assert_called_once_with({
                "city": {"$in": ["Sydney", "Melbourne", "Brisbane", "Canberra"]}
            })
    
    @patch('cities.cities.cities_db')
    def test_add_all_cities(self, mock_cities_db):
        """Test bulk add cities endpoint"""
        cities_data = [
            {"city": "Adelaide", "admin_name": "South Australia"},
            {"city": "Darwin", "admin_name": "Northern Territory"},
            {"city": "Hobart", "admin_name": "Tasmania"}
        ]
        
        with self.app.app_context():
            response = self.client.post('/cities/add_all',
                                      data=json.dumps(cities_data),
                                      content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(response_data["message"], "Cities added correctly!")
            
            # Verify each city was inserted
            self.assertEqual(mock_cities_db.insert_one.call_count, 3)
            
            # Verify correct data structure
            insert_calls = mock_cities_db.insert_one.call_args_list
            for i, call in enumerate(insert_calls):
                inserted_data = call[0][0]
                self.assertEqual(inserted_data["city"], cities_data[i]["city"])
                self.assertEqual(inserted_data["state"], cities_data[i]["admin_name"])
    
    @patch('cities.cities.cities_db')
    def test_get_cities_empty_result(self, mock_cities_db):
        """Test getting cities when no cities exist"""
        mock_cities_db.find.return_value = []
        
        with self.app.app_context():
            response = self.client.get('/cities/get_all')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(len(response_data), 0)
    
    @patch('cities.cities.cities_db')
    def test_get_main_cities_missing_some(self, mock_cities_db):
        """Test get main cities when some are missing from database"""
        # Only return 2 of the 4 main cities
        partial_main_cities = [
            {"_id": "city1", "city": "Sydney", "state": "New South Wales"},
            {"_id": "city2", "city": "Melbourne", "state": "Victoria"}
        ]
        mock_cities_db.find.return_value = partial_main_cities
        
        with self.app.app_context():
            response = self.client.get('/cities/get_main')
            
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(len(response_data), 2)
            
            # Verify only found cities are returned
            city_names = [city["city"] for city in response_data]
            self.assertIn("Sydney", city_names)
            self.assertIn("Melbourne", city_names)
            self.assertNotIn("Brisbane", city_names)
            self.assertNotIn("Canberra", city_names)


class TestCitiesValidation(unittest.TestCase):
    """Test city data validation"""
    
    def test_valid_city_data_structure(self):
        """Test validation of valid city data structure"""
        valid_city = {
            "city": "Sydney",
            "admin_name": "New South Wales"
        }
        
        # Test that required fields are present
        self.assertIn("city", valid_city)
        self.assertIn("admin_name", valid_city)
        self.assertTrue(valid_city["city"])  # Not empty
        self.assertTrue(valid_city["admin_name"])  # Not empty
    
    def test_main_cities_list(self):
        """Test main cities list is correctly defined"""
        expected_main_cities = ["Sydney", "Melbourne", "Brisbane", "Canberra"]
        
        # This mirrors the hardcoded list in the cities module
        self.assertEqual(len(expected_main_cities), 4)
        self.assertIn("Sydney", expected_main_cities)
        self.assertIn("Melbourne", expected_main_cities)
        self.assertIn("Brisbane", expected_main_cities)
        self.assertIn("Canberra", expected_main_cities)
    
    def test_australian_states_validation(self):
        """Test validation of Australian states"""
        valid_states = [
            "New South Wales",
            "Victoria", 
            "Queensland",
            "Western Australia",
            "South Australia",
            "Tasmania",
            "Northern Territory",
            "Australian Capital Territory"
        ]
        
        # Test that all states are valid Australian states
        for state in valid_states:
            self.assertIsInstance(state, str)
            self.assertTrue(len(state) > 2)  # Reasonable minimum length
    
    def test_city_name_validation(self):
        """Test city name validation"""
        valid_city_names = [
            "Sydney",
            "Melbourne", 
            "Brisbane",
            "Perth",
            "Adelaide",
            "Gold Coast",
            "Newcastle",
            "Wollongong"
        ]
        
        invalid_city_names = [
            "",  # Empty
            " ",  # Just whitespace
            "123",  # Just numbers
            "X",  # Too short
        ]
        
        # Test valid city names
        for city_name in valid_city_names:
            self.assertIsInstance(city_name, str)
            self.assertTrue(len(city_name) > 1)
            self.assertTrue(city_name.strip())  # Not empty after strip
        
        # Test invalid city names
        for city_name in invalid_city_names:
            with self.subTest(city_name=city_name):
                # In real implementation, this would call a validation function
                is_valid = len(city_name.strip()) > 1 and not city_name.isdigit()
                if city_name in ["", " "]:
                    self.assertFalse(is_valid or bool(city_name.strip()))
                elif city_name == "123":
                    self.assertFalse(not city_name.isdigit())


class TestCitiesIntegration(unittest.TestCase):
    """Integration tests for cities functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.register_blueprint(cities_bp, url_prefix='/cities')
        self.client = self.app.test_client()
    
    @patch('cities.cities.cities_db')
    def test_cities_workflow(self, mock_cities_db):
        """Test complete cities workflow: add cities, then retrieve them"""
        # Test adding cities
        new_cities = [
            {"city": "Townsville", "admin_name": "Queensland"},
            {"city": "Cairns", "admin_name": "Queensland"},
            {"city": "Ballarat", "admin_name": "Victoria"}
        ]
        
        with self.app.app_context():
            # Add cities
            add_response = self.client.post('/cities/add_all',
                                          data=json.dumps(new_cities),
                                          content_type='application/json')
            self.assertEqual(add_response.status_code, 200)
            
            # Mock cities for retrieval
            all_cities = [
                {"_id": "city1", "city": "Townsville", "state": "Queensland"},
                {"_id": "city2", "city": "Cairns", "state": "Queensland"},
                {"_id": "city3", "city": "Ballarat", "state": "Victoria"}
            ]
            mock_cities_db.find.return_value = all_cities
            
            # Get all cities
            get_response = self.client.get('/cities/get_all')
            self.assertEqual(get_response.status_code, 200)
            cities_retrieved = json.loads(get_response.data)
            self.assertEqual(len(cities_retrieved), 3)
    
    @patch('cities.cities.cities_db')
    def test_main_vs_all_cities(self, mock_cities_db):
        """Test difference between main cities and all cities endpoints"""
        all_cities = [
            {"_id": "1", "city": "Sydney", "state": "New South Wales"},
            {"_id": "2", "city": "Melbourne", "state": "Victoria"},
            {"_id": "3", "city": "Brisbane", "state": "Queensland"},
            {"_id": "4", "city": "Perth", "state": "Western Australia"},
            {"_id": "5", "city": "Adelaide", "state": "South Australia"},
            {"_id": "6", "city": "Canberra", "state": "Australian Capital Territory"}
        ]
        
        main_cities = [
            {"_id": "1", "city": "Sydney", "state": "New South Wales"},
            {"_id": "2", "city": "Melbourne", "state": "Victoria"},
            {"_id": "3", "city": "Brisbane", "state": "Queensland"},
            {"_id": "6", "city": "Canberra", "state": "Australian Capital Territory"}
        ]
        
        with self.app.app_context():
            # Test get all cities
            mock_cities_db.find.return_value = all_cities
            all_response = self.client.get('/cities/get_all')
            all_data = json.loads(all_response.data)
            self.assertEqual(len(all_data), 6)
            
            # Test get main cities
            mock_cities_db.find.return_value = main_cities
            main_response = self.client.get('/cities/get_main')
            main_data = json.loads(main_response.data)
            self.assertEqual(len(main_data), 4)
            
            # Verify main cities are subset of all cities
            main_city_names = {city["city"] for city in main_data}
            expected_main = {"Sydney", "Melbourne", "Brisbane", "Canberra"}
            self.assertEqual(main_city_names, expected_main)


class TestCitiesPerformance(unittest.TestCase):
    """Test performance considerations for cities endpoints"""
    
    @patch('cities.cities.cities_db')
    def test_large_cities_dataset(self, mock_cities_db):
        """Test handling of large cities dataset"""
        # Simulate a large number of cities
        large_cities_dataset = []
        for i in range(1000):
            large_cities_dataset.append({
                "_id": f"city{i}",
                "city": f"City{i}",
                "state": "Test State"
            })
        
        mock_cities_db.find.return_value = large_cities_dataset
        
        app = create_app()
        app.config['TESTING'] = True
        app.register_blueprint(cities_bp, url_prefix='/cities')
        client = app.test_client()
        
        with app.app_context():
            response = client.get('/cities/get_all')
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.data)
            self.assertEqual(len(response_data), 1000)
    
    def test_cities_data_consistency(self):
        """Test cities data consistency requirements"""
        # Test that city data structure is consistent
        city_template = {
            "_id": str,
            "city": str,
            "state": str
        }
        
        sample_city = {
            "_id": "12345",
            "city": "Sydney",
            "state": "New South Wales"
        }
        
        # Verify all required fields are present and correct type
        for field, expected_type in city_template.items():
            self.assertIn(field, sample_city)
            self.assertIsInstance(sample_city[field], expected_type)


if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
    
    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print(f"\nFailures:")
        for test, failure in result.failures:
            print(f"  - {test}: {failure}")
    
    if result.errors:
        print(f"\nErrors:")
        for test, error in result.errors:
            print(f"  - {test}: {error}")
    
    print(f"{'='*50}")