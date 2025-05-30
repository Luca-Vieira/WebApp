from pydantic import BaseModel, Field
from typing import List, Optional, Union

# Cor padrão, caso não seja fornecida pelo frontend
DEFAULT_ACCENT_COLOR = '#3b82f6'

class Option(BaseModel):
    id: str
    text: str

class Question(BaseModel):
    id: str
    # pageId: Optional[str] = None # Opcional, já que a questão estará aninhada na página
    text: str
    type: str # Ex: 'single-choice', 'multiple-choice'
    options: List[Option] = []

class Page(BaseModel):
    id: str
    title: str
    markdown: str
    accentColor: str = Field(default=DEFAULT_ACCENT_COLOR)
    questions: List[Question] = []

class StoryData(BaseModel):
    # Opcional: Se você tiver um título geral para a história.
    # Se a história for uma coleção de páginas sem um título próprio, pode remover.
    story_title: Optional[str] = "História Sem Título" 
    pages: List[Page]

    # Para o futuro: quem é o dono desta história
    # user_id: Optional[str] = None