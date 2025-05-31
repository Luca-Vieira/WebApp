from typing import Optional
from sqlalchemy.orm import Session
from . import models_db, schemas # models_db para ORM, schemas para Pydantic
from .auth_utils import get_password_hash

def get_user_by_email(db: Session, email: str) -> Optional[models_db.User]:
    """Busca um usuário pelo email."""
    return db.query(models_db.User).filter(models_db.User.email == email).first()

def get_user(db: Session, user_id: int) -> Optional[models_db.User]:
    """Busca um usuário pelo ID."""
    return db.query(models_db.User).filter(models_db.User.id == user_id).first()

def create_user(db: Session, user_create_data: schemas.UserCreate) -> models_db.User:
    """Cria um novo usuário no banco de dados."""
    hashed_password = get_password_hash(user_create_data.password)
    
    # Cria a instância do modelo ORM User
    db_user = models_db.User(
        email=user_create_data.email,
        name=user_create_data.name,
        hashed_password=hashed_password
    )
    
    db.add(db_user)  # Adiciona o objeto à sessão
    db.commit()     # Confirma (salva) as mudanças no banco
    db.refresh(db_user) # Atualiza o objeto db_user com dados do banco (como o ID gerado)
    return db_user