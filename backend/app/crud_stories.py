# backend/app/crud_stories.py
import json
from sqlalchemy.orm import Session
from typing import List, Optional
from . import models_db, schemas

def create_story(db: Session, story_data: schemas.StoryCreateSchema, creator_id: int) -> models_db.Story:
    """
    Cria uma nova história e suas páginas associadas no banco de dados.
    """
    db_story = models_db.Story(
        title=story_data.story_title,
        creator_id=creator_id,
        start_page_client_id=story_data.start_page_client_id
    )

    # Linhas de debug (podem ser removidas após o teste)
    print(f"--- DENTRO DO CRUD create_story PARA '{story_data.story_title}' ---")
    print(f"Start Page Client ID a ser salvo: {story_data.start_page_client_id}")
    print(f"Número de páginas em story_data.pages: {len(story_data.pages)}")

    pages_for_db_story = []
    for i, page_in_data in enumerate(story_data.pages):
        # Linhas de debug (podem ser removidas após o teste)
        print(f"  Processando página {i+1} no CRUD:")
        print(f"    ID (frontend): {page_in_data.id}")
        print(f"    Título: {page_in_data.title}")
        print(f"    Markdown (vindo de page_in_data): {page_in_data.markdown[:100] if page_in_data.markdown else 'Nenhum'}")
        
        questions_list_of_dicts = [q.model_dump() for q in page_in_data.questions]
        questions_as_json_string = json.dumps(questions_list_of_dicts)

        db_page_object = models_db.StoryPage(
            client_page_id=page_in_data.id,
            title=page_in_data.title,
            markdown=page_in_data.markdown,
            accent_color=page_in_data.accentColor,
            questions_json=questions_as_json_string
        )
        pages_for_db_story.append(db_page_object)
        # Linha de debug (pode ser removida após o teste)
        print(f"    Objeto db_page_object criado. Markdown: {db_page_object.markdown[:100] if db_page_object.markdown else 'Nenhum'}")

    db_story.pages = pages_for_db_story
    db.add(db_story)
    
    db.commit()
    db.refresh(db_story) 
    
    # Linhas de debug (podem ser removidas após o teste)
    print(f"História ID {db_story.id} salva. Start Page Client ID salvo: {db_story.start_page_client_id}")
    if db_story.pages:
        for p_idx, saved_page in enumerate(db_story.pages):
            print(f"  Página salva {p_idx+1}: ID no DB={saved_page.id_db}, ClientID={saved_page.client_page_id}, Título='{saved_page.title}', StoryID={saved_page.story_id}")
            print(f"    Markdown na página salva (do DB): {saved_page.markdown[:100] if saved_page.markdown else 'Nenhum'}")
    else:
        print("  Nenhuma página associada ao objeto db_story após refresh.")
    print("--- FIM DO CRUD create_story ---")
    
    return db_story

def get_stories_by_creator_id(db: Session, creator_id: int, skip: int = 0, limit: int = 100) -> List[models_db.Story]:
    """
    Busca todas as histórias criadas por um usuário específico, com paginação.
    """
    return db.query(models_db.Story)\
             .filter(models_db.Story.creator_id == creator_id)\
             .order_by(models_db.Story.id.desc())\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_story_by_id(db: Session, story_id: int, creator_id: Optional[int] = None) -> Optional[models_db.Story]:
    """
    Busca uma única história pelo seu ID.
    Opcionalmente, pode filtrar pelo creator_id para garantir que o usuário tenha acesso.
    """
    query = db.query(models_db.Story).filter(models_db.Story.id == story_id)
    if creator_id is not None:
        query = query.filter(models_db.Story.creator_id == creator_id)
    return query.first()

