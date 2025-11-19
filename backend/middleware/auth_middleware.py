"""
Middleware de autenticación para proteger rutas
"""
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import verify_token
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependencia para obtener el usuario actual desde el token JWT
    Usar como: user = Depends(get_current_user)
    """
    token = credentials.credentials
    user = verify_token(token)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """
    Dependencia para verificar que el usuario es administrador
    Usar como: admin = Depends(get_current_admin_user)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user

