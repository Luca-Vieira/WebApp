# backend/app/routers/executions_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List 

from .. import crud_executions, schemas, models_db 
from ..database import get_db
from .users_router import get_current_user # Para obter o usuário autenticado

router = APIRouter(
    prefix="/api/story-executions", 
    tags=["story-executions"],      
)

@router.post("/", response_model=schemas.StoryExecutionPublic, status_code=status.HTTP_201_CREATED)
async def save_story_execution_results(
    execution_payload: schemas.StoryExecutionCreate, 
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user) 
):
    """
    Salva os resultados de uma execução de história para o usuário autenticado.
    """
    try:
        # Linhas de debug (podem ser removidas ou comentadas em produção)
        # print(f"--- DADOS RECEBIDOS NO ROUTER (POST /story-executions) PELO USUÁRIO ID: {current_user.id} ---") 
        # print(f"Payload da execução: {execution_payload.model_dump_json(indent=2)}") 
        
        saved_execution = crud_executions.create_story_execution(
            db=db, 
            execution_data=execution_payload, 
            player_user_id=current_user.id
        )
        
        # print(f"Execução ID {saved_execution.id} salva com sucesso para o usuário ID {current_user.id}.") 
        return saved_execution
        
    except Exception as e:
        print(f"Erro ao salvar execução da história: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocorreu um erro interno ao tentar salvar os resultados da execução da história: {str(e)}"
        )

# --- ENDPOINT GET PARA O DASHBOARD DO CRIADOR MODIFICADO PARA PAGINAÇÃO ---
@router.get("/dashboard/my-results", response_model=schemas.PaginatedStoryExecutions)
async def get_dashboard_creator_results(
    skip: int = 0, 
    limit: int = 10, # Limite padrão de itens por página
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user) 
):
    """
    Recupera os resultados de execução para todas as histórias
    criadas pelo usuário autenticado (o criador), de forma paginada.
    """
    print(f"--- REQUISIÇÃO GET /dashboard/my-results (paginada) PARA CRIADOR ID: {current_user.id}, skip: {skip}, limit: {limit} ---") # Debug
    
    # 1. Obter o número total de execuções para este criador
    total_count = crud_executions.get_story_executions_for_creator_count(
        db=db, 
        creator_id=current_user.id
    )
    
    # 2. Obter os itens da página atual
    executions_items = crud_executions.get_story_executions_for_creator(
        db=db, 
        creator_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    
    # Não é mais necessário tratar 'if not executions_items:' aqui da mesma forma,
    # pois mesmo que 'items' seja uma lista vazia, a estrutura PaginatedStoryExecutions será retornada.
    # O frontend pode decidir o que fazer com uma lista vazia de items.
    
    print(f"Retornando {len(executions_items)} de {total_count} resultados de execução para o dashboard do criador ID: {current_user.id}") # Debug
    
    # 3. Construir e retornar o objeto de resposta paginada
    return schemas.PaginatedStoryExecutions(
        total_count=total_count,
        limit=limit,
        skip=skip,
        items=executions_items # FastAPI converterá items para List[schemas.StoryExecutionPublic]
    )
# --- FIM DO ENDPOINT MODIFICADO ---