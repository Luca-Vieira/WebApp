// frontend/src/pages/MainPage/MainPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import 'reactflow/dist/style.css'; // Estilos do React Flow

import './MainPage.css';
import GraphViewModal from './GraphViewModal'; // Ajuste o caminho se ./GraphViewModal
import QuestionEditorModal from './QuestionEditorModal'; // Ajuste o caminho se ./QuestionEditorModal

// --- Constantes e Helpers Globais ---
const generatePageId = (title) => {
  if (!title || typeof title !== 'string' || !title.trim()) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `untitled-page-${timestamp}-${randomSuffix}`;
  }
  return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

const INITIAL_PAGE_TITLE = 'Página Inicial';
const DEFAULT_ACCENT_COLOR = '#3b82f6';

const PAGES_STORAGE_KEY = 'minhaHistoriaInterativa_pages';
const CURRENT_PAGE_ID_STORAGE_KEY = 'minhaHistoriaInterativa_currentPageId';

function MainPage() {
  const [pages, setPages] = useState(() => {
    try {
      const savedPages = localStorage.getItem(PAGES_STORAGE_KEY);
      if (savedPages) {
        const parsedPages = JSON.parse(savedPages);
        if (Array.isArray(parsedPages) && parsedPages.every(p => p.id && typeof p.title !== 'undefined' && typeof p.markdown !== 'undefined')) {
          return parsedPages.map(p => ({ ...p, questions: Array.isArray(p.questions) ? p.questions : [] }));
        }
      }
    } catch (error) { console.error("Erro ao carregar páginas do LocalStorage:", error); }
    return [];
  });

  const [currentPageId, setCurrentPageId] = useState(() => {
    try { return localStorage.getItem(CURRENT_PAGE_ID_STORAGE_KEY) || null; }
    catch (error) { console.error("Erro ao carregar currentPageId do LocalStorage:", error); return null; }
  });

  const [markdownInput, setMarkdownInput] = useState('');
  const [currentPageTitleInput, setCurrentPageTitleInput] = useState('');
  const [currentPageAccentColor, setCurrentPageAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  
  const [isGraphViewOpen, setIsGraphViewOpen] = useState(false);
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [isEditMode, setIsEditMode] = useState(true);

  const createNewPageObject = useCallback((title, markdown, accentColor, id = null) => {
    return {
      id: id || generatePageId(title),
      title: title,
      markdown: markdown,
      accentColor: accentColor || DEFAULT_ACCENT_COLOR,
      questions: [],
    };
  }, []);

  const loadPageDataToInputs = useCallback((page) => {
    if (page) {
      setMarkdownInput(page.markdown || '');
      setCurrentPageTitleInput(page.title || '');
      setCurrentPageAccentColor(page.accentColor || DEFAULT_ACCENT_COLOR);
    } else {
      setMarkdownInput('');
      setCurrentPageTitleInput('');
      setCurrentPageAccentColor(DEFAULT_ACCENT_COLOR);
    }
  }, []);

  const loadPage = useCallback((pageId) => {
    const pageToLoad = pages.find(p => p.id === pageId);
    if (pageToLoad) {
      setCurrentPageId(pageToLoad.id);
      loadPageDataToInputs(pageToLoad);
      setTestAnswers({});
    }
  }, [pages, loadPageDataToInputs]);

  useEffect(() => {
    let effectiveCurrentPageId = currentPageId;
    let pageToLoadInitially = null;
    let pagesWereModifiedOrCreated = false;
    let currentPages = [...pages];

    if (currentPages.length === 0) {
      const initialPageId = generatePageId(INITIAL_PAGE_TITLE);
      const initialPage = createNewPageObject(INITIAL_PAGE_TITLE, `# ${INITIAL_PAGE_TITLE}\n\nBem-vindo! Use o editor para começar.`, DEFAULT_ACCENT_COLOR, initialPageId);
      currentPages = [initialPage];
      effectiveCurrentPageId = initialPage.id;
      pageToLoadInitially = initialPage;
      pagesWereModifiedOrCreated = true;
    } else {
      let didAnyPageMissQuestionsArray = false;
      currentPages = currentPages.map(p => {
        if (!Array.isArray(p.questions)) { didAnyPageMissQuestionsArray = true; return { ...p, questions: [] }; }
        return p;
      });
      if (didAnyPageMissQuestionsArray) pagesWereModifiedOrCreated = true;
      pageToLoadInitially = currentPages.find(p => p.id === effectiveCurrentPageId) || (currentPages.length > 0 ? currentPages[0] : null);
      if (pageToLoadInitially && effectiveCurrentPageId !== pageToLoadInitially.id) {
        effectiveCurrentPageId = pageToLoadInitially.id;
      }
    }
    
    if (pagesWereModifiedOrCreated) setPages(currentPages);
    
    if (effectiveCurrentPageId && pageToLoadInitially) {
        setCurrentPageId(effectiveCurrentPageId);
        loadPageDataToInputs(pageToLoadInitially);
    } else if (currentPages.length > 0 && !effectiveCurrentPageId) { // Caso não haja ID atual, mas existam páginas
        setCurrentPageId(currentPages[0].id);
        loadPageDataToInputs(currentPages[0]);
    } else if (currentPages.length === 0) { // Nenhuma página, resetar inputs
        loadPageDataToInputs(null);
        setCurrentPageTitleInput(INITIAL_PAGE_TITLE); // Prepara para nova página inicial
        setCurrentPageId(null);
    }
    setTestAnswers({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pages && (pages.length > 0 || localStorage.getItem(PAGES_STORAGE_KEY) !== null )) {
      try { localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(pages)); }
      catch (error) { console.error("Erro ao salvar páginas no LS:", error); }
    } else if (pages && pages.length === 0 && localStorage.getItem(PAGES_STORAGE_KEY)) {
      localStorage.removeItem(PAGES_STORAGE_KEY);
    }
  }, [pages]);

  useEffect(() => {
    if (currentPageId) {
      try { localStorage.setItem(CURRENT_PAGE_ID_STORAGE_KEY, currentPageId); }
      catch (error) { console.error("Erro ao salvar currentPageId no LS:", error); }
    } else { localStorage.removeItem(CURRENT_PAGE_ID_STORAGE_KEY); }
  }, [currentPageId]);

  const handleProcessMarkdown = () => {
    const titleTrimmed = currentPageTitleInput.trim();
    if (!titleTrimmed) {
      alert('Por favor, insira um título para a página.');
      return;
    }
    const isEffectivelyNewPage = !currentPageId || !pages.some(p => p.id === currentPageId);
    let newPageId = isEffectivelyNewPage ? generatePageId(titleTrimmed) : generatePageId(titleTrimmed);
    const oldPageId = currentPageId;

    if (pages.some(p => p.id === newPageId && p.id !== oldPageId)) {
      alert(`Uma página com o título "${titleTrimmed}" (ID "${newPageId}") já existe. Por favor, escolha um título diferente.`);
      if (!isEffectivelyNewPage && oldPageId) {
        const originalPage = pages.find(p => p.id === oldPageId);
        if (originalPage) setCurrentPageTitleInput(originalPage.title);
      }
      return;
    }
    
    let updatedPages = [...pages];
    let targetPageData;

    if (isEffectivelyNewPage) {
      targetPageData = createNewPageObject(titleTrimmed, markdownInput, currentPageAccentColor, newPageId);
      updatedPages.push(targetPageData);
    } else {
      const pageIndex = pages.findIndex(p => p.id === oldPageId);
      if (pageIndex !== -1) {
        const originalPageTitle = pages[pageIndex].title;
        targetPageData = {
          ...pages[pageIndex],
          id: newPageId,
          title: titleTrimmed,
          markdown: markdownInput,
          accentColor: currentPageAccentColor,
        };
        updatedPages[pageIndex] = targetPageData;

        if (newPageId !== oldPageId) {
          updatedPages = updatedPages.map(p => ({
            ...p,
            markdown: p.markdown.replace(new RegExp(`\\[\\[${originalPageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g'), `[[${titleTrimmed}]]`)
                                  .replace(new RegExp(`\\[\\[${oldPageId}\\]\\]`, 'g'), `[[${newPageId}]]`)
          }));
        }
      } else {
        console.error("Página para editar não encontrada:", oldPageId);
        return;
      }
    }
    
    const linkRegex = /\[\[(.*?)\]\]/g;
    let match;
    const newPagesFromLinks = [];
    const contentToScan = targetPageData.markdown;
    while ((match = linkRegex.exec(contentToScan)) !== null) {
      const linkedPageTitle = match[1].trim();
      if (!linkedPageTitle) continue;
      const linkedPageId = generatePageId(linkedPageTitle);
      if (!updatedPages.some(p => p.id === linkedPageId) && !newPagesFromLinks.some(p => p.id === linkedPageId)) {
        newPagesFromLinks.push(createNewPageObject(linkedPageTitle, `# ${linkedPageTitle}\n\nEsta página foi criada automaticamente.`, DEFAULT_ACCENT_COLOR, linkedPageId));
      }
    }
    if (newPagesFromLinks.length > 0) updatedPages = [...updatedPages, ...newPagesFromLinks];
    
    const finalUniquePages = Array.from(new Map(updatedPages.map(p => [p.id, p])).values())
                                 .sort((a, b) => a.title.localeCompare(b.title));
    
    setPages(finalUniquePages);
    setCurrentPageId(newPageId);
  };

  const handleInternalLinkClick = useCallback((linkedPageTitle) => {
    const linkedPageId = generatePageId(linkedPageTitle);
    const existingPage = pages.find(p => p.id === linkedPageId);
    if (existingPage) {
      loadPage(linkedPageId);
    } else {
      if (!isEditMode) {
        alert(`A página "${linkedPageTitle}" não existe. Entre no Modo Edição para criá-la automaticamente ao clicar no link ou manualmente.`);
        return;
      }
      if (window.confirm(`A página "${linkedPageTitle}" não existe. Deseja criá-la?`)) {
        const newPage = createNewPageObject(linkedPageTitle, `# ${linkedPageTitle}\n\nEsta página foi criada automaticamente através de um link.`, DEFAULT_ACCENT_COLOR, linkedPageId);
        setPages(prevPages => [...prevPages, newPage].sort((a, b) => a.title.localeCompare(b.title)));
        setCurrentPageId(newPage.id);
        loadPageDataToInputs(newPage);
      }
    }
  }, [pages, loadPage, createNewPageObject, loadPageDataToInputs, isEditMode]);
  
  const handleDeletePage = useCallback((pageIdToDelete) => {
    const pageToDelete = pages.find(p => p.id === pageIdToDelete);
    if (!pageToDelete) return;
    if (window.confirm(`Tem certeza que deseja apagar a página "${pageToDelete.title}"?`)) {
      let newPagesArray = pages.filter(page => page.id !== pageIdToDelete);
      newPagesArray = newPagesArray.map(p => ({
        ...p,
        markdown: p.markdown.replace(new RegExp(`\\[\\[${pageToDelete.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g'), `[[${pageToDelete.title} (apagada)]]`)
                              .replace(new RegExp(`\\[\\[${pageIdToDelete}\\]\\]`, 'g'), `[[${pageToDelete.title} (apagada)]]`)
      }));

      if (newPagesArray.length === 0) {
        const initialPageId = generatePageId(INITIAL_PAGE_TITLE);
        const initialPageRec = createNewPageObject(INITIAL_PAGE_TITLE, `# ${INITIAL_PAGE_TITLE}\n\nBem-vindo novamente!`, DEFAULT_ACCENT_COLOR, initialPageId);
        setPages([initialPageRec]);
        setCurrentPageId(initialPageRec.id);
        loadPageDataToInputs(initialPageRec);
      } else {
        setPages(newPagesArray.sort((a, b) => a.title.localeCompare(b.title)));
        if (currentPageId === pageIdToDelete) {
          const firstPage = newPagesArray[0];
          setCurrentPageId(firstPage.id);
          loadPageDataToInputs(firstPage);
        }
      }
      setTestAnswers({});
    }
  }, [pages, currentPageId, createNewPageObject, loadPageDataToInputs]);
  
  const currentPageObject = pages.find(p => p.id === currentPageId);

  const externalLinkRenderer = new marked.Renderer();
  externalLinkRenderer.link = (href, title, text) => {
    // Para links Markdown padrão (não os nossos [[Page Title]])
    // Abrir em nova aba e adicionar rel="noopener noreferrer" por segurança.
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  const renderMarkdown = (mdText) => {
    if (typeof mdText !== 'string') return { __html: '' };
    let html = '';
    try {
      // 1. Parsear o Markdown para HTML usando o renderer para links externos
      html = marked.parse(mdText, { renderer: externalLinkRenderer, gfm: true, breaks: true });
      
      // 2. Substituir os links internos [[Page Title]] no HTML gerado
      html = html.replace(/\[\[(.*?)\]\]/g, (match, pageTitle) => {
        const titleTrimmed = pageTitle.trim();
        if (!titleTrimmed) return match; 

        const linkColor = currentPageObject?.accentColor || DEFAULT_ACCENT_COLOR;
        const escapedTitle = titleTrimmed.replace(/"/g, '&quot;');
        return `<a href="#" class="internal-link" data-link-title="${escapedTitle}" style="color: ${linkColor}; text-decoration: underline; font-weight: bold;">${titleTrimmed}</a>`;
      });
      
    } catch (error) {
      console.error("Erro ao parsear Markdown:", error);
      html = '<p>Erro ao renderizar conteúdo Markdown.</p>';
    }
    return { __html: html };
  };

  useEffect(() => { 
    const contentArea = document.getElementById('page-content-display');
    if (contentArea) {
      const handleClick = (event) => {
        let target = event.target;
        while(target && target !== contentArea) {
            if (target.classList && target.classList.contains('internal-link')) {
                event.preventDefault();
                const linkedPageTitle = target.dataset.linkTitle;
                if (linkedPageTitle) handleInternalLinkClick(linkedPageTitle);
                return;
            }
            target = target.parentNode;
        }
      };
      contentArea.addEventListener('click', handleClick);
      return () => contentArea.removeEventListener('click', handleClick);
    }
  }, [handleInternalLinkClick]);

  const handleOpenQuestionEditor = useCallback((question = null) => { setEditingQuestion(question); setIsQuestionEditorOpen(true); }, []);
  const handleCloseQuestionEditor = useCallback(() => { setIsQuestionEditorOpen(false); setEditingQuestion(null); }, []);
  const handleSaveQuestion = useCallback((questionData) => {
    if (!currentPageId) { alert("Selecione ou crie uma página primeiro para adicionar uma questão."); return; }
    setPages(prevPages => prevPages.map(page => {
        if (page.id === currentPageId) {
          const existingQuestions = Array.isArray(page.questions) ? page.questions : [];
          let updatedQuestions;
          if (questionData.id) updatedQuestions = existingQuestions.map(q => q.id === questionData.id ? { ...q, ...questionData } : q );
          else {
            const newQuestion = { ...questionData, id: uuidv4(), options: (questionData.options || []).map(opt => ({ ...opt, id: opt.id || uuidv4() })) };
            updatedQuestions = [...existingQuestions, newQuestion];
          }
          return { ...page, questions: updatedQuestions };
        }
        return page;
      }));
    handleCloseQuestionEditor();
  }, [currentPageId, handleCloseQuestionEditor]);

  const handleDeleteQuestion = useCallback((questionId) => {
    if (!currentPageId || !questionId) return;
    if (!window.confirm("Tem certeza que deseja apagar esta questão?")) return;
    setPages(prevPages => prevPages.map(page => {
        if (page.id === currentPageId) {
          const updatedQuestions = (Array.isArray(page.questions) ? page.questions : []).filter(q => q.id !== questionId);
          return { ...page, questions: updatedQuestions };
        }
        return page;
      }));
  }, [currentPageId]);

  const handleTestAnswerChange = useCallback((questionId, optionId, questionType, isCheckedForCheckbox) => {
    setTestAnswers(prevAnswers => {
      const newAnswersForQuestion = { ...prevAnswers };
      if (questionType === 'single-choice') newAnswersForQuestion[questionId] = optionId;
      else { 
        const currentSelections = prevAnswers[questionId] || [];
        if (isCheckedForCheckbox) { if (!currentSelections.includes(optionId)) newAnswersForQuestion[questionId] = [...currentSelections, optionId]; }
        else newAnswersForQuestion[questionId] = currentSelections.filter(id => id !== optionId);
      }
      return newAnswersForQuestion;
    });
  }, []);

  const handleResetHistory = useCallback(() => {
    if (window.confirm("Tem certeza que deseja APAGAR TODA a história salva localmente e começar do zero? Esta ação não pode ser desfeita.")) {
      localStorage.removeItem(PAGES_STORAGE_KEY);
      localStorage.removeItem(CURRENT_PAGE_ID_STORAGE_KEY);
      const initialPageId = generatePageId(INITIAL_PAGE_TITLE);
      const newInitialPage = createNewPageObject( INITIAL_PAGE_TITLE, `# ${INITIAL_PAGE_TITLE}\n\nBem-vindo novamente! A história local foi resetada.`, DEFAULT_ACCENT_COLOR, initialPageId );
      setPages([newInitialPage]);
      setCurrentPageId(newInitialPage.id);
      loadPageDataToInputs(newInitialPage);
      setTestAnswers({});
      setIsGraphViewOpen(false);
      setIsQuestionEditorOpen(false);
      setEditingQuestion(null);
    }
  }, [createNewPageObject, loadPageDataToInputs]);

  const handleSaveStoryToBackend = async () => {
    if (pages.length === 0) {
      alert("Não há páginas para salvar na história.");
      return;
    }
    const storyTitle = pages.find(p => p.id === currentPageId)?.title || pages[0]?.title || "Minha História";
    const storyData = { story_title: storyTitle, pages: pages };
    try {
      const apiUrl = 'http://127.0.0.1:8000/api/stories';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro HTTP: ${response.status} - ${response.statusText}` }));
        console.error('Erro ao salvar história no backend:', response.status, errorData);
        alert(`Erro ao salvar história: ${errorData.message}`);
        return;
      }
      const savedStoryResponse = await response.json();
      console.log('História salva com sucesso no backend:', savedStoryResponse);
      alert(`História "${savedStoryResponse.received_story_title}" (com ${savedStoryResponse.received_pages_count} páginas) processada pela API!`);
    } catch (error) {
      console.error('Erro de conexão ao tentar salvar história:', error);
      alert('Erro de conexão ao tentar salvar. Verifique se a API Python está rodando e o CORS está configurado corretamente.');
    }
  };
  
  const pageSpecificStyles = currentPageObject ? {
    '--page-accent-color': currentPageObject.accentColor || DEFAULT_ACCENT_COLOR,
  } : {
    '--page-accent-color': DEFAULT_ACCENT_COLOR,
  };

  return (
    <div className="app-container" style={pageSpecificStyles}>
      <aside className="sidebar">
        <h2>Páginas</h2>
        <button onClick={() => setIsEditMode(prev => !prev)} className="sidebar-action-button toggle-mode-button">
          {isEditMode ? "Modo Exibição" : "Modo Edição"}
        </button>
        {isEditMode && (
          <>
            <button className="new-page-button sidebar-action-button" onClick={() => {
                const newTitleBase = "Nova Página"; let newTitle = newTitleBase; let counter = 1;
                while(pages.some(p => p.title === newTitle)) newTitle = `${newTitleBase} ${counter++}`;
                setCurrentPageId(null); 
                setCurrentPageTitleInput(newTitle);
                setMarkdownInput(`# ${newTitle}\n`); 
                setCurrentPageAccentColor(DEFAULT_ACCENT_COLOR);
                setTestAnswers({});
            }}>+ Nova Página</button>
            <button onClick={handleResetHistory} className="reset-history-button sidebar-action-button">
              Resetar História (Local)
            </button>
            <button 
              onClick={handleSaveStoryToBackend} 
              className="sidebar-action-button save-to-backend-button"
              disabled={pages.length === 0}
              title="Envia a história atual para o servidor"
            >
              Salvar no Servidor
            </button>
          </>
        )}
        <button onClick={() => setIsGraphViewOpen(true)} className="graph-view-button sidebar-action-button" disabled={pages.length === 0}>Visualizar Conexões</button>
        <ul>
          {pages.map(page => (
            <li key={page.id} className={page.id === currentPageId ? 'active' : ''}
                style={page.id === currentPageId ? { backgroundColor: page.accentColor || DEFAULT_ACCENT_COLOR, color: 'white', boxShadow: `inset 4px 0 0 color-mix(in srgb, ${page.accentColor || DEFAULT_ACCENT_COLOR} 70%, black)` } : {}}
                onClick={() => loadPage(page.id)}
                title={`Carregar: ${page.title}`}
            >
              <span className="page-title-sidebar">{page.title}</span>
              {isEditMode && pages.length > 1 && (<button onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }} className="delete-page-button" title={`Apagar "${page.title}"`}>X</button>)}
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        {isEditMode && (
          <div className="editor-area">
            <input 
              type="text" 
              className="title-input" 
              placeholder="Título da Página" 
              value={currentPageTitleInput} 
              onChange={(e) => setCurrentPageTitleInput(e.target.value)} 
              maxLength={255}
            />
            <textarea 
              className="markdown-input" 
              value={markdownInput} 
              onChange={(e) => setMarkdownInput(e.target.value)} 
              placeholder="Digite seu Markdown aqui... Use [[Nome da Outra Página]] para criar links."
              maxLength={65535}
            />
            <div className="color-picker-container">
              <label htmlFor="pageColorPicker">Cor de Destaque:</label>
              <input type="color" id="pageColorPicker" value={currentPageAccentColor} onChange={(e) => setCurrentPageAccentColor(e.target.value)} />
            </div>
            <button onClick={handleProcessMarkdown} className="process-button" disabled={!currentPageTitleInput.trim()}>
              {(!currentPageId || !pages.some(p => p.id === currentPageId)) ? "Criar Nova Página" : "Salvar Alterações na Página"}
            </button>
            {currentPageObject && (
              <div className="page-questions-section">
                <h3>Questões da Página: {currentPageObject.title}</h3>
                {(currentPageObject.questions && currentPageObject.questions.length > 0) ? (
                  <ul className="questions-list">
                    {currentPageObject.questions.map(q => (
                      <li key={q.id} className="question-item">
                        <span>{q.text.substring(0, 50)}{q.text.length > 50 ? '...' : ''} ({q.type === 'single-choice' ? 'Escolha Única' : 'Múltipla Escolha'})</span>
                        <div>
                          <button onClick={() => handleOpenQuestionEditor(q)} className="edit-question-btn">Editar</button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="delete-question-btn">Apagar</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (<p>Nenhuma questão adicionada a esta página ainda.</p>)}
                <button onClick={() => handleOpenQuestionEditor(null)} className="add-question-button">+ Adicionar Nova Questão</button>
              </div>
            )}
          </div>
        )}

        <div id="page-content-display" className={`page-display page-display-wrapper ${!isEditMode && currentPageObject ? 'full-height-display' : ''}`}>
          {currentPageObject ? (
            <>
              <h1 className="page-display-title" style={{color: currentPageObject.accentColor || DEFAULT_ACCENT_COLOR}}>{currentPageObject.title}</h1>
              <div dangerouslySetInnerHTML={renderMarkdown(currentPageObject.markdown || '')} />
              {currentPageObject.questions && currentPageObject.questions.length > 0 && (
                <div className="questions-display-area">
                  <h2>Questões {isEditMode ? "(Teste Interativo)" : ""}</h2>
                  {currentPageObject.questions.map(q => (
                    <div key={q.id} className="question-display-item">
                      <h4>{q.text}</h4>
                      <ul>
                        {q.options.map(opt => {
                          let isChecked = false;
                          if (q.type === 'single-choice') isChecked = testAnswers[q.id] === opt.id;
                          else isChecked = (testAnswers[q.id] || []).includes(opt.id);
                          return (
                            <li key={opt.id}>
                              <input type={q.type === 'single-choice' ? 'radio' : 'checkbox'}
                                      name={`question_test_${q.id}`} id={`test_opt_${opt.id}`} value={opt.id}
                                      checked={isChecked}
                                      onChange={(e) => handleTestAnswerChange(q.id, opt.id, q.type, e.target.checked)} />
                              <label htmlFor={`test_opt_${opt.id}`}>{opt.text}</label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
              (currentPageId === null && currentPageTitleInput && isEditMode) ? 
              <p>Preencha os dados da nova página e clique em "Criar Página" para adicionar conteúdo e questões.</p> :
              <p>Selecione uma página para visualizar ou clique em "+ Nova Página" (no modo edição) para começar.</p>
          )}
        </div>
      </main>

      {isEditMode && isQuestionEditorOpen && <QuestionEditorModal isOpen={isQuestionEditorOpen} onClose={handleCloseQuestionEditor} onSave={handleSaveQuestion} questionToEdit={editingQuestion} currentPageId={currentPageId} />}
      {isGraphViewOpen && <GraphViewModal pages={pages} onClose={() => setIsGraphViewOpen(false)} onNodeClick={(pageId) => { loadPage(pageId); setIsGraphViewOpen(false); }} />}
    </div>
  );
}

export default MainPage;