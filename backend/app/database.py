import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Define o caminho para o arquivo do banco de dados SQLite
DATABASE_URL = "sqlite:///./story_creator.db"

# SQLAlchemy engine
# O argumento connect_args={"check_same_thread": False} é necessário apenas para SQLite.
# Ele permite que mais de uma thread interaja com o banco de dados.
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal será a classe que usaremos para criar sessões de banco de dados
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base será usada para criar as classes do modelo do banco de dados (ORM models)
Base = declarative_base()

def create_db_and_tables():
    """
    Cria o arquivo de banco de dados e todas as tabelas definidas
    nos modelos que herdam de Base.
    """
    Base.metadata.create_all(bind=engine)

def get_db():
    """
    Função de dependência para obter uma sessão de banco de dados.
    Ela garante que a sessão seja fechada após a requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Função para inicializar o banco e criar tabelas se o DB não existir
# Você pode chamar isso uma vez ao iniciar a aplicação se necessário,
# mas `create_all` é seguro para ser chamado múltiplas vezes.
if not os.path.exists("./story_creator.db"):
    print("Criando banco de dados e tabelas...")
    # Precisamos importar os modelos aqui para que `Base.metadata` os conheça
    # antes de chamar `create_all`. Isso pode gerar um import circular
    # se não for gerenciado com cuidado. Por agora, vamos assumir que
    # os modelos serão importados em `main.py` ou quando `create_db_and_tables` for chamada.
    # from . import models_db # Descomente ou mova a criação para um local apropriado
    # Base.metadata.create_all(bind=engine) # Movido para a função create_db_and_tables

print(f"Banco de dados SQLite será acessado/criado em: {os.path.abspath('./story_creator.db')}")