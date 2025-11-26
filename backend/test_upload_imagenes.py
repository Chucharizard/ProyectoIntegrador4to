"""
🧪 Script de prueba para el endpoint de subida de imágenes
Ejecutar con: python test_upload_imagenes.py
"""

import requests
import os
from io import BytesIO
from PIL import Image

# Configuración
API_URL = "http://localhost:8000/api"
ID_PROPIEDAD = "8946a4a8-b9f7-4495-b2c5-5cef56645480"  # Cambia esto por un ID válido de tu BD

# 1. Login para obtener token
print("🔐 1. Iniciando sesión...")
login_data = {
    "username": "broker_admin",  # Cambia por tu usuario
    "password": "password123"  # Cambia por tu contraseña
}

login_response = requests.post(f"{API_URL}/login", data=login_data)

if login_response.status_code != 200:
    print("❌ Error en login:", login_response.json())
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print(f"✅ Login exitoso! Token: {token[:20]}...")

# 2. Crear imágenes de prueba en memoria
print("\n📸 2. Creando imágenes de prueba...")

def crear_imagen_prueba(color, numero):
    """Crea una imagen de prueba de 800x600"""
    img = Image.new('RGB', (800, 600), color=color)
    
    # Guardar en BytesIO
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

imagenes_prueba = [
    ('imagenes', ('foto1.jpg', crear_imagen_prueba('red', 1), 'image/jpeg')),
    ('imagenes', ('foto2.jpg', crear_imagen_prueba('blue', 2), 'image/jpeg')),
    ('imagenes', ('foto3.jpg', crear_imagen_prueba('green', 3), 'image/jpeg')),
]

print(f"✅ {len(imagenes_prueba)} imágenes creadas")

# 3. Subir imágenes
print(f"\n🚀 3. Subiendo imágenes a propiedad ID {ID_PROPIEDAD}...")

upload_response = requests.post(
    f"{API_URL}/imagenes-propiedad/upload/{ID_PROPIEDAD}",
    headers=headers,
    files=imagenes_prueba
)

print(f"\nStatus Code: {upload_response.status_code}")
print("Response:", upload_response.json())

if upload_response.status_code == 200:
    result = upload_response.json()
    print(f"\n✅ ¡Éxito! {result['mensaje']}")
    print(f"📂 Portada: {result['portada']}")
    print(f"\n📋 Imágenes guardadas:")
    for img in result['imagenes']:
        print(f"  - ID: {img['id_imagen']} | URL: {img['url_imagen']}")
else:
    print(f"\n❌ Error: {upload_response.json()}")

# 4. Verificar que las imágenes se pueden acceder
print(f"\n🔍 4. Verificando acceso a imágenes...")

if upload_response.status_code == 200:
    result = upload_response.json()
    for img in result['imagenes']:
        url_completa = f"http://localhost:8000{img['url_imagen']}"
        check_response = requests.get(url_completa)
        
        if check_response.status_code == 200:
            print(f"  ✅ {url_completa} - Accesible ({len(check_response.content)} bytes)")
        else:
            print(f"  ❌ {url_completa} - No accesible")

print("\n🎉 ¡Prueba completada!")
print("\n💡 Siguiente paso: Implementar la app móvil React Native")
