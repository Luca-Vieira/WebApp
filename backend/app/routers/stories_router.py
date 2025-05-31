# backend/app/routers/stories_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud_stories, schemas, models_db 
from ..database import get_db
from .users_router import get_current_user 

router = APIRouter(
    prefix="/api/stories",
    tags=["stories"],
)

@router.post("/", response_model=schemas.StoryCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_new_story(
    story_data: schemas.StoryCreateSchema, 
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    """
    Cria uma nova história no sistema.
    O usuário deve estar autenticado.
    """
    # Linhas de debug (podem ser removidas após o teste)
    # print("--- DADOS RECEBIDOS NO ROUTER (POST /stories) ---")
    # print(f"Título da História (story_data.story_title): {story_data.story_title}")
    # print(f"Start Page Client ID: {story_data.start_page_client_id}")
    # print(f"Número de páginas recebidas: {len(story_data.pages)}")
    # print("--- FIM DOS DADOS RECEBIDOS NO ROUTER (POST /stories) ---")

    try:
        created_story = crud_stories.create_story(
            db=db, 
            story_data=story_data, 
            creator_id=current_user.id
        )
        response_data = schemas.StoryCreateResponse(
            message="História criada com sucesso!",
            story_id=created_story.id,
            received_story_title=created_story.title, 
            received_pages_count=len(created_story.pages) 
        )
        return response_data
    except Exception as e:
        print(f"Erro ao criar história: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocorreu um erro interno ao tentar salvar a história: {str(e)}"
        )

@router.get("/", response_model=List[schemas.StoryPublic])
async def read_user_stories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    """
    Recupera uma lista de histórias criadas pelo usuário autenticado.
    """
    # print(f"--- REQUISIÇÃO GET /stories PARA USUÁRIO ID: {current_user.id} ---") # Debug
    stories = crud_stories.get_stories_by_creator_id(
        db=db, 
        creator_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    # if not stories:
        # print("Nenhuma história encontrada para este usuário.") # Debug
        # return [] # Retornar lista vazia é o comportamento correto
    # print(f"Retornando {len(stories)} histórias para o usuário ID: {current_user.id}") # Debug
    return stories

@router.get("/{story_id}", response_model=schemas.StoryPublic)
async def read_single_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user) # Ainda requer login para jogar
):
    """
    Recupera uma única história pelo seu ID para qualquer usuário autenticado jogar.
    A verificação de propriedade foi removida para leitura/jogo.
    """
    print(f"--- REQUISIÇÃO GET /stories/{story_id} PELO USUÁRIO ID: {current_user.id} (para jogar) ---") # Debug
    
    # Chama get_story_by_id SEM passar creator_id, para buscar publicamente (para usuários logados)
    db_story = crud_stories.get_story_by_id(db, story_id=story_id) 
    
    if db_story is None:
        # Agora, se não encontrar, é porque a história realmente não existe.
        print(f"História ID {story_id} não encontrada no banco de dados.") # Debug
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="História não encontrada")
    
    print(f"Retornando história ID {story_id} (Título: '{db_story.title}') para o usuário ID {current_user.id} jogar.") # Debug
    return db_story

# --- NOVO ENDPOINT PUT PARA ATUALIZAR HISTÓRIA ---
@router.put("/{story_id}", response_model=schemas.StoryPublic)
async def update_story_endpoint(
    story_id: int,
    story_data: schemas.StoryCreateSchema, # Reutilizando StoryCreateSchema para o corpo da requisição de atualização
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    """
    Atualiza uma história existente.
    Apenas o criador da história pode atualizá-la.
    Espera que o corpo da requisição contenha a estrutura completa da história para atualização.
    """
    print(f"--- REQUISIÇÃO PUT /stories/{story_id} PELO USUÁRIO ID: {current_user.id} ---") # Debug
    # print(f"Dados de atualização recebidos: {story_data.model_dump_json(indent=2)}") # Debug - Cuidado com dados grandes

    updated_story = crud_stories.update_story(
        db=db,
        story_id=story_id,
        story_update_data=story_data,
        creator_id=current_user.id
    )

    if updated_story is None:
        # Isso significa que a história não foi encontrada ou o usuário não era o proprietário.
        print(f"Falha ao atualizar: História ID {story_id} não encontrada para o usuário ID {current_user.id} ou não pertence a ele.") # Debug
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="História não encontrada ou você não tem permissão para atualizá-la."
        )
    
    print(f"História ID {story_id} atualizada com sucesso pelo usuário ID {current_user.id}.") # Debug
    return updated_story
# --- FIM DO NOVO ENDPOINT PUT ---

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story_endpoint(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    """
    Apaga uma história específica.
    Apenas o criador da história pode apagá-la.
    """
    # print(f"--- REQUISIÇÃO DELETE /stories/{story_id} PELO USUÁRIO ID: {current_user.id} ---") # Debug
    deleted_story = crud_stories.delete_story_by_id(
        db=db, 
        story_id=story_id, 
        creator_id=current_user.id
    )
    if deleted_story is None:
        # print(f"Falha ao apagar: História ID {story_id} não encontrada para o usuário ID {current_user.id} ou não pertence a ele.") # Debug
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="História não encontrada ou você não tem permissão para apagá-la."
        )
    # print(f"História ID {story_id} apagada com sucesso pelo usuário ID {current_user.id}.") # Debug
    return None