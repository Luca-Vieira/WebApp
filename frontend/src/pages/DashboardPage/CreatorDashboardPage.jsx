import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CreatorDashboardPage.css'; // Criaremos este arquivo de estilo

// Dados Simulados (Mock Data) - Substitua por chamadas de API no futuro
const mockStoryResults = [
  {
    executionId: 'exec_001',
    userName: 'Ana Beatriz',
    storyTitle: 'A Floresta Encantada',
    startTime: '2025-05-30T10:00:00Z',
    endTime: '2025-05-30T10:15:30Z',
    durationMinutes: 15.5,
    responses: [
      { questionId: 'q1_floresta', questionText: 'Qual caminho você segue?', answerGiven: 'Caminho da Esquerda', optionId: 'opt_left' },
      { questionId: 'q2_floresta', questionText: 'Você ajuda o esquilo?', answerGiven: 'Sim', optionId: 'opt_yes_squirrel' },
    ],
  },
  {
    executionId: 'exec_002',
    userName: 'Carlos Daniel',
    storyTitle: 'A Floresta Encantada',
    startTime: '2025-05-30T11:05:00Z',
    endTime: '2025-05-30T11:25:10Z',
    durationMinutes: 20.17,
    responses: [
      { questionId: 'q1_floresta', questionText: 'Qual caminho você segue?', answerGiven: 'Caminho da Direita', optionId: 'opt_right' },
      { questionId: 'q2_floresta', questionText: 'Você ajuda o esquilo?', answerGiven: 'Não', optionId: 'opt_no_squirrel' },
      { questionId: 'q3_rio', questionText: 'Como você cruza o rio?', answerGiven: 'Procurando uma ponte', optionId: 'opt_bridge' },
    ],
  },
  {
    executionId: 'exec_003',
    userName: 'Fernanda Oliveira',
    storyTitle: 'O Mistério do Castelo',
    startTime: '2025-05-31T14:00:00Z',
    endTime: '2025-05-31T14:45:00Z',
    durationMinutes: 45.0,
    responses: [
      { questionId: 'q1_castelo', questionText: 'Qual porta você escolhe?', answerGiven: 'Porta de Carvalho', optionId: 'opt_oak' },
    ],
  },
];


function CreatorDashboardPage() {
  const [storyResults, setStoryResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // No futuro, você passaria um storyId (ou pegaria do usuário logado)
  // e faria uma chamada à API aqui.
  useEffect(() => {
    // Simulação de uma chamada de API
    const fetchStoryResults = async () => {
      setIsLoading(true);
      try {
        // Exemplo de chamada de API (substituir pela sua lógica real)
        // const response = await fetch(`/api/dashboard/story-results/${storyId}`); // Ou /api/creator/dashboard
        // if (!response.ok) throw new Error('Falha ao buscar dados do dashboard');
        // const data = await response.json();
        // setStoryResults(data);

        // Usando dados mockados por enquanto:
        await new Promise(resolve => setTimeout(resolve, 700)); // Simula delay da rede
        setStoryResults(mockStoryResults);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar resultados da história:", err);
        setError(err.message);
        setStoryResults([]); // Limpa resultados em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoryResults();
  }, []); // O array vazio [] significa que este efeito roda uma vez quando o componente monta

  if (isLoading) {
    return <div className="dashboard-loading">Carregando dados do dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Erro ao carregar dashboard: {error}</div>;
  }

  if (storyResults.length === 0) {
    return (
      <div className="dashboard-container">
        <h2>Dashboard do Criador</h2>
        <p className="dashboard-no-data">Ainda não há resultados de execução para suas histórias.</p>
        <Link to="/" className="dashboard-link-back">Voltar para o Criador de Histórias</Link>
      </div>
    );
  }

  // Agrupar resultados por título da história
  const resultsByStory = storyResults.reduce((acc, result) => {
    (acc[result.storyTitle] = acc[result.storyTitle] || []).push(result);
    return acc;
  }, {});

  return (
    <div className="dashboard-container">
      <h1>Dashboard do Criador</h1>
      <p>Visualize quem jogou suas histórias e como eles responderam.</p>

      {Object.entries(resultsByStory).map(([storyTitle, results]) => (
        <section key={storyTitle} className="story-results-section">
          <h2>Resultados para: {storyTitle} ({results.length} execuções)</h2>
          {results.map((result) => (
            <div key={result.executionId} className="execution-result-item">
              <div className="execution-header">
                <p><strong>Usuário:</strong> {result.userName}</p>
                <p><strong>Duração:</strong> {result.durationMinutes} min</p>
              </div>
              <div className="execution-times">
                <small>Início: {new Date(result.startTime).toLocaleString()}</small>
                <small>Fim: {new Date(result.endTime).toLocaleString()}</small>
              </div>
              {result.responses && result.responses.length > 0 && (
                <div className="responses-section">
                  <strong>Respostas:</strong>
                  <ul>
                    {result.responses.map((response) => (
                      <li key={response.questionId}>
                        <p><em>P: {response.questionText}</em></p>
                        <p>R: {response.answerGiven}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/" className="dashboard-link-back button-like">Voltar para o Criador de Histórias</Link>
      </div>
    </div>
  );
}

export default CreatorDashboardPage;