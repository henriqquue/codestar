export interface MockParamCall {
  method: 'setValueAtTime' | 'exponentialRampToValueAtTime';
  value: number;
  time: number;
}

export class MockAudioParam {
  public value: number;
  public calls: MockParamCall[] = [];

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  public setValueAtTime = jest.fn((val: number, time: number) => {
    this.value = val;
    this.calls.push({ method: 'setValueAtTime', value: val, time });
  });

  public exponentialRampToValueAtTime = jest.fn((val: number, time: number) => {
    this.value = val;
    this.calls.push({ method: 'exponentialRampToValueAtTime', value: val, time });
  });
}

export class MockAudioNode {
  public nodeKind: string;
  public connectCalls: (MockAudioNode | AudioNode)[] = [];
  public disconnectCalls: number = 0;

  constructor(nodeKind: string) {
    this.nodeKind = nodeKind;
  }

  public connect = jest.fn((dest: MockAudioNode | AudioNode) => {
    this.connectCalls.push(dest);
    return dest;
  });

  public disconnect = jest.fn(() => {
    this.disconnectCalls++;
  });
}

export class MockOscillatorNode extends MockAudioNode {
  public type: OscillatorType = 'sine';
  public frequency: MockAudioParam;
  public startCalls: number[] = [];
  public stopCalls: number[] = [];

  constructor() {
    super('Oscillator');
    this.frequency = new MockAudioParam(440);
  }

  public start = jest.fn((time?: number) => {
    this.startCalls.push(time ?? 0);
  });

  public stop = jest.fn((time?: number) => {
    this.stopCalls.push(time ?? 0);
  });
}

export class MockGainNode extends MockAudioNode {
  public gain: MockAudioParam;

  constructor() {
    super('Gain');
    this.gain = new MockAudioParam(1);
  }
}

export class MockBiquadFilterNode extends MockAudioNode {
  public type: BiquadFilterType = 'lowpass';
  public frequency: MockAudioParam;

  constructor() {
    super('BiquadFilter');
    this.frequency = new MockAudioParam(350);
  }
}

export class MockAudioBuffer {
  public numberOfChannels: number;
  public length: number;
  public sampleRate: number;
  private channelData: Float32Array;

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channelData = new Float32Array(length);
  }

  public getChannelData = jest.fn((_channel: number): Float32Array => {
    return this.channelData;
  });
}

export class MockAudioBufferSourceNode extends MockAudioNode {
  public buffer: MockAudioBuffer | null = null;
  public startCalls: number[] = [];
  public stopCalls: number[] = [];

  constructor() {
    super('BufferSource');
  }

  public start = jest.fn((time?: number) => {
    this.startCalls.push(time ?? 0);
  });

  public stop = jest.fn((time?: number) => {
    this.stopCalls.push(time ?? 0);
  });
}

export class MockAudioContext {
  public currentTime: number = 0;
  public sampleRate: number = 44100;
  public state: AudioContextState = 'suspended';
  public destination: MockAudioNode;
  public createdNodes: MockAudioNode[] = [];

  constructor() {
    this.destination = new MockAudioNode('Destination');
    allCreatedContexts.push(this);
    lastCreatedContext = this;
  }

  public resume = jest.fn(async (): Promise<void> => {
    this.state = 'running';
  });

  public close = jest.fn(async (): Promise<void> => {
    this.state = 'closed';
  });

  public createOscillator = jest.fn((): MockOscillatorNode => {
    const node = new MockOscillatorNode();
    this.createdNodes.push(node);
    return node;
  });

  public createGain = jest.fn((): MockGainNode => {
    const node = new MockGainNode();
    this.createdNodes.push(node);
    return node;
  });

  public createBiquadFilter = jest.fn((): MockBiquadFilterNode => {
    const node = new MockBiquadFilterNode();
    this.createdNodes.push(node);
    return node;
  });

  public createBuffer = jest.fn(
    (channels: number, length: number, sampleRate: number): MockAudioBuffer => {
      return new MockAudioBuffer(channels, length, sampleRate);
    }
  );

  public createBufferSource = jest.fn((): MockAudioBufferSourceNode => {
    const node = new MockAudioBufferSourceNode();
    this.createdNodes.push(node);
    return node;
  });
}

export let allCreatedContexts: MockAudioContext[] = [];
export let lastCreatedContext: MockAudioContext | null = null;

export function resetMockAudio(): void {
  allCreatedContexts = [];
  lastCreatedContext = null;
}

export function installMockAudioContext(): void {
  resetMockAudio();
  (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
}
