import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// ── Declarações de tipo locais para a Web Speech API ─────────────────────────
// Definidas localmente para não depender de `lib.dom.d.ts` ou de `@types`.

type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed';

interface ISpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => ISpeechRecognition;
type ExtendedWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class VoiceRecognitionService {
  private recognition: ISpeechRecognition | null = null;

  /** Verificado uma única vez na criação do serviço. */
  readonly isSupported: boolean =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  /**
   * Inicia a escuta e emite o transcript final consolidado como Observable<string>.
   *
   * Gerenciamento de concorrência: se já houver uma gravação em andamento,
   * ela é abortada antes de iniciar a nova (garantia de sessão única).
   *
   * O teardown do Observable (return () => {...}) é executado automaticamente
   * quando o subscriber cancela via takeUntilDestroyed / DestroyRef.
   */
  listen(): Observable<string> {
    return new Observable<string>((subscriber) => {
      if (!this.isSupported) {
        subscriber.error(
          'Reconhecimento de voz não suportado. Use Chrome ou Edge.',
        );
        return;
      }

      // Garante que apenas uma gravação ocorra por vez
      this.recognition?.abort();

      const w = window as ExtendedWindow;
      const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition)!;
      const recognition = new Ctor();
      this.recognition = recognition;

      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        subscriber.next(transcript);
        subscriber.complete();
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        // 'aborted' é disparado quando chamamos abort() intencionalmente — não é erro de usuário
        if (event.error === 'aborted') return;
        subscriber.error(this.mapError(event.error));
      };

      recognition.onend = () => {
        // Garante que o observable feche se a sessão terminar sem resultado
        if (!subscriber.closed) subscriber.complete();
      };

      try {
        recognition.start();
      } catch {
        subscriber.error('Não foi possível iniciar o reconhecimento de voz.');
      }

      // TEARDOWN: executado via unsubscribe / takeUntilDestroyed / DestroyRef
      return () => {
        recognition.abort();
        this.recognition = null;
      };
    });
  }

  /** Para a gravação atual imediatamente, se houver. */
  stop(): void {
    this.recognition?.abort();
    this.recognition = null;
  }

  private mapError(code: SpeechRecognitionErrorCode): string {
    const messages: Record<SpeechRecognitionErrorCode, string> = {
      'no-speech': 'Nenhuma fala detectada. Tente novamente.',
      'audio-capture': 'Microfone não encontrado ou inacessível.',
      'not-allowed':
        'Permissão de microfone negada. Verifique as configurações do navegador.',
      network: 'Erro de rede ao processar a voz.',
      'service-not-allowed': 'Reconhecimento de voz não permitido neste contexto.',
      aborted: '',
      'bad-grammar': 'Erro na gramática de reconhecimento.',
      'language-not-supported': 'Idioma não suportado.',
    };
    return messages[code] ?? 'Erro no reconhecimento de voz. Tente novamente.';
  }
}
