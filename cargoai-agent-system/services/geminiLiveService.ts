import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { LiveConfig } from "../types";

// Audio processing constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Tool definition for the model to report status updates
const negotiationTool: FunctionDeclaration = {
  name: "update_negotiation_state",
  description: `Call this function to report the status of the negotiation. 
  CRITICAL RULES:
  1. If the broker rejects your offer, set status to 'negotiating' (NOT 'rejected'). Pivot to value propositions (reliability, tracking) and make a counter-offer.
  2. Only set status to 'walk_away' if the price is below the floor AND the broker explicitly says they have no more room.
  3. Set status to 'agreed' if you accept a price above the floor.
  4. Set status to 'rejected' only if the call ends without a deal due to non-price reasons.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      price: {
        type: Type.NUMBER,
        description: "The current price on the table.",
      },
      status: {
        type: Type.STRING,
        enum: ["negotiating", "agreed", "rejected", "walk_away"],
        description: "The current status of the negotiation.",
      }
    },
    required: ["price", "status"],
  },
};

export class GeminiLiveService extends EventTarget {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private nextStartTime = 0;
  private sessionPromise: Promise<any> | null = null;
  private currentStream: MediaStream | null = null;
  private cleanupFunctions: (() => void)[] = [];

  constructor() {
    super(); // Initialize EventTarget
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async connect(config: LiveConfig, onTranscription: (text: string, isUser: boolean) => void) {
    await this.disconnect(); // Ensure clean slate

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
    
    // CRITICAL: Resume contexts to ensure they are active (browser autoplay policy)
    await this.inputAudioContext.resume();
    await this.outputAudioContext.resume();
    
    this.inputNode = this.inputAudioContext.createGain();
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Microphone access denied:", err);
      throw err;
    }

    // Emit started event
    this.dispatchEvent(new CustomEvent('negotiationStarted', { 
        detail: { timestamp: Date.now() } 
    }));

    this.sessionPromise = this.ai.live.connect({
      model: config.model,
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Connected");
          this.setupAudioInput();
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Tool Calls (Price Updates)
          if (message.toolCall) {
            const functionCalls = message.toolCall.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
                functionCalls.forEach(fc => {
                    if (fc.name === 'update_negotiation_state') {
                        const args = fc.args as any;
                        // Emit priceUpdate event
                        this.dispatchEvent(new CustomEvent('priceUpdate', {
                            detail: {
                                price: args.price,
                                status: args.status,
                                timestamp: Date.now()
                            }
                        }));

                        // Send tool response back to model
                        this.sessionPromise?.then(session => {
                            session.sendToolResponse({
                                functionResponses: [{
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: "ok" }
                                }]
                            });
                        });
                    }
                });
            }
          }

          // Handle Audio
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext && this.outputNode) {
            this.handleAudioOutput(base64Audio);
          }

          // Handle Transcription
          if (message.serverContent?.outputTranscription?.text) {
             onTranscription(message.serverContent.outputTranscription.text, false);
          }
          if (message.serverContent?.inputTranscription?.text) {
             onTranscription(message.serverContent.inputTranscription.text, true);
          }

          // Handle Interruption
          if (message.serverContent?.interrupted) {
             this.stopAllAudio();
          }
        },
        onclose: () => {
            console.log("Gemini Live Closed");
            this.dispatchEvent(new CustomEvent('negotiationEnded', { detail: { timestamp: Date.now() } }));
        },
        onerror: (err) => console.error("Gemini Live Error:", err),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
        },
        systemInstruction: { parts: [{ text: config.systemInstruction }] },
        inputAudioTranscription: {}, 
        outputAudioTranscription: {},
        tools: [{ functionDeclarations: [negotiationTool] }]
      },
    });

    return this.sessionPromise;
  }

  private setupAudioInput() {
    if (!this.inputAudioContext || !this.currentStream || !this.sessionPromise) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.currentStream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = this.createBlob(inputData);
        
        this.sessionPromise?.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);

    this.cleanupFunctions.push(() => {
        source.disconnect();
        scriptProcessor.disconnect();
    });
  }

  private async handleAudioOutput(base64Audio: string) {
    if (!this.outputAudioContext || !this.outputNode) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    
    const audioBytes = this.decodeBase64(base64Audio);
    const audioBuffer = await this.decodeAudioData(audioBytes, this.outputAudioContext);
    
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    
    source.addEventListener('ended', () => {
        this.sources.delete(source);
    });

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  private stopAllAudio() {
      for (const source of this.sources) {
          try { source.stop(); } catch(e) {}
      }
      this.sources.clear();
      this.nextStartTime = 0;
  }

  public async disconnect() {
    this.stopAllAudio();
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];

    if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
    }

    if (this.inputAudioContext) {
        await this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        await this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
    
    this.sessionPromise = null;
    // Note: 'negotiationEnded' is also triggered by the onclose callback, 
    // but we dispatch here manually if disconnect is called explicitly to ensure UI updates.
    this.dispatchEvent(new CustomEvent('negotiationEnded', { detail: { timestamp: Date.now() } }));
  }

  // Utils
  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: this.encodeBase64(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encodeBase64(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decodeBase64(base64: string) {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, OUTPUT_SAMPLE_RATE);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }
}

export const geminiLiveService = new GeminiLiveService();