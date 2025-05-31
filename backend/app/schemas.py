# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict # Adicionado Dict e Any
import datetime # Adicionado para os campos DateTime

# --- Esquemas para Usuário (User) ---

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPublic(UserBase):
    id: int
    name: Optional[str] = None

    class Config:
        from_attributes = True # Pydantic V2 (anteriormente orm_mode)

# --- Esquemas para Token (Autenticação JWT) ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Esquemas para Questões (dentro das Páginas) ---

class QuestionOption(BaseModel):
    id: str # ID da opção (uuidv4 do frontend)
    text: str

class QuestionBase(BaseModel):
    id: str # ID da questão (uuidv4 do frontend)
    text: str
    type: str # 'single-choice' ou 'multiple-choice'
    options: List[QuestionOption]


# --- Esquemas para Páginas (StoryPage) ---
DEFAULT_ACCENT_COLOR = '#3b82f6' # Cor padrão do frontend

class PageBase(BaseModel): # Para validação de entrada e base comum para saída
    id: str # Este é o client_page_id que vem do frontend e é esperado na API
    title: str
    markdown: str
    accentColor: Optional[str] = DEFAULT_ACCENT_COLOR
    questions: List[QuestionBase] = []

class PageCreate(PageBase): # Usado para validar os dados de página na criação da história (ENTRADA)
    pass 

class PagePublic(PageBase): # Usado para formatar a SAÍDA da API
    class Config:
        from_attributes = True # NECESSÁRIO AQUI para converter Modelos ORM (StoryPage) para este Schema na resposta


# --- Esquemas para História (Story) ---

# Esquema base para SAÍDA de dados da história (usado por StoryPublic)
class StoryBaseForOutput(BaseModel): 
    id: int # ID da história no banco de dados
    title: str # Corresponde ao models_db.Story.title
    creator_id: int
    start_page_client_id: Optional[str] = None 
    
    class Config:
        from_attributes = True

# Esquema público para SAÍDA de uma história completa (usado como response_model)
class StoryPublic(StoryBaseForOutput):
    pages: List[PagePublic] # Lista de páginas públicas

# Esquema para ENTRADA de dados ao criar uma história (usado como request_body)
class StoryCreateSchema(BaseModel): 
    story_title: str # Campo 'story_title' como o frontend envia
    pages: List[PageCreate]
    start_page_client_id: Optional[str] = None

# Esquema para a RESPOSTA do endpoint de criação de história
class StoryCreateResponse(BaseModel):
    message: str
    story_id: Optional[int] = None 
    received_story_title: str 
    received_pages_count: int


# --- Esquemas para Execução de História (StoryExecution) ---

class StoryExecutionBase(BaseModel):
    # Estes campos virão do payload da StoryPlayerPage.jsx -> handleFinishStory
    # story_id será o 'storyDbId' do frontend
    # player_user_id será adicionado no backend a partir do current_user
    
    story_id: int 
    start_time: datetime.datetime 
    end_time: Optional[datetime.datetime] = None
    duration_minutes: float 
    
    answers: Dict[str, Any] 
    pages_visited: List[str]

    story_title_at_play: Optional[str] = None
    player_name_at_play: Optional[str] = None


class StoryExecutionCreate(StoryExecutionBase):
    # O player_user_id será adicionado no backend pelo endpoint,
    # então não precisa ser parte do payload de criação vindo do frontend.
    pass


class StoryExecutionPublic(StoryExecutionBase):
    id: int # ID da execução no banco de dados
    player_user_id: int # ID do jogador
    
    # Opcional: Se quiser aninhar informações completas do jogador ou da história aqui
    # player: Optional[UserPublic] = None 
    # story: Optional[StoryBaseForOutput] = None # Um schema de história mais simples

    class Config:
        from_attributes = True
        
# backend/app/schemas.py
# ... (importações existentes: BaseModel, List, Optional, datetime, etc.) ...
# ... (todos os seus esquemas existentes para User, Token, Question, Page, Story, StoryExecution) ...


# --- NOVO ESQUEMA PARA RESPOSTA PAGINADA DE EXECUÇÕES DE HISTÓRIA ---
class PaginatedStoryExecutions(BaseModel):
    total_count: int                      # Número total de execuções disponíveis para o criador
    limit: int                            # O limite de itens por página usado nesta requisição
    skip: int                             # O número de itens pulados (offset) nesta requisição
    items: List[StoryExecutionPublic]     # A lista de execuções para a página atual

    # Opcional: Você poderia adicionar mais campos aqui se quisesse que o backend calculasse,
    # mas geralmente o frontend pode calcular isso a partir de total_count, limit, e skip.
    # total_pages: Optional[int] = None
    # current_page: Optional[int] = None

    class Config:
        from_attributes = True # Se for construir este objeto a partir de atributos de outro objeto não-Pydantic
                               # No nosso caso, vamos construir este objeto explicitamente no router,
                               # então esta Config pode não ser estritamente necessária para este schema em particular,
                               # mas não prejudica.