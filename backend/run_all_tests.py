"""
Comprehensive test runner for all backend modules
Runs all tests and provides detailed coverage report
"""
import unittest
import sys
import os
import time
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_all_tests():
    """Run all test modules and provide comprehensive reporting"""
    
    print("=" * 80)
    print("AUSTRALIA JOBS BACKEND - COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    print(f"Test run started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 80)
    
    # List of all test modules
    test_modules = [
        'test_oauth',
        'test_oauth_integration', 
        'test_jobs',
        'test_users',
        'test_applications',
        'test_cities',
        'test_email_service'
    ]
    
    total_tests = 0
    total_failures = 0
    total_errors = 0
    start_time = time.time()
    
    module_results = {}
    
    for module_name in test_modules:
        print(f"\n[TEST] Running {module_name}...")
        print("-" * 40)
        
        try:
            # Import and run the test module
            module = __import__(module_name)
            loader = unittest.TestLoader()
            suite = loader.loadTestsFromModule(module)
            
            # Run tests with minimal output for summary
            runner = unittest.TextTestRunner(verbosity=1, stream=open(os.devnull, 'w'))
            result = runner.run(suite)
            
            # Store results
            module_results[module_name] = {
                'tests_run': result.testsRun,
                'failures': len(result.failures),
                'errors': len(result.errors),
                'success_rate': ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100) if result.testsRun > 0 else 0,
                'failure_details': result.failures,
                'error_details': result.errors
            }
            
            total_tests += result.testsRun
            total_failures += len(result.failures)
            total_errors += len(result.errors)
            
            # Print module summary
            if result.testsRun > 0:
                success_rate = (result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100
                status = "[PASS] PASS" if (len(result.failures) == 0 and len(result.errors) == 0) else "[FAIL] FAIL"
                print(f"{status} {module_name}: {result.testsRun} tests, {success_rate:.1f}% success rate")
            else:
                print(f"[WARN]  {module_name}: No tests found")
                
        except ImportError as e:
            print(f"[FAIL] Failed to import {module_name}: {e}")
            module_results[module_name] = {
                'tests_run': 0,
                'failures': 0, 
                'errors': 1,
                'success_rate': 0,
                'import_error': str(e)
            }
            total_errors += 1
        except Exception as e:
            print(f"[FAIL] Error running {module_name}: {e}")
            module_results[module_name] = {
                'tests_run': 0,
                'failures': 0,
                'errors': 1, 
                'success_rate': 0,
                'runtime_error': str(e)
            }
            total_errors += 1
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Print comprehensive summary
    print("\n" + "=" * 80)
    print("COMPREHENSIVE TEST RESULTS SUMMARY")
    print("=" * 80)
    
    # Overall statistics
    total_passed = total_tests - total_failures - total_errors
    overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"STATS: OVERALL STATISTICS:")
    print(f"   Total Tests Run: {total_tests}")
    print(f"   Tests Passed: {total_passed}")
    print(f"   Tests Failed: {total_failures}")
    print(f"   Tests Errored: {total_errors}")
    print(f"   Success Rate: {overall_success_rate:.1f}%")
    print(f"   Duration: {duration:.2f} seconds")
    print()
    
    # Module breakdown
    print("MODULES: MODULE BREAKDOWN:")
    print("-" * 80)
    print(f"{'Module':<25} {'Tests':<8} {'Pass':<8} {'Fail':<8} {'Error':<8} {'Success %':<10}")
    print("-" * 80)
    
    for module_name, results in module_results.items():
        tests = results['tests_run']
        failures = results['failures']
        errors = results['errors']
        passed = tests - failures - errors
        success_rate = results['success_rate']
        
        print(f"{module_name:<25} {tests:<8} {passed:<8} {failures:<8} {errors:<8} {success_rate:<10.1f}")
    
    print("-" * 80)
    
    # Coverage analysis
    print("\nCOVERAGE: COVERAGE ANALYSIS:")
    print("-" * 40)
    
    modules_tested = len([m for m in module_results.keys() if module_results[m]['tests_run'] > 0])
    total_modules = len(test_modules)
    
    print(f"Modules with tests: {modules_tested}/{total_modules}")
    print(f"Test coverage by module: {(modules_tested/total_modules*100):.1f}%")
    
    # Functionality coverage
    functionality_coverage = {
        'Authentication & OAuth': ['test_oauth', 'test_oauth_integration'],
        'Job Management': ['test_jobs'],
        'User Management': ['test_users'], 
        'Job Applications': ['test_applications'],
        'Location Services': ['test_cities'],
        'Email Services': ['test_email_service'],
        'File Management': [],  # No resume tests created yet
        'API Integration': []   # No integration tests created yet
    }
    
    print("\nFUNCTIONS: FUNCTIONALITY COVERAGE:")
    for func, modules in functionality_coverage.items():
        if modules:
            covered_modules = [m for m in modules if m in module_results and module_results[m]['tests_run'] > 0]
            coverage_pct = len(covered_modules) / len(modules) * 100
            status = "[PASS]" if coverage_pct == 100 else "[WARN]" if coverage_pct > 0 else "[FAIL]"
            print(f"   {status} {func}: {coverage_pct:.0f}% ({len(covered_modules)}/{len(modules)} modules)")
        else:
            print(f"   [FAIL] {func}: 0% (No tests)")
    
    # Detailed failure report
    if total_failures > 0 or total_errors > 0:
        print("\n" + "=" * 80)
        print("DETAILED FAILURE/ERROR REPORT")
        print("=" * 80)
        
        for module_name, results in module_results.items():
            if results['failures'] > 0 or results['errors'] > 0:
                print(f"\n[FAIL] {module_name.upper()} ISSUES:")
                print("-" * 40)
                
                if 'import_error' in results:
                    print(f"IMPORT ERROR: {results['import_error']}")
                elif 'runtime_error' in results:
                    print(f"RUNTIME ERROR: {results['runtime_error']}")
                else:
                    if results['failures'] > 0:
                        print(f"FAILURES ({results['failures']}):")
                        for i, (test, failure) in enumerate(results['failure_details'][:3], 1):  # Show first 3
                            print(f"  {i}. {test}")
                            print(f"     {failure.split('AssertionError:')[-1].strip()[:100]}...")
                    
                    if results['errors'] > 0:
                        print(f"ERRORS ({results['errors']}):")
                        for i, (test, error) in enumerate(results['error_details'][:3], 1):  # Show first 3
                            print(f"  {i}. {test}")
                            print(f"     {error.split('Exception:')[-1].strip()[:100]}...")
    
    # Recommendations
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    
    recommendations = []
    
    if overall_success_rate < 80:
        recommendations.append("FIX: Fix failing tests to improve overall success rate")
    
    if modules_tested < total_modules:
        missing_modules = total_modules - modules_tested
        recommendations.append(f"ADD: Add tests for {missing_modules} modules without test coverage")
    
    if any(results['tests_run'] < 5 for results in module_results.values() if results['tests_run'] > 0):
        recommendations.append("[TEST] Expand test coverage for modules with few tests")
    
    if total_errors > 0:
        recommendations.append("DEBUG: Investigate and fix import/runtime errors")
    
    if not recommendations:
        recommendations.append("[SUCCESS] Excellent! All tests are passing with good coverage")
    
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec}")
    
    # Final status
    print("\n" + "=" * 80)
    if overall_success_rate >= 90 and total_errors == 0:
        print("[SUCCESS] OVERALL STATUS: EXCELLENT - Tests are in great shape!")
    elif overall_success_rate >= 70:
        print("[PASS] OVERALL STATUS: GOOD - Minor issues to address")
    elif overall_success_rate >= 50:
        print("[WARN]  OVERALL STATUS: NEEDS IMPROVEMENT - Several issues to fix")
    else:
        print("[FAIL] OVERALL STATUS: CRITICAL - Major testing issues need attention")
    
    print(f"Test run completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    return module_results, overall_success_rate


if __name__ == '__main__':
    # Set environment variable to suppress individual test output
    os.environ['PYTHONUNBUFFERED'] = '1'
    
    try:
        results, success_rate = run_all_tests()
        
        # Exit with appropriate code
        if success_rate >= 90:
            sys.exit(0)  # Success
        elif success_rate >= 70:
            sys.exit(1)  # Minor issues
        else:
            sys.exit(2)  # Major issues
            
    except KeyboardInterrupt:
        print("\n\n[FAIL] Test run interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n[FAIL] Test runner failed with error: {e}")
        sys.exit(1)