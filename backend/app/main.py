# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar routers
from .routers import users_router
from .routers import stories_router
from .routers import executions_router # Router para os resultados da execução

# Importar para criação de tabelas
# A importação de models_db aqui garante que o SQLAlchemy (Base.metadata)
# conheça todos os modelos (User, Story, StoryPage, StoryExecution)
# antes de create_db_and_tables ser chamada.
from . import models_db 
from .database import engine, create_db_and_tables

# Criar tabelas no banco de dados (SE NÃO EXISTIREM)
# Esta função agora também criará a tabela 'story_executions'
# se ela ainda não existir, devido ao modelo StoryExecution em models_db.py.
create_db_and_tables() 

app = FastAPI(
    title="Criador de Histórias Interativas API",
    description="API para gerenciar usuários e histórias interativas, incluindo resultados de execuções.",
    version="0.1.1" # Versão incrementada para refletir novas funcionalidades
)

# Configuração do CORS (Cross-Origin Resource Sharing)
# Permite que seu frontend React se comunique com o backend FastAPI.
origins = [
    "http://localhost:5173", # Endereço do seu frontend React (Vite padrão)
    "http://localhost:3000", # Endereço comum para Create React App
    # Adicione outras origens se necessário (ex: seu app em produção)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Lista de origens permitidas
    allow_credentials=True,      # Permite cookies/autenticação baseada em cabeçalho
    allow_methods=["*"],         # Permite todos os métodos HTTP (GET, POST, etc.)
    allow_headers=["*"],         # Permite todos os cabeçalhos
)

# Incluir os routers na aplicação principal
app.include_router(users_router.router)
app.include_router(stories_router.router)
app.include_router(executions_router.router) # Novo router adicionado

@app.get("/api/health", tags=["healthcheck"])
async def health_check():
    """Verifica a saúde da API."""
    return {"status": "API está funcionando!"}

# Para rodar o servidor localmente (lembrete):
# No diretório 'backend/', com o ambiente virtual ativado:
# uvicorn app.main:app --reload --port 8000