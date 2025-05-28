// src/QuestionEditorModal.jsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './QuestionEditorModal.css'; // Criaremos este CSS

const QuestionEditorModal = ({ isOpen, onClose, onSave, questionToEdit, currentPageId }) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('single-choice'); // 'single-choice' ou 'multiple-choice'
  const [options, setOptions] = useState([{ id: uuidv4(), text: '' }]); // Opções de resposta

  useEffect(() => {
    if (questionToEdit) {
      setQuestionText(questionToEdit.text || '');
      setQuestionType(questionToEdit.type || 'single-choice');
      setOptions(questionToEdit.options && questionToEdit.options.length > 0 ? 
                 questionToEdit.options.map(opt => ({...opt, id: opt.id || uuidv4()})) : 
                 [{ id: uuidv4(), text: '' }]);
    } else {
      // Reset para nova questão
      setQuestionText('');
      setQuestionType('single-choice');
      setOptions([{ id: uuidv4(), text: '' }]);
    }
  }, [questionToEdit, isOpen]); // Resetar quando o modal abrir com ou sem questão para editar

  if (!isOpen) {
    return null;
  }

  const handleAddOption = () => {
    setOptions([...options, { id: uuidv4(), text: '' }]);
  };

  const handleRemoveOption = (optionId) => {
    if (options.length <= 1) {
        alert("Uma questão deve ter pelo menos uma opção.");
        return;
    }
    setOptions(options.filter(opt => opt.id !== optionId));
  };

  const handleOptionTextChange = (optionId, newText) => {
    setOptions(options.map(opt => (opt.id === optionId ? { ...opt, text: newText } : opt)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert("O texto da questão não pode estar vazio.");
      return;
    }
    if (options.some(opt => !opt.text.trim())) {
      alert("Todas as opções devem ter texto.");
      return;
    }

    const questionData = {
      id: questionToEdit ? questionToEdit.id : null, // Mantém ID se estiver editando
      pageId: questionToEdit ? questionToEdit.pageId : currentPageId, // Mantém pageId se estiver editando
      text: questionText,
      type: questionType,
      options: options.map(opt => ({ id: opt.id, text: opt.text.trim() })), // Salva opções com texto trimado
    };
    onSave(questionData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{questionToEdit ? 'Editar Questão' : 'Adicionar Nova Questão'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="questionText">Texto da Questão:</label>
            <textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Questão:</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="questionType"
                  value="single-choice"
                  checked={questionType === 'single-choice'}
                  onChange={(e) => setQuestionType(e.target.value)}
                />
                Escolha Única
              </label>
              <label style={{ marginLeft: '20px' }}>
                <input
                  type="radio"
                  name="questionType"
                  value="multiple-choice"
                  checked={questionType === 'multiple-choice'}
                  onChange={(e) => setQuestionType(e.target.value)}
                />
                Múltipla Escolha
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Opções de Resposta:</label>
            {options.map((option, index) => (
              <div key={option.id} className="option-input-group">
                <input
                  type="text"
                  placeholder={`Opção ${index + 1}`}
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  required
                />
                {options.length > 1 && ( // Só mostra o botão de remover se houver mais de uma opção
                  <button type="button" onClick={() => handleRemoveOption(option.id)} className="remove-option-btn">
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddOption} className="add-option-btn">
              + Adicionar Opção
            </button>
          </div>

          <div className="modal-actions">
            <button type="submit" className="save-btn">Salvar Questão</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditorModal;