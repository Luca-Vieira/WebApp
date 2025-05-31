from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from pydantic import BaseModel
import os

# Configuração do Hashing de Senha
# Usaremos bcrypt como o esquema de hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configurações do Token JWT
# Estes devem vir de variáveis de ambiente em produção!
SECRET_KEY = os.getenv("SECRET_KEY", "uma-chave-secreta-muito-forte-e-dificil-de-adivinhar")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # Token expira em 24 horas

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano corresponde à senha com hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera o hash de uma senha."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um novo token de acesso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[str]:
    """
    Decodifica o token de acesso.
    Retorna o email (ou identificador) do usuário se o token for válido, senão None.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub") # "sub" é o nome padrão para o sujeito do token
        if email is None:
            return None
        return email
    except JWTError:
        return None

# Para usar nas dependências do FastAPI para proteger rotas
class TokenData(BaseModel):
    email: Optional[str] = None