#!/usr/bin/env python3
"""
Script para generar el hash de la nueva contraseña del admin
Ejecutar: python3 update_admin_password.py <nueva_contraseña>
"""
import sys
import bcrypt

if len(sys.argv) < 2:
    print("Uso: python3 update_admin_password.py <nueva_contraseña>")
    print("\nEjemplo:")
    print("  python3 update_admin_password.py 'Admin@2024!'")
    sys.exit(1)

password = sys.argv[1]

# Validar que la contraseña cumpla con los requisitos
if len(password) < 8:
    print("❌ Error: La contraseña debe tener al menos 8 caracteres")
    sys.exit(1)

# Generar hash
hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print("\n✅ Hash generado exitosamente:")
print(f"\nContraseña: {password}")
print(f"\nHash para actualizar en auth_service.py:")
print(f'        "password_hash": "{hash}",  # {password}')
print("\n📝 Copia el hash y actualízalo en backend/services/auth_service.py")

