# test_imports.py
import os
import sys
import traceback

# Setup path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

print("Testing imports...")
print("=" * 70)

# Test basic imports
imports = [
    ("app.config.settings", "settings"),
    ("app.database", "get_db"),
    ("app.api.routers.match", None),
    ("app.api.routers.slip", None),
    ("app.api.routers.generator", None),
]

for module_path, attr in imports:
    try:
        if attr:
            module = __import__(module_path, fromlist=[attr])
            obj = getattr(module, attr)
            print(f"✅ {module_path}.{attr}")
        else:
            __import__(module_path)
            print(f"✅ {module_path}")
    except Exception as e:
        print(f"❌ {module_path}: {type(e).__name__}: {e}")
        if "DEBUG" in os.environ:
            traceback.print_exc()

print("\nTesting router objects...")
routers = ["match", "slip", "generator", "market", "user"]
for router in routers:
    try:
        module = __import__(f"app.api.routers.{router}", fromlist=['router'])
        if hasattr(module, 'router'):
            print(f"✅ {router}: has router")
        else:
            print(f"⚠️  {router}: no router attribute")
    except Exception as e:
        print(f"❌ {router}: {e}")

print("\n" + "=" * 70)
print("To run the server:")
print("  python -m app.main")
print("  OR")
print("  uvicorn app.main:app --reload")