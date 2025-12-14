#!/usr/bin/env python3
import subprocess
import sys
import os

def run_command(cmd, description=""):
    """Run a shell command."""
    if description:
        print(f"\n{description}...")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            if result.stdout:
                print(f"  Output: {result.stdout.strip()}")
            return True
        else:
            print(f"  Error: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"  Exception: {e}")
        return False

def check_python_version():
    """Check Python version."""
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major != 3 or version.minor < 8:
        print("⚠️  Warning: Python 3.8+ is recommended")
        return False
    return True

def create_virtual_env():
    """Create virtual environment."""
    if not os.path.exists("venv"):
        print("Creating virtual environment...")
        return run_command(f"{sys.executable} -m venv venv", "Creating venv")
    else:
        print("Virtual environment already exists")
        return True

def install_requirements():
    """Install required packages."""
    requirements = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "sqlalchemy==2.0.23", 
        "pymysql==1.1.0",
        "python-dotenv==1.0.0",
        "alembic==1.12.1",
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0",
        "requests==2.31.0"
    ]
    
    print("\nInstalling packages...")
    
    # First upgrade pip
    run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip")
    
    # Install packages
    for package in requirements:
        package_name = package.split('==')[0]
        run_command(f"{sys.executable} -m pip install {package}", f"Installing {package_name}")
    
    return True

def create_env_file():
    """Create .env file if it doesn't exist."""
    if not os.path.exists(".env"):
        print("\nCreating .env file...")
        with open(".env", "w") as f:
            f.write("""# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=polygot
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_CHARSET=utf8mb4

# Connection Pool Settings
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_RECYCLE=3600

# App Settings
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
""")
        print("  Created .env file - remember to update your MySQL password!")
        return True
    else:
        print("\n.env file already exists")
        return True

def main():
    print("=" * 50)
    print("Accumulator Generator Backend Setup")
    print("=" * 50)
    
    # Check Python
    if not check_python_version():
        return
    
    # Create virtual environment
    if not create_virtual_env():
        return
    
    # Install requirements
    if not install_requirements():
        return
    
    # Create .env file
    create_env_file()
    
    print("\n" + "=" * 50)
    print("✅ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Update .env file with your MySQL credentials")
    print("2. Activate virtual environment:")
    print("   Windows:   venv\\Scripts\\activate")
    print("   Mac/Linux: source venv/bin/activate")
    print("3. Start the backend:")
    print("   python -m uvicorn app.main:app --reload")
    print("\nTest the database connection:")
    print("   python test_database.py")
    print("=" * 50)

if __name__ == "__main__":
    main()