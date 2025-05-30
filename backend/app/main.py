# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # 1. Certifique-se de que este import está presente
from typing import List
from .models import StoryData # Importa seus modelos Pydantic

# Cria uma instância do FastAPI
app = FastAPI(title="API de Histórias Interativas", version="0.1.0")

# ----- Configuração do CORS -----
# Adicione aqui a URL exata onde seu frontend está rodando.
# A porta padrão do Vite é 5173.
# Se você acessa por http://localhost:XXXX ou http://127.0.0.1:XXXX, adicione ambas.
origins = [
    "http://localhost:5173",    # URL comum para frontend Vite/React em desenvolvimento
    "http://127.0.0.1:5173",  # Adicione esta também para cobrir ambos os acessos
    # Se seu frontend estiver em outra porta, adicione-a:
    # "http://localhost:SUA_PORTA_FRONTEND",
    # "http://127.0.0.1:SUA_PORTA_FRONTEND",
]

app.add_middleware( # 2. Esta é a seção crucial para o CORS
    CORSMiddleware,
    allow_origins=origins,        # Lista de origens permitidas.
                                  # Para depuração RÁPIDA, você pode usar ["*"] (NÃO RECOMENDADO PARA PRODUÇÃO).
    allow_credentials=True,       # Permite cookies e cabeçalhos de autenticação.
    allow_methods=["*"],          # Permite TODOS os métodos HTTP (GET, POST, PUT, OPTIONS, etc.).
    allow_headers=["*"],          # Permite TODOS os cabeçalhos.
)

# ----- Endpoints da API -----

@app.get("/")
async def read_root():
    """Endpoint raiz para verificar se a API está funcionando."""
    return {"message": "Bem-vindo à API de Histórias Interativas! O CORS deve estar funcionando."}

@app.post("/api/stories", status_code=201)
async def create_story(story_data: StoryData):
    """
    Endpoint para receber e (por enquanto) exibir os dados de uma nova história.
    """
    print("--- Dados da História Recebidos na API ---")
    print(f"Título Geral da História: {story_data.story_title}")
    print(f"Número Total de Páginas: {len(story_data.pages)}")

    for i, page in enumerate(story_data.pages):
        print(f"\n  Detalhes da Página {i+1}:")
        print(f"    ID da Página: {page.id}")
        print(f"    Título da Página: {page.title}")
        print(f"    Cor de Destaque: {page.accentColor}")
        # Opcional: Imprimir uma prévia do markdown (cuidado com textos muito longos)
        # print(f"    Markdown (prévia): {page.markdown[:100]}...") 
        print(f"    Número de Questões na Página: {len(page.questions)}")
        for j, question in enumerate(page.questions):
            print(f"      Detalhes da Questão {j+1}:")
            print(f"        ID da Questão: {question.id}")
            print(f"        Texto da Questão: {question.text}")
            print(f"        Tipo da Questão: {question.type}")
            print(f"        Número de Opções: {len(question.options)}")
            for k, option in enumerate(question.options):
                print(f"          Opção {k+1}: ID={option.id}, Texto='{option.text}'")
    print("--- Fim dos Dados da História ---")
    
    # Resposta para o frontend
    return {
        "message": "API: Dados da história recebidos com sucesso!",
        "received_story_title": story_data.story_title,
        "received_pages_count": len(story_data.pages)
    }

# Não se esqueça de adicionar seus endpoints de Login e Cadastro aqui no futuro!