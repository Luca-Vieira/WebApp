// frontend/src/pages/DashboardPage/CreatorDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import { Link } from 'react-router-dom';
import './CreatorDashboardPage.css';

const API_URL = 'http://127.0.0.1:8000'; // URL do backend

const ITEMS_PER_PAGE = 5; // Define quantos resultados de execução mostrar por página

function CreatorDashboardPage() {
  const [allExecutionResults, setAllExecutionResults] = useState([]); // Guarda todos os resultados para filtragem client-side
  const [displayedExecutionResults, setDisplayedExecutionResults] = useState([]); // Resultados a serem exibidos após paginação e filtro
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [storyDefinitions, setStoryDefinitions] = useState({});
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);

  const [selectedStoryTitleFilter, setSelectedStoryTitleFilter] = useState('TODAS');
  const [uniqueStoryTitles, setUniqueStoryTitles] = useState([]);

  // --- ESTADOS PARA PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  // itemsPerPage é definido como constante ITEMS_PER_PAGE acima
  // --- FIM ESTADOS PARA PAGINAÇÃO ---

  // Função para buscar definições das histórias (movida para ser reutilizável)
  const fetchStoryDefinitionsForResults = useCallback(async (resultsToProcess) => {
    if (resultsToProcess.length > 0) {
      setIsLoadingDefinitions(true);
      const token = localStorage.getItem('accessToken');
      if (!token) { // Adicionado para proteger a chamada
          setIsLoadingDefinitions(false);
          return; // Não pode buscar definições sem token
      }

      const storyIdsToFetch = [...new Set(resultsToProcess.map(result => result.story_id))];
      const newDefinitions = { ...storyDefinitions }; // Começa com as definições já carregadas

      let definitionsChanged = false;
      for (const storyId of storyIdsToFetch) {
        if (!newDefinitions[storyId]) { // Busca apenas se ainda não tiver
          try {
            const storyDefResponse = await fetch(`${API_URL}/api/stories/${storyId}`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (storyDefResponse.ok) {
              newDefinitions[storyId] = await storyDefResponse.json();
              definitionsChanged = true;
            } else {
              console.warn(`Não foi possível buscar a definição da história ID ${storyId}. Status: ${storyDefResponse.status}`);
              newDefinitions[storyId] = null; 
            }
          } catch (storyErr) {
            console.error(`Erro ao buscar definição da história ID ${storyId}:`, storyErr);
            newDefinitions[storyId] = null;
          }
        }
      }
      if (definitionsChanged) {
        setStoryDefinitions(newDefinitions);
      }
      setIsLoadingDefinitions(false);
    } else {
        setIsLoadingDefinitions(false); // Se não houver resultados, não há definições para carregar
    }
  }, [storyDefinitions]); // Depende de storyDefinitions para não refazer buscas desnecessárias

  // useEffect para buscar os dados paginados e as definições
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError("Usuário não autenticado. Faça login para ver o dashboard.");
        setIsLoading(false);
        return;
      }

      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const limit = ITEMS_PER_PAGE;

      try {
        const response = await fetch(`${API_URL}/api/story-executions/dashboard/my-results?skip=${skip}&limit=${limit}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: `Erro HTTP ${response.status}` }));
          throw new Error(errorData.detail || `Falha ao buscar dados do dashboard: ${response.statusText}`);
        }

        const paginatedData = await response.json(); // Espera-se schemas.PaginatedStoryExecutions
        
        setAllExecutionResults(paginatedData.items || []); // Guarda os itens da página atual
        setTotalItems(paginatedData.total_count || 0);
        
        // Extrai títulos únicos de TODAS as execuções (isso pode ser melhorado no futuro)
        // Por agora, para manter o filtro simples, vamos popular os títulos baseados nos items da página atual
        // ou, idealmente, teríamos um endpoint separado para buscar todos os títulos de história do criador.
        // Para simplificar, vamos popular uniqueStoryTitles com base nos items carregados
        // se for a primeira página e ainda não tivermos títulos,
        // ou o usuário pode precisar de um mecanismo para carregar todos os títulos de histórias.
        // **Melhoria**: Se `allExecutionResults` guardasse TODAS as execuções (sem paginação no backend),
        // o filtro e a paginação seriam puramente client-side.
        // Mas como o backend agora pagina, o filtro client-side só funcionará nos dados da página atual.
        // Para um filtro global com paginação no backend, o filtro teria que ser enviado ao backend.
        // Vamos manter o filtro client-side nos dados da página atual por simplicidade POR ENQUANTO.
        if (paginatedData.items && paginatedData.items.length > 0) {
            const titles = [...new Set(paginatedData.items.map(result => result.story_title_at_play || `História ID ${result.story_id}` || "História Desconhecida"))];
             // Apenas adiciona novos títulos ao filtro, não substitui totalmente
            setUniqueStoryTitles(prevTitles => {
                const combined = new Set([...prevTitles, ...titles]);
                return Array.from(combined).sort();
            });
            fetchStoryDefinitionsForResults(paginatedData.items); // Busca definições para os itens da página atual
        }
        
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
        setError(err.message);
        setAllExecutionResults([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentPage, fetchStoryDefinitionsForResults]); // Re-busca quando currentPage muda

  // useEffect para filtrar e paginar os resultados exibidos quando o filtro ou allExecutionResults mudam
  useEffect(() => {
    let filtered = allExecutionResults;
    if (selectedStoryTitleFilter !== 'TODAS') {
      filtered = allExecutionResults.filter(result => 
        (result.story_title_at_play || `História ID ${result.story_id}` || "História Desconhecida") === selectedStoryTitleFilter
      );
    }
    setDisplayedExecutionResults(filtered);
    // Nota: com paginação no backend, este filtro client-side só atua nos dados da página atual.
    // Para um filtro global, o `selectedStoryTitleFilter` precisaria ser um parâmetro da API.
  }, [selectedStoryTitleFilter, allExecutionResults]);


  const getQuestionAndOptionTexts = useCallback((storyId, questionId, answerOptionIdOrIds) => {
    // ... (função como definida anteriormente, dependendo de storyDefinitions) ...
    const storyDef = storyDefinitions[storyId];
    let questionText = `Questão ID: ${questionId}`; 
    let answerGiven = Array.isArray(answerOptionIdOrIds) 
                      ? answerOptionIdOrIds.join(', ') 
                      : String(answerOptionIdOrIds); 

    if (isLoadingDefinitions && !storyDef) { 
        questionText = `Carregando texto da questão ID: ${questionId}...`;
        answerGiven = `Carregando texto da resposta...`;
        return { questionText, answerGiven };
    }
    
    if (storyDef && storyDef.pages) {
      let foundQuestion = null;
      for (const page of storyDef.pages) {
        if (page.questions && Array.isArray(page.questions)) {
          foundQuestion = page.questions.find(q => q.id === questionId);
          if (foundQuestion) break;
        }
      }

      if (foundQuestion) {
        questionText = foundQuestion.text || `Questão ID: ${questionId} (texto não encontrado)`;
        if (Array.isArray(answerOptionIdOrIds)) { 
          const answerTexts = answerOptionIdOrIds.map(optionId => {
            const foundOption = foundQuestion.options.find(opt => opt.id === optionId);
            return foundOption ? foundOption.text : `Opção ID: ${optionId}`;
          });
          answerGiven = answerTexts.length > 0 ? answerTexts.join(', ') : "Nenhuma opção selecionada";
        } else { 
          const foundOption = foundQuestion.options.find(opt => opt.id === answerOptionIdOrIds);
          answerGiven = foundOption ? foundOption.text : `Opção ID: ${answerOptionIdOrIds}`;
        }
      }
    }
    return { questionText, answerGiven };
  }, [storyDefinitions, isLoadingDefinitions]); // Adicionado isLoadingDefinitions à dependência

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };


  if (isLoading && allExecutionResults.length === 0) {
    return <div className="dashboard-loading">Carregando dados do dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Erro ao carregar dashboard: {error}</div>;
  }

  // Agrupa os resultados *a serem exibidos* (já paginados e filtrados no nível da página)
  const resultsByStoryToDisplay = displayedExecutionResults.reduce((acc, result) => {
    const storyTitle = result.story_title_at_play || `História ID ${result.story_id}` || "História Desconhecida";
    (acc[storyTitle] = acc[storyTitle] || []).push(result);
    return acc;
  }, {});

  return (
    <div className="dashboard-container">
      <h1>Dashboard do Criador</h1>
      <p>Visualize quem jogou suas histórias e como eles responderam.</p>

      {/* Filtro de Histórias */}
      {uniqueStoryTitles.length > 0 && (
        <div className="dashboard-filter-container">
          <label htmlFor="storyFilter">Filtrar por História: </label>
          <select 
            id="storyFilter" 
            value={selectedStoryTitleFilter} 
            onChange={(e) => {
                setSelectedStoryTitleFilter(e.target.value);
                // setCurrentPage(1); // Opcional: resetar para a página 1 ao mudar o filtro
            }}
          >
            <option value="TODAS">Todas as Histórias (nesta página)</option>
            {uniqueStoryTitles.map(title => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Feedback se não houver resultados após carregar ou filtrar */}
      {!isLoading && displayedExecutionResults.length === 0 && allExecutionResults.length > 0 && selectedStoryTitleFilter !== 'TODAS' && (
         <p className="no-stories-message">Nenhuma execução encontrada para a história "{selectedStoryTitleFilter}" nesta página.</p>
      )}
      {!isLoading && allExecutionResults.length === 0 && ( // Se não houver execuções no total (após o primeiro fetch)
          <p className="no-stories-message">Você ainda não tem resultados de execução para suas histórias.</p>
      )}

      {Object.entries(resultsByStoryToDisplay).map(([storyTitle, results]) => {
        if (results.length === 0) return null; 

        return (
          <section key={storyTitle} className="story-results-section">
            <h2>Resultados para: {storyTitle} ({results.length} execuções nesta página)</h2>
            {results.map((result) => (
              <div key={result.id} className="execution-result-item">
                <div className="execution-header">
                  <p><strong>Usuário:</strong> {result.player_name_at_play || `ID Jogador: ${result.player_user_id}`}</p>
                  <p><strong>Duração:</strong> {result.duration_minutes != null ? result.duration_minutes.toFixed(2) : 'N/A'} min</p>
                </div>
                <div className="execution-times">
                  <small>Início: {new Date(result.start_time).toLocaleString()}</small>
                  <small>Fim: {result.end_time ? new Date(result.end_time).toLocaleString() : 'Não finalizada'}</small>
                </div>
                
                {result.answers && Object.keys(result.answers).length > 0 && (
                  <div className="responses-section">
                    <strong>Respostas:</strong>
                    <ul>
                      {Object.entries(result.answers).map(([questionId, answerValue]) => {
                        const { questionText, answerGiven } = getQuestionAndOptionTexts(
                          result.story_id,
                          questionId,
                          answerValue
                        );
                        return (
                          <li key={questionId}>
                            <p><em>P: {questionText}</em></p>
                            <p>R: {answerGiven}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {isLoadingDefinitions && result.answers && Object.keys(result.answers).length > 0 && (
                     <p className="loading-message" style={{fontSize: '0.8em', fontStyle: 'italic'}}>Carregando textos das questões...</p>
                )}
                {(!result.answers || Object.keys(result.answers).length === 0) && (
                    <p className="no-answers-text"><em>Nenhuma resposta registrada para esta execução.</em></p>
                )}

                {result.pages_visited && result.pages_visited.length > 0 && (
                  <div className="pages-visited-section">
                      <strong>Páginas Visitadas (Títulos):</strong>
                      <p>{result.pages_visited.join(' → ')}</p>
                  </div>
                )}
              </div>
            ))}
          </section>
        );
      })}
      
      {/* --- CONTROLES DE PAGINAÇÃO --- */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={handlePreviousPage} disabled={currentPage === 1}>
            Anterior
          </button>
          <span> Página {currentPage} de {totalPages} (Total de execuções: {totalItems}) </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>
            Próxima
          </button>
        </div>
      )}
      {/* --- FIM CONTROLES DE PAGINAÇÃO --- */}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/hub" className="dashboard-link-back button-like">Voltar para o Hub</Link>
      </div>
    </div>
  );
}

export default CreatorDashboardPage;