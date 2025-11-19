"""
Servicio de autenticación con JWT
"""
import os
import re
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

# Configuración de seguridad
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-min-32-chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))  # 8 horas por defecto

# Validar que SECRET_KEY tenga longitud mínima en producción
if len(SECRET_KEY) < 32 and os.getenv("ENVIRONMENT") == "production":
    raise ValueError(
        "SECRET_KEY debe tener al menos 32 caracteres en producción. "
        "Genera uno con: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

# Dominio permitido
ALLOWED_DOMAIN = "@inbursa.com"
ALLOWED_DEPARTMENTS = ["RH"]

# Base de datos de usuarios (en producción usar una BD real)
# Formato: {username: {"password_hash": "...", "email": "...", "role": "...", "department": "..."}}
# Hashes pre-generados con bcrypt
# 
# Para cambiar la contraseña del admin:
# 1. Ejecuta: docker-compose exec backend python3 update_admin_password.py "TU_NUEVA_CONTRASEÑA"
# 2. O dentro del contenedor: python3 -c "import bcrypt; print(bcrypt.hashpw('TU_CONTRASEÑA'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'))"
# 3. Actualiza el hash en la línea siguiente
USERS_DB: Dict[str, Dict[str, str]] = {
    "admin": {
        "password_hash": "$2b$12$bhQIa.cKhwISeD7GWLU25.XP8BVciItioj6iemXOEUZvyTGjabNFi",  # Admin@2024!
        "email": "admin@inbursa.com",
        "role": "admin",
        "department": "RH"
    }
}


def validate_email_domain(email: str) -> bool:
    """Valida que el email sea del dominio @inbursa.com"""
    if not email or not isinstance(email, str):
        return False
    return email.lower().endswith(ALLOWED_DOMAIN.lower())


def validate_department(department: str) -> bool:
    """Valida que el departamento sea RH"""
    if not department or not isinstance(department, str):
        return False
    return department.strip() == "RH"


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Valida la fortaleza de la contraseña"""
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres"
    if not re.search(r"[A-Z]", password):
        return False, "La contraseña debe contener al menos una letra mayúscula"
    if not re.search(r"[a-z]", password):
        return False, "La contraseña debe contener al menos una letra minúscula"
    if not re.search(r"\d", password):
        return False, "La contraseña debe contener al menos un número"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "La contraseña debe contener al menos un carácter especial"
    return True, ""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña coincide con el hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Error verificando contraseña: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def get_user(username: str) -> Optional[Dict[str, str]]:
    """Obtiene un usuario de la base de datos"""
    user_data = USERS_DB.get(username)
    if user_data:
        return {
            "username": username,
            "email": user_data.get("email"),
            "role": user_data.get("role", "user"),
            "department": user_data.get("department")
        }
    return None


def authenticate_user(username: str, password: str) -> Optional[Dict[str, str]]:
    """Autentica un usuario y retorna sus datos si es válido"""
    user_data = USERS_DB.get(username)
    if not user_data:
        logger.warning(f"Intento de login fallido: usuario '{username}' no existe")
        return None
    
    # Obtener el hash de la contraseña
    password_hash = user_data.get("password_hash")
    if not password_hash:
        logger.error(f"Usuario '{username}' no tiene hash de contraseña configurado")
        return None
    
    if not verify_password(password, password_hash):
        logger.warning(f"Intento de login fallido: contraseña incorrecta para usuario '{username}'")
        return None
    
    # Validar dominio de email
    email = user_data.get("email")
    if email and not validate_email_domain(email):
        logger.warning(f"Usuario {username} intentó iniciar sesión con email no autorizado: {email}")
        return None
    
    # Validar departamento
    department = user_data.get("department")
    if department and not validate_department(department):
        logger.warning(f"Usuario {username} intentó iniciar sesión sin ser del departamento RH: {department}")
        return None
    
    return {
        "username": username,
        "email": email,
        "role": user_data.get("role", "user"),
        "department": department
    }


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT de acceso"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, str]]:
    """Verifica y decodifica un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return get_user(username)
    except JWTError as e:
        logger.warning(f"Error verificando token: {e}")
        return None


def create_user(
    username: str, 
    password: str, 
    email: str, 
    department: str,
    role: str = "user"
) -> tuple[bool, str]:
    """
    Crea un nuevo usuario con validaciones estrictas.
    Retorna (success: bool, message: str)
    """
    # Validar que el usuario no exista
    if username in USERS_DB:
        return False, "El usuario ya existe"
    
    # Validar formato de username
    if not re.match(r"^[a-zA-Z0-9_]{3,50}$", username):
        return False, "El nombre de usuario debe tener entre 3 y 50 caracteres y solo contener letras, números y guiones bajos"
    
    # Validar dominio de email
    if not validate_email_domain(email):
        return False, f"El email debe ser del dominio {ALLOWED_DOMAIN}"
    
    # Validar departamento
    if not validate_department(department):
        return False, f"El departamento debe ser uno de: {', '.join(ALLOWED_DEPARTMENTS)}"
    
    # Validar fortaleza de contraseña
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        return False, error_msg
    
    # Crear usuario
    try:
        USERS_DB[username] = {
            "password_hash": get_password_hash(password),
            "email": email.lower().strip(),
            "role": role,
            "department": department.strip()
        }
        logger.info(f"Usuario creado: {username} ({email}) - Departamento: {department}")
        return True, "Usuario creado exitosamente"
    except Exception as e:
        logger.error(f"Error creando usuario {username}: {e}")
        return False, f"Error al crear usuario: {str(e)}"

