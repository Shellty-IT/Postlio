import google.generativeai as genai
import os
from dotenv import load_dotenv

# Załaduj .env
load_dotenv()

# Konfiguruj API
api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key loaded: {'Yes' if api_key else 'No'}")
print(f"API Key (first 10 chars): {api_key[:10] if api_key else 'None'}...")

genai.configure(api_key=api_key)

print("\n" + "="*50)
print("DOSTĘPNE MODELE DLA TWOJEGO KLUCZA API:")
print("="*50 + "\n")

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ {model.name}")
            print(f"   Display name: {model.display_name}")
            print(f"   Description: {model.description[:80]}...")
            print()
except Exception as e:
    print(f"❌ Błąd listowania modeli: {e}")

print("\n" + "="*50)
print("TEST GENEROWANIA:")
print("="*50 + "\n")

# Testuj różne nazwy modeli
test_models = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "models/gemini-2.0-flash",
    "models/gemini-1.5-flash",
]

for model_name in test_models:
    try:
        print(f"Testing: {model_name}...", end=" ")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say 'Hello' in Polish")
        print(f"✅ OK - Response: {response.text[:50]}...")
    except Exception as e:
        print(f"❌ FAILED - {str(e)[:60]}")

print("\n" + "="*50)
print("KONIEC TESTU")
print("="*50)