def delete_story_by_id(db: Session, story_id: int, creator_id: int) -> Optional[models_db.Story]:
    """
    Apaga uma história específica do banco de dados, verificando o proprietário.
    """
    db_story = db.query(models_db.Story).filter(
        models_db.Story.id == story_id,
        models_db.Story.creator_id == creator_id
    ).first()

    if db_story:
        print(f"CRUD: Apagando história ID {db_story.id} titulada '{db_story.title}' do usuário ID {creator_id}")
        db.delete(db_story)
        db.commit()
        return db_story 
    
    print(f"CRUD: Tentativa de apagar história ID {story_id} falhou. Não encontrada ou usuário {creator_id} não é o proprietário.")
    return None

# --- NOVA FUNÇÃO PARA ATUALIZAR HISTÓRIA ---
def update_story(
    db: Session, 
    story_id: int, 
    story_update_data: schemas.StoryCreateSchema, # Reutilizando o schema de criação
    creator_id: int
) -> Optional[models_db.Story]:
    """
    Atualiza uma história existente e suas páginas.
    Apenas o criador da história pode atualizá-la.
    A estratégia atual é apagar todas as páginas antigas e recriá-las.
    """
    # 1. Busca a história existente e verifica a propriedade
    db_story = db.query(models_db.Story).filter(
        models_db.Story.id == story_id,
        models_db.Story.creator_id == creator_id
    ).first()

    if not db_story:
        print(f"CRUD UPDATE: História ID {story_id} não encontrada ou usuário {creator_id} não é o proprietário.")
        return None

    print(f"CRUD UPDATE: Atualizando história ID {story_id} titulada '{db_story.title}'")

    # 2. Atualiza os campos da história principal
    db_story.title = story_update_data.story_title
    db_story.start_page_client_id = story_update_data.start_page_client_id
    
    # 3. Apaga as páginas antigas.
    # A maneira mais robusta com SQLAlchemy é limpar a coleção e deixar o `delete-orphan` agir,
    # ou iterar e deletar explicitamente se precisar de mais controle ou se o `delete-orphan` não estiver configurado.
    # Como temos delete-orphan, limpar a coleção e adicionar novas deve funcionar.
    
    # Remove as páginas antigas da sessão e da coleção da história.
    # O SQLAlchemy, com cascade="all, delete-orphan", cuidará de deletá-las do banco no commit.
    db_story.pages.clear() 
    # Um db.flush() aqui executaria os deletes imediatamente, o que pode ser útil
    # para evitar qualquer conflito de constraint se os IDs das páginas pudessem ser reutilizados (não é o nosso caso com client_page_id).
    # db.flush()


    # 4. Cria e adiciona as novas páginas
    new_pages_for_db_story = []
    for page_in_data in story_update_data.pages:
        questions_list_of_dicts = [q.model_dump() for q in page_in_data.questions]
        questions_as_json_string = json.dumps(questions_list_of_dicts)

        db_page_object = models_db.StoryPage(
            client_page_id=page_in_data.id,
            title=page_in_data.title,
            markdown=page_in_data.markdown,
            accent_color=page_in_data.accentColor,
            questions_json=questions_as_json_string,
            story_id = db_story.id # Define explicitamente o story_id aqui
        )
        new_pages_for_db_story.append(db_page_object)
        # Não precisa adicionar db_page_object à sessão se formos usar db_story.pages = ...
        # ou se story_id for definido e db_story já estiver na sessão.

    db_story.pages = new_pages_for_db_story # Atribui a nova lista de páginas. SQLAlchemy gerencia as mudanças.
    
    # Adiciona a história (já está na sessão por ter sido consultada, mas
    # esta chamada garante que está "dirty" se necessário ou adiciona de volta se foi expulsa).
    # Na verdade, modificar seus atributos já a marca como "dirty".
    # db.add(db_story) # Geralmente não é necessário para objetos já persistidos e modificados

    db.commit()
    db.refresh(db_story) # Para recarregar a história e suas páginas atualizadas do banco

    print(f"CRUD UPDATE: História ID {db_story.id} atualizada com {len(db_story.pages)} páginas.")
    return db_story
# --- FIM DA NOVA FUNÇÃO ---