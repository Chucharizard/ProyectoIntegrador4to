"""
Script simple para probar bcrypt sin dependencias
"""
from passlib.context import CryptContext

# Configurar bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash que está en tu base de datos
hash_bd = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNGkrJ7CO"

# Contraseña que estás intentando
password_prueba = "password123"

print("=" * 60)
print("🔐 TEST DE VERIFICACIÓN DE CONTRASEÑA")
print("=" * 60)

# Probar verificación
resultado = pwd_context.verify(password_prueba, hash_bd)
print(f"\n✅ Hash en BD: {hash_bd}")
print(f"🔑 Contraseña probada: {password_prueba}")
print(f"📊 Resultado verificación: {resultado}")

# Generar un nuevo hash para comparar
nuevo_hash = pwd_context.hash(password_prueba)
print(f"\n🆕 Nuevo hash generado: {nuevo_hash}")
print(f"📊 Verificación con nuevo hash: {pwd_context.verify(password_prueba, nuevo_hash)}")

print("\n" + "=" * 60)
if resultado:
    print("✅ ¡LA CONTRASEÑA ES CORRECTA!")
    print("\n💡 Entonces el problema es otro. Puede ser:")
    print("   1. El usuario no se está encontrando")
    print("   2. Hay algún problema en el flujo del login")
else:
    print("❌ LA CONTRASEÑA NO COINCIDE")
    print("\n💡 Solución:")
    print("   Actualiza la contraseña en Supabase con este SQL:")
    print(f"\n   UPDATE usuario")
    print(f"   SET contrasenia_usuario = '{nuevo_hash}'")
    print(f"   WHERE nombre_usuario = 'broker_admin';")
print("=" * 60)
