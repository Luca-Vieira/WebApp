import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import './StoryPlayerPage.css'; // Criaremos este arquivo de estilo

const DEFAULT_ACCENT_COLOR = '#3b82f6'; // Mantenha consistente com MainPage

function StoryPlayerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Espera-se que storyData (com o array 'pages') e storyTitle sejam passados via estado da rota
  const { storyData } = location.state || {};
  
  const [storyPages, setStoryPages] = useState([]);
  const [currentStoryPage, setCurrentStoryPage] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [userName, setUserName] = useState("Jogador Anônimo"); // Placeholder

  // Inicialização da história e do tempo
  useEffect(() => {
    if (storyData && storyData.pages && storyData.pages.length > 0) {
      setStoryPages(storyData.pages);
      setCurrentStoryPage(storyData.pages[0]); // Começa com a primeira página
      setStartTime(new Date().getTime());
      setUserAnswers({}); // Limpa respostas anteriores
      
      // Simulação de obtenção do nome do usuário (substituir com lógica de autenticação real)
      // const loggedInUser = localStorage.getItem("loggedInUserName");
      // if (loggedInUser) setUserName(loggedInUser);

    } else {
      // Se não houver dados da história, redireciona ou mostra uma mensagem
      alert("Nenhuma história carregada para jogar. Redirecionando...");
      navigate('/'); // Ou para uma página de seleção de histórias
    }
  }, [storyData, navigate]);

  const handleAnswerChange = useCallback((questionId, optionId, questionType, isCheckedForCheckbox) => {
    setUserAnswers(prevAnswers => {
      const newAnswersForQuestion = { ...prevAnswers };
      if (questionType === 'single-choice') {
        newAnswersForQuestion[questionId] = optionId;
      } else { // multiple-choice
        const currentSelections = prevAnswers[questionId] || [];
        if (isCheckedForCheckbox) {
          if (!currentSelections.includes(optionId)) {
            newAnswersForQuestion[questionId] = [...currentSelections, optionId];
          }
        } else {
          newAnswersForQuestion[questionId] = currentSelections.filter(id => id !== optionId);
        }
      }
      return newAnswersForQuestion;
    });
  }, []);

  const navigateToPageByTitle = useCallback((pageTitle) => {
    const targetPage = storyPages.find(p => p.title.trim().toLowerCase() === pageTitle.trim().toLowerCase());
    if (targetPage) {
      setCurrentStoryPage(targetPage);
    } else {
      alert(`Página "${pageTitle}" não encontrada nesta história.`);
    }
  }, [storyPages]);
  
  // Renderer customizado para links
  const renderer = new marked.Renderer();
  renderer.link = (href, title, text) => {
    // Links internos [[Page Title]] devem ter sido processados para <a class="internal-link">...</a>
    // Esta função é para links Markdown padrão: [texto](url)
    if (href && !href.startsWith('#')) { // Assume links externos
      return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
    // Para links de âncora na mesma página ou já processados internamente
    return new marked.Renderer().link(href, title, text); // Devolve ao renderer padrão do marked
  };

  const renderMarkdownForPlayer = (mdText) => {
    if (typeof mdText !== 'string') return { __html: '' };
    let html = '';
    try {
      html = marked.parse(mdText, { renderer, gfm: true, breaks: true });
      
      // Substituir os links internos [[Page Title]] no HTML gerado
      html = html.replace(/\[\[(.*?)\]\]/g, (match, pageTitle) => {
        const titleTrimmed = pageTitle.trim();
        if (!titleTrimmed) return match; 

        const linkColor = currentStoryPage?.accentColor || DEFAULT_ACCENT_COLOR;
        const escapedTitle = titleTrimmed.replace(/"/g, '&quot;');
        return `<a href="#" class="internal-player-link" data-link-title="${escapedTitle}" style="color: ${linkColor}; text-decoration: underline; font-weight: bold;">${titleTrimmed}</a>`;
      });
      
    } catch (error) {
      console.error("Erro ao parsear Markdown no player:", error);
      html = '<p>Erro ao renderizar conteúdo.</p>';
    }
    return { __html: html };
  };

  // Adiciona listener para links internos no conteúdo renderizado
  useEffect(() => {
    const contentArea = document.getElementById('story-page-content');
    if (contentArea) {
      const handleClick = (event) => {
        let target = event.target;
        while (target && target !== contentArea) {
          if (target.classList && target.classList.contains('internal-player-link')) {
            event.preventDefault();
            const linkedPageTitle = target.dataset.linkTitle;
            if (linkedPageTitle) {
              navigateToPageByTitle(linkedPageTitle);
            }
            return;
          }
          target = target.parentNode;
        }
      };
      contentArea.addEventListener('click', handleClick);
      return () => contentArea.removeEventListener('click', handleClick);
    }
  }, [navigateToPageByTitle, currentStoryPage]); // Re-anexa se a página mudar, para garantir que a cor do link esteja atualizada na função de replace

  const handleFinishStory = () => {
    const endTime = new Date().getTime();
    const durationMs = endTime - startTime;
    const durationSec = durationMs / 1000;
    const durationMin = durationSec / 60;

    const results = {
      userName: userName,
      storyTitle: storyData?.story_title || "História Desconhecida", // Pega o título da história, se disponível
      startTime: new Date(startTime).toLocaleString(),
      endTime: new Date(endTime).toLocaleString(),
      durationMinutes: parseFloat(durationMin.toFixed(2)),
      answers: userAnswers, // Objeto com { questionId: answerValue }
      pagesVisited: storyPages.map(p => p.title) // Exemplo, pode ser mais detalhado
    };

    console.log("--- Resultados da Execução da História ---", results);
    alert(`História finalizada! Tempo de execução: ${results.durationMinutes.toFixed(2)} minutos. Verifique o console para os dados.`);
    
    // No futuro: enviar 'results' para a API do backend
    // Ex: await fetch('/api/story-results', { method: 'POST', body: JSON.stringify(results), ... });

    navigate('/'); // Volta para a página inicial após finalizar
  };

  if (!currentStoryPage) {
    return <div className="story-player-loading">Carregando história...</div>;
  }

  // Estilos inline para a cor de destaque da página atual
  const pageSpecificStyles = {
    '--current-page-accent-color': currentStoryPage.accentColor || DEFAULT_ACCENT_COLOR,
  };

  return (
    <div className="story-player-container" style={pageSpecificStyles}>
      <div className="story-player-header">
        <h1>{currentStoryPage.title}</h1>
        <p>História: {storyData?.story_title || "Título da História"}</p>
      </div>

      <div id="story-page-content" className="story-player-content"
           dangerouslySetInnerHTML={renderMarkdownForPlayer(currentStoryPage.markdown || '')} />

      {currentStoryPage.questions && currentStoryPage.questions.length > 0 && (
        <div className="story-questions-area">
          <h3>Questões</h3>
          {currentStoryPage.questions.map(q => (
            <div key={q.id} className="story-question-item">
              <h4>{q.text}</h4>
              <ul className="story-options-list">
                {q.options.map(opt => {
                  let isChecked = false;
                  if (q.type === 'single-choice') {
                    isChecked = userAnswers[q.id] === opt.id;
                  } else { // multiple-choice
                    isChecked = (userAnswers[q.id] || []).includes(opt.id);
                  }
                  return (
                    <li key={opt.id}>
                      <input 
                        type={q.type === 'single-choice' ? 'radio' : 'checkbox'}
                        name={`question_${q.id}`} // Garante que radios de uma mesma questão sejam mutuamente exclusivos
                        id={`option_${opt.id}`} 
                        value={opt.id}
                        checked={isChecked}
                        onChange={(e) => handleAnswerChange(q.id, opt.id, q.type, e.target.checked)} 
                      />
                      <label htmlFor={`option_${opt.id}`}>{opt.text}</label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="story-player-navigation">
        {/* Aqui você pode adicionar botões de "Página Anterior/Próxima Página" se a navegação for linear */}
        <button onClick={handleFinishStory} className="story-finish-button">
          Encerrar História
        </button>
      </div>
      <div className="story-player-footer">
        <Link to="/">Voltar para Início</Link>
      </div>
    </div>
  );
}

export default StoryPlayerPage;