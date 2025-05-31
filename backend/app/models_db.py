# backend/app/models_db.py
import json 
import datetime # Adicionado para o default de StoryExecution.start_time
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime # Adicionado DateTime
from sqlalchemy.orm import relationship
from typing import List, Dict, Any 
from .database import Base 

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    stories = relationship("Story", back_populates="creator")
    # Adicionando relacionamento para execuções de histórias feitas por este usuário
    executions = relationship("StoryExecution", foreign_keys="[StoryExecution.player_user_id]", back_populates="player")


    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, index=True, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_page_client_id = Column(String, nullable=True) 

    creator = relationship("User", back_populates="stories")
    pages = relationship("StoryPage", back_populates="story", cascade="all, delete-orphan")
    # Adicionando relacionamento para execuções desta história
    executions = relationship("StoryExecution", back_populates="story", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Story(id={self.id}, title='{self.title}', creator_id={self.creator_id}, start_page_client_id='{self.start_page_client_id}')>"

class StoryPage(Base):
    __tablename__ = "story_pages"

    id_db = Column("id", Integer, primary_key=True, index=True, autoincrement=True) 
    client_page_id = Column(String, nullable=False, index=True) 
    title = Column(String, nullable=False)
    markdown = Column(Text, nullable=True)
    accent_color = Column(String, nullable=True)
    questions_json = Column(Text, nullable=True) 

    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    story = relationship("Story", back_populates="pages")

    @property
    def id(self) -> str: 
        return self.client_page_id
    
    @property
    def questions(self) -> List[Dict[str, Any]]: 
        if self.questions_json:
            try:
                loaded_questions = json.loads(self.questions_json)
                if isinstance(loaded_questions, list):
                    return loaded_questions
                return [] 
            except json.JSONDecodeError:
                return [] 
        return []

    def __repr__(self):
        return f"<StoryPage(id_db={self.id_db}, client_page_id='{self.client_page_id}', title='{self.title}', story_id={self.story_id})>"

# --- NOVO MODELO StoryExecution ---
class StoryExecution(Base):
    __tablename__ = "story_executions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    player_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True) 
    duration_minutes = Column(Integer, nullable=True)
    answers_json = Column(Text, nullable=True) 
    pages_visited_json = Column(Text, nullable=True) 
    story_title_at_play = Column(String, nullable=True) 
    player_name_at_play = Column(String, nullable=True)

    story = relationship("Story", back_populates="executions") 
    player = relationship("User", foreign_keys=[player_user_id], back_populates="executions")

    # --- NOVAS PROPRIEDADES PARA DESSERIALIZAÇÃO ---
    @property
    def answers(self) -> Dict[str, Any]:
        if self.answers_json:
            try:
                return json.loads(self.answers_json)
            except json.JSONDecodeError:
                return {} # Ou logar erro
        return {}

    @property
    def pages_visited(self) -> List[str]:
        if self.pages_visited_json:
            try:
                loaded_pages = json.loads(self.pages_visited_json)
                if isinstance(loaded_pages, list):
                    return loaded_pages
                return [] # Ou logar erro
            except json.JSONDecodeError:
                return [] # Ou logar erro
        return []
    # --- FIM DAS NOVAS PROPRIEDADES ---

    def __repr__(self):
        return f"<StoryExecution(id={self.id}, story_id={self.story_id}, player_user_id={self.player_user_id}, end_time='{self.end_time}')>"