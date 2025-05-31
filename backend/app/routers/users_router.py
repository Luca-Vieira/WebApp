from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from .. import crud_users, schemas, auth_utils, models_db # Ajuste nos imports
from ..database import get_db # Importa get_db

router = APIRouter(
    prefix="/api/users", # Prefixo para todas as rotas neste router
    tags=["users"],      # Tag para agrupar na documentação do Swagger/OpenAPI
)

# OAuth2PasswordBearer é uma classe que pode ser usada como uma dependência
# para obter o token da requisição. `tokenUrl` aponta para o endpoint de login.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models_db.User:
    """
    Dependência para obter o usuário atual a partir do token JWT.
    Protege rotas que requerem autenticação.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = auth_utils.decode_access_token(token)
    if email is None:
        raise credentials_exception
    
    # Aqui você pode adicionar lógica para verificar se o usuário existe no DB, se está ativo, etc.
    user = crud_users.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=schemas.UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Endpoint para registrar um novo usuário.
    """
    db_user = crud_users.get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado."
        )
    created_user = crud_users.create_user(db=db, user_create_data=user_data)
    return created_user


@router.post("/login", response_model=schemas.Token) # Renomeado para /login, espera JSON
async def login_for_access_token_json(
    form_data: schemas.UserLogin, # Espera um JSON com email e password
    db: Session = Depends(get_db)
):
    """
    Endpoint de login que espera um payload JSON (email, password).
    Retorna um token de acesso JWT se as credenciais forem válidas.
    """
    user = crud_users.get_user_by_email(db, email=form_data.email)
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Endpoint alternativo para login usando Form Data (como o frontend React espera para OAuth2PasswordRequestForm)
@router.post("/login/token", response_model=schemas.Token) # Mantém /login/token para compatibilidade com OAuth2PasswordRequestForm
async def login_for_access_token_form(
    form_data: OAuth2PasswordRequestForm = Depends(), # Espera Form Data (username, password)
    db: Session = Depends(get_db)
):
    """
    Endpoint de login que espera Form Data (username=email, password).
    Usado pelo frontend se estiver configurado para OAuth2PasswordRequestForm.
    Retorna um token de acesso JWT.
    """
    # OAuth2PasswordRequestForm usa 'username' para o campo de identificação
    user = crud_users.get_user_by_email(db, email=form_data.username) # form_data.username é o email
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos (form)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserPublic)
async def read_users_me(current_user: models_db.User = Depends(get_current_user)):
    """
    Endpoint para obter os dados do usuário autenticado atualmente.
    Requer um token JWT válido.
    """
    return current_user