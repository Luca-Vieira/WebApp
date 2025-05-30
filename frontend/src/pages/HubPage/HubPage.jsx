import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './HubPage.css'; // Estilos para esta página

function HubPage() {
  const navigate = useNavigate();
  const [storyIdInput, setStoryIdInput] = useState('');

  const handleCreateStory = () => {
    navigate('/editor'); // Navega para a página de criação/edição
  };

  const handleExecuteStory = (e) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário, se houver
    if (!storyIdInput.trim()) {
      alert('Por favor, insira um ID de história para executar.');
      return;
    }
    
    // NO FUTURO:
    // 1. Você faria uma chamada à API: GET /api/stories/${storyIdInput} para buscar os dados da história.
    // 2. Se a história for encontrada, receberia os dados (ex: storyData.pages).
    // 3. Então, navegaria para a StoryPlayerPage com esses dados:
    //    navigate('/story/play', { state: { storyData: { story_title: "Título da API", pages: dadosDaApi.pages } } });

    // POR AGORA (SIMULAÇÃO ou funcionalidade limitada):
    // Poderíamos tentar navegar e a StoryPlayerPage usaria dados mockados se não encontrar nada,
    // ou você pode desabilitar este botão até o backend estar pronto.
    // Para este exemplo, vamos apenas mostrar um alerta e não navegar,
    // indicando que a funcionalidade está pendente.
    alert(`Funcionalidade "Executar História por ID" (${storyIdInput}) pendente de implementação completa com o backend.\nPor enquanto, você pode testar o player indo diretamente ao MainPage e clicando em "Jogar História Atual".`);
    
    // Ou, se quiser tentar passar o ID para StoryPlayerPage (que usaria mock data se não receber state.storyData):
    // navigate('/story/play', { state: { storyIdToLoad: storyIdInput } }); 
    // A StoryPlayerPage precisaria ser adaptada para tentar buscar dados com este ID.
    setStoryIdInput(''); 
  };

  return (
    <div className="hub-page-container">
      <header className="hub-header">
        <h1>Bem-vindo ao Criador de Histórias Interativas!</h1>
        <p>Escolha uma opção abaixo para começar:</p>
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
          <h2>Executar uma História</h2>
          <p>Tem um ID de história? Insira-o abaixo para mergulhar em uma aventura!</p>
          <form onSubmit={handleExecuteStory} className="execute-story-form">
            <input
              type="text"
              value={storyIdInput}
              onChange={(e) => setStoryIdInput(e.target.value)}
              placeholder="Insira o ID da História"
              className="hub-input"
            />
            <button type="submit" className="hub-button secondary-button" disabled={!storyIdInput.trim()}> 
            {/* O botão pode estar desabilitado até a funcionalidade backend existir.
                Por enquanto, ele mostrará um alerta.
            */}
              Executar História
            </button>
          </form>
        </div>
      </div>

      <footer className="hub-footer">
        <p>
          Explore suas <Link to="/dashboard">estatísticas no Dashboard</Link> ou <Link to="/story/play">teste o Player</Link> (com dados da última edição).
        </p>
      </footer>
    </div>
  );
}

export default HubPage;