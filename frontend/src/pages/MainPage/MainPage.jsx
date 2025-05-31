// frontend/src/pages/MainPage/MainPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import 'reactflow/dist/style.css';

import './MainPage.css';
import GraphViewModal from './GraphViewModal';
import QuestionEditorModal from './QuestionEditorModal';

const API_URL = 'http://127.0.0.1:8000'; // URL do backend

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
const DESIGNATED_START_PAGE_ID_STORAGE_KEY = 'minhaHistoriaInterativa_designatedStartPageId';

function MainPage() {
  const location = useLocation(); 
  const navigate = useNavigate(); 

  const [pages, setPages] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(null);
  const [designatedStartPageId, setDesignatedStartPageId] = useState(null);
  
  const [editingStoryDbId, setEditingStoryDbId] = useState(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false); 

  const [markdownInput, setMarkdownInput] = useState('');
  const [currentPageTitleInput, setCurrentPageTitleInput] = useState('');
  const [currentPageAccentColor, setCurrentPageAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  
  const [isGraphViewOpen, setIsGraphViewOpen] = useState(false);
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [isEditMode, setIsEditMode] = useState(true);

  const createNewPageObject = useCallback((title, markdown, accentColor, id = null, questions = []) => {
    return {
      id: id || generatePageId(title),
      title: title,
      markdown: markdown,
      accentColor: accentColor || DEFAULT_ACCENT_COLOR,
      questions: Array.isArray(questions) ? questions : [],
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

  const resetEditorToNewStory = useCallback(() => {
    const initialPageId = generatePageId(INITIAL_PAGE_TITLE);
    const initialPage = createNewPageObject(INITIAL_PAGE_TITLE, `# ${INITIAL_PAGE_TITLE}\n\nComece sua nova história aqui.`, DEFAULT_ACCENT_COLOR, initialPageId);
    setPages([initialPage]);
    setCurrentPageId(initialPage.id);
    setDesignatedStartPageId(initialPage.id);
    loadPageDataToInputs(initialPage);
    setEditingStoryDbId(null); 
    setTestAnswers({});
    localStorage.removeItem(PAGES_STORAGE_KEY);
    localStorage.removeItem(CURRENT_PAGE_ID_STORAGE_KEY);
    localStorage.removeItem(DESIGNATED_START_PAGE_ID_STORAGE_KEY);
  }, [createNewPageObject, loadPageDataToInputs]);

  // --- DEFINIÇÃO DA FUNÇÃO loadPage ---
  const loadPage = useCallback((pageId) => {
    const pageToLoad = pages.find(p => p.id === pageId);
    if (pageToLoad) {
      setCurrentPageId(pageToLoad.id);
      loadPageDataToInputs(pageToLoad);
      setTestAnswers({}); 
    } else {
      console.warn(`Tentativa de carregar página com ID '${pageId}' não encontrada.`);
    }
  }, [pages, loadPageDataToInputs]);
  // --- FIM DA DEFINIÇÃO DE loadPage ---

  useEffect(() => {
    const storyToLoadIdFromState = location.state?.storyToLoadId;

    const loadStoryFromBackend = async (storyDbId) => {
      setIsLoadingStory(true);
      setEditingStoryDbId(storyDbId); 
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert("Autenticação necessária para carregar a história.");
        setIsLoadingStory(false);
        navigate('/login'); 
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/stories/${storyDbId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Falha ao buscar história ID ${storyDbId} para edição.`);
        }
        const storyDataFromApi = await response.json();
        
        if (storyDataFromApi && storyDataFromApi.pages && storyDataFromApi.pages.length > 0) {
          const loadedPages = storyDataFromApi.pages.map(p => createNewPageObject(
            p.title, p.markdown, p.accentColor, p.id, p.questions 
          ));
          setPages(loadedPages.sort((a, b) => a.title.localeCompare(b.title)));
          
          let initialPageToLoadInEditor = null;
          if (storyDataFromApi.start_page_client_id) {
            initialPageToLoadInEditor = loadedPages.find(p => p.id === storyDataFromApi.start_page_client_id);
          }
          if (!initialPageToLoadInEditor && loadedPages.length > 0) { // Corrigido para checar loadedPages.length
            initialPageToLoadInEditor = loadedPages[0]; 
          }

          if (initialPageToLoadInEditor) {
            setCurrentPageId(initialPageToLoadInEditor.id);
            loadPageDataToInputs(initialPageToLoadInEditor);
          } else { // Se ainda não houver página para carregar (história vazia vinda do backend, improvável)
            resetEditorToNewStory(); // Reseta para um estado inicial seguro
          }
          setDesignatedStartPageId(storyDataFromApi.start_page_client_id || (initialPageToLoadInEditor ? initialPageToLoadInEditor.id : null));
          
          navigate(location.pathname, { replace: true, state: {} }); 
        } else {
          alert("História carregada do backend não contém páginas. Resetando para uma nova história.");
          resetEditorToNewStory();
        }
      } catch (err) {
        console.error("Erro ao carregar história do backend:", err);
        alert(`Erro ao carregar história para edição: ${err.message}. Iniciando uma nova história.`);
        resetEditorToNewStory();
      } finally {
        setIsLoadingStory(false);
      }
    };

    if (storyToLoadIdFromState) {
      console.log(`Carregando história ID ${storyToLoadIdFromState} do backend para edição...`);
      loadStoryFromBackend(storyToLoadIdFromState);
    } else { 
      const savedPages = localStorage.getItem(PAGES_STORAGE_KEY);
      const savedCurrentPageId = localStorage.getItem(CURRENT_PAGE_ID_STORAGE_KEY);
      const savedDesignatedStartPageId = localStorage.getItem(DESIGNATED_START_PAGE_ID_STORAGE_KEY);

      if (savedPages) {
        try {
          const parsedPages = JSON.parse(savedPages);
          if (Array.isArray(parsedPages) && parsedPages.length > 0 && parsedPages.every(p => p.id && typeof p.title !== 'undefined')) {
            setPages(parsedPages.map(p => ({ ...p, questions: Array.isArray(p.questions) ? p.questions : [] })));
            const pageToLoad = parsedPages.find(p => p.id === savedCurrentPageId) || parsedPages[0];
            if (pageToLoad) {
              setCurrentPageId(pageToLoad.id);
              loadPageDataToInputs(pageToLoad);
            }
            setDesignatedStartPageId(savedDesignatedStartPageId || (parsedPages[0]?.id || null));
          } else {
            resetEditorToNewStory();
          }
        } catch (error) {
          console.error("Erro ao carregar páginas do LocalStorage no useEffect inicial:", error);
          resetEditorToNewStory();
        }
      } else {
        resetEditorToNewStory();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.storyToLoadId]); // Apenas re-executa se storyToLoadId mudar

  useEffect(() => { 
    if (pages.length > 0 && !isLoadingStory) {
        localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(pages));
    } else if (pages.length === 0 && !isLoadingStory) { // Limpa se não houver páginas e não estiver carregando
        localStorage.removeItem(PAGES_STORAGE_KEY);
    }
  }, [pages, isLoadingStory]);

  useEffect(() => { 
    if (currentPageId && !isLoadingStory) {
        localStorage.setItem(CURRENT_PAGE_ID_STORAGE_KEY, currentPageId);
    } else if (!currentPageId && !isLoadingStory) {
        localStorage.removeItem(CURRENT_PAGE_ID_STORAGE_KEY);
    }
  }, [currentPageId, isLoadingStory]);

  useEffect(() => { 
    if (designatedStartPageId && !isLoadingStory) {
        localStorage.setItem(DESIGNATED_START_PAGE_ID_STORAGE_KEY, designatedStartPageId);
    } else if (!designatedStartPageId && !isLoadingStory) {
        localStorage.removeItem(DESIGNATED_START_PAGE_ID_STORAGE_KEY);
    }
  }, [designatedStartPageId, isLoadingStory]);

  const handleProcessMarkdown = () => { 
    const titleTrimmed = currentPageTitleInput.trim();
    if (!titleTrimmed) { alert('Título da página é obrigatório.'); return; }
    const isEffectivelyNewPage = !currentPageId || !pages.some(p => p.id === currentPageId);
    let newPageId = generatePageId(titleTrimmed);
    const oldPageId = currentPageId;

    if (pages.some(p => p.id === newPageId && p.id !== oldPageId)) {
      alert(`Página com título "${titleTrimmed}" já existe.`);
      if (!isEffectivelyNewPage && oldPageId) {
        const op = pages.find(p => p.id === oldPageId);
        if (op) setCurrentPageTitleInput(op.title);
      }
      return;
    }
    
    let updatedPages = [...pages];
    let targetPageData;
    const currentQuestions = isEffectivelyNewPage ? [] : (pages.find(p => p.id === oldPageId)?.questions || []);

    if (isEffectivelyNewPage) {
      targetPageData = createNewPageObject(titleTrimmed, markdownInput, currentPageAccentColor, newPageId, currentQuestions);
      updatedPages.push(targetPageData);
      if (updatedPages.length === 1 || !designatedStartPageId) {
        setDesignatedStartPageId(newPageId);
      }
    } else {
      const pageIndex = pages.findIndex(p => p.id === oldPageId);
      if (pageIndex !== -1) {
        const originalPageTitle = pages[pageIndex].title;
        targetPageData = { ...pages[pageIndex], id: newPageId, title: titleTrimmed, markdown: markdownInput, accentColor: currentPageAccentColor, questions: currentQuestions };
        updatedPages[pageIndex] = targetPageData;
        if (newPageId !== oldPageId) {
          if (designatedStartPageId === oldPageId) setDesignatedStartPageId(newPageId);
          updatedPages = updatedPages.map(p => ({ ...p, markdown: p.markdown.replace(new RegExp(`\\[\\[${originalPageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g'), `[[${titleTrimmed}]]`).replace(new RegExp(`\\[\\[${oldPageId}\\]\\]`, 'g'), `[[${newPageId}]]`) }));
        }
      } else { 
        targetPageData = createNewPageObject(titleTrimmed, markdownInput, currentPageAccentColor, newPageId, []);
        updatedPages.push(targetPageData);
        if (updatedPages.length === 1 || !designatedStartPageId) {
            setDesignatedStartPageId(newPageId);
        }
       }
    }
    
    const linkRegex = /\[\[(.*?)\]\]/g; let match; const newPagesFromLinks = [];
    const contentToScan = targetPageData.markdown;
    while ((match = linkRegex.exec(contentToScan)) !== null) {
      const linkedPageTitle = match[1].trim(); if (!linkedPageTitle) continue;
      const linkedPageId = generatePageId(linkedPageTitle);
      if (!updatedPages.some(p => p.id === linkedPageId) && !newPagesFromLinks.some(p => p.id === linkedPageId)) {
        newPagesFromLinks.push(createNewPageObject(linkedPageTitle, `# ${linkedPageTitle}\n\nEsta página foi criada automaticamente.`, DEFAULT_ACCENT_COLOR, linkedPageId));
      }
    }
    if (newPagesFromLinks.length > 0) updatedPages = [...updatedPages, ...newPagesFromLinks];
    
    const finalUniquePages = Array.from(new Map(updatedPages.map(p => [p.id, p])).values()).sort((a, b) => a.title.localeCompare(b.title));
    setPages(finalUniquePages);
    setCurrentPageId(newPageId);
    if (!designatedStartPageId && finalUniquePages.length > 0) {
        const firstSorted = finalUniquePages.find(p => p.id === newPageId) || finalUniquePages[0];
        if (firstSorted) { // Adicionado null check para firstSorted
            setDesignatedStartPageId(firstSorted.id);
        }
    }
  };

  const handleInternalLinkClick = useCallback((linkedPageTitle) => { 
    const linkedPageId = generatePageId(linkedPageTitle);
    const existingPage = pages.find(p => p.id === linkedPageId);
    if (existingPage) { loadPage(linkedPageId); } // loadPage é usado aqui
    else {
      if (!isEditMode) { alert(`A página "${linkedPageTitle}" não existe...`); return; }
      if (window.confirm(`Página "${linkedPageTitle}" não existe. Criar?`)) {
        const newPage = createNewPageObject(linkedPageTitle, `# ${linkedPageTitle}\n\n...`, DEFAULT_ACCENT_COLOR, linkedPageId);
        const updatedPages = [...pages, newPage].sort((a, b) => a.title.localeCompare(b.title));
        setPages(updatedPages);
        if (updatedPages.length === 1 || !designatedStartPageId) setDesignatedStartPageId(newPage.id);
        setCurrentPageId(newPage.id); loadPageDataToInputs(newPage);
      }
    }
  }, [pages, loadPage, createNewPageObject, loadPageDataToInputs, isEditMode, designatedStartPageId]); // loadPage é dependência
  
  const handleDeletePage = useCallback((pageIdToDelete) => { 
    const pageToDelete = pages.find(p=>p.id === pageIdToDelete);
    if (!pageToDelete) return;
    if (window.confirm(`Apagar página "${pageToDelete.title}"?`)) {
      let newPagesArray = pages.filter(page => page.id !== pageIdToDelete);
      newPagesArray = newPagesArray.map(p => ({ ...p, markdown: p.markdown.replace(new RegExp(`\\[\\[${pageToDelete.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g'), `[[${pageToDelete.title} (apagada)]]`) }));
      let newDesignatedStartPageId = designatedStartPageId;
      if (designatedStartPageId === pageIdToDelete) {
        newDesignatedStartPageId = newPagesArray.length > 0 ? newPagesArray.sort((a,b) => a.title.localeCompare(b.title))[0].id : null;
      }
      if (newPagesArray.length === 0) {
        const initialPageId = generatePageId(INITIAL_PAGE_TITLE);
        const initialPageRec = createNewPageObject(INITIAL_PAGE_TITLE, `# ${INITIAL_PAGE_TITLE}\n\n...`, DEFAULT_ACCENT_COLOR, initialPageId);
        setPages([initialPageRec]); setCurrentPageId(initialPageRec.id); loadPageDataToInputs(initialPageRec);
        newDesignatedStartPageId = initialPageRec.id;
      } else {
        setPages(newPagesArray.sort((a, b) => a.title.localeCompare(b.title)));
        if (currentPageId === pageIdToDelete) {
          const firstPage = newPagesArray.length > 0 ? newPagesArray[0] : null; // Garante que firstPage não é undefined
          if (firstPage) {
            setCurrentPageId(firstPage.id); loadPageDataToInputs(firstPage);
          } else { // Se não houver mais páginas, reseta
            resetEditorToNewStory(); // Ou alguma outra lógica de estado vazio
            return; // Sai da função pois não há mais o que fazer
          }
        }
      }
      setDesignatedStartPageId(newDesignatedStartPageId);
      setTestAnswers({});
    }
  }, [pages, currentPageId, createNewPageObject, loadPageDataToInputs, designatedStartPageId, resetEditorToNewStory]); // Adicionado resetEditorToNewStory
  
  const currentPageObject = pages.find(p => p.id === currentPageId);
  const externalLinkRenderer = new marked.Renderer();
  externalLinkRenderer.link = (href, title, text) => `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  const renderMarkdown = (mdText) => { 
    if (typeof mdText !== 'string') return { __html: '' }; let html = '';
    try {
      html = marked.parse(mdText, { renderer: externalLinkRenderer, gfm: true, breaks: true });
      html = html.replace(/\[\[(.*?)\]\]/g, (match, pageTitle) => {
        const titleTrimmed = pageTitle.trim(); if (!titleTrimmed) return match; 
        const linkColor = currentPageObject?.accentColor || DEFAULT_ACCENT_COLOR;
        const escapedTitle = titleTrimmed.replace(/"/g, '&quot;');
        return `<a href="#" class="internal-link" data-link-title="${escapedTitle}" style="color: ${linkColor}; text-decoration: underline; font-weight: bold;">${titleTrimmed}</a>`;
      });
    } catch (e) { console.error("Erro ao renderizar Markdown:", e); html="<p>Erro ao renderizar conteúdo.</p>"; } return { __html: html };
  };

  useEffect(() => { 
    const contentArea = document.getElementById('page-content-display');
    if (contentArea) {
      const handleClick = (event) => { let target = event.target;
        while(target && target !== contentArea) {
            if (target.classList && target.classList.contains('internal-link')) {
                event.preventDefault(); const linkedPageTitle = target.dataset.linkTitle;
                if (linkedPageTitle) handleInternalLinkClick(linkedPageTitle); return;
            } target = target.parentNode;
        }
      };
      contentArea.addEventListener('click', handleClick);
      return () => contentArea.removeEventListener('click', handleClick);
    }
  }, [handleInternalLinkClick, currentPageObject]);

  const handleOpenQuestionEditor = useCallback((q=null) => { setEditingQuestion(q); setIsQuestionEditorOpen(true); }, []);
  const handleCloseQuestionEditor = useCallback(() => { setEditingQuestion(null); setIsQuestionEditorOpen(false); }, []);
  const handleSaveQuestion = useCallback((questionData) => { 
    if (!currentPageId) { alert("Selecione uma página primeiro."); return; }
    setPages(prevPages => prevPages.map(page => {
        if (page.id === currentPageId) {
          const existingQuestions = Array.isArray(page.questions) ? page.questions : [];
          let updatedQuestions;
          if (questionData.id && existingQuestions.some(q => q.id === questionData.id)) {
            updatedQuestions = existingQuestions.map(q => q.id === questionData.id ? { ...q, ...questionData, options: (questionData.options || []).map(opt => ({...opt, id: opt.id || uuidv4()})) } : q );
          } else {
            const newQuestion = { ...questionData, id: questionData.id || uuidv4(), pageId: page.id, options: (questionData.options || []).map(opt => ({ ...opt, id: opt.id || uuidv4() })) };
            updatedQuestions = [...existingQuestions, newQuestion];
          }
          return { ...page, questions: updatedQuestions };
        }
        return page;
      }));
    handleCloseQuestionEditor();
  }, [currentPageId, handleCloseQuestionEditor]);

  const handleDeleteQuestion = useCallback((qid) => { 
    if(!currentPageId||!qid||!window.confirm("Tem certeza que deseja apagar esta questão?")) return;
    setPages(prevPages => prevPages.map(p => p.id === currentPageId ? {...p, questions:(p.questions||[]).filter(q=>q.id!==qid)} : p));
  }, [currentPageId]);

  const handleTestAnswerChange = useCallback((qid,oid,qtype,checked) => { 
    setTestAnswers(prevAnswers => { const newAnswers = {...prevAnswers}; if(qtype==='single-choice') newAnswers[qid]=oid; else {const currentSel = prevAnswers[qid]||[]; if(checked){if(!currentSel.includes(oid)) newAnswers[qid]=[...currentSel,oid];} else newAnswers[qid]=currentSel.filter(id=>id!==oid);} return newAnswers; });
  }, []);

  const handleResetHistory = useCallback(() => { 
    if (window.confirm("Tem certeza que deseja APAGAR TODA a história salva localmente e começar do zero (incluindo a história carregada para edição, se houver)?")) {
      resetEditorToNewStory();
      setTestAnswers({}); setIsGraphViewOpen(false); setIsQuestionEditorOpen(false); setEditingQuestion(null);
    }
  }, [resetEditorToNewStory]);

  const handleSetDesignatedStartPage = useCallback((pageId) => { 
    if (pages.some(p => p.id === pageId)) setDesignatedStartPageId(pageId);
    else alert("Página não encontrada.");
  }, [pages]);

  const handleSaveStoryToBackend = async () => {
    if (pages.length === 0) {
      alert("Não há páginas para salvar.");
      return;
    }
    
    let currentDesignatedStartPageId = designatedStartPageId;
    if (!currentDesignatedStartPageId && pages.length > 0) {
        const firstPageSorted = [...pages].sort((a,b) => a.title.localeCompare(b.title))[0];
        if (firstPageSorted) {
            currentDesignatedStartPageId = firstPageSorted.id;
            console.warn(`Nenhuma página inicial explicitamente definida. Usando "${firstPageSorted.title}" como inicial para este salvamento.`);
        } else {
            alert("Não foi possível determinar uma página inicial. Salve as páginas primeiro.");
            return;
        }
    }

    const storyTitleForBackend = editingStoryDbId 
        ? pages.find(p => p.id === currentPageId)?.title || pages.find(p => p.id === currentDesignatedStartPageId)?.title || (pages[0] ? pages[0].title : "História Editada") // Adicionado null check para pages[0]
        : (currentPageObject?.title || (pages[0] ? pages[0].title : "Minha História Interativa")); // Adicionado null check para pages[0]
    
    const storyDataPayload = {
      story_title: storyTitleForBackend,
      pages: pages.map(p => ({
        id: p.id, title: p.title, markdown: p.markdown,
        accentColor: p.accentColor || DEFAULT_ACCENT_COLOR,
        questions: Array.isArray(p.questions) ? p.questions.map(q => ({
            id: q.id, text: q.text, type: q.type,
            options: Array.isArray(q.options) ? q.options.map(opt => ({ id: opt.id, text: opt.text })) : []
        })) : []
      })),
      start_page_client_id: currentDesignatedStartPageId 
    };

    const token = localStorage.getItem('accessToken');
    if (!token) { alert("Não autenticado. Faça login."); return; }

    try {
      let response;
      let apiUrl;
      let method;

      if (editingStoryDbId) { 
        method = 'PUT';
        apiUrl = `${API_URL}/api/stories/${editingStoryDbId}`;
        console.log(`Atualizando história ID ${editingStoryDbId} em ${apiUrl}`);
      } else { 
        method = 'POST';
        apiUrl = `${API_URL}/api/stories`;
        console.log(`Criando nova história em ${apiUrl}`);
      }

      response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(storyDataPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erro HTTP: ${response.status}` }));
        console.error(`Erro ao ${editingStoryDbId ? 'atualizar' : 'salvar nova'} história:`, response.status, errorData);
        alert(`Erro ao ${editingStoryDbId ? 'atualizar' : 'salvar nova'} história: ${response.status}\n${errorData.detail || 'Detalhe do erro não disponível.'}`); 
        return;
      }

      const savedOrUpdatedStoryResponse = await response.json();
      console.log(`História ${editingStoryDbId ? 'atualizada' : 'salva'} com sucesso:`, savedOrUpdatedStoryResponse);
      
      if (!editingStoryDbId && savedOrUpdatedStoryResponse.story_id) {
        setEditingStoryDbId(savedOrUpdatedStoryResponse.story_id); 
        alert(`História "${savedOrUpdatedStoryResponse.received_story_title}" criada com ID ${savedOrUpdatedStoryResponse.story_id}! Agora você está editando esta história.`);
      } else if (editingStoryDbId) {
        alert(`História "${savedOrUpdatedStoryResponse.title}" atualizada com sucesso!`);
      } else {
         alert(`História "${savedOrUpdatedStoryResponse.received_story_title}" processada!`);
      }

    } catch (error) {
      console.error(`Erro de conexão ao ${editingStoryDbId ? 'atualizar' : 'salvar nova'} história:`, error);
      alert(`Erro de conexão ao ${editingStoryDbId ? 'atualizar' : 'salvar nova'} história.`);
    }
  };
  
  const pageSpecificStyles = currentPageObject ? { '--page-accent-color': currentPageObject.accentColor || DEFAULT_ACCENT_COLOR, } : { '--page-accent-color': DEFAULT_ACCENT_COLOR, };

  const newPageButtonText = "+ Nova História (Limpa Editor)"; // Ajustado o texto
  const saveButtonText = editingStoryDbId ? "Atualizar História no Servidor" : "Salvar Nova História no Servidor";

  if (isLoadingStory) {
    return <div className="app-container" style={{padding: "2rem", textAlign: "center"}}>Carregando história para edição...</div>;
  }

  return (
    <div className="app-container" style={pageSpecificStyles}>
      <aside className="sidebar">
        <h2>
            Páginas 
            {pages.length > 0 && designatedStartPageId && (
                 <span style={{fontSize: '0.6em', display: 'block', color: '#666'}}>
                    Inicial: {pages.find(p=>p.id === designatedStartPageId)?.title || 'N/A'}
                 </span>
            )}
        </h2>
        <button onClick={() => setIsEditMode(prev => !prev)} className="sidebar-action-button toggle-mode-button">
          {isEditMode ? "Modo Exibição" : "Modo Edição"}
        </button>
        {isEditMode && (
          <>
            <button 
              className="new-page-button sidebar-action-button" 
              onClick={() => {
                if (editingStoryDbId || pages.length > 0) {
                    if (window.confirm("Isso limpará o editor atual e começará uma nova história do zero (as alterações não salvas na história atual serão perdidas). Deseja continuar?")) {
                        resetEditorToNewStory();
                    }
                } else {
                    resetEditorToNewStory(); 
                }
            }}>
              {newPageButtonText}
            </button>
            {/* O botão Resetar História (Local) pode ser confuso com Nova História. Removido por ora para simplificar.
                Se quiser manter, certifique-se que a lógica dele também chame resetEditorToNewStory ou similar.
            <button onClick={handleResetHistory} className="reset-history-button sidebar-action-button">
              Resetar Edição Atual (Local)
            </button> 
            */}
            <button 
              onClick={handleSaveStoryToBackend} 
              className="sidebar-action-button save-to-backend-button"
              disabled={pages.length === 0}
              title={saveButtonText}
            >
              {saveButtonText}
            </button>
          </>
        )}
        <button onClick={() => setIsGraphViewOpen(true)} className="graph-view-button sidebar-action-button" disabled={pages.length === 0}>Visualizar Conexões</button>
        
        <ul>
          {pages.map(page => (
            <li key={page.id} 
                className={`${page.id === currentPageId ? 'active' : ''} ${page.id === designatedStartPageId ? 'designated-start-page' : ''}`}
                style={page.id === currentPageId ? { backgroundColor: page.accentColor || DEFAULT_ACCENT_COLOR, color: 'white', boxShadow: `inset 4px 0 0 color-mix(in srgb, ${page.accentColor || DEFAULT_ACCENT_COLOR} 70%, black)` } : {}}
                onClick={() => loadPage(page.id)}
                title={`Carregar: ${page.title}${page.id === designatedStartPageId ? ' (Página Inicial da História)' : ''}`}
            >
              <div className="page-list-item-content">
                <span className="page-title-sidebar">{page.title}</span>
                {isEditMode && page.id !== designatedStartPageId && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSetDesignatedStartPage(page.id); }} 
                    className="set-start-page-button" 
                    title="Marcar como página inicial da história"
                  >⭐</button>
                )}
                {isEditMode && page.id === designatedStartPageId && (
                    <span className="start-page-indicator" title="Esta é a página inicial da história">⭐</span>
                )}
              </div>
              {isEditMode && pages.length > 0 && 
                (pages.length > 1 || (pages.length === 1 && page.id !== designatedStartPageId)) && // Permite apagar a única página se não for a inicial designada
                <button onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }} className="delete-page-button" title={`Apagar "${page.title}"`}>X</button>
              }
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
         {isEditMode && (
          <div className="editor-area">
            <input type="text" className="title-input" placeholder="Título da Página" value={currentPageTitleInput} onChange={(e) => setCurrentPageTitleInput(e.target.value)} maxLength={255}/>
            <textarea className="markdown-input" value={markdownInput} onChange={(e) => setMarkdownInput(e.target.value)} placeholder="Digite seu Markdown aqui... Use [[Nome da Outra Página]] para criar links." maxLength={65535}/>
            <div className="color-picker-container">
              <label htmlFor="pageColorPicker">Cor de Destaque:</label>
              <input type="color" id="pageColorPicker" value={currentPageAccentColor} onChange={(e) => setCurrentPageAccentColor(e.target.value)} />
            </div>
            <button onClick={handleProcessMarkdown} className="process-button" disabled={!currentPageTitleInput.trim()}>
              {(!currentPageId || !pages.some(p => p.id === currentPageId)) ? "Criar Nova Página Local" : "Salvar Alterações na Página Local"}
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
                    <div key={q.id} className="question-display-item"><h4>{q.text}</h4>
                      <ul>{q.options.map(opt => { let isChecked = false;
                          if (q.type === 'single-choice') isChecked = testAnswers[q.id] === opt.id;
                          else isChecked = (testAnswers[q.id] || []).includes(opt.id);
                          return (<li key={opt.id}><input type={q.type === 'single-choice' ? 'radio' : 'checkbox'} name={`question_test_${q.id}`} id={`test_opt_${opt.id}`} value={opt.id} checked={isChecked} onChange={(e) => handleTestAnswerChange(q.id, opt.id, q.type, e.target.checked)} /><label htmlFor={`test_opt_${opt.id}`}>{opt.text}</label></li>);
                        })}</ul></div>))}
                </div>
              )}
            </>
          ) : ( (currentPageId === null && currentPageTitleInput && isEditMode && !editingStoryDbId) ? 
                  <p>Preencha os dados da nova página e clique em "Criar Página Local" para adicionar conteúdo e questões.</p> :
                  (editingStoryDbId && isLoadingStory) ? <p>Carregando história para edição...</p> :
                  <p>Selecione uma página para visualizar ou clique em "+ Nova História" (no modo edição) para começar.</p>
          )}
        </div>
      </main>

      {isEditMode && isQuestionEditorOpen && <QuestionEditorModal isOpen={isQuestionEditorOpen} onClose={handleCloseQuestionEditor} onSave={handleSaveQuestion} questionToEdit={editingQuestion} currentPageId={currentPageId} />}
      {isGraphViewOpen && <GraphViewModal pages={pages} onClose={() => setIsGraphViewOpen(false)} onNodeClick={(pageId) => { loadPage(pageId); setIsGraphViewOpen(false); }} />}
    </div>
  );
}

export default MainPage;