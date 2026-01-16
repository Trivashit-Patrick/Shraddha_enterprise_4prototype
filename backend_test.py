import requests
import sys
import json
from datetime import datetime

class ShraddhaEnterprisesAPITester:
    def __init__(self, base_url="https://shraddha-product.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_seed_data(self):
        """Test seeding sample data"""
        print("\n🌱 Testing Data Seeding...")
        result = self.run_test("Seed Sample Data", "POST", "seed", 200)
        return result is not None

    def test_categories(self):
        """Test category operations"""
        print("\n📁 Testing Category Operations...")
        
        # Get categories
        categories = self.run_test("Get Categories", "GET", "categories", 200)
        if not categories:
            return False
        
        print(f"    Found {len(categories)} categories")
        return len(categories) > 0

    def test_subcategories(self):
        """Test subcategory operations"""
        print("\n📂 Testing Subcategory Operations...")
        
        # Get all subcategories
        subcategories = self.run_test("Get All Subcategories", "GET", "subcategories", 200)
        if not subcategories:
            return False
        
        print(f"    Found {len(subcategories)} subcategories")
        
        # Get subcategories by category (if categories exist)
        categories = self.run_test("Get Categories for Subcategory Test", "GET", "categories", 200)
        if categories and len(categories) > 0:
            category_id = categories[0]['id']
            filtered_subs = self.run_test(
                "Get Subcategories by Category", 
                "GET", 
                f"subcategories?category_id={category_id}", 
                200
            )
            if filtered_subs:
                print(f"    Found {len(filtered_subs)} subcategories for category")
        
        return len(subcategories) > 0

    def test_products(self):
        """Test product operations"""
        print("\n📦 Testing Product Operations...")
        
        # Get all products
        products = self.run_test("Get All Products", "GET", "products", 200)
        if not products:
            return False
        
        print(f"    Found {len(products)} products")
        
        # Get featured products
        featured = self.run_test("Get Featured Products", "GET", "products?featured=true", 200)
        if featured:
            print(f"    Found {len(featured)} featured products")
        
        # Test individual product if products exist
        if len(products) > 0:
            product_id = products[0]['id']
            product = self.run_test("Get Single Product", "GET", f"products/{product_id}", 200)
            if product:
                print(f"    Retrieved product: {product.get('name', 'Unknown')}")
        
        return len(products) > 0

    def test_videos(self):
        """Test video operations"""
        print("\n🎥 Testing Video Operations...")
        
        videos = self.run_test("Get Videos", "GET", "videos", 200)
        if videos is not None:
            print(f"    Found {len(videos)} videos")
            return True
        return False

    def test_admin_auth(self):
        """Test admin authentication"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test registration (might fail if admin already exists)
        test_admin = {
            "name": "Test Admin",
            "email": f"test_admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123"
        }
        
        register_result = self.run_test("Admin Registration", "POST", "auth/register", 200, test_admin)
        
        if register_result:
            self.token = register_result.get('access_token')
            self.admin_data = register_result.get('admin')
            print(f"    Registered admin: {self.admin_data.get('name')}")
            
            # Test getting current admin info
            self.run_test("Get Current Admin", "GET", "auth/me", 200)
            return True
        else:
            # Try login with existing admin (if registration failed)
            print("    Registration failed, trying existing admin login...")
            login_data = {
                "email": "admin@shraddhaenterprises.com",
                "password": "admin123"
            }
            login_result = self.run_test("Admin Login (Existing)", "POST", "auth/login", 200, login_data)
            
            if login_result:
                self.token = login_result.get('access_token')
                self.admin_data = login_result.get('admin')
                print(f"    Logged in as: {self.admin_data.get('name')}")
                return True
        
        return False

    def test_admin_operations(self):
        """Test admin-only operations (requires authentication)"""
        if not self.token:
            print("\n⚠️  Skipping admin operations - no authentication token")
            return False
        
        print("\n👨‍💼 Testing Admin Operations...")
        
        # Test creating category
        new_category = {
            "name": f"Test Category {datetime.now().strftime('%H%M%S')}",
            "description": "Test category for API testing"
        }
        category_result = self.run_test("Create Category", "POST", "categories", 200, new_category)
        
        if category_result:
            category_id = category_result.get('id')
            print(f"    Created category: {category_result.get('name')}")
            
            # Test creating subcategory
            new_subcategory = {
                "name": f"Test Subcategory {datetime.now().strftime('%H%M%S')}",
                "category_id": category_id,
                "description": "Test subcategory"
            }
            subcategory_result = self.run_test("Create Subcategory", "POST", "subcategories", 200, new_subcategory)
            
            if subcategory_result:
                print(f"    Created subcategory: {subcategory_result.get('name')}")
            
            # Clean up - delete the test category
            self.run_test("Delete Test Category", "DELETE", f"categories/{category_id}", 200)
        
        return category_result is not None

    def test_queries(self):
        """Test query submission and retrieval"""
        print("\n💬 Testing Query Operations...")
        
        # Test submitting a query
        test_query = {
            "name": "Test Customer",
            "email": "customer@test.com",
            "phone": "+91 9876543210",
            "product_name": "Test Product Inquiry",
            "message": "This is a test query from API testing"
        }
        
        query_result = self.run_test("Submit Query", "POST", "queries", 200, test_query)
        
        if query_result:
            print(f"    Submitted query: {query_result.get('message')}")
        
        # Test getting queries (admin only)
        if self.token:
            queries = self.run_test("Get Queries (Admin)", "GET", "queries", 200)
            if queries:
                print(f"    Retrieved {len(queries)} queries")
        
        return query_result is not None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Shraddha Enterprises API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic health checks
        self.test_health_check()
        
        # Seed data first
        self.test_seed_data()
        
        # Test public endpoints
        self.test_categories()
        self.test_subcategories()
        self.test_products()
        self.test_videos()
        
        # Test query submission
        self.test_queries()
        
        # Test admin authentication
        auth_success = self.test_admin_auth()
        
        # Test admin operations if authenticated
        if auth_success:
            self.test_admin_operations()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = ShraddhaEnterprisesAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())