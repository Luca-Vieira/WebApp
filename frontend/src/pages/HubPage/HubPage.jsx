// frontend/src/pages/HubPage/HubPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './HubPage.css';

const API_URL = 'http://127.0.0.1:8000'; // URL do nosso backend FastAPI

function HubPage() {
  const navigate = useNavigate();
  const [storyIdInput, setStoryIdInput] = useState('');
  
  const [userStories, setUserStories] = useState([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [storiesError, setStoriesError] = useState(null);

  // Função para buscar as histórias do usuário (movida para fora para ser reutilizável)
  const fetchUserStories = async () => {
    setIsLoadingStories(true);
    setStoriesError(null);
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setIsLoadingStories(false);
      // setStoriesError("Usuário não autenticado para buscar histórias."); // O ProtectedRoute deve lidar com isso
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/stories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erro ${response.status}` }));
        throw new Error(errorData.detail || `Falha ao buscar histórias: ${response.statusText}`);
      }

      const data = await response.json();
      // console.log("Histórias recebidas do backend no HubPage:", JSON.stringify(data, null, 2));
      setUserStories(data);
    } catch (error) {
      console.error("Erro ao buscar histórias do usuário:", error);
      setStoriesError(error.message);
      setUserStories([]);
    } finally {
      setIsLoadingStories(false);
    }
  };

  useEffect(() => {
    fetchUserStories();
  }, []); // O array vazio [] faz com que o efeito rode uma vez quando o componente monta

  const handleCreateStory = () => {
    navigate('/editor');
  };

  const handleExecuteStoryById = (e) => {
    e.preventDefault();
    if (!storyIdInput.trim()) {
      alert('Por favor, insira um ID de história para executar.');
      return;
    }
    // No futuro, isso navegaria para o player com o ID da história do banco
    navigate(`/story/play/${storyIdInput.trim()}`);
    setStoryIdInput('');
  };

    const handleEditStory = (storyId, storyTitle) => {
    console.log(`Redirecionando para Editar História: ID=${storyId}, Título=${storyTitle}`);
    // Usa o navigate para ir para a rota do editor, passando o storyId via state
    navigate('/editor', { state: { storyToLoadId: storyId } });
  };

  const handlePlayStory = (storyId, storyTitle) => {
    console.log(`Redirecionando para Jogar História: ID=${storyId}, Título=${storyTitle}`);
    navigate(`/story/play/${storyId}`); 
  };

  // --- NOVA FUNÇÃO PARA APAGAR HISTÓRIA ---
  const handleDeleteStory = async (storyId, storyTitle) => {
    if (!window.confirm(`Tem certeza que deseja apagar a história "${storyTitle}" (ID: ${storyId})? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert("Autenticação necessária para apagar histórias.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 204) { // 204 No Content - Sucesso
        alert(`História "${storyTitle}" apagada com sucesso.`);
        // Atualiza a lista de histórias no frontend removendo a história apagada
        setUserStories(prevStories => prevStories.filter(story => story.id !== storyId));
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erro HTTP ${response.status}` }));
        throw new Error(errorData.detail || `Falha ao apagar história: ${response.statusText}`);
      } else {
        // Se o status for ok, mas não 204 (ex: 200 com corpo, embora não esperado aqui)
        alert(`História "${storyTitle}" apagada.`);
        setUserStories(prevStories => prevStories.filter(story => story.id !== storyId));
      }
    } catch (error) {
      console.error("Erro ao apagar história:", error);
      alert(`Erro ao apagar história: ${error.message}`);
    }
  };
  // --- FIM DA NOVA FUNÇÃO ---


  return (
    <div className="hub-page-container">
      <header className="hub-header">
        <h1>Bem-vindo ao Criador de Histórias Interativas!</h1>
        <p>Escolha uma opção abaixo para começar ou continue uma história existente:</p>
      </header>

      <div className="hub-options-grid">
        <div className="hub-option-card create-story-card">
          <h2>Criar Nova História</h2>
          <p>Dê vida às suas ideias e construa narrativas ramificadas com questões e múltiplos finais.</p>
          <button onClick={handleCreateStory} className="hub-button primary-button">
            Começar a Criar
          </button>
        </div>

        <div className="hub-option-card execute-story-card">
          <h2>Executar uma História por ID</h2>
          <p>Tem um ID de história específico? Insira-o abaixo para mergulhar na aventura!</p>
          <form onSubmit={handleExecuteStoryById} className="execute-story-form">
            <input
              type="text"
              value={storyIdInput}
              onChange={(e) => setStoryIdInput(e.target.value)}
              placeholder="Insira o ID da História (do DB)"
              className="hub-input"
            />
            <button type="submit" className="hub-button secondary-button" disabled={!storyIdInput.trim()}>
              Executar História
            </button>
          </form>
        </div>
      </div>

      <section className="user-stories-section">
        <h2>Minhas Histórias Salvas</h2>
        {isLoadingStories && <p className="loading-message">Carregando suas histórias...</p>}
        {storiesError && <p className="error-message">Erro ao carregar histórias: {storiesError}</p>}
        {!isLoadingStories && !storiesError && userStories.length === 0 && (
          <p className="no-stories-message">Você ainda não salvou nenhuma história. Que tal <Link to="/editor">criar uma agora</Link>?</p>
        )}
        {!isLoadingStories && !storiesError && userStories.length > 0 && (
          <ul className="stories-list">
            {userStories.map(story => (
              <li key={story.id} className="story-list-item">
                <div className="story-info">
                  <h3>{story.title}</h3> {/* Usando story.title como corrigido */}
                  <p>Páginas: {story.pages ? story.pages.length : 0}</p>
                  {story.start_page_client_id && (
                    <p className="start-page-info-hub">
                        Página Inicial Designada ID: {story.start_page_client_id}
                        {/* Você pode querer mostrar o título da página inicial aqui,
                            o que exigiria encontrar a página na lista story.pages */}
                    </p>
                  )}
                </div>
                <div className="story-actions">
                  <button 
                    onClick={() => handleEditStory(story.id, story.title)} 
                    className="hub-button list-action-button edit-button"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handlePlayStory(story.id, story.title)} 
                    className="hub-button list-action-button play-button"
                  >
                    Jogar
                  </button>
                  {/* --- NOVO BOTÃO APAGAR --- */}
                  <button 
                    onClick={() => handleDeleteStory(story.id, story.title)} 
                    className="hub-button list-action-button delete-button"
                  >
                    Apagar
                  </button>
                  {/* --- FIM DO NOVO BOTÃO APAGAR --- */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="hub-footer">
        <p>
          Explore suas <Link to="/dashboard">estatísticas no Dashboard</Link> ou <Link to="/editor">vá para o Editor</Link>.
        </p>
      </footer>
    </div>
  );
}

export default HubPage;