import { UiState } from '../components/RunControls';
import { ChallengeCheckResult } from '../challenge/challenge';
import { CompilationResult } from '../dsl';

export type { UiState };

export interface AppState {
  uiState: UiState;
  code: string;
  compilation: CompilationResult | null;
  activeStep: number | null;
  checkResult: ChallengeCheckResult | null;
}

export type AppAction =
  | { type: 'TYPE_CODE'; payload: string }
  | { type: 'COMPILE_RESULT'; payload: CompilationResult }
  | { type: 'START_PLAYING' }
  | { type: 'STEP_CHANGED'; payload: number }
  | { type: 'FINISH_PLAYING'; payload: ChallengeCheckResult }
  | { type: 'STOP_PLAYING' }
  | { type: 'CLEAR_CODE' };

export const initialState: AppState = {
  uiState: 'initial',
  code: '',
  compilation: null,
  activeStep: null,
  checkResult: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TYPE_CODE': {
      const newCode = action.payload;
      // Código vazio retorna imediatamente ao estado 'initial'
      if (newCode.trim() === '') {
        return {
          ...state,
          code: newCode,
          uiState: 'initial',
          compilation: null,
          activeStep: null,
          checkResult: null,
        };
      }
      // Qualquer alteração enquanto o usuário digita transita para 'editing'
      return {
        ...state,
        code: newCode,
        uiState: 'editing',
        activeStep: null,
      };
    }

    case 'COMPILE_RESULT': {
      // Se o código foi limpo no meio tempo, mantém initial
      if (state.code.trim() === '') {
        return {
          ...state,
          uiState: 'initial',
          compilation: null,
          activeStep: null,
          checkResult: null,
        };
      }

      const comp = action.payload;
      if (comp.errors.length > 0) {
        return {
          ...state,
          uiState: 'error',
          compilation: comp,
          activeStep: null,
          checkResult: null,
        };
      }

      // Código válido sem erros e com eventos rítmicos gerados
      if (comp.events.length > 0) {
        return {
          ...state,
          uiState: 'valid',
          compilation: comp,
          activeStep: null,
        };
      }

      // Código sem erros mas sem batidas/passos executáveis (ex: apenas comentários ou linhas vazias)
      return {
        ...state,
        uiState: 'initial',
        compilation: comp,
        activeStep: null,
      };
    }

    case 'START_PLAYING':
      return {
        ...state,
        uiState: 'playing',
        activeStep: 0,
      };

    case 'STEP_CHANGED':
      return {
        ...state,
        activeStep: action.payload,
      };

    case 'FINISH_PLAYING': {
      const res = action.payload;
      return {
        ...state,
        uiState: res.success ? 'completed' : 'valid',
        activeStep: null,
        checkResult: res,
      };
    }

    case 'STOP_PLAYING':
      return {
        ...state,
        uiState: 'valid',
        activeStep: null,
      };

    case 'CLEAR_CODE':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}
