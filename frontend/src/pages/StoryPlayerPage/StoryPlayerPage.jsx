// frontend/src/pages/StoryPlayerPage/StoryPlayerPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Adicionado useMemo
import { useNavigate, Link, useParams } from 'react-router-dom';
import { marked } from 'marked';
import './StoryPlayerPage.css';

const DEFAULT_ACCENT_COLOR = '#3b82f6';
const API_URL = 'http://127.0.0.1:8000'; 

function StoryPlayerPage() {
  const navigate = useNavigate();
  const { storyId } = useParams();

  const [fetchedStoryData, setFetchedStoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [storyPages, setStoryPages] = useState([]);
  const [currentStoryPage, setCurrentStoryPage] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [userName, setUserName] = useState("Jogador Anônimo");
  const [visitedPageOrder, setVisitedPageOrder] = useState([]);

  useEffect(() => {
    const fetchStoryDetails = async () => {
      if (!storyId) {
        setError("ID da história não fornecido na URL.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setVisitedPageOrder([]); 
      setUserAnswers({}); 
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError("Usuário não autenticado. Faça login para jogar.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/stories/${storyId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: `Erro HTTP ${response.status}` }));
          throw new Error(errorData.detail || `Falha ao buscar detalhes da história: ${response.statusText}`);
        }
        
        const storyDataFromApi = await response.json();

        if (storyDataFromApi && storyDataFromApi.pages && storyDataFromApi.pages.length > 0) {
          setFetchedStoryData(storyDataFromApi);
          setStoryPages(storyDataFromApi.pages);

          let initialPage = storyDataFromApi.pages[0]; 
          if (storyDataFromApi.start_page_client_id) {
            const designatedStartPage = storyDataFromApi.pages.find(
              p => p.id === storyDataFromApi.start_page_client_id
            );
            if (designatedStartPage) {
              initialPage = designatedStartPage;
            }
          }
          setCurrentStoryPage(initialPage);
          if (initialPage) {
            setVisitedPageOrder([initialPage.title]); 
          }
          
          setStartTime(new Date().getTime());
          
          const storedUser = localStorage.getItem("currentUser");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.name) {
              setUserName(parsedUser.name);
            }
          }
        } else {
          throw new Error("Dados da história inválidos ou nenhuma página encontrada retornada pela API.");
        }
      } catch (err) {
        console.error("Erro ao buscar detalhes da história:", err);
        setError(err.message);
        setStoryPages([]);
        setCurrentStoryPage(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStoryDetails();
  }, [storyId, navigate]);

  const handleAnswerChange = useCallback((questionId, optionId, questionType, isCheckedForCheckbox) => {
    setUserAnswers(prevAnswers => {
      const newAnswersForQuestion = { ...prevAnswers };
      if (questionType === 'single-choice') {
        newAnswersForQuestion[questionId] = optionId;
      } else { 
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
      setVisitedPageOrder(prevOrder => [...prevOrder, targetPage.title]);
    } else {
      alert(`Página "${pageTitle}" não encontrada nesta história.`);
    }
  }, [storyPages]);
  
  const renderer = new marked.Renderer();
  renderer.link = (href, title, text) => { 
    if (href && !href.startsWith('#')) { return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`; }
    return new marked.Renderer().link(href, title, text);
  };

  const renderMarkdownForPlayer = (mdText) => { 
    if (typeof mdText !== 'string') return { __html: '' }; let html = '';
    try {
      html = marked.parse(mdText, { renderer, gfm: true, breaks: true });
      html = html.replace(/\[\[(.*?)\]\]/g, (match, pageTitle) => {
        const titleTrimmed = pageTitle.trim(); if (!titleTrimmed) return match; 
        const linkColor = currentStoryPage?.accentColor || DEFAULT_ACCENT_COLOR;
        const escapedTitle = titleTrimmed.replace(/"/g, '&quot;');
        return `<a href="#" class="internal-player-link" data-link-title="${escapedTitle}" style="color: ${linkColor}; text-decoration: underline; font-weight: bold;">${titleTrimmed}</a>`;
      });
    } catch (e) { console.error(e); html="<p>Erro.</p>"; } return { __html: html };
  };

  // --- LÓGICA MEMOIZADA PARA VERIFICAR QUESTÕES RESPONDIDAS ---
  const allCurrentPageQuestionsAnswered = useMemo(() => {
    if (!currentStoryPage || !currentStoryPage.questions || currentStoryPage.questions.length === 0) {
      return true; 
    }
    for (const question of currentStoryPage.questions) {
      const answer = userAnswers[question.id];
      if (answer === undefined) {
        return false; 
      }
      if (question.type === 'multiple-choice' && (!Array.isArray(answer) || answer.length === 0)) {
        return false; // Exige pelo menos uma seleção para múltipla escolha
      }
    }
    return true;
  }, [currentStoryPage, userAnswers]);
  // --- FIM DA LÓGICA MEMOIZADA ---

  useEffect(() => {
    const contentArea = document.getElementById('story-page-content');
    if (contentArea) {
      const handleClick = (event) => {
        let target = event.target;
        while (target && target !== contentArea) {
          if (target.classList && target.classList.contains('internal-player-link')) {
            event.preventDefault();
            // --- VERIFICAÇÃO ADICIONADA AQUI ---
            if (!allCurrentPageQuestionsAnswered) {
              alert("Por favor, responda todas as questões nesta página antes de prosseguir para outra página.");
              return; 
            }
            // --- FIM DA VERIFICAÇÃO ---
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
  }, [navigateToPageByTitle, currentStoryPage, allCurrentPageQuestionsAnswered]); // Adicionada allCurrentPageQuestionsAnswered

  const handleFinishStory = async () => { 
    if (!allCurrentPageQuestionsAnswered) { // Usa a variável memoizada
      alert("Por favor, responda todas as questões nesta página antes de encerrar a história.");
      return;
    }

    const storyEndTime = new Date(); 
    const storyStartTime = new Date(startTime);
    const durationMs = storyEndTime.getTime() - storyStartTime.getTime();
    const durationMin = (durationMs / 1000) / 60;

    const executionPayload = {
      story_id: parseInt(storyId, 10),
      start_time: storyStartTime.toISOString(),
      end_time: storyEndTime.toISOString(),    
      duration_minutes: parseFloat(durationMin.toFixed(2)),
      answers: userAnswers, 
      pages_visited: visitedPageOrder, 
      story_title_at_play: fetchedStoryData?.title || "História Desconhecida",
      player_name_at_play: userName,
    };

    console.log("--- Resultados da Execução da História (a serem enviados) ---", executionPayload);
    
    const token = localStorage.getItem('accessToken');
    if (!token) { alert("Não autenticado."); navigate('/hub'); return; }

    try {
        const response = await fetch(`${API_URL}/api/story-executions/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify(executionPayload),
        });
        if (response.status === 201) { 
            const savedExecution = await response.json();
            console.log("Resultados salvos:", savedExecution);
            alert(`História finalizada e resultados salvos! Tempo: ${executionPayload.duration_minutes.toFixed(2)} min.`);
        } else { 
            const errorData = await response.json().catch(() => ({ detail: `Erro HTTP ${response.status}` }));
            console.error("Falha ao salvar resultados:", response.status, errorData);
            alert(`História finalizada, mas falha ao salvar resultados: ${errorData.detail || response.statusText}`);
        }
    } catch (err) { 
        console.error("Erro de rede ao salvar resultados:", err);
        alert("História finalizada, mas erro de rede ao salvar resultados.");
    }
    navigate('/hub');
  };
  
  const finishButtonDisabled = (currentStoryPage && currentStoryPage.questions && currentStoryPage.questions.length > 0) 
                               ? !allCurrentPageQuestionsAnswered 
                               : false;

  const pageSpecificStyles = { '--current-page-accent-color': currentStoryPage?.accentColor || DEFAULT_ACCENT_COLOR, }; // Adicionado ? para currentStoryPage

  // JSX de carregamento, erro...
  if (isLoading) { return <div className="story-player-loading">Carregando história...</div>; }
  if (error) { return <div className="story-player-error">Erro ao carregar história: {error} <Link to="/hub" className="dashboard-link-back button-like">Voltar ao Hub</Link></div>; }
  if (!currentStoryPage || !fetchedStoryData) { return <div className="story-player-loading">História não encontrada ou dados incompletos. <Link to="/hub" className="dashboard-link-back button-like">Voltar ao Hub</Link></div>;}

  return (
    <div className="story-player-container" style={pageSpecificStyles}>
      <div className="story-player-header">
        <h1>{currentStoryPage.title}</h1>
        <p>História: {fetchedStoryData?.title || "Carregando título..."}</p>
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
                  if (q.type === 'single-choice') { isChecked = userAnswers[q.id] === opt.id; } 
                  else { isChecked = (userAnswers[q.id] || []).includes(opt.id); }
                  return (
                    <li key={opt.id}>
                      <input type={q.type === 'single-choice' ? 'radio' : 'checkbox'} name={`question_${q.id}`} id={`option_${q.id}_${opt.id}`} value={opt.id} checked={isChecked} onChange={(e) => handleAnswerChange(q.id, opt.id, q.type, e.target.checked)} />
                      <label htmlFor={`option_${q.id}_${opt.id}`}>{opt.text}</label>
                    </li>);
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="story-player-navigation">
        <button onClick={handleFinishStory} className="story-finish-button" disabled={finishButtonDisabled} title={finishButtonDisabled ? "Responda todas as questões da página para encerrar" : "Encerrar a história"}>
          Encerrar História
        </button>
      </div>
      <div className="story-player-footer">
        <Link to="/hub">Voltar para o Hub</Link>
      </div>
    </div>
  );
}

export default StoryPlayerPage;