[tool.pytest.ini_options]
minversion = "8.0"
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "-v",
    "--tb=short",
    "--strict-markers",
    "-ra",
]
filterwarnings = [
    "ignore::DeprecationWarning",
    "ignore::PendingDeprecationWarning",
]
markers = [
    "unit: Unit tests (fast, no external deps)",
    "integration: Integration tests (may use DB)",
    "slow: Slow tests",
    "external: Tests requiring external APIs",
]

[tool.pytest.env]
DEBUG = "True"
SECRET_KEY = "test-secret-key-for-testing-only-32chars"
DATABASE_URL = "sqlite+aiosqlite:///:memory:"
GOOGLE_API_KEY = "test-google-api-key"
GROQ_API_KEY = "test-groq-api-key"
HUGGINGFACE_API_KEY = "test-huggingface-api-key"
DEFAULT_TEXT_PROVIDER = "gemini"
DEFAULT_IMAGE_PROVIDER = "pollinations"
TOKEN_ENCRYPTION_KEY = "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1jaGFycw=="
FACEBOOK_APP_ID = "test-fb-app-id"
FACEBOOK_APP_SECRET = "test-fb-app-secret"
LINKEDIN_CLIENT_ID = "test-linkedin-client-id"
LINKEDIN_CLIENT_SECRET = "test-linkedin-client-secret"
FRONTEND_URL = "http://localhost:3000"

[tool.coverage.run]
source = ["app"]
branch = true
omit = [
    "app/main.py",
    "app/config.py",
    "*/migrations/*",
    "*/__pycache__/*",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.:",
]
show_missing = true
precision = 2