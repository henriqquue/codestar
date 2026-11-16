import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../App';
import { MVP_CHALLENGE } from '../../challenge/challenge';

jest.mock('../../audio/engine', () => {
  return {
    AudioEngine: jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
      isPlaying: jest.fn().mockReturnValue(false),
      dispose: jest.fn(),
    })),
  };
});

describe('Componente App - Fluxo de Interface e Estados', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('exibe o estado error e desabilita o botão Executar ao digitar PLAY e aguardar o debounce de 400 ms', () => {
    // Preparar
    render(<App />);
    const editor = screen.getByLabelText(/código dsl/i);
    const runButton = screen.getByRole('button', { name: /executar ritmo/i });

    // Agir: digita "PLAY" (sem selecionar instrumento, causando erro semântico)
    fireEvent.change(editor, { target: { value: 'PLAY' } });

    // Estado antes do timer deve ser editing
    expect(screen.getByText(/estado:/i).parentElement).toHaveTextContent('editing');

    // Avança o tempo do debounce
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Conferir
    expect(screen.getByText(/estado:/i).parentElement).toHaveTextContent('error');
    expect(runButton).toBeDisabled();
  });

  it('exibe o estado valid e habilita o botão Executar ao digitar a solução de referência e aguardar 400 ms', () => {
    // Preparar
    render(<App />);
    const editor = screen.getByLabelText(/código dsl/i);
    const runButton = screen.getByRole('button', { name: /executar ritmo/i });

    // Agir: insere o código do gabarito oficial do MVP
    fireEvent.change(editor, { target: { value: MVP_CHALLENGE.referenceSolution } });

    // Avança o debounce
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Conferir
    expect(screen.getByText(/estado:/i).parentElement).toHaveTextContent('valid');
    expect(runButton).toBeEnabled();
  });

  it('atualiza o indicador "Estado:" no rodapé refletindo cada transição da máquina de estados', () => {
    // Preparar
    render(<App />);
    const stateBadge = screen.getByText(/estado:/i).parentElement;
    const editor = screen.getByLabelText(/código dsl/i);

    // Conferir estado inicial
    expect(stateBadge).toHaveTextContent('initial');

    // Agir: inicia digitação
    fireEvent.change(editor, { target: { value: 'INSTRUMENT kick' } });

    // Conferir estado de edição
    expect(stateBadge).toHaveTextContent('editing');

    // Agir: avança temporizador de compilação
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Apenas instrumento sem batidas volta a initial
    expect(stateBadge).toHaveTextContent('initial');

    // Agir: adiciona batida válida
    fireEvent.change(editor, { target: { value: 'INSTRUMENT kick\nPLAY' } });
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Conferir transição para valid
    expect(stateBadge).toHaveTextContent('valid');
  });

  it('permite alternar entre os desafios oficiais atualizando o painel de instruções e limpando o código', () => {
    // Preparar
    render(<App />);
    const editor = screen.getByLabelText(/código dsl/i);

    // Digita algo no desafio 1
    fireEvent.change(editor, { target: { value: 'INSTRUMENT kick\nPLAY' } });
    expect(editor).toHaveValue('INSTRUMENT kick\nPLAY');

    // Agir: clica no botão do Desafio 2 (Batida em laço) no seletor
    const challenge2Button = screen.getByRole('button', { name: /batida em laço/i });
    fireEvent.click(challenge2Button);

    // Conferir: editor limpo e painel exibe o novo desafio
    expect(editor).toHaveValue('');
    expect(
      screen.getByRole('heading', { level: 2, name: /batida em laço/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/padrão rítmico alvo/i)).toBeInTheDocument();
  });
});

