# backend/app/crud_executions.py
import json
from sqlalchemy.orm import Session
from sqlalchemy import desc # Para ordenar
import datetime 
from typing import List 

from . import models_db, schemas # Para os modelos de banco e esquemas Pydantic

def create_story_execution(
    db: Session, 
    execution_data: schemas.StoryExecutionCreate, 
    player_user_id: int
) -> models_db.StoryExecution:
    """
    Salva uma nova execução de história no banco de dados.

    Args:
        db: A sessão do banco de dados SQLAlchemy.
        execution_data: Os dados da execução da história (do tipo schemas.StoryExecutionCreate).
        player_user_id: O ID do usuário que jogou a história.

    Returns:
        O objeto StoryExecution criado, recuperado do banco de dados.
    """

    answers_as_json_string = json.dumps(execution_data.answers)
    pages_visited_as_json_string = json.dumps(execution_data.pages_visited)

    db_execution = models_db.StoryExecution(
        story_id=execution_data.story_id,
        player_user_id=player_user_id,
        start_time=execution_data.start_time,
        end_time=execution_data.end_time,
        duration_minutes=int(round(execution_data.duration_minutes)),
        answers_json=answers_as_json_string,
        pages_visited_json=pages_visited_as_json_string,
        story_title_at_play=execution_data.story_title_at_play,
        player_name_at_play=execution_data.player_name_at_play
    )
    
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    
    print(f"CRUD: Execução de história ID {db_execution.id} para história ID {db_execution.story_id} salva.") # Debug
    return db_execution

# --- FUNÇÃO ADICIONADA PARA BUSCAR EXECUÇÕES PARA O DASHBOARD DO CRIADOR ---
def get_story_executions_for_creator(
    db: Session, 
    creator_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[models_db.StoryExecution]:
    """
    Busca todas as execuções de histórias para todas as histórias
    criadas por um usuário específico.

    Args:
        db: A sessão do banco de dados SQLAlchemy.
        creator_id: O ID do usuário criador das histórias.
        skip: Número de registros a pular (para paginação).
        limit: Número máximo de registros a retornar (para paginação).

    Returns:
        Uma lista de objetos StoryExecution.
    """
    # Certifique-se de que a linha 'return' está indentada corretamente
    # em relação à linha 'def' acima (4 espaços, por exemplo).
    # E que todas as linhas continuadas (com '\' ou dentro de parênteses)
    # também estão indentadas consistentemente.
    return db.query(models_db.StoryExecution)\
             .join(models_db.Story, models_db.StoryExecution.story_id == models_db.Story.id)\
             .filter(models_db.Story.creator_id == creator_id)\
             .order_by(desc(models_db.StoryExecution.start_time))\
             .offset(skip)\
             .limit(limit)\
             .all()
             
def get_story_executions_for_creator_count(db: Session, creator_id: int) -> int:
    """
    Conta o número total de execuções de histórias para todas as histórias
    criadas por um usuário específico.

    Args:
        db: A sessão do banco de dados SQLAlchemy.
        creator_id: O ID do usuário criador das histórias.

    Returns:
        O número total de execuções.
    """
    return db.query(models_db.StoryExecution.id)\
             .join(models_db.Story, models_db.StoryExecution.story_id == models_db.Story.id)\
             .filter(models_db.Story.creator_id == creator_id)\
             .count()
# --- FIM DA FUNÇÃO ADICIONADA ---