/* eslint-disable */

export interface FMOD {

  /** Current FMOD version number. */
  readonly VERSION: 0x00020312;
  /** Maximum number of channels. */
  readonly MAX_CHANNEL_WIDTH: 32;
  /** Maximum listeners. */
  readonly MAX_LISTENERS: 8;
  /** Maximum number of System objects allowed. */
  readonly MAX_SYSTEMS: 8;
  /** Length in bytes of the buffer pointed to by the valuestr argument of FMOD.DSP_GETPARAM_XXXX_CALLBACK functions. */
  readonly DSP_GETPARAM_VALUESTR_LENGTH: 32;
  /** The plug-in SDK version. */
  readonly PLUGIN_SDK_VERSION: 110;
  /** The codec plug-in API version the plug-in was built with. */
  readonly CODEC_PLUGIN_VERSION: 1;
  /** The output plug-in API version the plug-in was created with. */
  readonly OUTPUT_PLUGIN_VERSION: 5;
  /** The maximum number of global reverb instances. */
  readonly REVERB_MAXINSTANCES: 4;

  /** Safety check.  Dont call System::update or System::playSound if this is true. */
  asyncInFlight: boolean;

  getLastError(): FMOD.RESULT;
  setLastError(result: FMOD.RESULT): void;
  errorString(result: FMOD.RESULT): string;
  /** Creates an instance of the FMOD system. */
  System_Create(): FMOD.System
  /** Specify the level and delivery method of log messages when using the logging version of FMOD. */
  Debug_Initialize(
    flags: FMOD.DEBUG_FLAGS
  ):void;
  Memory_GetStats(
    blocking: boolean
  ): { currentalloced:number, maxalloced: number }

  /** Information function to retrieve the state of FMOD disk access. */
  File_GetDiskBusy(): boolean;

  /** Retrieve a value from a specific FMOD memory address. */
  getValue(
      ptr: number,
      type: string
  ): number;
  /** Store a value at a specific FMOD memory address. */
  setValue(
      ptr: number, 
      value: number, 
      type: string
  ): void;
  /** Copy a source array to an FMOD memory address. */
  copyToPtr(
    dest: number, 
    src: ArrayBuffer | ArrayBufferView | number[], 
    length: number
  ): void;
  /** For System::createSound - for accurate Sound::getLength / Channel::setPosition on VBR MP3, and MOD/S3M/XM/IT/MIDI files. Scans file first, so takes longer to open. FMOD.OPENONLY does not affect this. */
  ACCURATETIME: number;
  /** Called when a sound ends. Supported by Channel only. commanddata1: Unused. commanddata2: Unused. */
  CHANNELCONTROL_CALLBACK_END: number;
  /** Maximum number of callback types supported. */
  CHANNELCONTROL_CALLBACK_MAX: number;
  /** Called when geometry occlusion values are calculated. Can be used to clamp or change the value. Supported by Channel and ChannelGroup. commanddata1: (float \) representing the calculated direct occlusion value, can be modified. commanddata2: (float \) representing the calculated reverb occlusion value, can be modified. */
  CHANNELCONTROL_CALLBACK_OCCLUSION: number;
  /** Called when a syncpoint is encountered. Can be from wav file markers or user added. Supported by Channel only. commanddata1: (int) representing the index of the sync point for use with Sound::getSyncPointInfo. commanddata2: Unused. */
  CHANNELCONTROL_CALLBACK_SYNCPOINT: number;
  /** Called when a Channel is made virtual or real. Supported by Channel objects only. commanddata1: (int) 0 represents 'virtual to real' and 1 represents 'real to virtual'. commanddata2: Unused. */
  CHANNELCONTROL_CALLBACK_VIRTUALVOICE: number;
  /** Type representing Channel */
  CHANNELCONTROL_CHANNEL: number;
  /** Type representing ChannelGroup */
  CHANNELCONTROL_CHANNELGROUP: number;
  /** Built-in fader DSP. */
  CHANNELCONTROL_DSP_FADER: number;
  /** Head of the DSP chain, closest to the output, equivalent of index 0. */
  CHANNELCONTROL_DSP_HEAD: number;
  /** Tail of the DSP chain, closest to the input, equivalent of the number of DSPs minus 1. */
  CHANNELCONTROL_DSP_TAIL: number;
  /** Maximum number of ChannelControl types. */
  CHANNELCONTROL_MAX: number;
  /** 5.1 surround channel mask. */
  CHANNELMASK_5POINT1: number;
  /** 5.1 surround channel mask, using rears instead of surrounds. */
  CHANNELMASK_5POINT1_REARS: number;
  /** 7.0 surround channel mask. */
  CHANNELMASK_7POINT0: number;
  /** 7.1 surround channel mask. */
  CHANNELMASK_7POINT1: number;
  /** Back center channel, not represented in any FMOD.SPEAKERMODE. */
  CHANNELMASK_BACK_CENTER: number;
  /** Back left channel. */
  CHANNELMASK_BACK_LEFT: number;
  /** Back right channel. */
  CHANNELMASK_BACK_RIGHT: number;
  /** Front center channel. */
  CHANNELMASK_FRONT_CENTER: number;
  /** Front left channel. */
  CHANNELMASK_FRONT_LEFT: number;
  /** Front right channel. */
  CHANNELMASK_FRONT_RIGHT: number;
  /** Low frequency channel. */
  CHANNELMASK_LOW_FREQUENCY: number;
  /** Left / right / center channel mask. */
  CHANNELMASK_LRC: number;
  /** Mono channel mask. */
  CHANNELMASK_MONO: number;
  /** Quadphonic channel mask. */
  CHANNELMASK_QUAD: number;
  /** Stereo channel mask. */
  CHANNELMASK_STEREO: number;
  /** 5.0 surround channel mask. */
  CHANNELMASK_SURROUND: number;
  /** Surround left channel. */
  CHANNELMASK_SURROUND_LEFT: number;
  /** Surround right channel. */
  CHANNELMASK_SURROUND_RIGHT: number;
  /** Mono, Mono, Mono, Mono, Mono, Mono, ... (each channel up to FMOD.MAX_CHANNEL_WIDTH treated as mono) */
  CHANNELORDER_ALLMONO: number;
  /** Left, Right, Left, Right, Left, Right, ... (each pair of channels up to FMOD.MAX_CHANNEL_WIDTH treated as stereo) */
  CHANNELORDER_ALLSTEREO: number;
  /** Left, Right, Surround Left, Surround Right, Center, LFE (as per Linux ALSA channel order) */
  CHANNELORDER_ALSA: number;
  /** Left, Right, Center, LFE, Surround Left, Surround Right, Back Left, Back Right (see FMOD.SPEAKER enumeration) */
  CHANNELORDER_DEFAULT: number;
  /** Maximum number of channel orderings supported. */
  CHANNELORDER_MAX: number;
  /** Left, Center, Right, Surround Left, Surround Right, LFE */
  CHANNELORDER_PROTOOLS: number;
  /** Left, Right, Center, LFE, Back Left, Back Right, Surround Left, Surround Right (as per Microsoft .wav WAVEFORMAT structure master order) */
  CHANNELORDER_WAVEFORMAT: number;
  /** Load MP2/MP3/FADPCM/IMAADPCM/Vorbis/AT9 or XMA into memory and leave it compressed. Vorbis/AT9/FADPCM encoding only supported in the .FSB container format. During playback the FMOD software mixer will decode it in realtime as a 'compressed sample'. Overrides FMOD.CREATESAMPLE. If the sound data is not one of the supported formats, it will behave as if it was created with FMOD.CREATESAMPLE and decode the sound into PCM. */
  CREATECOMPRESSEDSAMPLE: number;
  /** Decompress at loadtime, decompressing or decoding whole file into memory as the target sample format (ie PCM). Fastest for playback and most flexible. */
  CREATESAMPLE: number;
  /** Decompress at runtime, streaming from the source provided (ie from disk). Overrides FMOD.CREATESAMPLE and FMOD.CREATECOMPRESSEDSAMPLE. Note a stream can only be played once at a time due to a stream only having 1 stream buffer and file handle. Open multiple streams to have them play concurrently. */
  CREATESTREAM: number;
  /** Display the source code file and line number for where the message originated. */
  DEBUG_DISPLAY_LINENUMBERS: number;
  /** Display the thread ID of the calling function that generated the message. */
  DEBUG_DISPLAY_THREAD: number;
  /** Display the time stamp of the log message in milliseconds. */
  DEBUG_DISPLAY_TIMESTAMPS: number;
  /** Enable only error messages. */
  DEBUG_LEVEL_ERROR: number;
  /** Enable informational, warning and error messages (default). */
  DEBUG_LEVEL_LOG: number;
  /** Disable all messages. */
  DEBUG_LEVEL_NONE: number;
  /** Enable warning and error messages. */
  DEBUG_LEVEL_WARNING: number;
  /** Call specified callback with log information. */
  DEBUG_MODE_CALLBACK: number;
  /** Write log to specified file path. */
  DEBUG_MODE_FILE: number;
  /** Default log location per platform, i.e. Visual Studio output window, stderr, LogCat, etc. */
  DEBUG_MODE_TTY: number;
  /** Verbose logging for codec initialization, only use this if you are debugging a codec related issue. */
  DEBUG_TYPE_CODEC: number;
  /** Verbose logging for file access, only use this if you are debugging a file related issue. */
  DEBUG_TYPE_FILE: number;
  /** Verbose logging for memory operations, only use this if you are debugging a memory related issue. */
  DEBUG_TYPE_MEMORY: number;
  /** Verbose logging for internal errors, use this for tracking the origin of error codes. */
  DEBUG_TYPE_TRACE: number;
  /** Verbose logging for whenever a Channel changes its virtual state. */
  DEBUG_TYPE_VIRTUAL: number;
  /** Default for all modes listed below. FMOD.LOOPOFF, FMOD.2D, FMOD.3D_WORLDRELATIVE, FMOD.3D_INVERSEROLLOFF */
  DEFAULT: number;
  /** Device is currently plugged in. */
  DRIVER_STATE_CONNECTED: number;
  /** Device is the users preferred choice. */
  DRIVER_STATE_DEFAULT: number;
  /** Maximum number of DSP connection types supported. */
  DSPCONNECTION_TYPE_MAX: number;
  /** Pre-allocated connection allocated with System::createDSPConnection. Only used with DSP::addInput. */
  DSPCONNECTION_TYPE_PREALLOCATED: number;
  /** Send connection type. Audio is mixed from the input to the output DSP's audible buffer, but the input is not executed, only copied from. A standard connection or sidechain needs to make an input execute to generate data. */
  DSPCONNECTION_TYPE_SEND: number;
  /** Send sidechain connection type. Audio is mixed from the input to the output DSP's sidechain buffer, but the input is not executed, only copied from. A standard connection or sidechain needs to make an input execute to generate data. */
  DSPCONNECTION_TYPE_SEND_SIDECHAIN: number;
  /** Sidechain connection type. Audio is mixed from the input to the output DSP's sidechain buffer. */
  DSPCONNECTION_TYPE_SIDECHAIN: number;
  /** Default connection type. Audio is mixed from the input to the output DSP's audible buffer. */
  DSPCONNECTION_TYPE_STANDARD: number;
  /** Called when a DSP's data parameter can be released. data: FMOD.DSP_DATA_PARAMETER_INFO. */
  DSP_CALLBACK_DATAPARAMETERRELEASE: number;
  DSP_CALLBACK_MAX: number;
  /** Chorus modulation depth. */
  DSP_CHORUS_DEPTH: number;
  /** Percentage of wet signal in mix. */
  DSP_CHORUS_MIX: number;
  /** Chorus modulation rate. */
  DSP_CHORUS_RATE: number;
  /** Attack time. */
  DSP_COMPRESSOR_ATTACK: number;
  /** Make-up gain applied after limiting. */
  DSP_COMPRESSOR_GAINMAKEUP: number;
  /** false = Independent (compressor per channel), true = Linked. */
  DSP_COMPRESSOR_LINKED: number;
  /** Compression Ratio. */
  DSP_COMPRESSOR_RATIO: number;
  /** Release time. */
  DSP_COMPRESSOR_RELEASE: number;
  /** Threshold level. */
  DSP_COMPRESSOR_THRESHOLD: number;
  /** Data of type FMOD.DSP_PARAMETER_SIDECHAIN. Whether to analyse the sidechain signal instead of the input signal. The FMOD.DSP_PARAMETER_SIDECHAIN::sidechainenable default is false. */
  DSP_COMPRESSOR_USESIDECHAIN: number;
  /** Original sound volume. */
  DSP_CONVOLUTION_REVERB_PARAM_DRY: number;
  /** Array of signed 16-bit (short) PCM data to be used as reverb impulse response. First member of the array should be a 16 bit value (short) which specifies the number of channels. Array looks like index 0=numchannels. Data is copied internally so source can be freed. */
  DSP_CONVOLUTION_REVERB_PARAM_IR: number;
  /** Linked - channels are mixed together before processing through the reverb. */
  DSP_CONVOLUTION_REVERB_PARAM_LINKED: number;
  /** Volume of echo signal to pass to output. */
  DSP_CONVOLUTION_REVERB_PARAM_WET: number;
  /** Distortion value. */
  DSP_DISTORTION_LEVEL: number;
  /** Echo delay. */
  DSP_ECHO_DELAY: number;
  /** The method used to smooth delay changes. */
  DSP_ECHO_DELAYCHANGEMODE: number;
  /** The ramp delay change mode will fade-in the new delay value and fade-out the old delay value. This is best suited for large, fast parameter changes. */
  DSP_ECHO_DELAYCHANGEMODE_FADE: number;
  /** The lerp delay change mode will use linear interpolation to approach the new delay target. This is best suited for small, slow parameter changes, and for emulating the doppler effect. */
  DSP_ECHO_DELAYCHANGEMODE_LERP: number;
  /** The none delay change mode will disable value smoothing between delay changes. */
  DSP_ECHO_DELAYCHANGEMODE_NONE: number;
  /** Original sound volume. */
  DSP_ECHO_DRYLEVEL: number;
  /** Echo decay per delay. 100.0 = No decay, 0.0 = total decay. */
  DSP_ECHO_FEEDBACK: number;
  /** Volume of echo signal to pass to output. */
  DSP_ECHO_WETLEVEL: number;
  /** The start frequency of the analysis band. */
  DSP_FFT_BAND_START_FREQ: number;
  /** The stop frequency of the analysis band. */
  DSP_FFT_BAND_STOP_FREQ: number;
  /** The channel to analyze. If set to -1, all channels will be analyzed, producing multiple spectra. Otherwise only the specified channel will be analyzed, producing a single spectrum. */
  DSP_FFT_CHANNEL: number;
  /** Downmix mode. If set to FMOD.DSP_FFT_DOWNMIX_MONO, the DSP will downmix the input signal to mono before analysis, producing a single spectrum. Note that this only affects the analysis - the DSP will pass the unmodified signal through to its output regardless of the downmix setting. */
  DSP_FFT_DOWNMIX: number;
  /** Downmix to mono. */
  DSP_FFT_DOWNMIX_MONO: number;
  /** No downmix. */
  DSP_FFT_DOWNMIX_NONE: number;
  /** Immediate Mode. False = data requests will have a delay on first time use and hardware acceleration, if available, will be used. True = data requests will have no delay on first time use, and no hardware acceleration will be used. */
  DSP_FFT_IMMEDIATE_MODE: number;
  /** The total RMS value of the spectral components within the analysis band. */
  DSP_FFT_RMS: number;
  /** Returns the centroid of the spectral components within the analysis band for the first channel. */
  DSP_FFT_SPECTRAL_CENTROID: number;
  /** Returns the current spectrum values between 0 and 1 for each 'fft bin'. Divide the Nyquist frequency by the window size to get the hz value per entry. */
  DSP_FFT_SPECTRUMDATA: number;
  /** FFT Window Type. */
  DSP_FFT_WINDOW: number;
  /** Window size. Must be a power of 2 between 128 and 16384. */
  DSP_FFT_WINDOWSIZE: number;
  /** w[n] = 0.42 - (0.5 COS(n/N) ) + (0.08 COS(2.0 n/N) ) */
  DSP_FFT_WINDOW_BLACKMAN: number;
  /** w[n] = 0.35875 - (0.48829 COS(1.0 n/N)) + (0.14128 COS(2.0 n/N)) - (0.01168 COS(3.0 n/N)) */
  DSP_FFT_WINDOW_BLACKMANHARRIS: number;
  /** w[n] = 0.54 - (0.46 COS(n/N) ) */
  DSP_FFT_WINDOW_HAMMING: number;
  /** w[n] = 0.5 (1.0 - COS(n/N) ) */
  DSP_FFT_WINDOW_HANNING: number;
  /** w[n] = 1.0 */
  DSP_FFT_WINDOW_RECT: number;
  /** w[n] = TRI(2n/N) */
  DSP_FFT_WINDOW_TRIANGLE: number;
  /** Flange depth. */
  DSP_FLANGE_DEPTH: number;
  /** Percentage of wet signal in the mix. */
  DSP_FLANGE_MIX: number;
  /** Flange speed. */
  DSP_FLANGE_RATE: number;
  /** Highpass cutoff frequency. */
  DSP_HIGHPASS_CUTOFF: number;
  /** Highpass resonance Q value. */
  DSP_HIGHPASS_RESONANCE: number;
  /** Highpass cutoff frequency. */
  DSP_HIGHPASS_SIMPLE_CUTOFF: number;
  /** Percentage of output fed back into input. */
  DSP_ITECHO_FEEDBACK: number;
  /** Delay for left channel. */
  DSP_ITECHO_LEFTDELAY: number;
  /** Value that specifies whether to swap left and right delays with each successive echo. CURRENTLY NOT SUPPORTED. */
  DSP_ITECHO_PANDELAY: number;
  /** Delay for right channel. */
  DSP_ITECHO_RIGHTDELAY: number;
  /** Ratio of wet (processed) signal to dry (unprocessed) signal. Higher is wetter. */
  DSP_ITECHO_WETDRYMIX: number;
  /** Lowpass cutoff frequency. */
  DSP_ITLOWPASS_CUTOFF: number;
  /** Lowpass resonance Q value. */
  DSP_ITLOWPASS_RESONANCE: number;
  /** Maximum level of the output signal. */
  DSP_LIMITER_CEILING: number;
  /** Maximum amplification allowed. */
  DSP_LIMITER_MAXIMIZERGAIN: number;
  /** Channel processing mode where false is independent (limiter per channel) and true is linked (all channels are summed together before processing). */
  DSP_LIMITER_MODE: number;
  /** Time to return the gain reduction to full in ms. */
  DSP_LIMITER_RELEASETIME: number;
  /** Metering information. */
  DSP_LOUDNESS_METER_INFO: number;
  /** Update state. */
  DSP_LOUDNESS_METER_STATE: number;
  /** Enable loudness meter recording and analyzing. */
  DSP_LOUDNESS_METER_STATE_ANALYZING: number;
  /** Reset all loudness meter information. */
  DSP_LOUDNESS_METER_STATE_RESET_ALL: number;
  /** Pause loudness meter. */
  DSP_LOUDNESS_METER_STATE_PAUSED: number;
  /** Reset loudness meter information except max peak. */
  DSP_LOUDNESS_METER_STATE_RESET_INTEGRATED: number;
  /** Reset loudness meter max peak. */
  DSP_LOUDNESS_METER_STATE_RESET_MAXPEAK: number;
  /** Channel weighting. */
  DSP_LOUDNESS_METER_WEIGHTING: number;
  /** Lowpass cutoff frequency. */
  DSP_LOWPASS_CUTOFF: number;
  /** Lowpass resonance Q value. */
  DSP_LOWPASS_RESONANCE: number;
  /** Lowpass cutoff frequency. */
  DSP_LOWPASS_SIMPLE_CUTOFF: number;
  /** The DSP can consume incoming audio, modify it, then write it to the outgoing buffer. */
  DSP_MODE_FILTER: number;
  /** The DSP generates audio only and writes it to the output buffer. The input buffer to read or process callback will be null. */
  DSP_MODE_GENERATOR: number;
  /** Band A: Dynamic attack time. This is the duration it will take the dynamic processor to apply the full ratio of amplification or attenuation. Lower values will mean the full ratio is applied quickly, and will approach the ratio value more smoothly as the attack value increases. */
  DSP_MULTIBAND_DYNAMICS_A_ATTACK: number;
  /** Band A: Gain applied before dynamic processing. This amplifies or attenuates the signal before it is split into separate bands and dynamic processors. */
  DSP_MULTIBAND_DYNAMICS_A_GAIN: number;
  /** Band A: Gain applied after dynamic processing. This amplifies or attenuates the signal after it passes through the dynamic processors and before the split signal is mixed back together. */
  DSP_MULTIBAND_DYNAMICS_A_GAIN_MAKEUP: number;
  /** Band A: Dynamic response mode. Use this to configure how the band will respond to the envelope of the signal. The "Upward" modes will amplify the signal, and the "Downward" modes will attenuate the signal. */
  DSP_MULTIBAND_DYNAMICS_A_MODE: number;
  /** Band A: Dynamic response ratio. This changes the amount of amplification or attenuation that will be applied to the signal. The result of dynamic processing will be more subtle at lower ratio values, and will intensify as the ratio increases. */
  DSP_MULTIBAND_DYNAMICS_A_RATIO: number;
  /** Band A: Dynamic release time. This is the duration it will take the dynamic processor to return to stop applying amplification or attenuation. Lower values will mean the ratio stops being applied quickly, and will back off the ratio value more smoothly as the release value increases. */
  DSP_MULTIBAND_DYNAMICS_A_RELEASE: number;
  /** Band A: Dynamic response metering information. This structure contains data on the average attenuation or amplification applied per channel in the last mix block. */
  DSP_MULTIBAND_DYNAMICS_A_RESPONSE_DATA: number;
  /** Band A: Dynamic response threshold. This changes the threshold at which this band will start attenuating or amplifying the signal. */
  DSP_MULTIBAND_DYNAMICS_A_THRESHOLD: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_ATTACK: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_GAIN: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_GAIN_MAKEUP: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_MODE: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_RATIO: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_RELEASE: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_RESPONSE_DATA: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_DYNAMICS_B_THRESHOLD: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_ATTACK: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_GAIN: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_GAIN_MAKEUP: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_MODE: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_RATIO: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_RELEASE: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_RESPONSE_DATA: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_DYNAMICS_C_THRESHOLD: number;
  /** Enables optimized processing mode. When set to true, the input signal is mixed down to mono before passing through the dynamic processor bands. */
  DSP_MULTIBAND_DYNAMICS_LINKED: number;
  /** Lower crossover frequency. Band A will process the dynamic content ranging from 20Hz to this value, and Band B will process the dynamic content ranging from this value to the value of FMOD.DSP_MULTIBAND_DYNAMICS_UPPER_FREQUENCY. */
  DSP_MULTIBAND_DYNAMICS_LOWER_FREQUENCY: number;
  /** Dynamic downward compression. Attenuates the signal above a defined threshold. */
  DSP_MULTIBAND_DYNAMICS_MODE_COMPRESS_DOWN: number;
  /** Dynamic upward compression. Amplifies the signal below a defined threshold. */
  DSP_MULTIBAND_DYNAMICS_MODE_COMPRESS_UP: number;
  /** Response disabled, no processing. */
  DSP_MULTIBAND_DYNAMICS_MODE_DISABLED: number;
  /** Dynamic downward expansion. Attenuates the signal below a defined threshold. */
  DSP_MULTIBAND_DYNAMICS_MODE_EXPAND_DOWN: number;
  /** Dynamic upward expansion. Amplifies the signal above a defined threshold. */
  DSP_MULTIBAND_DYNAMICS_MODE_EXPAND_UP: number;
  /** Upper crossover frequency. Band B will process the dynamic content ranging from the value of FMOD.DSP_MULTIBAND_DYNAMICS_LOWER_FREQUENCY to this value, and Band C will process the dynamic content ranging from this value to 20kHz. */
  DSP_MULTIBAND_DYNAMICS_UPPER_FREQUENCY: number;
  /** Whether to analyse the sidechain signal instead of the input signal. When sidechaining is enabled the sidechain channel will be split into separate bands and analyzed for their dynamic content, but the resulting dynamic response will still be applied to the host channel. */
  DSP_MULTIBAND_DYNAMICS_USE_SIDECHAIN: number;
  /** Band A: used to interpret the behavior of the remaining parameters. */
  DSP_MULTIBAND_EQ_A_FILTER: number;
  /** Band A: Significant frequency, cutoff [low/high pass, low/high shelf], center [notch, peaking, band-pass], phase transition point [all-pass]. */
  DSP_MULTIBAND_EQ_A_FREQUENCY: number;
  /** Band A: Boost or attenuation in dB [peaking, high/low shelf only]. -30 to 30. Default = 0. */
  DSP_MULTIBAND_EQ_A_GAIN: number;
  /** Band A: Quality factor, resonance [low/high pass], bandwidth [notch, peaking, band-pass], phase transition sharpness [all-pass], unused [low/high shelf]. */
  DSP_MULTIBAND_EQ_A_Q: number;
  /** Band B: See Band A. */
  DSP_MULTIBAND_EQ_B_FILTER: number;
  /** Band B: See Band A */
  DSP_MULTIBAND_EQ_B_FREQUENCY: number;
  /** Band B: See Band A */
  DSP_MULTIBAND_EQ_B_GAIN: number;
  /** Band B: See Band A */
  DSP_MULTIBAND_EQ_B_Q: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_EQ_C_FILTER: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_EQ_C_FREQUENCY: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_EQ_C_GAIN: number;
  /** Band C: See Band A. */
  DSP_MULTIBAND_EQ_C_Q: number;
  /** Band D: See Band A. */
  DSP_MULTIBAND_EQ_D_FILTER: number;
  /** Band D: See Band A. */
  DSP_MULTIBAND_EQ_D_FREQUENCY: number;
  /** Band D: See Band A. */
  DSP_MULTIBAND_EQ_D_GAIN: number;
  /** Band D: See Band A. */
  DSP_MULTIBAND_EQ_D_Q: number;
  /** Band E: See Band A. */
  DSP_MULTIBAND_EQ_E_FILTER: number;
  /** Band E: See Band A. */
  DSP_MULTIBAND_EQ_E_FREQUENCY: number;
  /** Band E: See Band A. */
  DSP_MULTIBAND_EQ_E_GAIN: number;
  /** Band E: See Band A. */
  DSP_MULTIBAND_EQ_E_Q: number;
  /** All-pass filter, allows all frequencies to pass, but changes the phase response at a given point (with specified sharpness). */
  DSP_MULTIBAND_EQ_FILTER_ALLPASS: number;
  /** Band-pass filter, allows frequencies at a given point (with specificed bandwidth) to pass while attenuating frequencies outside this range. */
  DSP_MULTIBAND_EQ_FILTER_BANDPASS: number;
  /** Disabled filter, no processing. */
  DSP_MULTIBAND_EQ_FILTER_DISABLED: number;
  /** Resonant high-pass filter, attenuates frequencies (12dB per octave) below a given point (with specificed resonance) while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_HIGHPASS_12DB: number;
  /** Resonant high-pass filter, attenuates frequencies (24dB per octave) below a given point (with specificed resonance) while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_HIGHPASS_24DB: number;
  /** Resonant high-pass filter, attenuates frequencies (48dB per octave) below a given point (with specificed resonance) while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_HIGHPASS_48DB: number;
  /** Non-resonant high-pass filter, attenuates frequencies (6dB per octave) below a given point while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_HIGHPASS_6DB: number;
  /** High-shelf filter, boosts or attenuates frequencies (with specified gain) above a given point while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_HIGHSHELF: number;
  /** Resonant low-pass filter, attenuates frequencies (12dB per octave) above a given point (with specificed resonance) while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_LOWPASS_12DB: number;
  /** Resonant low-pass filter, attenuates frequencies (24dB per octave) above a given point (with specificed resonance) while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_LOWPASS_24DB: number;
  /** Resonant low-pass filter, attenuates frequencies (48dB per octave) above a given point (with specificed resonance) while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_LOWPASS_48DB: number;
  /** Non-resonant low-pass filter, attenuates frequencies (6dB per octave) above a given point while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_LOWPASS_6DB: number;
  /** Low-shelf filter, boosts or attenuates frequencies (with specified gain) below a given point while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_LOWSHELF: number;
  /** Notch or band-reject filter, attenuates frequencies at a given point (with specificed bandwidth) while allowing frequencies outside this range to pass. */
  DSP_MULTIBAND_EQ_FILTER_NOTCH: number;
  /** Peaking filter, boosts or attenuates frequencies (with specified gain) at a given point (with specificed bandwidth) while allowing the rest to pass. */
  DSP_MULTIBAND_EQ_FILTER_PEAKING: number;
  /** Time to ramp the silence to full. */
  DSP_NORMALIZE_FADETIME: number;
  /** Maximum amplification allowed. */
  DSP_NORMALIZE_MAXAMP: number;
  /** Lower volume range threshold to ignore. */
  DSP_NORMALIZE_THRESHOLD: number;
  /** Attenuation Range when FMOD.DSP_OBJECTPAN_OVERRIDE_RANGE is false. */
  DSP_OBJECTPAN_ATTENUATION_RANGE: number;
  /** Override Attenuation Range with FMOD.DSP_OBJECTPAN_3D_MINDISTANCE and FMOD.DSP_OBJECTPAN_3D_MAXDISTANCE. */
  DSP_OBJECTPAN_OVERRIDE_RANGE: number;
  /** 3D Extent Mode. */
  DSP_OBJECTPAN_3D_EXTENT_MODE: number;
  /** 3D Max Distance when DSP_OBJECTPAN_OVERRIDE_RANGE is true. */
  DSP_OBJECTPAN_3D_MAX_DISTANCE: number;
  /** 3D Min Distance when DSP_OBJECTPAN_OVERRIDE_RANGE is true. */
  DSP_OBJECTPAN_3D_MIN_DISTANCE: number;
  /** 3D Min Extent. */
  DSP_OBJECTPAN_3D_MIN_EXTENT: number;
  /** 3D Position. */
  DSP_OBJECTPAN_3D_POSITION: number;
  /** 3D Roll-off Type. */
  DSP_OBJECTPAN_3D_ROLLOFF: number;
  /** 3D Sound Size. */
  DSP_OBJECTPAN_3D_SOUND_SIZE: number;
  /** Output gain level. */
  DSP_OBJECTPAN_OUTPUTGAIN: number;
  /** Overall gain to allow FMOD to know the DSP is scaling the signal for virtualization purposes. */
  DSP_OBJECTPAN_OVERALL_GAIN: number;
  /** Frequency of the tone. Does not affect the noise generator. */
  DSP_OSCILLATOR_RATE: number;
  /** Waveform type. 0 = sine. 1 = square. 2 = sawup. 3 = sawdown. 4 = triangle. 5 = noise. */
  DSP_OSCILLATOR_TYPE: number;
  /** 2D Surround pan direction. Direction from center point of panning circle where 0 is front center and -180 or +180 is rear speakers center point. */
  DSP_PAN_2D_DIRECTION: number;
  /** 2D Surround pan extent. */
  DSP_PAN_2D_EXTENT: number;
  /** 2D Height blend. When the input or FMOD.DSP_PAN_SURROUND_SPEAKER_MODE has height speakers, control the blend between ground and height. -1.0 (push top speakers to ground), 0.0 (preserve top / ground separation), 1.0 (push ground speakers to top). */
  DSP_PAN_2D_HEIGHT_BLEND: number;
  /** 2D Surround pan LFE level. */
  DSP_PAN_2D_LFE_LEVEL: number;
  /** 2D Surround pan rotation. */
  DSP_PAN_2D_ROTATION: number;
  /** Stereo-To-Surround Stereo For FMOD.DSP_PAN_2D_STEREO_MODE_DISCRETE mode. Axis/rotation of L/R parts of stereo sound. */
  DSP_PAN_2D_STEREO_AXIS: number;
  /** Stereo-To-Surround Mode. */
  DSP_PAN_2D_STEREO_MODE: number;
  /** The L/R parts of a stereo sound are rotated around a circle based on FMOD.DSP_PAN_2D_STEREO_AXIS / FMOD.DSP_PAN_2D_STEREO_SEPARATION. */
  DSP_PAN_2D_STEREO_MODE_DISCRETE: number;
  /** The parts of a stereo sound are spread around destination speakers based on FMOD.DSP_PAN_2D_EXTENT / FMOD.DSP_PAN_2D_DIRECTION */
  DSP_PAN_2D_STEREO_MODE_DISTRIBUTED: number;
  /** 2D Stereo pan position. */
  DSP_PAN_2D_STEREO_POSITION: number;
  /** Stereo-To-Surround Stereo For FMOD.DSP_PAN_2D_STEREO_MODE_DISCRETE mode. Separation/width of L/R parts of stereo sound. */
  DSP_PAN_2D_STEREO_SEPARATION: number;
  /** 3D Extent Mode. */
  DSP_PAN_3D_EXTENT_MODE: number;
  DSP_PAN_3D_EXTENT_MODE_TYPE_AUTO: number;
  DSP_PAN_3D_EXTENT_MODE_TYPE_OFF: number;
  DSP_PAN_3D_EXTENT_MODE_TYPE_USER: number;
  /** 3D volume attenuation maximum distance when FMOD.DSP_OBJECTPAN_OVERRIDE_RANGE is true. */
  DSP_PAN_3D_MAX_DISTANCE: number;
  /** 3D volume attenuation minimum distance when FMOD.DSP__OBJECT_PAN_OVERRIDE_RANGE is true. */
  DSP_PAN_3D_MIN_DISTANCE: number;
  /** 3D Min Extent. */
  DSP_PAN_3D_MIN_EXTENT: number;
  /** 3D Pan Blend. */
  DSP_PAN_3D_PAN_BLEND: number;
  /** 3D Position of panner and listener(s). */
  DSP_PAN_3D_POSITION: number;
  /** 3D volume attenuation curve shape. */
  DSP_PAN_3D_ROLLOFF: number;
  /** This is a linear-square roll-off model. Below `mindistance`, the volume is unattenuated; as `distance` increases from `mindistance` to `maxdistance`, the volume attenuates to silence according to a linear squared gradient. For this roll-off mode, `distance` values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). This roll-off mode provides steeper volume ramping close to the `mindistance`, and more gradual ramping close to the `maxdistance`, than linear roll-off mode. */
  DSP_PAN_3D_ROLLOFF_CUSTOM: number;
  /** This is an inverse roll-off model. Below `mindistance`, the volume is unattenuated; as `distance` increases above `mindistance`, the volume attenuates using `mindistance/distance` as the gradient until it reaches `maxdistance`, where it stops attenuating. For this roll-off mode, distance values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). This roll-off mode accurately models the way sounds attenuate over distance in the real world. (DEFAULT) */
  DSP_PAN_3D_ROLLOFF_INVERSE: number;
  /** This is a combination of the inverse and linear-square roll-off models. At short distances where inverse roll-off would provide greater attenuation, it functions as inverse roll-off mode; then at greater distances where linear-square roll-off mode would provide greater attenuation, it uses that roll-off mode instead. For this roll-off mode, distance values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). Inverse tapered roll-off mode approximates realistic behavior while still guaranteeing the sound attenuates to silence at `maxdistance`. */
  DSP_PAN_3D_ROLLOFF_INVERSETAPERED: number;
  /** This is a linear roll-off model. Below `mindistance`, the volume is unattenuated; as `distance` increases from `mindistance` to `maxdistance`, the volume attenuates to silence using a linear gradient. For this roll-off mode, distance values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). While this roll-off mode is not as realistic as inverse roll-off mode, it is easier to comprehend. */
  DSP_PAN_3D_ROLLOFF_LINEAR: number;
  /** This is a linear-square roll-off model. Below `mindistance`, the volume is unattenuated; as `distance` increases from `mindistance` to `maxdistance`, the volume attenuates to silence according to a linear squared gradient. For this roll-off mode, `distance` values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). This roll-off mode provides steeper volume ramping close to the `mindistance`, and more gradual ramping close to the `maxdistance`, than linear roll-off mode. */
  DSP_PAN_3D_ROLLOFF_LINEARSQUARED: number;
  /** 3D Sound Size. */
  DSP_PAN_3D_SOUND_SIZE: number;
  /** Attenuation Range when FMOD.DSP_OBJECTPAN_OVERRIDE_RANGE is false. */
  DSP_PAN_ATTENUATION_RANGE: number;
  /** Speakers Enabled Bitmask for each speaker from 0 to 32 to be considered by panner. Use to disable speakers from being panned to. 0 to 0xFFF. Default = 0xFFF (All on). */
  DSP_PAN_ENABLED_SPEAKERS: number;
  /** LFE Upmix Enabled. Determines whether non-LFE source channels should mix to the LFE or leave it alone. 0 (off) to 1 (on). Default = 0 (off). */
  DSP_PAN_LFE_UPMIX_ENABLED: number;
  /** Panner mode. */
  DSP_PAN_MODE: number;
  /** Single channel output. */
  DSP_PAN_MODE_MONO: number;
  /** Two channel output. */
  DSP_PAN_MODE_STEREO: number;
  /** Three or more channel output.  Includes common modes like quad, 5.1 or 7.1. */
  DSP_PAN_MODE_SURROUND: number;
  /** Overall gain to allow FMOD to know the DSP is scaling the signal for visualization purposes. */
  DSP_PAN_OVERALL_GAIN: number;
  /** Override Attenuation Range with FMOD.DSP_PAN_3D_MINDISTANCE and FMOD.DSP_PAN_3D_MAXDISTANCE. */
  DSP_PAN_OVERRIDE_RANGE: number;
  /** Surround speaker mode. (FMOD.SPEAKERMODE) */
  DSP_PAN_SURROUND_SPEAKER_MODE: number;
  /** Octave range around the center frequency to filter. */
  DSP_PARAMEQ_BANDWIDTH: number;
  /** Frequency center. */
  DSP_PARAMEQ_CENTER: number;
  /** Frequency Gain in dB. */
  DSP_PARAMEQ_GAIN: number;
  /** FFT window size - 256, 512, 1024, 2048, 4096. Increase this to reduce 'smearing'. This effect creates a warbling sound similar to when an mp3 is encoded at very low bitrates. */
  DSP_PITCHSHIFT_FFTSIZE: number;
  /** Maximum channels supported. 0 = same as FMOD's default output polyphony, 1 = mono, 2 = stereo etc. See remarks for more. It is recommended to leave it at 0. */
  DSP_PITCHSHIFT_MAXCHANNELS: number;
  /** Removed. Do not use. FMOD now uses 4 overlaps and cannot be changed. */
  DSP_PITCHSHIFT_OVERLAP: number;
  /** Pitch value. 0.5 = one octave down, 2.0 = one octave up. 1.0 does not change the pitch. */
  DSP_PITCHSHIFT_PITCH: number;
  /** ID of this Return DSP. */
  DSP_RETURN_ID: number;
  /** Input speaker mode of this return. */
  DSP_RETURN_INPUT_SPEAKER_MODE: number;
  /** Send level. */
  DSP_SEND_LEVEL: number;
  /** ID of the Return DSP this send is connected to where -1 indicates no connected return DSP. */
  DSP_SEND_RETURNID: number;
  /** Reverberation decay time at low-frequencies. */
  DSP_SFXREVERB_DECAYTIME: number;
  /** Reverberation density (modal density). */
  DSP_SFXREVERB_DENSITY: number;
  /** Reverberation diffusion (echo density). */
  DSP_SFXREVERB_DIFFUSION: number;
  /** Dry signal level. */
  DSP_SFXREVERB_DRYLEVEL: number;
  /** Delay time of first reflection. */
  DSP_SFXREVERB_EARLYDELAY: number;
  /** Blend ratio of late reverb to early reflections. */
  DSP_SFXREVERB_EARLYLATEMIX: number;
  /** High-frequency decay time relative to decay time. */
  DSP_SFXREVERB_HFDECAYRATIO: number;
  /** Reference frequency for high-frequency decay. */
  DSP_SFXREVERB_HFREFERENCE: number;
  /** Cutoff frequency of low-pass filter. */
  DSP_SFXREVERB_HIGHCUT: number;
  /** Late reverberation delay time relative to first reflection in milliseconds. */
  DSP_SFXREVERB_LATEDELAY: number;
  /** Transition frequency of low-shelf filter. */
  DSP_SFXREVERB_LOWSHELFFREQUENCY: number;
  /** Gain of low-shelf filter. */
  DSP_SFXREVERB_LOWSHELFGAIN: number;
  /** Reverb signal level. */
  DSP_SFXREVERB_WETLEVEL: number;
  /** Crossover Slope type. */
  DSP_THREE_EQ_CROSSOVERSLOPE: number;
  /** 12dB/Octave crossover slope. */
  DSP_THREE_EQ_CROSSOVERSLOPE_12DB: number;
  /** 24dB/Octave crossover slope. */
  DSP_THREE_EQ_CROSSOVERSLOPE_24DB: number;
  /** 48dB/Octave crossover slope. */
  DSP_THREE_EQ_CROSSOVERSLOPE_48DB: number;
  /** Mid-to-high crossover frequency. */
  DSP_THREE_EQ_HIGHCROSSOVER: number;
  /** High frequency gain. */
  DSP_THREE_EQ_HIGHGAIN: number;
  /** Low-to-mid crossover frequency. */
  DSP_THREE_EQ_LOWCROSSOVER: number;
  /** Low frequency gain. */
  DSP_THREE_EQ_LOWGAIN: number;
  /** Mid frequency gain. */
  DSP_THREE_EQ_MIDGAIN: number;
  /** Global slot that can be transmitted to or received from. */
  DSP_TRANSCEIVER_CHANNEL: number;
  /** Gain to receive or transmit. */
  DSP_TRANSCEIVER_GAIN: number;
  /** The transmitter uses the channel count of its input signal as the channel count of its channel buffer. */
  DSP_TRANSCEIVER_SPEAKERMODE_AUTO: number;
  /** The transmitter downmixes its input signal to a mono channel buffer. */
  DSP_TRANSCEIVER_SPEAKERMODE_MONO: number;
  /** The transmitter upmixes or downmixes its input signal to a stereo channel buffer. */
  DSP_TRANSCEIVER_SPEAKERMODE_STEREO: number;
  /** The transmitter upmixes or downmixes its input signal to a surround channel buffer. Surround could mean any speaker mode above stereo, so this could mean quad/surround/5.1/7.1. */
  DSP_TRANSCEIVER_SPEAKERMODE_SURROUND: number;
  /** FALSE = Transceiver is a 'receiver' (like a return) and accepts data from a channel. TRUE = Transceiver is a 'transmitter' (like a send). */
  DSP_TRANSCEIVER_TRANSMIT: number;
  /** Speaker mode (transmitter mode only). (FMOD.DSP_TRANSCEIVER_SPEAKERMODE) */
  DSP_TRANSCEIVER_TRANSMITSPEAKERMODE: number;
  /** Tremolo depth. */
  DSP_TREMOLO_DEPTH: number;
  /** LFO on-time. */
  DSP_TREMOLO_DUTY: number;
  /** LFO frequency. */
  DSP_TREMOLO_FREQUENCY: number;
  /** Instantaneous LFO phase. */
  DSP_TREMOLO_PHASE: number;
  /** LFO shape morph between triangle and sine. */
  DSP_TREMOLO_SHAPE: number;
  /** Time-skewing of LFO cycle. */
  DSP_TREMOLO_SKEW: number;
  /** Rotation / auto-pan effect. */
  DSP_TREMOLO_SPREAD: number;
  /** Flatness of the LFO shape. */
  DSP_TREMOLO_SQUARE: number;
    /** Output channel rotations are spread across the panning circle based on speaker positions. */
  DSP_PAN_SURROUND_DEFAULT: number;
  /** Output channel rotations are spread evenly across the panning circle. */
  DSP_PAN_SURROUND_ROTATION_NOT_BIASED: number;
  /** Default data type.  All user data types should be 0 or above. */
  DSP_PARAMETER_DATA_TYPE_USER: number;
  /** Data type for FMOD.DSP_PARAMETER_OVERALLGAIN parameters.  There should be a maximum of one per DSP. */
  DSP_PARAMETER_DATA_TYPE_OVERALLGAIN: number;
  /** Data type for FMOD.DSP_PARAMETER_3DATTRIBUTES parameters.  There should be a maximum of one per DSP. */
  DSP_PARAMETER_DATA_TYPE_3DATTRIBUTES: number;
  /** Data type for FMOD.DSP_PARAMETER_SIDECHAIN parameters.  There should be a maximum of one per DSP. */
  DSP_PARAMETER_DATA_TYPE_SIDECHAIN: number;
  /** Data type for FMOD.DSP_PARAMETER_FFT parameters.  There should be a maximum of one per DSP. */
  DSP_PARAMETER_DATA_TYPE_FFT: number;
  /** Data type for FMOD.DSP_PARAMETER_3DATTRIBUTES_MULTI parameters.  There should be a maximum of one per DSP. */
  DSP_PARAMETER_DATA_TYPE_3DATTRIBUTES_MULTI: number;
  /** Data type for FMOD.DSP_PARAMETER_ATTENUATION_RANGE parameters.  There should be a maximum of one per DSP. */
  DSP_PARAMETER_DATA_TYPE_ATTENUATION_RANGE: number;
  /** Data type for FMOD.DSP_PARAMETER_DYNAMIC_RESPONSE parameters.  There should be a maximum of one per DSP. */
  DSP_PARAMETER_DATA_TYPE_DYNAMIC_RESPONSE: number;
    /** A mapping is automatically chosen based on range and units. See remarks. */
  DSP_PARAMETER_FLOAT_MAPPING_TYPE_AUTO: number;
  /** Values mapped linearly across range. */
  DSP_PARAMETER_FLOAT_MAPPING_TYPE_LINEAR: number;
  /** Values mapped in a piecewise linear fashion defined by FMOD.DSP_PARAMETER_FLOAT_MAPPING_PIECEWISE_LINEAR. */
  DSP_PARAMETER_FLOAT_MAPPING_TYPE_PIECEWISE_LINEAR: number;
  /** FMOD.DSPPARAMETER_DESC will use the FMOD.DSPPARAMETER_DESC_BOOL. */
  DSP_PARAMETER_TYPE_BOOL: number;
  /** FMOD.DSPPARAMETER_DESC will use the FMOD.DSPPARAMETER_DESC_DATA. */
  DSP_PARAMETER_TYPE_DATA: number;
  /** FMOD.DSPPARAMETER_DESC will use the FMOD.DSPPARAMETER_DESC_FLOAT. */
  DSP_PARAMETER_TYPE_FLOAT: number;
  /** FMOD.DSPPARAMETER_DESC will use the FMOD.DSPPARAMETER_DESC_INT. */
  DSP_PARAMETER_TYPE_INT: number;
  /** Maximum number of DSP parameter types. */
  DSP_PARAMETER_TYPE_MAX: number;
  /** Process the incoming audio in inbufferarray and output to outbufferarray. */
  DSP_PROCESS_PERFORM: number;
  /** The DSP is being queried for the expected output format and whether it needs to process audio or should be bypassed. The function should return FMOD.OK, or FMOD.ERR_DSP_DONTPROCESS or FMOD.ERR_DSP_SILENCE if audio can pass through unprocessed. See remarks for more. If audio is to be processed, outbufferarray must be filled with the expected output format, channel count and mask. */
  DSP_PROCESS_QUERY: number;
  /** Cubic interpolation. Slower than linear interpolation but better quality. */
  DSP_RESAMPLER_CUBIC: number;
  /** Default interpolation method, same as FMOD.DSP_RESAMPLER_LINEAR. */
  DSP_RESAMPLER_DEFAULT: number;
  /** Linear interpolation (default method). Fast and good quality, causes very slight lowpass effect on low frequency sounds. */
  DSP_RESAMPLER_LINEAR: number;
  /** Maximum number of resample methods supported. */
  DSP_RESAMPLER_MAX: number;
  /** No interpolation. High frequency aliasing hiss will be audible depending on the sample rate of the sound. */
  DSP_RESAMPLER_NOINTERP: number;
  /** 5 point spline interpolation. Slowest resampling method but best quality. */
  DSP_RESAMPLER_SPLINE: number;
  /** Provides per channel gain, channel grouping of the input signal which also sets the speaker format for the output signal, and customizable input to output channel routing. See FMOD.DSP_CHANNELMIX for parameter information, Effect reference - Channel Mix for overview. */
  DSP_TYPE_CHANNELMIX: number;
  /** Produces a chorus effect on the sound. See FMOD.DSP_CHORUS for parameter information, Effect reference - Chorus for overview. */
  DSP_TYPE_CHORUS: number;
  /** Dynamic compression (linked/unlinked multi-channel, wideband). See FMOD.DSP_COMPRESSOR for parameter information, Effect reference - Compressor for overview. */
  DSP_TYPE_COMPRESSOR: number;
  /** Convolution reverb. See FMOD.DSP_CONVOLUTIONREVERB for parameter information, Effect reference - Convolution Reverb for overview. */
  DSP_TYPE_CONVOLUTIONREVERB: number;
  /** Produces different delays on individual channels of the sound. See FMOD.DSP_DELAY for parameter information, Effect reference - Delay for overview. */
  DSP_TYPE_DELAY: number;
  /** Distorts the sound. See FMOD.DSP_DISTORTION for parameter information, Effect reference - Distortion for overview. */
  DSP_TYPE_DISTORTION: number;
  /** Produces an echo on the sound and fades out at the desired rate. See FMOD.DSP_ECHO for parameter information, Effect reference - Echo for overview. */
  DSP_TYPE_ECHO: number;
  /** Pans and scales the volume of a unit. See FMOD.DSP_FADER for parameter information, Effect reference - Fader for overview. */
  DSP_TYPE_FADER: number;
  /** Analyzes the signal and provides spectrum information back through getParameter. See FMOD.DSP_FFT for parameter information, Effect reference - FFT for overview. */
  DSP_TYPE_FFT: number;
  /** Produces a flange effect on the sound. See FMOD.DSP_FLANGE for parameter information, Effect reference - Flange for overview. */
  DSP_TYPE_FLANGE: number;
  /** Filters sound using a resonant highpass filter algorithm. Deprecated and will be removed in a future release. See FMOD.DSP_HIGHPASS remarks for parameter information, Effect reference - High Pass for overview. */
  DSP_TYPE_HIGHPASS: number;
  /** Filters sound using a simple highpass with no resonance, but has flexible cutoff and is fast. Deprecated and will be removed in a future release. See FMOD.DSP_HIGHPASS_SIMPLE remarks for parameter information, Effect reference - High Pass Simple for overview. */
  DSP_TYPE_HIGHPASS_SIMPLE: number;
  /** Produces an echo on the sound and fades out at the desired rate as is used in Impulse Tracker. See FMOD.DSP_ITECHO for parameter information, Effect reference - IT Echo for overview. */
  DSP_TYPE_ITECHO: number;
  /** Filters sound using a resonant lowpass filter algorithm that is used in Impulse Tracker, but with limited cutoff range (0 to 8060hz). See FMOD.DSP_ITLOWPASS for parameter information, Effect reference - IT Low Pass for overview. */
  DSP_TYPE_ITLOWPASS: number;
  /** Limits the sound to a certain level. See FMOD.DSP_LIMITER for parameter information, Effect reference - Limiter for overview. */
  DSP_TYPE_LIMITER: number;
  /** Analyzes the loudness and true peak of the signal. */
  DSP_TYPE_LOUDNESS_METER: number;
  /** Filters sound using a high quality, resonant lowpass filter algorithm but consumes more CPU time. Deprecated and will be removed in a future release. See FMOD.DSP_LOWPASS remarks for parameter information, Effect reference - Low Pass for overview. */
  DSP_TYPE_LOWPASS: number;
  /** Filters sound using a simple lowpass with no resonance, but has flexible cutoff and is fast. Deprecated and will be removed in a future release. See FMOD.DSP_LOWPASSSIMPLE remarks for parameter information, Effect reference - Low Pass Simple for overview. */
  DSP_TYPE_LOWPASS_SIMPLE: number;
  /** Maximum number of pre-defined DSP types. */
  DSP_TYPE_MAX: number;
  /** Does not process the signal. Acts as a unit purely for mixing inputs. */
  DSP_TYPE_MIXER: number;
  /** Three-band compressor/expander. See FMOD.DSP_MULTIBAND_DYNAMICS for parameter information, Effect reference - Multiband Dynamics for overview. */
  DSP_TYPE_MULTIBAND_DYNAMICS: number;
  /** Five band parametric equalizer. See FMOD.DSP_MULTIBAND_EQ for parameter information, Effect reference - Multiband Equalizer for overview. */
  DSP_TYPE_MULTIBAND_EQ: number;
  /** Normalizes or amplifies the sound to a certain level. See FMOD.DSP_NORMALIZE for parameter information, Effect reference - Normalize for overview. */
  DSP_TYPE_NORMALIZE: number;
  /** Spatializes input signal by passing it to an external object mixer. See FMOD.DSP_OBJECTPAN for parameter information, Effect reference - Object Panner for overview. */
  DSP_TYPE_OBJECTPAN: number;
  /** Generates sine/square/saw/triangle or noise tones. See FMOD.DSP_OSCILLATOR for parameter information, Effect reference - Oscillator for overview. */
  DSP_TYPE_OSCILLATOR: number;
  /** Pans the signal in 2D or 3D, possibly upmixing or downmixing as well. See FMOD.DSP_PAN for parameter information, Effect reference - Pan for overview. */
  DSP_TYPE_PAN: number;
  /** Attenuates or amplifies a selected frequency range. Deprecated and will be removed in a future release. See FMOD.DSP_PARAMEQ for parameter information, Effect reference - Parametric EQ for overview. */
  DSP_TYPE_PARAMEQ: number;
  /** Bends the pitch of a sound without changing the speed of playback. See FMOD.DSP_PITCHSHIFT for parameter information, Effect reference - Pitch Shifter for overview. */
  DSP_TYPE_PITCHSHIFT: number;
  /** Receives signals from a number of send DSPs. See FMOD.DSP_RETURN for parameter information, Effect reference - Return for overview. */
  DSP_TYPE_RETURN: number;
  /** Sends a copy of the signal to a return DSP anywhere in the DSP tree. See FMOD.DSP_SEND for parameter information, Effect reference - Send for overview. */
  DSP_TYPE_SEND: number;
  /** I3DL2 reverb effect. See FMOD.DSP_SFXREVERB for parameter information, Effect reference - SFX Reverb for overview. */
  DSP_TYPE_SFXREVERB: number;
  /** Three-band equalizer. See FMOD.DSP_THREEEQ for parameter information, Effect reference - Three EQ for overview. */
  DSP_TYPE_THREE_EQ: number;
  /** 'sends' and 'receives' from a selection of up to 32 different slots. It is like a send/return but it uses global slots rather than returns as the destination. It also has other features. Multiple transceivers can receive from a single channel, or multiple transceivers can send to a single channel, or a combination of both. See FMOD.DSP_TRANSCEIVER for parameter information, Effect reference - Transceiver for overview. */
  DSP_TYPE_TRANSCEIVER: number;
  /** Produces a tremolo / chopper effect on the sound. See FMOD.DSP_TREMOLO for parameter information, Effect reference - Tremolo for overview. */
  DSP_TYPE_TREMOLO: number;
  /** Was created via a non-FMOD plug-in and has an unknown purpose. */
  DSP_TYPE_UNKNOWN: number;
  /** Type representing Channel. */
  ERRORCALLBACK_INSTANCETYPE_CHANNEL: number;
  /** Type representing ChannelControl. */
  ERRORCALLBACK_INSTANCETYPE_CHANNELCONTROL: number;
  /** Type representing ChannelGroup. */
  ERRORCALLBACK_INSTANCETYPE_CHANNELGROUP: number;
  /** Type representing DSP. */
  ERRORCALLBACK_INSTANCETYPE_DSP: number;
  /** Type representing DSPConnection. */
  ERRORCALLBACK_INSTANCETYPE_DSPCONNECTION: number;
  /** Type representing Geometry. */
  ERRORCALLBACK_INSTANCETYPE_GEOMETRY: number;
  /** Type representing no known instance type. */
  ERRORCALLBACK_INSTANCETYPE_NONE: number;
  /** Type representing Reverb3D. */
  ERRORCALLBACK_INSTANCETYPE_REVERB3D: number;
  /** Type representing Sound. */
  ERRORCALLBACK_INSTANCETYPE_SOUND: number;
  /** Type representing SoundGroup. */
  ERRORCALLBACK_INSTANCETYPE_SOUNDGROUP: number;
  /** Type representing Studio::Bank. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_BANK: number;
  /** Type representing Studio::Bus. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_BUS: number;
  /** Type representing Studio::CommandReplay. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_COMMANDREPLAY: number;
  /** Type representing Studio::EventDescription. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_EVENTDESCRIPTION: number;
  /** Type representing Studio::EventInstance. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_EVENTINSTANCE: number;
  /** Deprecated. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_PARAMETERINSTANCE: number;
  /** Type representing Studio::System. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_SYSTEM: number;
  /** Type representing Studio::VCA. */
  ERRORCALLBACK_INSTANCETYPE_STUDIO_VCA: number;
  /** Type representing System. */
  ERRORCALLBACK_INSTANCETYPE_SYSTEM: number;
  /** The specified resource is already locked. */
  ERR_ALREADY_LOCKED: number;
  /** Tried to call a function on a data type that does not allow this type of functionality (ie calling Sound::lock on a streaming Sound). */
  ERR_BADCOMMAND: number;
  /** Error trying to allocate a Channel. */
  ERR_CHANNEL_ALLOC: number;
  /** The specified Channel has been reused to play another Sound. */
  ERR_CHANNEL_STOLEN: number;
  /** DMA Failure. See debug output for more information. */
  ERR_DMA: number;
  /** DSP connection error. Connection possibly caused a cyclic dependency or connected DSPs with incompatible buffer counts. */
  ERR_DSP_CONNECTION: number;
  /** DSP return code from a DSP process query callback. Tells mixer not to call the process callback and therefore not consume CPU. Use this to optimize the DSP graph. */
  ERR_DSP_DONTPROCESS: number;
  /** DSP format error. A DSP unit may have attempted to connect to this graph with the wrong format, or a matrix may have been set with the wrong size if the target unit has a specified channel map. */
  ERR_DSP_FORMAT: number;
  /** DSP is already in the mixer's DSP graph. It must be removed before being reinserted or released. */
  ERR_DSP_INUSE: number;
  /** DSP connection error. Couldn't find the DSP unit specified. */
  ERR_DSP_NOTFOUND: number;
  /** DSP operation error. Cannot perform operation on this DSP as it is reserved by the system. */
  ERR_DSP_RESERVED: number;
  /** DSP return code from a DSP process query callback. Tells the mixer silence would be produced from read, so go idle and not consume CPU. Use this to optimize the DSP graph. */
  ERR_DSP_SILENCE: number;
  /** DSP operation cannot be performed on a DSP of this type. */
  ERR_DSP_TYPE: number;
  /** The specified bank has already been loaded. */
  ERR_EVENT_ALREADY_LOADED: number;
  /** The live update connection failed due to the game already being connected. */
  ERR_EVENT_LIVEUPDATE_BUSY: number;
  /** The live update connection failed due to the game data being out of sync with the tool. */
  ERR_EVENT_LIVEUPDATE_MISMATCH: number;
  /** The live update connection timed out. */
  ERR_EVENT_LIVEUPDATE_TIMEOUT: number;
  /** The requested event, parameter, bus or vca could not be found. */
  ERR_EVENT_NOTFOUND: number;
  /** Error loading file. */
  ERR_FILE_BAD: number;
  /** Couldn't perform seek operation. This is a limitation of the medium (ie netstreams) or the file format. */
  ERR_FILE_COULDNOTSEEK: number;
  /** Media was ejected while reading. */
  ERR_FILE_DISKEJECTED: number;
  /** End of current chunk reached while trying to read data. */
  ERR_FILE_ENDOFDATA: number;
  /** End of file unexpectedly reached while trying to read essential data (truncated?). */
  ERR_FILE_EOF: number;
  /** File not found. */
  ERR_FILE_NOTFOUND: number;
  /** Unsupported file or audio format. */
  ERR_FORMAT: number;
  /** There is a version mismatch between the FMOD header and either the FMOD API library or the Core API library. */
  ERR_HEADER_MISMATCH: number;
  /** A HTTP error occurred. This is a catch-all for HTTP errors not listed elsewhere. */
  ERR_HTTP: number;
  /** The specified resource requires authentication or is forbidden. */
  ERR_HTTP_ACCESS: number;
  /** Proxy authentication is required to access the specified resource. */
  ERR_HTTP_PROXY_AUTH: number;
  /** A HTTP server error occurred. */
  ERR_HTTP_SERVER_ERROR: number;
  /** The HTTP request timed out. */
  ERR_HTTP_TIMEOUT: number;
  /** FMOD was not initialized correctly to support this function. */
  ERR_INITIALIZATION: number;
  /** Cannot call this command after System::init. */
  ERR_INITIALIZED: number;
  /** An error occured in the FMOD system. Use the logging version of FMOD for more information. */
  ERR_INTERNAL: number;
  /** Value passed in was a NaN, Inf or denormalized float. */
  ERR_INVALID_FLOAT: number;
  /** An invalid object handle was used. */
  ERR_INVALID_HANDLE: number;
  /** An invalid parameter was passed to this function. */
  ERR_INVALID_PARAM: number;
  /** An invalid seek position was passed to this function. */
  ERR_INVALID_POSITION: number;
  /** An invalid speaker was passed to this function based on the current speaker mode. */
  ERR_INVALID_SPEAKER: number;
  /** An invalid string was passed to this function. */
  ERR_INVALID_STRING: number;
  /** The syncpoint did not come from this Sound handle. */
  ERR_INVALID_SYNCPOINT: number;
  /** Tried to call a function on a thread that is not supported. */
  ERR_INVALID_THREAD: number;
  /** The vectors passed in are not unit length, or perpendicular. */
  ERR_INVALID_VECTOR: number;
  /** Reached maximum audible playback count for this Sound's SoundGroup. */
  ERR_MAXAUDIBLE: number;
  /** Not enough memory or resources. */
  ERR_MEMORY: number;
  /** Can't use FMOD.OPENMEMORY_POINT on non PCM source data, or non mp3/xma/adpcm data if FMOD.CREATECOMPRESSEDSAMPLE was used. */
  ERR_MEMORY_CANTPOINT: number;
  /** Tried to call a command on a 2D Sound when the command was meant for 3D Sound. */
  ERR_NEEDS3D: number;
  /** Tried to use a feature that requires hardware support. */
  ERR_NEEDSHARDWARE: number;
  /** Couldn't connect to the specified host. */
  ERR_NET_CONNECT: number;
  /** A socket error occurred. This is a catch-all for socket-related errors not listed elsewhere. */
  ERR_NET_SOCKET_ERROR: number;
  /** The specified URL couldn't be resolved. */
  ERR_NET_URL: number;
  /** Operation on a non-blocking socket could not complete immediately. */
  ERR_NET_WOULD_BLOCK: number;
  /** Operation could not be performed because specified Sound/DSP connection is not ready. */
  ERR_NOTREADY: number;
  /** The specified resource is not locked, so it can't be unlocked. */
  ERR_NOT_LOCKED: number;
  /** Error initializing output device, but more specifically, the output device is already in use and cannot be reused. */
  ERR_OUTPUT_ALLOCATED: number;
  /** Error creating hardware sound buffer. */
  ERR_OUTPUT_CREATEBUFFER: number;
  /** A call to a standard soundcard driver failed, which could possibly mean a bug in the driver or resources were missing or exhausted. */
  ERR_OUTPUT_DRIVERCALL: number;
  /** Soundcard does not support the specified format. */
  ERR_OUTPUT_FORMAT: number;
  /** Error initializing output device. */
  ERR_OUTPUT_INIT: number;
  /** The output device has no drivers installed. If pre-init, FMOD.OUTPUT_NOSOUND is selected as the output mode. If post-init, the function just fails. */
  ERR_OUTPUT_NODRIVERS: number;
  /** An unspecified error has been returned from a plug-in. */
  ERR_PLUGIN: number;
  /** A requested output, dsp unit type or codec was not available. */
  ERR_PLUGIN_MISSING: number;
  /** A resource that the plug-in requires (e.g.: The DLS file for MIDI playback) cannot be allocated or found. */
  ERR_PLUGIN_RESOURCE: number;
  /** A plug-in was built with an unsupported SDK version. */
  ERR_PLUGIN_VERSION: number;
  /** An error occurred trying to initialize the recording device. */
  ERR_RECORD: number;
  /** The specified recording driver has been disconnected. */
  ERR_RECORD_DISCONNECTED: number;
  /** Reverb properties cannot be set on this Channel because a parent ChannelGroup owns the reverb connection. */
  ERR_REVERB_CHANNELGROUP: number;
  /** Specified instance in FMOD.REVERB_PROPERTIES couldn't be set. Most likely because it is an invalid instance number or the reverb doesn't exist. */
  ERR_REVERB_INSTANCE: number;
  /** The specified resource is not loaded, so it can't be unloaded. */
  ERR_STUDIO_NOT_LOADED: number;
  /** The Studio::System object is not yet initialized. */
  ERR_STUDIO_UNINITIALIZED: number;
  /** The error occurred because the Sound referenced contains subsounds when it shouldn't have, or it doesn't contain subsounds when it should have. The operation may also not be able to be performed on a parent Sound. */
  ERR_SUBSOUNDS: number;
  /** This subsound is already being used by another Sound, you cannot have more than one parent to a Sound. Null out the other parent's entry first. */
  ERR_SUBSOUND_ALLOCATED: number;
  /** Shared subsounds cannot be replaced or moved from their parent stream, such as when the parent stream is an FSB file. */
  ERR_SUBSOUND_CANTMOVE: number;
  /** The specified tag could not be found or there are no tags. */
  ERR_TAGNOTFOUND: number;
  /** The Sound created exceeds the allowable input speaker channel count. This result occurs only when a signal's speaker channel format requires more than 32 channels. */
  ERR_TOOMANYCHANNELS: number;
  /** The length provided exceeds the allowable limit. */
  ERR_TOOMANYSAMPLES: number;
  /** The retrieved string is too long to fit in the supplied buffer and has been truncated. */
  ERR_TRUNCATED: number;
  /** Something in FMOD hasn't been implemented when it should be. Contact support. */
  ERR_UNIMPLEMENTED: number;
  /** This command failed because System::init or System::setDriver was not called. */
  ERR_UNINITIALIZED: number;
  /** A command issued was not supported by this object. Possibly a plug-in without certain callbacks specified. */
  ERR_UNSUPPORTED: number;
  /** The version number of this file format is not supported. */
  ERR_VERSION: number;
  /** Skips id3v2/asf/etc tag checks when opening a Sound, to reduce seek/read overhead when opening files. */
  IGNORETAGS: number;
  /** 3D calculations will be performed in right-handed coordinates, instead of the default of left-handed coordinates. See the Handedness section of the Glossary for more information. */
  INIT_3D_RIGHTHANDED: number;
  /** All FMOD.3D based voices add a software low pass and highpass filter effect into the DSP chain, which acts as a distance-automated bandpass filter. Use System::setAdvancedSettings to adjust the center frequency. */
  INIT_CHANNEL_DISTANCEFILTER: number;
  /** Enables usage of ChannelControl::setLowPassGain, ChannelControl::set3DOcclusion, or automatic usage by the Geometry API. All voices will add a software lowpass filter effect into the DSP chain which is idle unless one of the previous functions/features are used. */
  INIT_CHANNEL_LOWPASS: number;
  /** Enables hard clipping of output values greater than 1.0f or less than -1.0f. */
  INIT_CLIP_OUTPUT: number;
  /** With the geometry engine, only process the closest polygon rather than accumulating all polygons the sound to listener line intersects. */
  INIT_GEOMETRY_USECLOSEST: number;
  /** Enables memory allocation tracking. Currently this is only useful when using the Studio API. Increases memory footprint and reduces performance. This flag is implied by FMOD.STUDIO_INIT_MEMORY_TRACKING. */
  INIT_MEMORY_TRACKING: number;
  /** No mixer thread is created internally. Mixing is driven from System::update. Only applies to polling based output modes such as FMOD.OUTPUTTYPE_NOSOUND, FMOD.OUTPUTTYPE_WAVWRITER. */
  INIT_MIX_FROM_UPDATE: number;
  /** Initialize normally */
  INIT_NORMAL: number;
  /** When using FMOD.SPEAKERMODE_5POINT1 with a stereo output device, use the Dolby Pro Logic II downmix algorithm instead of the default stereo downmix algorithm. */
  INIT_PREFER_DOLBY_DOWNMIX: number;
  /** Enable TCP/IP based host which allows FMOD Studio or FMOD Profiler to connect to it, and view memory, CPU and the DSP graph in real-time. */
  INIT_PROFILE_ENABLE: number;
  /** Slower, but adds level metering for every single DSP unit in the graph. Use DSP::setMeteringEnabled to turn meters off individually. Setting this flag implies FMOD.INIT_PROFILE_ENABLE. */
  INIT_PROFILE_METER_ALL: number;
  /** No stream thread is created internally. Streams are driven from System::update. Mainly used with non-realtime outputs. */
  INIT_STREAM_FROM_UPDATE: number;
  /** Disables thread safety for API calls. Only use this if FMOD is being called from a single thread, and if Studio API is not being used! */
  INIT_THREAD_UNSAFE: number;
  /** Any sounds that are 0 volume will go virtual and not be processed except for having their positions updated virtually. Use System::setAdvancedSettings to adjust what volume besides zero to switch to virtual at. */
  INIT_VOL0_BECOMES_VIRTUAL: number;
  /** For bidirectional looping Sounds. (only works on non-streaming, real voices). */
  LOOP_BIDI: number;
  /** For forward looping Sounds. */
  LOOP_NORMAL: number;
  /** For non looping Sounds. (DEFAULT). Overrides FMOD.LOOP_NORMAL / FMOD.LOOP_BIDI. */
  LOOP_OFF: number;
  /** Removes some features from samples to give a lower memory overhead, like Sound::getName. */
  LOWMEM: number;
  /** Mask specifying all memory types. */
  MEMORY_ALL: number;
  /** Deprecated. */
  MEMORY_DSP_BUFFER: number;
  /** Standard memory. */
  MEMORY_NORMAL: number;
  /** Persistent memory. Memory will be freed when System::release is called. */
  MEMORY_PERSISTENT: number;
  /** Memory allocated by a third party plugin. */
  MEMORY_PLUGIN: number;
  /** Sample data buffer. Raw audio data, usually PCM/MPEG/ADPCM/XMA data. */
  MEMORY_SAMPLEDATA: number;
  /** Stream decode buffer, size controllable with FMOD.CREATESOUNDEXINFO::decodebuffersize. */
  MEMORY_STREAM_DECODE: number;
  /** Stream file buffer, size controllable with System::setStreamBufferSize. */
  MEMORY_STREAM_FILE: number;
  /** For corrupted / bad MP3 files. This will search all the way through the file until it hits a valid MPEG header. Normally only searches for 4k. */
  MPEGSEARCH: number;
  /** For opening Sounds and getting streamed subsounds (seeking) asynchronously. Use Sound::getOpenState to poll the state of the Sound as it opens or retrieves the subsound in the background. */
  NONBLOCKING: number;
  /** No errors. */
  OK: number;
  /** When used, the first argument of System::createSound and System::createStream, nameordata, is interpreted as a pointer to memory instead of filename for creating sounds. The following data must be provided using FMOD.CREATESOUNDEXINFO: cbsize, and length. If used with FMOD.CREATESAMPLE or FMOD.CREATECOMPRESSEDSAMPLE, FMOD duplicates the memory into its own buffers. Your own buffer can be freed after open, unless you are using FMOD.NONBLOCKING then wait until the Sound is in the FMOD.OPENSTATE_READY state. If used with FMOD.CREATESTREAM, FMOD will stream out of the buffer whose pointer you passed in. In this case, your own buffer should not be freed until you have finished with and released the stream. */
  OPENMEMORY: number;
  /** When used, the first argument of System::createSound and System::createStream, nameordata, is interpreted as a pointer to memory instead of filename for creating sounds. The following data must be provided using FMOD.CREATESOUNDEXINFO: cbsize, and length. This differs to FMOD.OPENMEMORY in that it uses the memory as is, without duplicating the memory into its own buffers. Cannot be freed after open, only after Sound::release. Will not work if the data is compressed and FMOD.CREATECOMPRESSEDSAMPLE is not used. Cannot be used in conjunction with FMOD.CREATESOUNDEXINFO::encryptionkey. */
  OPENMEMORY_POINT: number;
  /** Just open the file, don't prebuffer or read. Good for fast opens for info, or when Sound::readData is to be used. */
  OPENONLY: number;
  /** Will ignore file format and treat as raw PCM. The following data must be provided using FMOD.CREATESOUNDEXINFO: cbsize, numchannels, defaultfrequency, and format. Must be little endian data, and integer data must also be signed. */
  OPENRAW: number;
  /** Buffering data. */
  OPENSTATE_BUFFERING: number;
  /** Connecting to remote host (internet sounds only). */
  OPENSTATE_CONNECTING: number;
  /** Failed to open - file not found, out of memory etc. See return value of Sound::getOpenState for what happened. */
  OPENSTATE_ERROR: number;
  /** Initial load in progress. */
  OPENSTATE_LOADING: number;
  /** Maximum number of open state types. */
  OPENSTATE_MAX: number;
  /** Ready and playing, but not possible to release at this time without stalling the main thread. */
  OPENSTATE_PLAYING: number;
  /** Opened and ready to play. */
  OPENSTATE_READY: number;
  /** Seeking to subsound and re-flushing stream buffer. */
  OPENSTATE_SEEKING: number;
  /** Seeking within a stream to a different position. */
  OPENSTATE_SETPOSITION: number;
  /** Opens a user-created static sample or stream. When used, the first argument of System::createSound and System::createStream, nameordata, is ignored, so recommended practice is to pass null or equivalent. The following data must be provided using FMOD.CREATESOUNDEXINFO: cbsize, length, numchannels, defaultfrequency, format, and optionally readcallback. If a user-created 'sample' is created with no read callback, the sample will be empty. If this is the case, use Sound::lock and Sound::unlock to place sound data into the Sound. */
  OPENUSER: number;
  /** Android - AAudio. (Default on Android 8.1 and above) */
  OUTPUTTYPE_AAUDIO: number;
  /** Linux - Advanced Linux Sound Architecture. (Default on Linux if PulseAudio isn't available) */
  OUTPUTTYPE_ALSA: number;
  /** Win - Low latency ASIO 2.0. */
  OUTPUTTYPE_ASIO: number;
  /** PS4 - Audio3D. */
  OUTPUTTYPE_AUDIO3D: number;
  /** PS4 / PS5 - Audio Out. (Default on PS4, PS5) */
  OUTPUTTYPE_AUDIOOUT: number;
  /** Android - Java Audio Track. (Default on Android 2.2 and below) */
  OUTPUTTYPE_AUDIOTRACK: number;
  /** HTML5 - Web Audio AudioWorkletNode output. (Default on non pthread HTML5 if available) */
  OUTPUTTYPE_AUDIOWORKLET: number;
  /** HTML5 - Web Audio pthread AudioWorkletNode output. (Default on pthread HTML5 if available) */
  OUTPUTTYPE_AUDIOWORKLETP: number;
  /** Picks the best output mode for the platform. This is the default. */
  OUTPUTTYPE_AUTODETECT: number;
  /** Mac / iOS - Core Audio. (Default on Mac and iOS) */
  OUTPUTTYPE_COREAUDIO: number;
  /** Maximum number of output types supported. */
  OUTPUTTYPE_MAX: number;
  /** Switch - nn::audio. (Default on Switch) */
  OUTPUTTYPE_NNAUDIO: number;
  /** All - Perform all mixing but discard the final output. */
  OUTPUTTYPE_NOSOUND: number;
  /** All - Non-realtime version of FMOD.OUTPUTTYPE_NOSOUND, one mix per System::update. */
  OUTPUTTYPE_NOSOUND_NRT: number;
  /** OpenHarmony - OHAudio. */
  OUTPUTTYPE_OHAUDIO: number;
  /** Android - OpenSL ES. (Default on Android 2.3 up to 7.1) */
  OUTPUTTYPE_OPENSL: number;
  /** iOS - PHASE framework. (Disabled) */
  OUTPUTTYPE_PHASE: number;
  /** Linux - Pulse Audio. (Default on Linux if available) */
  OUTPUTTYPE_PULSEAUDIO: number;
  /** All - 3rd party plug-in, unknown. This is for use with System::getOutput only. */
  OUTPUTTYPE_UNKNOWN: number;
  /** Win / Game Core - Windows Audio Session API. (Default on Windows and Game Core) */
  OUTPUTTYPE_WASAPI: number;
  /** All - Writes output to a .wav file. */
  OUTPUTTYPE_WAVWRITER: number;
  /** All - Non-realtime version of FMOD.OUTPUTTYPE_WAVWRITER, one mix per System::update. */
  OUTPUTTYPE_WAVWRITER_NRT: number;
  /** HTML5 - Web Audio ScriptProcessorNode output. (Default on HTML5 if AudioWorkletNode isn't available) */
  OUTPUTTYPE_WEBAUDIO: number;
  /** Win10 / Xbox One / Game Core - Windows Sonic. */
  OUTPUTTYPE_WINSONIC: number;
  /** File format codec plug-in represented with FMOD.CODEC_DESCRIPTION. */
  PLUGINTYPE_CODEC: number;
  /** DSP unit plug-in represented with FMOD.DSP_DESCRIPTION. */
  PLUGINTYPE_DSP: number;
  /** Maximum number of plug-in types supported. */
  PLUGINTYPE_MAX: number;
  /** Audio output interface plug-in represented with FMOD.OUTPUT_DESCRIPTION. */
  PLUGINTYPE_OUTPUT: number;
  /** Excess sounds will fail when calling System::playSound. */
  SOUNDGROUP_BEHAVIOR_FAIL: number;
  /** Maximum number of SoundGroup behaviors. */
  SOUNDGROUP_BEHAVIOR_MAX: number;
  /** Excess sounds will begin mute and will become audible when sufficient sounds are stopped. */
  SOUNDGROUP_BEHAVIOR_MUTE: number;
  /** Excess sounds will steal from the quietest Sound playing in the group. */
  SOUNDGROUP_BEHAVIOR_STEALLOWEST: number;
  /** Sound data is in its native compressed format. See FMOD.CREATECOMPRESSEDSAMPLE */
  SOUND_FORMAT_BITSTREAM: number;
  /** Maximum number of sound formats supported. */
  SOUND_FORMAT_MAX: number;
  /** Uninitalized / unknown. */
  SOUND_FORMAT_NONE: number;
  /** 16bit integer PCM data. */
  SOUND_FORMAT_PCM16: number;
  /** 24bit integer PCM data. */
  SOUND_FORMAT_PCM24: number;
  /** 32bit integer PCM data. */
  SOUND_FORMAT_PCM32: number;
  /** 8bit integer PCM data. */
  SOUND_FORMAT_PCM8: number;
  /** 32bit floating point PCM data. */
  SOUND_FORMAT_PCMFLOAT: number;
  /** Audio Interchange File Format (.aif, .aiff). Uncompressed integer formats only. */
  SOUND_TYPE_AIFF: number;
  /** Microsoft Advanced Systems Format (.asf, .wma, .wmv). Platform provided decoder, available only on Windows. */
  SOUND_TYPE_ASF: number;
  /** Sony ATRAC9 bit-stream supported by FSB (.fsb) container format. Platform provided decoder, available only on PlayStation. */
  SOUND_TYPE_AT9: number;
  /** Apple Audio Queue decoder (.mp4, .m4a, .mp3). Supported encodings: AAC, ALAC, MP3. Platform provided decoder, available only on iOS / tvOS devices. */
  SOUND_TYPE_AUDIOQUEUE: number;
  /** Downloadable Sound (.dls). Multi-sound bank format used by MIDI (.mid). */
  SOUND_TYPE_DLS: number;
  /** FMOD Adaptive Differential Pulse Code Modulation bit-stream supported by FSB (.fsb) container format. */
  SOUND_TYPE_FADPCM: number;
  /** Free Lossless Audio Codec (.flac). */
  SOUND_TYPE_FLAC: number;
  /** FMOD Sample Bank (.fsb). Proprietary multi-sound bank format. Supported encodings: PCM16, FADPCM, Vorbis, AT9, XMA, Opus. */
  SOUND_TYPE_FSB: number;
  /** Impulse Tracker (.it). */
  SOUND_TYPE_IT: number;
  /** Maximum number of sound types supported. */
  SOUND_TYPE_MAX: number;
  /** Google Media Codec decoder (.m4a, .mp4). Platform provided decoder, available only on Android. */
  SOUND_TYPE_MEDIACODEC: number;
  /** Musical Instrument Digital Interface (.mid). */
  SOUND_TYPE_MIDI: number;
  /** Protracker / Fasttracker Module File (.mod). */
  SOUND_TYPE_MOD: number;
  /** Moving Picture Experts Group (.mp2, .mp3). Also supports .wav (RIFF) container format. */
  SOUND_TYPE_MPEG: number;
  /** Ogg Vorbis (.ogg). */
  SOUND_TYPE_OGGVORBIS: number;
  /** Opus bit-stream supported by FSB (.fsb) container format. Platform provided decoder, available only on Xbox Series X|S, PS5, and Switch. */
  SOUND_TYPE_OPUS: number;
  /** Play list information container (.asx, .pls, .m3u, .wax). No audio, tags only. */
  SOUND_TYPE_PLAYLIST: number;
  /** Raw uncompressed PCM data (.raw). */
  SOUND_TYPE_RAW: number;
  /** ScreamTracker 3 Module (.s3m). */
  SOUND_TYPE_S3M: number;
  /** Unknown or custom codec plug-in. */
  SOUND_TYPE_UNKNOWN: number;
  /** User created sound. */
  SOUND_TYPE_USER: number;
  /** Vorbis bit-stream supported by FSB (.fsb) container format. */
  SOUND_TYPE_VORBIS: number;
  /** Microsoft Waveform Audio File Format (.wav). Supported encodings: Uncompressed PCM, IMA ADPCM. Platform provided ACM decoder extensions, available only on Windows. */
  SOUND_TYPE_WAV: number;
  /** FastTracker 2 Extended Module (.xm). */
  SOUND_TYPE_XM: number;
  /** Microsoft XMA bit-stream supported by FSB (.fsb) container format. Platform provided decoder, available only on Xbox. */
  SOUND_TYPE_XMA: number;
  /** 6 speaker setup (5.1) front left, front right, center, low frequency, surround left, surround right. */
  SPEAKERMODE_5POINT1: number;
  /** 8 speaker setup (7.1) front left, front right, center, low frequency, surround left, surround right, back left, back right. */
  SPEAKERMODE_7POINT1: number;
  /** 12 speaker setup (7.1.4) front left, front right, center, low frequency, surround left, surround right, back left, back right, top front left, top front right, top back left, top back right. */
  SPEAKERMODE_7POINT1POINT4: number;
  /** Default speaker mode for the chosen output mode which will resolve after System::init. */
  SPEAKERMODE_DEFAULT: number;
  /** Maximum number of speaker modes supported. */
  SPEAKERMODE_MAX: number;
  /** 1 speaker setup (monaural). */
  SPEAKERMODE_MONO: number;
  /** 4 speaker setup (4.0) front left, front right, surround left, surround right. */
  SPEAKERMODE_QUAD: number;
  /** Assume there is no special mapping from a given channel to a speaker, channels map 1:1 in order. Use System::setSoftwareFormat to specify the speaker count. */
  SPEAKERMODE_RAW: number;
  /** 2 speaker setup (stereo) front left, front right. */
  SPEAKERMODE_STEREO: number;
  /** 5 speaker setup (5.0) front left, front right, center, surround left, surround right. */
  SPEAKERMODE_SURROUND: number;
  /** The back left speaker */
  SPEAKER_BACK_LEFT: number;
  /** The back right speaker */
  SPEAKER_BACK_RIGHT: number;
  /** The front center speaker */
  SPEAKER_FRONT_CENTER: number;
  /** The front left speaker */
  SPEAKER_FRONT_LEFT: number;
  /** The front right speaker */
  SPEAKER_FRONT_RIGHT: number;
  /** The LFE or 'subwoofer' speaker */
  SPEAKER_LOW_FREQUENCY: number;
  /** Maximum number of speaker types supported. */
  SPEAKER_MAX: number;
  /** No speaker */
  SPEAKER_NONE: number;
  /** The surround left (usually to the side) speaker */
  SPEAKER_SURROUND_LEFT: number;
  /** The surround right (usually to the side) speaker */
  SPEAKER_SURROUND_RIGHT: number;
  /** The top back left speaker */
  SPEAKER_TOP_BACK_LEFT: number;
  /** The top back right speaker */
  SPEAKER_TOP_BACK_RIGHT: number;
  /** The top front left speaker */
  SPEAKER_TOP_FRONT_LEFT: number;
  /** The top front right speaker */
  SPEAKER_TOP_FRONT_RIGHT: number;
  /** Mask representing all callback types. */
  SYSTEM_CALLBACK_ALL: number;
  /** Deprecated. */
  SYSTEM_CALLBACK_BADDSPCONNECTION: number;
  /** Called from the feeder thread after audio was consumed from the ring buffer, but not enough to allow another mix to run. */
  SYSTEM_CALLBACK_BUFFEREDNOMIX: number;
  /** Called from System::update when the enumerated list of devices has changed. Called from the main (calling) thread when set from the Core API or Studio API in synchronous mode, and from the Studio Update Thread when in default / async mode. */
  SYSTEM_CALLBACK_DEVICELISTCHANGED: number;
  /** Deprecated. */
  SYSTEM_CALLBACK_DEVICELOST: number;
  /** Called from System::update when an output device is re-initialized. Called from the main (calling) thread when set from the Core API or Studio API in synchronous mode, and from the Studio Update Thread when in default / async mode. */
  SYSTEM_CALLBACK_DEVICEREINITIALIZE: number;
  /** Called directly when an API function returns an error, including delayed async functions. */
  SYSTEM_CALLBACK_ERROR: number;
  /** Called directly when a memory allocation fails. */
  SYSTEM_CALLBACK_MEMORYALLOCATIONFAILED: number;
  /** Called from the mixer thread when the device output attempts to read more samples than are available in the output buffer. */
  SYSTEM_CALLBACK_OUTPUTUNDERRUN: number;
  /** Called from the mixer thread after it finishes a block. */
  SYSTEM_CALLBACK_POSTMIX: number;
  /** Called at end of System::update from the main (calling) thread when set from the Core API or Studio API in synchronous mode, and from the Studio Update Thread when in default / async mode. */
  SYSTEM_CALLBACK_POSTUPDATE: number;
  /** Called from the mixer thread before it starts the next block. */
  SYSTEM_CALLBACK_PREMIX: number;
  /** Called at start of System::update from the main (calling) thread when set from the Core API or Studio API in synchronous mode, and from the Studio Update Thread when in default / async mode. */
  SYSTEM_CALLBACK_PREUPDATE: number;
  /** Called from System::update when the enumerated list of recording devices has changed. Called from the main (calling) thread when set from the Core API or Studio API in synchronous mode, and from the Studio Update Thread when in default / async mode. */
  SYSTEM_CALLBACK_RECORDLISTCHANGED: number;
  /** Called from the mixer thread when the System record position changed. */
  SYSTEM_CALLBACK_RECORDPOSITIONCHANGED: number;
  /** Called from the game thread when a thread is created. */
  SYSTEM_CALLBACK_THREADCREATED: number;
  /** Called from the game thread when a thread is destroyed. */
  SYSTEM_CALLBACK_THREADDESTROYED: number;
  /** Raw binary data. see FMOD.TAG structure for length of data in bytes. */
  TAGDATATYPE_BINARY: number;
  /** IEEE floating point number. See FMOD.TAG structure to confirm if the float data is 32bit or 64bit (4 vs 8 bytes). */
  TAGDATATYPE_FLOAT: number;
  /** Integer - Note this integer could be 8bit / 16bit / 32bit / 64bit. See FMOD.TAG structure for integer size (1 vs 2 vs 4 vs 8 bytes). */
  TAGDATATYPE_INT: number;
  /** Maximum number of tag datatypes supported. */
  TAGDATATYPE_MAX: number;
  /** 8bit ASCII char string. See FMOD.TAG structure for string length in bytes. */
  TAGDATATYPE_STRING: number;
  /** 16bit UTF string. Assume little endian byte order. See FMOD.TAG structure for string length in bytes. */
  TAGDATATYPE_STRING_UTF16: number;
  /** 16bit UTF string Big endian byte order. See FMOD.TAG structure for string length in bytes. */
  TAGDATATYPE_STRING_UTF16BE: number;
  /** 8 bit UTF string. See FMOD.TAG structure for string length in bytes. */
  TAGDATATYPE_STRING_UTF8: number;
  /** Advanced Systems Format metadata typically associated with Windows Media formats such as WMA. */
  TAGTYPE_ASF: number;
  /** Tag type used by FMOD's MIDI, MOD, S3M, XM, IT format support, and netstreams to notify of internet stream events like a sample rate change. */
  TAGTYPE_FMOD: number;
  /** Icecast internet stream metadata which can be issued during playback. */
  TAGTYPE_ICECAST: number;
  /** MP3 ID3 Tag 1.0. Typically 1 tag stored 128 bytes from end of an MP3 file. */
  TAGTYPE_ID3V1: number;
  /** MP3 ID3 Tag 2.0. Variable length tags with more than 1 possible. */
  TAGTYPE_ID3V2: number;
  /** Maximum number of tag types supported. */
  TAGTYPE_MAX: number;
  /** Metadata stored inside a MIDI file. */
  TAGTYPE_MIDI: number;
  /** Playlist files such as PLS,M3U,ASX and WAX will populate playlist information through this tag type. */
  TAGTYPE_PLAYLIST: number;
  /** SHOUTcast internet stream metadata which can be issued during playback. */
  TAGTYPE_SHOUTCAST: number;
  /** Tag type that is not recognized by FMOD */
  TAGTYPE_UNKNOWN: number;
  /** For codec developers, this tag type can be used with FMOD.CODEC_METADATA_FUNC to generate custom metadata. */
  TAGTYPE_USER: number;
  /** Metadata container used in Vorbis, FLAC, Theora, Speex and Opus file formats. */
  TAGTYPE_VORBISCOMMENT: number;
  /** Thread responsible for mixing and processing blocks of audio. */
  THREAD_TYPE_MIXER: number;
  /** Thread used by some output plug-ins for transferring buffered audio from FMOD.THREAD_TYPE_MIXER to the sound output device. */
  THREAD_TYPE_FEEDER: number;
  /** Thread that decodes compressed audio to PCM for Sounds created as FMOD.CREATESTREAM. */
  THREAD_TYPE_STREAM: number;
  /** Thread that reads compressed audio from disk to be consumed by FMOD.THREAD_TYPE_STREAM. */
  THREAD_TYPE_FILE: number;
  /** Thread that processes the creation of Sounds asynchronously when opened with FMOD.NONBLOCKING. */
  THREAD_TYPE_NONBLOCKING: number;
  /** Thread used by some output plug-ins for transferring audio from a microphone to FMOD.THREAD_TYPE_MIXER. */
  THREAD_TYPE_RECORD: number;
  /** Thread used by the Geometry system for performing background calculations. */
  THREAD_TYPE_GEOMETRY: number;
  /** Thread for network communication when using FMOD.INIT_PROFILE_ENABLE. */
  THREAD_TYPE_PROFILER: number;
  /** Thread for processing Studio API commands and scheduling sound playback. */
  THREAD_TYPE_STUDIO_UPDATE: number;
  /** Thread for asynchronously loading Studio::Bank metadata. */
  THREAD_TYPE_STUDIO_LOAD_BANK: number;
  /** Thread for asynchronously loading Studio::Bank sample data. */
  THREAD_TYPE_STUDIO_LOAD_SAMPLE: number;
  /** Thread for processing medium size delay lines for FMOD.DSP_TYPE_CONVOLUTIONREVERB. */
  THREAD_TYPE_CONVOLUTION1: number;
  /** Thread for processing larger size delay lines for FMOD.DSP_TYPE_CONVOLUTIONREVERB. */
  THREAD_TYPE_CONVOLUTION2: number;
  /** Maximum number of thread types supported. */
  THREAD_TYPE_MAX: number;
  /** MOD/S3M/XM/IT. Order in a sequenced module format. Use Sound::getFormat to determine the PCM format being decoded to. */
  TIMEUNIT_MODORDER: number;
  /** MOD/S3M/XM/IT. Current pattern in a sequenced module format. Cannot use with Channel::setPosition. Sound::getLength will return the number of patterns in the song and Channel::getPosition will return the currently playing pattern. */
  TIMEUNIT_MODPATTERN: number;
  /** MOD/S3M/XM/IT. Current row in a sequenced module format. Cannot use with Channel::setPosition. Sound::getLength will return the number of rows in the currently playing or seeked to pattern. */
  TIMEUNIT_MODROW: number;
  /** Milliseconds. */
  TIMEUNIT_MS: number;
  /** PCM samples, related to milliseconds samplerate / 1000. */
  TIMEUNIT_PCM: number;
  /** Bytes, related to PCM samples channels datawidth (ie 16bit = 2 bytes). */
  TIMEUNIT_PCMBYTES: number;
  /** Fractions of 1 PCM sample. Unsigned int range 0 to 0xFFFFFFFF. Used for sub-sample granularity for DSP purposes. */
  TIMEUNIT_PCMFRACTION: number;
  /** Raw file bytes of (compressed) sound data (does not include headers). Only used by Sound::getLength and Channel::getPosition. */
  TIMEUNIT_RAWBYTES: number;
  /** Unique Sound, can only be played one at a time. */
  UNIQUE: number;
  /** For Channels that start virtual (due to being quiet or low importance), instead of swapping back to audible, and playing at the correct offset according to time, this flag makes the Channel play from the start. */
  VIRTUAL_PLAYFROMSTART: number;
  /** Ignores any 3d processing. (DEFAULT). */
  _2D: number;
  /** Makes the Sound, Channel or ChannelGroup positionable in 3D. Overrides FMOD.2D. */
  _3D: number;
  /** This sound follow a roll-off model defined by Sound::set3DCustomRolloff / ChannelControl::set3DCustomRolloff. This roll-off mode provides greater freedom and flexibility than any other, but must be defined manually. */
  _3D_CUSTOMROLLOFF: number;
  /** Make the Sound's position, velocity and orientation relative to the listener. */
  _3D_HEADRELATIVE: number;
  /** Is not affected by geometry occlusion.  If not specified in Sound::setMode, or ChannelControl::setMode, the flag is cleared and it is affected by geometry again. */
  _3D_IGNOREGEOMETRY: number;
  /** This sound follows an inverse roll-off model. Below `mindistance`, the volume is unattenuated; as `distance` increases above `mindistance`, the volume attenuates using `mindistance/distance` as the gradient until it reaches `maxdistance`, where it stops attenuating. For this roll-off mode, distance values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). This roll-off mode accurately models the way sounds attenuate over distance in the real world. (DEFAULT) */
  _3D_INVERSEROLLOFF: number;
  /** This sound follows a combination of the inverse and linear-square roll-off models. At short distances where inverse roll-off would provide greater attenuation, it functions as inverse roll-off mode; then at greater distances where linear-square roll-off mode would provide greater attenuation, it uses that roll-off mode instead. For this roll-off mode, distance values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). Inverse tapered roll-off mode approximates realistic behavior while still guaranteeing the sound attenuates to silence at `maxdistance`. */
  _3D_INVERSETAPEREDROLLOFF: number;
  /** This sound follows a linear roll-off model. Below `mindistance`, the volume is unattenuated; as `distance` increases from `mindistance` to `maxdistance`, the volume attenuates to silence using a linear gradient. For this roll-off mode, distance values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). While this roll-off mode is not as realistic as inverse roll-off mode, it is easier to comprehend. */
  _3D_LINEARROLLOFF: number;
  /** This sound follows a linear-square roll-off model. Below `mindistance`, the volume is unattenuated; as `distance` increases from `mindistance` to `maxdistance`, the volume attenuates to silence according to a linear squared gradient. For this roll-off mode, `distance` values greater than `mindistance` are scaled according to the [rolloffscale](core-api-system.html#system_set3dsettings). This roll-off mode provides steeper volume ramping close to the `mindistance`, and more gradual ramping close to the `maxdistance`, than linear roll-off mode. */
  _3D_LINEARSQUAREROLLOFF: number;
  /** Make the Sound's position, velocity and orientation absolute (relative to the world). (DEFAULT) */
  _3D_WORLDRELATIVE: number;
}

export interface InitOptions {
  /** Run before the module starts; receives the FMOD object. */
  preRun?: Array<(mod: FMOD) => void> | ((mod: FMOD) => void);
  INITIAL_MEMORY?: number;
  window?: Window;
}

export namespace FMOD {
  export type RESULT = number;
  export type DEBUG_FLAGS = number;
  export type CHANNELCONTROL_TYPE = number;
  export type CHANNELCONTROL_CALLBACK_TYPE = number;
  export type INITFLAGS = number;

  // ===== Global declarations (non-functions) =====
  export type CHANNELCONTROL_CALLBACK = (
    channel: Channel,
    controltype: CHANNELCONTROL_TYPE,
    callbacktype: CHANNELCONTROL_CALLBACK_TYPE,
    commanddata1: any,
    commanddata2: any
  ) => void

  /** Structure describing a position, velocity and orientation. */
  export interface _3D_ATTRIBUTES
  {
    position?: {x?:number, y?:number, z?:number};
    velocity?: {x?:number, y?:number, z?:number};
    forward?: {x?:number, y?:number, z?:number};
    up?: {x?:number, y?:number, z?:number};
  }

  /** Performance information for Core API functionality. */
  export interface CPU_USAGE
  {
      dsp: number;
      stream: number;
      geometry: number;
      update: number;
      convolution1: number;
      convolution2: number;
  }

  /** Structure describing a globally unique identifier. */
  export interface GUID {
    Data1: number;
    Data2: number;
    Data3: number;
    Data4: Array<number>;
  }

  /** Named marker for a given point in time. */
  export interface SYNCPOINT {

  }

  /** Structure describing a point in 3D space. */
  export interface VECTOR {
    x?: number;
    y?: number;
    z?: number;
  }

  /** Complex number structure. */
  export interface COMPLEX
  {
    real: number;
    imag: number;
  }

  export type MEMORY_TYPE = number;

  export type DSP_ALLOC_FUNC = (
      size: number,
      type: MEMORY_TYPE,
      sourcestr: string
  ) => number

  export type CHANNELMASK = number;
  export type SPEAKERMODE = number;

  /** Structure for input and output buffers. */
  export interface DSP_BUFFER {
    numchannels: number;
    buffer: number;
    speakermode: SPEAKERMODE;
  }
  export type DSP_CREATE_CALLBACK = (
      dsp_state: DSP_STATE
  ) => void

  /** DSP mode types. */
  export type DSP_MODE = number;

  /** DSP description. */
  export interface DSP_DESCRIPTION
  {
    pluginsdkversion: number;
    name?: string;
    version?: number;
    mode?: DSP_MODE;
    defaultcooldown?: number;
    inchannels?: number;
    outchannels?: number;
    create?: DSP_CREATE_CALLBACK;
    release?: DSP_RELEASE_CALLBACK;
    reset?: DSP_RESET_CALLBACK;
    process?: DSP_PROCESS_CALLBACK;
    setposition?: DSP_SETPOSITION_CALLBACK;
    numparameters?: number;
    paramdesc?: Array<DSP_PARAMETER_DESC>;
    setparameterfloat?: DSP_SETPARAM_FLOAT_CALLBACK;
    setparameterint?: DSP_SETPARAM_INT_CALLBACK;
    setparameterbool?: DSP_SETPARAM_BOOL_CALLBACK;
    setparameterdata?: DSP_SETPARAM_DATA_CALLBACK;
    getparameterfloat?: DSP_GETPARAM_FLOAT_CALLBACK;
    getparameterint?: DSP_GETPARAM_INT_CALLBACK;
    getparameterbool?: DSP_GETPARAM_BOOL_CALLBACK;
    getparameterdata?: DSP_GETPARAM_DATA_CALLBACK;
    userdata?: any;
    sys_register?: DSP_SYSTEM_REGISTER_CALLBACK;
    sys_deregister?: DSP_SYSTEM_DEREGISTER_CALLBACK;
    sys_mix?: DSP_SYSTEM_MIX_CALLBACK;
  }
  export type DSP_FREE_FUNC = (
      ptr: number,
      type: MEMORY_TYPE,
      sourcestr: string
  ) => void
  export type DSP_GETBLOCKSIZE_FUNC = (
      dsp_state: DSP_STATE
  ) => number
  export type DSP_GETCLOCK_FUNC = (
      dsp_state: DSP_STATE
  ) => { clock: number, offset: number, length:number }
  export type DSP_GETLISTENERATTRIBUTES_FUNC = (
      dsp_state: DSP_STATE
  ) => { numlisteners: number, attributes: _3D_ATTRIBUTES }
  export type DSP_GETPARAM_BOOL_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number
  ) => { value: boolean, valuestr: string } | undefined
  export type DSP_GETPARAM_DATA_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number
  ) => { data: any, length: number, valuestr?: string } | undefined
  export type DSP_GETPARAM_FLOAT_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number
  ) => { value: number, valuestr: string } | undefined
  export type DSP_GETPARAM_INT_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number
  ) => { value: number, valuestr: string } | undefined
  export type DSP_GETSAMPLERATE_FUNC = (
      dsp_state: DSP_STATE
  ) => number
  export type DSP_GETSPEAKERMODE_FUNC = (
      dsp_state: DSP_STATE
  ) => { speakermode_mixer: SPEAKERMODE, speakermode_output: SPEAKERMODE }
  export type DSP_LOG_FUNC = (
      level: DEBUG_FLAGS,
      file: string,
      line: number,
      functionname: string,
      str: string
  ) => void
  export type DSP_GETUSERDATA_FUNC = (
      dsp_state: DSP_STATE
  ) => any 
  /** Function to get the time in samples this DSP has been idle. */
  export type DSP_GETIDLETIME_FUNC = (
      dsp_state: DSP_STATE
  ) => number
  /** Function to set the cooldown state of the DSP. */
  export type DSP_SETCOOLDOWN_FUNC = (
      dsp_state: DSP_STATE,
      cooldown: number
  ) => void
  /** Function to set the bypass state of the DSP. */
  export type DSP_SETBYPASS_FUNC = (
      dsp_state: DSP_STATE,
      bypass: boolean
  ) => void
  /** Function to signal to the mixer that the output of DSP_PROCESS_CALLBACK will be silence. */
  export type DSP_SETSILENCE_FUNC = (
      dsp_state: DSP_STATE,
      silence: boolean
  ) => void
  export type DSP_SETOUTPUTFORMAT_FUNC = (
      dsp_state: DSP_STATE,
      channels: number,
      speakermode: SPEAKERMODE
  ) => void

  /** DSP metering info. */
  export interface DSP_METERING_INFO
  {
    numsamples: number;
    peaklevel: Array<number>;
    rmslevel: Array<number>;
    numchannels: number;
  }

  /** DSP parameter types. */
  export type DSP_PARAMETER_TYPE = number;

  /** Base structure for DSP parameter descriptions. */
  export interface DSP_PARAMETER_DESC {
    type: DSP_PARAMETER_TYPE;
    name: string;
    label: string;
    description: string;
    floatdesc?: DSP_PARAMETER_DESC_FLOAT;
    intdesc?: DSP_PARAMETER_DESC_INT;
    booldesc?: DSP_PARAMETER_DESC_BOOL;
    datadesc?: DSP_PARAMETER_DESC_DATA;
  }

  /** DSP float parameter mappings. These determine how values are mapped across dials and automation curves. */
  export type DSP_PARAMETER_FLOAT_MAPPING_TYPE = number;

  /** Structure to define a mapping for a DSP unit's float parameter. */
  export interface DSP_PARAMETER_FLOAT_MAPPING {
    type: DSP_PARAMETER_FLOAT_MAPPING_TYPE;
    piecewiselinearmapping?: DSP_PARAMETER_FLOAT_MAPPING_PIECEWISE_LINEAR;
  }
  /** Structure to define a piecewise linear mapping. */
  export interface DSP_PARAMETER_FLOAT_MAPPING_PIECEWISE_LINEAR {
    numpoints: number;
    pointparamvalues: Array<number>;
    pointpositions: Array<number>;
  }

  /** Process operation type. */
  export type DSP_PROCESS_OPERATION = number;

  export type DSP_PROCESS_CALLBACK = (
    dsp_state : DSP_STATE,
    length: number,
    inbufferarray: DSP_BUFFER,
    outbufferarray: DSP_BUFFER,
  ) => void

  export type DSP_REALLOC_FUNC = (
      ptr: number,
      size: number,
      type: MEMORY_TYPE,
      sourcestr: string
  ) => number
  export type DSP_RELEASE_CALLBACK = (
      dsp_state: DSP_STATE
  ) => void
  export type DSP_RESET_CALLBACK = (
      dsp_state: DSP_STATE
  ) => void
  export type DSP_SETPARAM_BOOL_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number,
      value: boolean
  ) => void
  export type DSP_SETPARAM_DATA_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number,
      data: number,
      length: number
  ) => void
  export type DSP_SETPARAM_FLOAT_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number,
      value: number
  ) => void
  export type DSP_SETPARAM_INT_CALLBACK = (
      dsp_state: DSP_STATE,
      index: number,
      value: number
  ) => void
  export type DSP_SETPOSITION_CALLBACK = (
      dsp_state: DSP_STATE,
      pos: number
  ) => void
  /** DSP plug-in structure that is passed into each callback. */
  export interface DSP_STATE {
    instance: any;
    plugindata: any;
    channelmask: CHANNELMASK;
    source_speakermode: SPEAKERMODE;
    sidechaindata: Array<number>;
    sidechainchannels: number;
    functions: DSP_STATE_FUNCTIONS;
    systemobject: number;
  }
  /** Struct containing functions to give plug-in developers the ability to query system state and access system level functionality and helpers. */
  export interface DSP_STATE_FUNCTIONS {
    alloc: DSP_ALLOC_FUNC;
    realloc: DSP_REALLOC_FUNC;
    free: DSP_FREE_FUNC;
    getsamplerate: DSP_GETSAMPLERATE_FUNC;
    getblocksize: DSP_GETBLOCKSIZE_FUNC;
    getspeakermode: DSP_GETSPEAKERMODE_FUNC;
    getclock: DSP_GETCLOCK_FUNC;
    getlistenerattributes: DSP_GETLISTENERATTRIBUTES_FUNC;
    log: DSP_LOG_FUNC;
    getuserdata: DSP_GETUSERDATA_FUNC;
    getidletime: DSP_GETIDLETIME_FUNC;
    setcooldown: DSP_SETCOOLDOWN_FUNC;
    setbypass: DSP_SETBYPASS_FUNC;
    setsilence: DSP_SETSILENCE_FUNC;
    setoutputformat: DSP_SETOUTPUTFORMAT_FUNC          
  }
  export type DSP_SYSTEM_DEREGISTER_CALLBACK = (
      dsp_state: DSP_STATE
  ) => void
  export type DSP_SYSTEM_MIX_CALLBACK = (
      dsp_state: DSP_STATE,
      stage: number
  ) => void
  export type DSP_SYSTEM_REGISTER_CALLBACK = (
      dsp_state: DSP_STATE
  ) => void

  /** Loudness meter information data structure. */
  export interface DSP_LOUDNESS_METER_INFO_TYPE {
    momentaryloudness: number;
    shorttermloudness: number;
    integratedloudness: number;
    loudness10thpercentile: number;
    loudness95thpercentile: number;
    loudnesshistogram: number;
    maxtruepeak: number;
    maxmomentaryloudness: number;
  }

  /** Loudness meter channel weighting. */
  export interface DSP_LOUDNESS_METER_WEIGHTING_TYPE
  {
    channelweight: Array<number>
  }

  /** Types of callback called by a DSP. */
  export type DSP_CALLBACK_TYPE = number;

  /** Callback for DSP notifications. */
  export type DSP_CALLBACK = (
    dsp: DSP,
    type: DSP_CALLBACK_TYPE,
    data: any
  ) => void

  /** Describes the value of a DSP's data parameter. */
  export interface DSP_DATA_PARAMETER_INFO
  {
    data: any;
    length: number;
    index: number;
  }

  /** 3D attributes data structure for multiple listeners. */
  export interface DSP_PARAMETER_3DATTRIBUTES_MULTI {
    numlisteners: number;
    relative: Array<number>;
    weight: Array<number>;
    absolute: _3D_ATTRIBUTES;
  }

  /** 3D attributes data structure. */
  export interface DSP_PARAMETER_3DATTRIBUTES {
    relative: _3D_ATTRIBUTES;
    absolute: _3D_ATTRIBUTES;
  }

  /** Attenuation range parameter data structure. */
  export interface DSP_PARAMETER_ATTENUATION_RANGE {
    min: number;
    max: number;
  }

  /** Boolean parameter description. */
  interface DSP_PARAMETER_DESC_BOOL {
    defaultval: boolean;
  }

  /** Data parameter description. */
  interface DSP_PARAMETER_DESC_DATA {
    datatype: number;
  }

  /** Float parameter description. */
  interface DSP_PARAMETER_DESC_FLOAT {
    min: number;
    max: number;
    defaultval: number;
    mapping: DSP_PARAMETER_FLOAT_MAPPING;
  }

  /** Integer parameter description. */
  interface DSP_PARAMETER_DESC_INT {
    min: number;
    max: number;
    defaultval: number;
    goestoinf: boolean;
    valuenames: Array<string>;
  }

  /** Dynamic response data structure. */
  interface DSP_PARAMETER_DYNAMIC_RESPONSE {
    numchannels: number;
    rms: Array<number>;
  }

  /** FFT parameter data structure. */
  interface DSP_PARAMETER_FFT {
    length: number;
    numchannels: number;
    spectrum: Array<number>;
  }

  /** Overall gain parameter data structure. */
  interface DSP_PARAMETER_OVERALLGAIN {
    linear_gain: number;
    linear_gain_additive: number;
  }

  /** Side chain parameter data structure. */
  interface DSP_PARAMETER_SIDECHAIN {
    sidechainenable: boolean;
  }

  /** Struct containing DFT functions to enable a plug-in to perform optimized time-frequency domain conversion. */
  // interface DSP_STATE_DFT_FUNCTIONS {
  //   fftreal: DSP_DFT_FFTREAL_FUNC;
  //   inversefftreal: DSP_DFT_IFFTREAL_FUNC;
  // }

  export type SOUND_NONBLOCK_CALLBACK = (
    sound: Sound,
    result: RESULT
  ) => void
  export type SOUND_PCMREAD_CALLBACK = (
    sound: Sound,
    data: number,
    datalen: number
  ) => void

  export type TIMEUNIT = number;

  export type SOUND_PCMSETPOS_CALLBACK = (
    sound: Sound,
    subsound: number,
    position: number,
    postype: TIMEUNIT
  ) => void

  export type TAGTYPE = number;
  export type TAGDATATYPE = number;

  /** Tag data / metadata description. */
  export interface TAG
  {
    type: TAGTYPE;
    datatype: TAGDATATYPE;
    data: string;
    datalen: number;
    updated: boolean;
  }

  export type DSP_RESAMPLER = number;

  /** Advanced configuration settings. */
  export interface ADVANCEDSETTINGS
  {
    maxMPEGCodecs: number;
    maxADPCMCodecs: number;
    maxXMACodecs: number;
    maxVorbisCodecs: number;
    maxAT9Codecs: number;
    maxFADPCMCodecs: number;
    maxOpusCodecs: number;
    vol0virtualvol: number;
    defaultDecodeBufferSize: number;
    profilePort: number;
    geometryMaxFadeTime: number;
    distanceFilterCenterFreq: number;
    reverb3Dinstance: number;
    DSPBufferPoolSize: number;
    resamplerMethod: DSP_RESAMPLER;
    randomSeed: number;
    maxConvolutionThreads: number;
    maxSpatialObjects: number;
  }
  /** Information about a single asynchronous file operation. */
  export interface ASYNCREADINFO
  {
    handle: any;
    offset: number;
    sizebytes: number;
    priority: number;
    userdata: any;
    buffer: number;
    bytesread: number;
    id: number;
    done: FILE_ASYNCDONE_FUNC;
  }
  export type SOUND_FORMAT = number;
  export type SOUND_TYPE = number;
  export type CHANNELORDER = number;

  /** Additional options for creating a Sound. */
  export interface CREATESOUNDEXINFO
  {
    length?: number;
    fileoffset?: number;
    numchannels?: number;
    defaultfrequency?: number;
    format?: SOUND_FORMAT;
    decodebuffersize?: number;
    initialsubsound?: number;
    numsubsounds?: number;
    inclusionlist?: number;
    inclusionlistnum?: number;
    pcmreadcallback?: SOUND_PCMREAD_CALLBACK;
    pcmsetposcallback?: SOUND_PCMSETPOS_CALLBACK;
    nonblockcallback?: SOUND_NONBLOCK_CALLBACK;
    dlsname?: string;
    encryptionkey?: string;
    maxpolyphony?: number;
    userdata?: any;
    suggestedsoundtype?: SOUND_TYPE;
    fileuseropen?: FILE_OPEN_CALLBACK;
    fileuserclose?: FILE_CLOSE_CALLBACK;
    fileuserread?: FILE_READ_CALLBACK;
    fileuserseek?: FILE_SEEK_CALLBACK;
    fileuserasyncread?: FILE_ASYNCREAD_CALLBACK;
    fileuserasynccancel?: FILE_ASYNCCANCEL_CALLBACK;
    fileuserdata?: any;
    filebuffersize?: number;
    channelorder?: CHANNELORDER;
    initialsoundgroup?: SoundGroup;
    initialseekposition?: number;
    initialseekpostype?: TIMEUNIT;
    ignoresetfilesystem?: boolean;
    audioqueuepolicy?: number;
    minmidigranularity?: number;
    nonblockthreadid?: number;
    resamplermethod?: DSP_RESAMPLER;
  }

  export type ERRORCALLBACK_INSTANCETYPE = number;

  /** Information describing an error that has occurred. */
  export interface ERRORCALLBACK_INFO
  {
    result: RESULT;
    instancetype: ERRORCALLBACK_INSTANCETYPE;
    instance: any;
    functionname: string;
    functionparams: string;
  }

  /** Callback for cancelling a pending asynchronous read. */
  export type FILE_ASYNCCANCEL_CALLBACK = (
    info: ASYNCREADINFO,
    userdata: any
  ) => number
  /** Function to be called when asynchronous reading is finished. */
  export type FILE_ASYNCDONE_FUNC = (
    info: ASYNCREADINFO,
    result: RESULT
  ) => void
  /** Information about a single asynchronous file operation. */
  export type FILE_ASYNCREAD_CALLBACK = (
    info: ASYNCREADINFO,
    userdata: any
  ) => void
  /** Calback for closing a file. */
  export type FILE_CLOSE_CALLBACK = (
    handle: any,
    userdata: any
  ) => void
  /** Callback for opening a file. */
  export type FILE_OPEN_CALLBACK = (
    name: string,
    userdata?: any
  ) => Promise<{ filesize: number, handle: any, result: number }>
  /** Callback for reading from a file. */
  export type FILE_READ_CALLBACK = (
    handle: any,
    buffer: number,
    sizebytes: number,
    userdata: any
  ) => Promise<{ bytesread: number, result: number }>
  /** Callback for seeking within a file. */
  export type FILE_SEEK_CALLBACK = (
    handle: any,
    pos: number,
    userdata: any
  ) => number

  /** Structure defining a reverb environment. */
  export interface REVERB_PROPERTIES
  {
    DecayTime: number;
    EarlyDelay: number;
    LateDelay: number;
    HFReference: number;
    HFDecayRatio: number;
    Diffusion: number;
    Density: number;
    LowShelfFrequency: number;
    LowShelfGain: number;
    HighCut: number;
    EarlyLateMix: number;
    WetLevel: number;
  }

  export type SYSTEM_CALLBACK_TYPE = number;

  export type SYSTEM_CALLBACK = (
    system: System,
    type: SYSTEM_CALLBACK_TYPE,
    commanddata1: any,
    commanddata2: any,
    userdata: any
  ) => void


  // ===== API for folder: channel =====
  export class Channel extends ChannelControl {
    /** Retrieves the ChannelGroup this object outputs to. */
    getChannelGroup(): ChannelGroup
    /** Retrieves the currently playing Sound. */
    getCurrentSound() : Sound
    /** Retrieves the playback frequency or playback rate. */
    getFrequency(): number
    /** Retrieves the index of this object in the System Channel pool. */
    getIndex(): number
    /** Retrieves the number of times to loop before stopping. */
    getLoopCount(): number
    /** Retrieves the loop start and end points. */
    getLoopPoints(
      loopstarttype: TIMEUNIT,
      loopendtype: TIMEUNIT
    ): { loopstart: number, loopend: number }
    /** Retrieves the current playback position. */
    getPosition(
      postype: TIMEUNIT
    ): number
    /** Retrieves the priority used for virtual voice ordering. */
    getPriority(): number
    /** Retrieves whether the Channel is being emulated by the virtual voice system. */
    isVirtual(): boolean
    /** Sets the ChannelGroup this object outputs to. */
    setChannelGroup(
      channelgroup: ChannelGroup
    ): void
    /** Sets the frequency or playback rate. */
    setFrequency(
      frequency: number
    ): void
    /** Sets the number of times to loop before stopping. */
    setLoopCount(
      loopcount: number
    ): void
    /** Sets the loop start and end points. */
    setLoopPoints(
      loopstart: number,
      loopstarttype: TIMEUNIT,
      loopend: number,
      loopendtype: TIMEUNIT
    ): void
    /** Sets the current playback position. */
    setPosition(
      position: number,
      postype: TIMEUNIT
    ): void
    /** Sets the priority used for virtual voice ordering. */
    setPriority(
      priority: number
    ): void
  }

  export type MODE = number;

  // ===== API for folder: channelcontrol =====
  export class ChannelControl {
    /** Adds a DSP unit to the specified index in the DSP chain. */
    addDSP(
      index: number,
      dsp: DSP
    ): void
    /** Adds a sample accurate fade point at a time relative to the parent ChannelGroup DSP clock. */
    addFadePoint(
      dspclock: number,
      volume: number
    ): void
    /** Retrieves the 3D position and velocity used to apply panning, attenuation and doppler. */
    get3DAttributes(): {pos: {x?:number, y?:number, z?:number}, vel: {x?:number, y?:number, z?:number} }
    /** Retrieves the orientation of a 3D cone shape, used for simulated occlusion. */
    get3DConeOrientation(): {x?:number, y?:number, z?:number}
    /** Retrieves the angles and attenuation levels of a 3D cone shape, for simulated occlusion which is based on direction. */
    get3DConeSettings(): { insideconeangle: number, outsideconeangle: number, outsidevolume: number }
    /** Retrieves the current custom roll-off shape for 3D distance attenuation. */
    get3DCustomRolloff(): { points: Array<{x?:number, y?:number, z?:number}>, numpoints: number }
    /** Retrieves the override values for the 3D distance filter. */
    get3DDistanceFilter(): { custom: boolean, customLevel: number, centerFreq: number }
    /** Retrieves the amount by which doppler is scaled. */
    get3DDopplerLevel(): number
    /** Retrieves the blend between 3D panning and 2D panning. */
    get3DLevel(): number
    /** Retrieves the minimum and maximum distances used to calculate the 3D roll-off attenuation. */
    get3DMinMaxDistance(): { mindistance: number, maxdistance: number }
    /** Retrieves the 3D attenuation factors for the direct and reverb paths. */
    get3DOcclusion(): { directocclusion: number, reverbocclusion: number }
    /** Retrieves the spread of a 3D sound in speaker space. */
    get3DSpread(): number
    /** Gets the calculated audibility based on all attenuation factors which contribute to the final output volume. */
    getAudibility(): number
    /** Retrieves a sample accurate start (and/or stop) time relative to the parent ChannelGroup DSP clock. */
    getDelay(): { dspclock_start: number, dspclock_end: number, stopchannels: boolean }
    /** Retrieves the DSP unit at the specified index in the DSP chain. */
    getDSP(
      index: number
    ): DSP
    /** Retrieves the DSP clock values at this point in time. */
    getDSPClock(): { dspclock: number, parentclock: number }
    /** Retrieves the index of a DSP inside the Channel or ChannelGroup's DSP chain. */
    getDSPIndex(
      dsp: DSP
    ): number
    /** Retrieves information about stored fade points. */
    getFadePoints(): { numpoints:number, point_dspclock: Array<number>, point_volume: Array<number> }
    /** Retrieves the gain of the dry signal when built in lowpass / distance filtering is applied. */
    getLowPassGain(): number
    /** Retrieves a 2 dimensional pan matrix that maps the signal from input channels (columns) to output speakers (rows). */
    getMixMatrix(): { matrix: Array<number>, outchannels: number, inchannels: number }
    /** Retrieves the playback mode bits that control how this object behaves. */
    getMode(): MODE
    /** Retrieves the mute state. */
    getMute(): boolean
    /** Retrieves the number of DSP units in the DSP chain. */
    getNumDSPs(): number
    /** Retrieves the paused state. */
    getPaused(): boolean
    /** Retrieves the relative pitch / playback rate. */
    getPitch(): number
    /** Retrieves the wet / send level for a particular reverb instance. */
    getReverbProperties(
      instance: number
    ): number
    /** Retrieves the System that created this object. */
    getSystemObject(): System
    /** Retrieves a user value associated with this object. */
    getUserData(): any
    /** Retrieves the volume level. */
    getVolume(): number
    /** Retrieves whether volume changes are ramped or instantaneous. */
    getVolumeRamp(): boolean
    /** Retrieves the playing state. */
    isPlaying(): boolean
    /** Removes the specified DSP unit from the DSP chain. */
    removeDSP(
      dsp: DSP
    ): void
    /** Removes all fade points between the two specified clock values (inclusive). */
    removeFadePoints(
      dspclock_start: number,
      dspclock_end: number
    ): void
    /** Sets the 3D position and velocity used to apply panning, attenuation and doppler. */
    set3DAttributes(
      pos: {x?:number, y?:number, z?:number},
      vel?: {x?:number, y?:number, z?:number}
    ): void
    /** Sets the orientation of a 3D cone shape, used for simulated occlusion. */
    set3DConeOrientation(
      orientation: {x?:number, y?:number, z?:number}
    ): void
    /** Sets the angles and attenuation levels of a 3D cone shape, for simulated occlusion which is based on direction. */
    set3DConeSettings(
      insideconeangle: number,
      outsideconeangle: number,
      outsidevolume: number
    ): void
    /** Sets a custom roll-off shape for 3D distance attenuation. */
    set3DCustomRolloff(
      points: Array<{x?:number, y?:number, z?:number}>,
      numpoints: number
    ): void
    /** Sets an override value for the 3D distance filter. */
    set3DDistanceFilter(
      custom: boolean,
      customLevel: number,
      centerFreq?: number
    ): void
    /** Sets the amount by which doppler is scaled. */
    set3DDopplerLevel(
      level: number
    ): void
    /** Sets the blend between 3D panning and 2D panning. */
    set3DLevel(
      level: number
    ): void
    /** Sets the minimum and maximum distances used to calculate the 3D roll-off attenuation. */
    set3DMinMaxDistance(
      mindistance: number,
      maxdistance: number
    ): void
    /** Sets the 3D attenuation factors for the direct and reverb paths. */
    set3DOcclusion(
      directocclusion: number,
      reverbocclusion: number
    ): void
    /** Sets the spread of a 3D sound in speaker space. */
    set3DSpread(
      angle: number
    ): void
    /** Sets the callback for ChannelControl level notifications. */
    setCallback(
      callback: CHANNELCONTROL_CALLBACK | null
    ): void
    /** Sets a sample accurate start (and/or stop) time relative to the parent ChannelGroup DSP clock. */
    setDelay(
      dspclock_start: number,
      dspclock_end: number,
      stopchannels: boolean
    ): void
    /** Sets the index in the DSP chain of the specified DSP. */
    setDSPIndex(
      dsp: DSP,
      index: number
    ): void
    /** Adds a volume ramp at the specified time in the future using fade points. */
    setFadePointRamp(
      dspclock: number,
      volume: number
    ): void
    /** Sets the gain of the dry signal when built in lowpass / distance filtering is applied. */
    setLowPassGain(
      gain: number
    ): void
    /** Sets the incoming volume level for each channel of a multi-channel signal. */
    setMixLevelsInput(
      levels: Array<number>,
      numlevels: number,
    ): void
    /** Sets the outgoing volume levels for each speaker. */
    setMixLevelsOutput(
      frontleft: number,
      frontright: number,
      center: number,
      lfe: number,
      surroundleft: number,
      surroundright: number,
      backleft: number,
      backright: number
    ): void
    /** Sets a two-dimensional pan matrix that maps the signal from input channels (columns) to output speakers (rows). */
    setMixMatrix(
      matrix: Array<number>,
      outchannels: number,
      inchannels: number
    ): void
    /** Sets the playback mode that controls how this object behaves. */
    setMode(
      mode: MODE
    ): void
    /** Sets the mute state. */
    setMute(
      mute: boolean
    ): void
    /** Sets the left/right pan level. */
    setPan(
      pan: number
    ): void
    /** Sets the paused state. */
    setPaused(
      paused: boolean
    ): void
    /** Sets the relative pitch / playback rate. */
    setPitch(
      pitch: number
    ): void
    /** Sets the wet / send level for a particular reverb instance. */
    setReverbProperties(
      instance: number,
      wet: number
    ): void
    /** Sets a user value associated with this object. */
    setUserData(
      userdata: any
    ): void
    /** Sets the volume level. */
    setVolume(
      volume: number
    ): void
    /** Sets whether volume changes are ramped or instantaneous. */
    setVolumeRamp(
      ramp: boolean
    ): void
    /** Stops the Channel (or all Channels in nested ChannelGroups) from playing. */
    stop(): void
  }

  // ===== API for folder: channelgroup =====
  export class ChannelGroup extends ChannelControl {
    /** Adds a ChannelGroup as an input to this group. */
    addGroup(
      group: ChannelGroup,
      propagatedspclock: boolean
    ): DSPConnection
    /** Retrieves the Channel at the specified index in the list of Channel inputs. */
    getChannel(
      index: number
    ): Channel
    /** Retrieves the ChannelGroup at the specified index in the list of group inputs. */
    getGroup(
      index: number
    ): ChannelGroup
    /** Retrieves the name set when the group was created. */
    getName(): string
    /** Retrieves the number of Channels that feed into to this group. */
    getNumChannels(): number
    /** Retrieves the number of ChannelGroups that feed into to this group. */
    getNumGroups(): number
    /** Retrieves the ChannelGroup this object outputs to. */
    getParentGroup(): ChannelGroup
    /** Frees the memory for the group. */
    release(): void
  }
  export type DSPCONNECTION_TYPE = number;
  export type DSP_TYPE = number;

  // ===== API for folder: dsp =====
  export class DSP {
    /** Adds a DSP unit as an input to this object. */
    addInput(
      input: DSP,
      preallocated_connection?: DSPConnection,
      type?: DSPCONNECTION_TYPE
    ): DSPConnection
    /** Disconnects all inputs and/or outputs. */
    disconnectAll(
      inputs: boolean,
      outputs: boolean
    ): void
    /** Disconnect the specified input DSP. */
    disconnectFrom(
      target: DSP,
      connection?: DSPConnection | null
    ): void
    /** Retrieves the processing active state. */
    getActive(): boolean
    /** Retrieves the processing bypass state. */
    getBypass(): boolean
    /** Retrieves the PCM input format this DSP will receive when processing. */
    getInputChannelFormat(): { inchannels: number, inmode: SPEAKERMODE }
    /** Retrieves statistics on the mixer thread CPU usage for this unit. */
    getCPUUsage(): { exclusive: number, inclusive: number }
    /** Retrieve the index of the first data parameter of a particular data type. */
    getDataParameterIndex(
      datatype: number
    ): number
    /** Retrieves the idle state. */
    getIdle(): boolean
    /** Retrieves information about this DSP unit. */
    getInfo(): { name: string, version: number, channels: number, mode: DSP_MODE }
    /** Retrieves the DSP unit at the specified index in the input list. */
    getInput(
      index: number
    ): { input: DSP, inputconnection: DSPConnection }
    /** Retrieves the input and output signal metering enabled states. */
    getMeteringEnabled(): { inputEnabled: boolean, outputEnabled: boolean }
    /** Retrieve the signal metering enabled metering information. */
    getMeteringInfo(): { inputInfo: DSP_METERING_INFO, outputInfo: DSP_METERING_INFO }
    /** Retrieves the number of DSP units in the input list. */
    getNumInputs(): number
    /** Retrieves the number of DSP units in the output list. */
    getNumOutputs(): number
    /** Retrieves the number of parameters exposed by this unit. */
    getNumParameters(): number
    /** Retrieves the DSP unit at the specified index in the output list. */
    getOutput(
      index: number
    ): { output: DSP, outputconnection: DSPConnection }
    /** Retrieves the output format this DSP produces when processing based on the input specified. */
    getOutputChannelFormat(
      inchannels: number,
      inmode: SPEAKERMODE
    ): { outchannels: number, outmode: SPEAKERMODE }
    /** Retrieves a boolean parameter by index. */
    getParameterBool(
      index: number
    ): { value: boolean, valuestr: string }
    /** Retrieves a binary data parameter by index. */
    getParameterData(
      index: number
    ): { data: any, length: number, valuestr: string }
    /** Retrieves a floating point parameter by index. */
    getParameterFloat(
      index: number
    ): { value: number, valuestr: string }
    /** Retrieve information about a specified parameter. */
    getParameterInfo(
      index: number
    ): DSP_PARAMETER_DESC
    /** Retrieves an integer parameter by index. */
    getParameterInt(
      index: number
    ): { value: number, valuestr: string }
    /** Retrieves the parent System object. */
    getSystemObject(): System
    /** Retrieves the pre-defined type of a FMOD registered DSP unit. */
    getType(): DSP_TYPE
    /** Retrieves a user value associated with this object. */
    getUserData(): any
    /** Retrieves the scale of the wet and dry signal components. */
    getWetDryMix() : { prewet: number, postwet: number, dry: number }
    /** Releases a DSP unit, freeing the memory used by that object. */
    release(): void
    /** Reset a DSP's internal state, making it ready for a new input signal. */
    reset(): void
    /** Sets the processing active state. */
    setActive(
      active: boolean
    ): void
    /** Sets the processing bypass state. */
    setBypass(
      bypass: boolean
    ): void
    /** Sets the callback for DSP notifications. */
    setCallback(
      callback: DSP_CALLBACK | null
    ): void
    /** Sets the PCM input format this DSP is to receive when processing. */
    setInputChannelFormat(
      numchannels: number,
      speakermode: SPEAKERMODE
    ): void
    /** Sets the input and output signal metering enabled states. */
    setMeteringEnabled(
      inputEnabled: boolean,
      outputEnabled: boolean
    ): void
    /** Sets a boolean parameter by index. */
    setParameterBool(
      index: number,
      value: boolean
    ): void
    /** Sets a binary data parameter by index. */
    setParameterData(
      index: number,
      data: string,
      length: number
    ): void
    /** Sets a floating point parameter by index. */
    setParameterFloat(
      index: number,
      value: number
    ): void
    /** Sets an integer parameter by index. */
    setParameterInt(
      index: number,
      value: number
    ): void
    /** Sets a user value associated with this object. */
    setUserData(
      userdata: any
    ): void
    /** Sets the scale of the wet and dry signal components. */
    setWetDryMix(
      prewet: number,
      postwet: number,
      dry: number
    ): void
  }

  // ===== API for folder: dspconnection =====
  export class DSPConnection {
    /** Retrieves the connection's input DSP unit. */
    getInput(): DSP
    /** Retrieves the connection's volume scale. */
    getMix(): number
    /** Retrieves a 2 dimensional pan matrix that maps the signal from input channels (columns) to output speakers (rows). */
    getMixMatrix(): { matrix: Array<number>, outchannels: number, inchannels: number }
    /** Retrieves the connection's output DSP unit. */
    getOutput(): DSP
    /** Retrieves the type of the connection between two DSP units. */
    getType(): DSPCONNECTION_TYPE
    /** Retrieves a user value associated with this object. */
    getUserData(): any
    /** Sets the connection's volume scale. */
    setMix(
      volume: number
    ): void
    /** Sets a 2 dimensional pan matrix that maps the signal from input channels (columns) to output speakers (rows). */
    setMixMatrix(
      matrix: Array<number>,
      outchannels: number,
      inchannels: number
    ): void
    /** Sets a user value associated with this object. */
    setUserData(
      userdata: any
    ): void
  }

  // ===== API for folder: geometry =====
  export class Geometry {
    /** Retrieves whether an object is processed by the geometry engine. */
    getActive(): boolean
    /** Retrieves the maximum number of polygons and vertices allocatable for this object. */
    getMaxPolygons(): { maxpolygons: number, maxvertices: number }
    /** Retrieves the number of polygons in this object. */
    getNumPolygons(): number
    /** Retrieves the attributes for a polygon. */
    getPolygonAttributes(
      index: number
    ): { directocclusion: number, reverbocclusion: number, doublesided: number }
    /** Gets the number of vertices in a polygon. */
    getPolygonNumVertices(
      index: number
    ): number
    /** Retrieves the position of a vertex. */
    getPolygonVertex(
      index: number,
      vertexindex: number
    ): {x?:number, y?:number, z?:number}
    /** Retrieves the 3D position of the object. */
    getPosition(): {x?:number, y?:number, z?:number}
    /** Retrieves the 3D orientation of the object. */
    getRotation(): { forward: {x?:number, y?:number, z?:number}, up: {x?:number, y?:number, z?:number} }
    /** Retrieves the 3D scale of the object. */
    getScale(): {x?:number, y?:number, z?:number}
    /** Retrieves a user value associated with this object. */
    getUserData(): any
    /** Frees a geometry object and releases its memory. */
    release(): void
    /** Sets whether an object is processed by the geometry engine. */
    setActive(
      active: boolean
    ): void
    /** Sets individual attributes for a polygon inside a geometry object. */
    setPolygonAttributes(
      index: number,
      directocclusion: number,
      reverbocclusion: number,
      doublesided: boolean
    ): void
    /** Alters the position of a polygon's vertex inside a geometry object. */
    setPolygonVertex(
      index: number,
      vertexindex: number,
      vertex: {x?:number, y?:number, z?:number}
    ): void
    /** Sets the 3D position of the object. */
    setPosition(
      position: {x?:number, y?:number, z?:number}
    ): void
    /** Sets the 3D orientation of the object. */
    setRotation(
      forward: {x?:number, y?:number, z?:number},
      up: {x?:number, y?:number, z?:number}
    ): void
    /** Sets the 3D scale of the object. */
    setScale(
      scale: {x?:number, y?:number, z?:number}
    ): void
    /** Sets a user value associated with this object. */
    setUserData(
      userdata: any
    ): void
  }

  // ===== API for folder: reverb3d =====
  export class Reverb3D {
    /** Retrieves the 3D attributes of a reverb sphere. */
    get3DAttributes(): { position: {x?:number, y?:number, z?:number}, mindistance: number, maxdistance: number }
    /** Retrieves the active state. */
    getActive(): boolean
    /** Retrieves the environmental properties of a reverb sphere. */
    getProperties(): REVERB_PROPERTIES
    /** Retrieves a user value associated with this object. */
    getUserData(): any
    /** Releases the memory for a reverb object and makes it inactive. */
    release(): void
    /** Sets the 3D attributes of a reverb sphere. */
    set3DAttributes(
      position: {x?:number, y?:number, z?:number},
      mindistance: number,
      maxdistance: number
    ): void
    /** Sets the active state. */
    setActive(
      active: boolean
    ): void
    /** Sets the environmental properties of a reverb sphere. */
    setProperties(
      properties: REVERB_PROPERTIES
    ): void
    /** Sets a user value associated with this object. */
    setUserData(
      userdata: any
    ): void
  }
  export type OPENSTATE = number;
  // ===== API for folder: sound =====
  export class Sound {
    /** Adds a sync point at a specific time within the sound. */
    addSyncPoint(
      offset: number,
      offsettype: TIMEUNIT,
      name?: string
    ): SYNCPOINT
    /** Deletes a sync point within the sound. */
    deleteSyncPoint(
      point: SYNCPOINT
    ): void
    /** Retrieves the inside and outside angles of the 3D projection cone and the outside volume. */
    get3DConeSettings(): { insideconeangle: number, outsideconeangle: number, outsidevolume: number }
    /** Retrieves the current custom roll-off shape for 3D distance attenuation. */
    get3DCustomRolloff(): { points: {x?:number, y?:number, z?:number}, numpoints: number }
    /** Retrieve the minimum and maximum audible distance for a 3D sound. */
    get3DMinMaxDistance(): { min: number, max: number }
    /** Retrieves a sound's default playback attributes. */
    getDefaults(): { frequency: number, priority: number }
    /** Returns format information about the sound. */
    getFormat(): { type: SOUND_TYPE, format: SOUND_FORMAT, channels: number, bits: number }
    /** Retrieves the length using the specified time unit. */
    getLength(
      lengthtype: TIMEUNIT
    ): number
    /** Retrieves the sound's loop count. */
    getLoopCount(): number
    /** Retrieves the loop points for a sound. */
    getLoopPoints(
      loopstarttype: TIMEUNIT,
      loopendtype: TIMEUNIT
    ): { loopstart: number, loopend: number }
    /** Retrieves the mode of a sound. */
    getMode(): MODE
    /** Retrieves the volume of a MOD/S3M/XM/IT/MIDI music channel volume. */
    getMusicChannelVolume(
      channel: number
    ): number
    /** Gets the number of music channels inside a MOD/S3M/XM/IT/MIDI file. */
    getMusicNumChannels(): number
    /** Gets the relative speed of MOD/S3M/XM/IT/MIDI music. */
    getMusicSpeed(): number
    /** Retrieves the name of a sound. */
    getName(): string
    /** Retrieves the number of subsounds stored within a sound. */
    getNumSubSounds(): number
    /** Retrieves the number of sync points stored within a sound. */
    getNumSyncPoints(): number
    /** Retrieves the number of metadata tags. */
    getNumTags(): { numtags: number, numtagsupdated: number }
    /** Retrieves the state a sound is in after being opened with the non blocking flag, or the current state of the streaming buffer. */
    getOpenState(): { openstate: OPENSTATE, percentbuffered: number, starving: boolean, diskbusy: boolean }
    /** Retrieves the sound's current sound group. */
    getSoundGroup(): SoundGroup
    /** Retrieves a handle to a Sound object that is contained within the parent sound. */
    getSubSound(
      index: number
    ): Sound
    /** Retrieves the parent Sound object that contains this subsound. */
    getSubSoundParent(): Sound
    /** Retrieve a sync point. */
    getSyncPoint(
      index: number
    ): SYNCPOINT
    /** Retrieves information on an embedded sync point. */
    getSyncPointInfo(
      point: SYNCPOINT,
      offsettype: TIMEUNIT
    ): { name: string, offset: number }
    /** Retrieves the parent System object. */
    getSystemObject(): System
    /** Retrieves a metadata tag. */
    getTag(
      name: string,
      index: number
    ): TAG
    /** Retrieves a user value associated with this object. */
    getUserData(): any
    /** Gives access to a portion or all the sample data of a sound for direct manipulation. */
    lock(
      offset: number,
      length: number,
    ): { ptr1:number, ptr2:number, len1:number, len2:number }
    /** Reads data from an opened sound to a specified buffer, using FMOD's internal codecs. */
    readData(
      length: number
    ): { buffer:Array<number>, length: number }
    /** Frees a sound object. */
    release():void
    /** Seeks a sound for use with data reading, using FMOD's internal codecs. */
    seekData(
      pcm: number
    ): void
    /** Sets the angles and attenuation levels of a 3D cone shape, for simulated occlusion which is based on direction. */
    set3DConeSettings(
      insideconeangle: number,
      outsideconeangle: number,
      outsidevolume: number
    ): void
    /** Sets a custom roll-off shape for 3D distance attenuation. */
    set3DCustomRolloff(
      points: Array<{x?:number, y?:number, z?:number}>,
      numpoints: number
    ): void
    /** Sets the minimum and maximum audible distance for a 3D sound. */
    set3DMinMaxDistance(
      min: number,
      max: number
    ): void
    /** Sets a sound's default playback attributes. */
    setDefaults(
      frequency: number,
      priority: number
    ): void
    /** Sets the sound to loop a specified number of times before stopping if the playback mode is set to looping. */
    setLoopCount(
      loopcount: number
    ): void
    /** Sets the loop points within a sound. */
    setLoopPoints(
      loopstart: number,
      loopstarttype: TIMEUNIT,
      loopend: number,
      loopendtype: TIMEUNIT
    ): void
    /** Sets or alters the mode of a sound. */
    setMode(
      mode: MODE
    ): void
    /** Sets the volume of a MOD/S3M/XM/IT/MIDI music channel volume. */
    setMusicChannelVolume(
      channel: number,
      volume: number
    ): void
    /** Sets the relative speed of MOD/S3M/XM/IT/MIDI music. */
    setMusicSpeed(
      speed: number
    ): void
    /** Moves the sound from its existing SoundGroup to the specified sound group. */
    setSoundGroup(
      soundgroup: SoundGroup
    ): void
    /** Sets a user value associated with this object. */
    setUserData(
      userdata: any
    ): void
    /** Finalizes a previous sample data lock and submits it back to the Sound object. */
    unlock(
      ptr1: number,
      ptr2: number,
      len1: number,
      len2: number
    ): void
  }

  export type SOUNDGROUP_BEHAVIOR = number;

  // ===== API for folder: soundgroup =====
  export class SoundGroup {
    /** Retrieves the maximum number of playbacks to be audible at once in a sound group. */
    getMaxAudible(): number
    /** Retrieves the current max audible behavior. */
    getMaxAudibleBehavior(): SOUNDGROUP_BEHAVIOR
    /** Retrieves the current mute fade time. */
    getMuteFadeSpeed(): number
    /** Retrieves the name of the sound group. */
    getName(): string
    /** Retrieves the number of currently playing Channels for the SoundGroup. */
    getNumPlaying(): number
    /** Retrieves the current number of sounds in this sound group. */
    getNumSounds(): number
    /** Retrieves a sound. */
    getSound(
      index: number,
    ): Sound
    /** Retrieves the parent System object. */
    getSystemObject(): System
    /** Retrieves a user value associated with this object. */
    getUserData(): any
    /** Retrieves the volume of the sound group. */
    getVolume(): number
    /** Releases a soundgroup object and returns all sounds back to the master sound group. */
    release(): void
    /** Sets the maximum number of playbacks to be audible at once in a sound group. */
    setMaxAudible(
      maxaudible: number
    ): void
    /** This function changes the way the sound playback behaves when too many sounds are playing in a soundgroup. */
    setMaxAudibleBehavior(
      behavior: SOUNDGROUP_BEHAVIOR
    ): void
    /** Sets a mute fade time. */
    setMuteFadeSpeed(
      speed: number
    ): void
    /** Sets a user value associated with this object. */
    setUserData(
      userdata: any
    ): void
    /** Sets the volume of the sound group. */
    setVolume(
      volume: number
    ): void
    /** Stops all sounds within this soundgroup. */
    stop(): void
  }

  export type PLUGINTYPE = number;
  export type OUTPUTTYPE = number;
  export type SPEAKER = number;
  export type DRIVER_STATE = number;

  /** System Level Interface */
  export class System {
    /** Connect the output of the specified ChannelGroup to an audio port on the output driver. */
    attachChannelGroupToPort(
      portType: number,
      portIndex: number,
      channelgroup: ChannelGroup,
      passThru: boolean
    ): void
    /** 'Piggyback' on FMOD file reading routines to capture data as it's read. */
    attachFileSystem(
      useropen: FILE_OPEN_CALLBACK,
      userclose: FILE_CLOSE_CALLBACK,
      userread: FILE_READ_CALLBACK,
      userseek: FILE_SEEK_CALLBACK
    ): void
    /** Close the connection to the output and return to an uninitialized state without releasing the object. */
    close(): void
    /** Create a ChannelGroup object. */
    createChannelGroup(
      name?: string
    ): ChannelGroup
    /** Create a DSP unit given a plug-in description structure. */
    createDSP(
      description: DSP_DESCRIPTION
    ): DSP
    /** Create a DSP unit with a specified plug-in handle. */
    createDSPByPlugin(
      handle: number
    ): DSP
    /** Create a DSP unit with a specified built-in type index. */
    createDSPByType(
      type: DSP_TYPE,
    ): DSP
    /** Create a DSPConnection object. */
    createDSPConnection(
      type: DSPCONNECTION_TYPE
    ): DSPConnection
    /** Geometry creation function. This function will create a base geometry object which can then have polygons added to it. */
    createGeometry(
      maxpolygons: number,
      maxvertices: number
    ): Geometry
    /** Creates a 'virtual reverb' object. This object reacts to 3D location and morphs the reverb environment based on how close it is to the reverb object's center. */
    createReverb3D(): Reverb3D
    /** Loads a sound into memory, opens it for streaming or sets it up for callback based sounds. */
    createSound(
      name_or_data: string | ArrayBuffer,
      mode: MODE,
      exinfo?: CREATESOUNDEXINFO
    ): Promise<Sound>
    /** Creates a SoundGroup object. */
    createSoundGroup(
      name: String
    ): SoundGroup
    /** Opens a sound for streaming. */
    createStream(
      name_or_data: string | ArrayBuffer,
      mode: MODE,
      exinfo?: CREATESOUNDEXINFO
    ): Promise<Sound>
    /** Disconnect the output of the specified ChannelGroup from an audio port on the output driver. */
    detachChannelGroupFromPort(
      channelgroup: ChannelGroup
    ): void
    /** Retrieves the position, velocity and orientation of the specified 3D sound listener. */
    get3DListenerAttributes(
      listener: number
    ): { pos: {x?:number, y?:number, z?:number}, vel: {x?:number, y?:number, z?:number}, forward: {x?:number, y?:number, z?:number}, up: {x?:number, y?:number, z?:number} }
    /** Retrieves the number of 3D listeners. */
    get3DNumListeners(
    ): number
    /** Retrieves the global doppler scale, distance factor and roll-off scale for all 3D sounds. */
    get3DSettings(): { dopplerscale: number, distancefactor: number, rolloffscale: number }
    /** Retrieves the advanced settings for the system object. */
    getAdvancedSettings(): ADVANCEDSETTINGS
    /** Retrieves a handle to a Channel by ID. */
    getChannel(
      channelid: number
    ): Channel
    /** Retrieves the number of currently playing Channels. */
    getChannelsPlaying(): { channels: number, realchannels: number }
    /** Retrieves the amount of CPU used for different parts of the Core API. */
    getCPUUsage(): CPU_USAGE
    /** Retrieves the default matrix used to convert from one speaker mode to another. */
    getDefaultMixMatrix(
      sourcespeakermode: SPEAKERMODE,
      targetspeakermode: SPEAKERMODE
    ): Array<number>
    /** Retrieves the output driver for the selected output type. */
    getDriver(): number
    /** Retrieves identification information about a sound device specified by its index, and specific to the selected output mode. */
    getDriverInfo(
      id: number
    ): { name:string, guid: GUID, systemrate: number, speakermode: SPEAKERMODE, speakermodechannels: number }
    /** Retrieves the buffer size settings for the FMOD software mixing engine. */
    getDSPBufferSize(): { bufferlength: number, numbuffers: number }
    /** Retrieve the description structure for a pre-existing DSP plug-in. */
    getDSPInfoByPlugin(
      handle: number
    ): DSP_DESCRIPTION
    /** Retrieve the description structure for a built-in DSP plug-in. */
    getDSPInfoByType(
      type: DSP_TYPE
    ): DSP_DESCRIPTION
    /** Retrieves information about file reads. */
    getFileUsage(): { sampleBytesRead: number, streamBytesRead: number, otherBytesRead: number }
    /** Calculates geometry occlusion between a listener and a sound source. */
    getGeometryOcclusion(): { listener: {x?:number, y?:number, z?:number}, source: {x?:number, y?:number, z?:number}, direct: number, reverb: number }
    /** Retrieves the maximum world size for the geometry engine. */
    getGeometrySettings(): number
    /** Retrieves the master ChannelGroup that all sounds ultimately route to. */
    getMasterChannelGroup(): ChannelGroup
    /** Retrieves the default SoundGroup, where all sounds are placed when they are created. */
    getMasterSoundGroup(): SoundGroup
    /** Retrieves the handle of a nested plug-in. */
    getNestedPlugin(
      handle: number,
      index: number
    ): number
    /** Retrieves the URL of the proxy server used in internet streaming. */
    getNetworkProxy(): string
    /** Retrieve the timeout value for network streams. */
    getNetworkTimeout(): number
    /** Retrieves the number of output drivers available for the selected output type. */
    getNumDrivers(): number
    /** Retrieves the number of nested plug-ins from the selected plug-in. */
    getNumNestedPlugins(
      handle: number
    ): number
    /** Retrieves the number of loaded plug-ins. */
    getNumPlugins(
      plugintype: PLUGINTYPE
    ): number
    /** Retrieves the type of output interface used to run the mixer. */
    getOutput(): OUTPUTTYPE
    /** Retrieves the plug-in handle for the currently selected output type. */
    getOutputByPlugin(): number
    /** Retrieves the handle of a plug-in based on its type and relative index. */
    getPluginHandle(
      plugintype: PLUGINTYPE,
      index: number
    ): number
    /** Retrieves information for the selected plug-in. */
    getPluginInfo(
      handle: number,
      plugintype: PLUGINTYPE,
    ): { name: string, version: number }
    /** Retrieves identification information about an audio device specified by its index, and specific to the output mode. */
    getRecordDriverInfo(
      id: number
    ): { name:string, guid: GUID, systemrate: number, speakermode: SPEAKERMODE, speakermodechannels: number, state:DRIVER_STATE }
    /** Retrieves the number of recording devices available for this output mode. Use this to enumerate all recording devices possible so that the user can select one. */
    getRecordNumDrivers(): { numdrivers: number, numconnected: number }
    /** Retrieves the current recording position of the record buffer in PCM samples. */
    getRecordPosition(
      id: number
    ): number
    /** Retrieves the current reverb environment for the specified reverb instance. */
    getReverbProperties(
      instance: number
    ): REVERB_PROPERTIES
    /** Retrieves the maximum number of software mixed Channels possible. */
    getSoftwareChannels(): number
    /** Retrieves the output format for the software mixer. */
    getSoftwareFormat(): { samplerate: number, speakermode: SPEAKERMODE, numrawspeakers: number }
    /** Retrieves the channel count for a given speaker mode. */
    getSpeakerModeChannels(
      mode: SPEAKERMODE
    ): number
    /** Retrieves the position of the specified speaker for the current speaker mode. */
    getSpeakerPosition(
      speaker: SPEAKER
    ): { x: number, y: number, active: boolean }
    /** Retrieves the default file buffer size for newly opened streams. */
    getStreamBufferSize(): { filebuffersize: number, filebuffersizetype: TIMEUNIT }
    /** Retrieves a user value associated with a System object. */
    getUserData(): any
    /** Retrieves the FMOD version and build number. */
    getVersion(): { version: number, buildnumber: number }
    /** Initialize the system object and prepare FMOD for playback. */
    init(
      maxchannels: number,
      flags: INITFLAGS,
      extradriverdata?: any
    ): void
    /** Retrieves the state of the FMOD recording API, ie if it is currently recording or not. */
    isRecording(
      id: number
    ): boolean
    /** Creates a geometry object from a block of memory which contains pre-saved geometry data. */
    loadGeometry(
      data: string
    ): Geometry
    /** Mutual exclusion function to lock the DSP engine (which runs asynchronously in another thread), so that it will not execute. */
    lockDSP(): void
    /** Resume mixer thread and reacquire access to audio hardware. */
    mixerResume(): void
    /** Suspend mixer thread and relinquish usage of audio hardware while maintaining internal state. */
    mixerSuspend(): void
    /** Plays a DSP along with any of its inputs on a Channel. */
    playDSP(
      dsp: DSP | null,
      channelgroup: ChannelGroup | null,
      paused: boolean
    ): Channel
    /** Plays a Sound on a Channel. */
    playSound(
      sound: Sound | null,
      channelgroup: ChannelGroup | null,
      paused: boolean
    ): Channel
    /** Starts the recording engine recording to a pre-created Sound object. */
    recordStart(
      id: number,
      sound: Sound,
      loop: boolean
    ): void
    /** Stops the recording engine from recording to a pre-created Sound object. */
    recordStop(
      id: number
    ): void
    /** Register a DSP plug-in description structure for later use. */
    registerDSP(
      description: DSP_DESCRIPTION
    ): number
    /** Closes and frees this object and its resources. */
    release(): void
    /** Sets the position, velocity and orientation of the specified 3D sound listener. */
    set3DListenerAttributes(
      listener: number,
      pos?: {x?:number, y?:number, z?:number},
      vel?: {x?:number, y?:number, z?:number},
      forward?: {x?:number, y?:number, z?:number},
      up?: {x?:number, y?:number, z?:number}
    ): void
    /** Sets the number of 3D 'listeners' in the 3D sound scene. */
    set3DNumListeners(
      numlisteners: number
    ): void
    /** Sets the global doppler scale, distance factor and log roll-off scale for all 3D sound in FMOD. */
    set3DSettings(
      dopplerscale: number,
      distancefactor: number,
      rolloffscale: number
    ): void
    /** Sets advanced settings for the system object, typically to allow adjusting of settings related to resource usage or audio quality. */
    setAdvancedSettings(
      settings: ADVANCEDSETTINGS
    ): void
    /** Sets the callback for System level notifications. */
    setCallback(
      callback: SYSTEM_CALLBACK | null,
      callbackmask?: SYSTEM_CALLBACK_TYPE
    ): void
    /** Sets the output driver for the selected output type. */
    setDriver(
      driver: number
    ): void
    /** Sets the buffer size for the FMOD software mixing engine. */
    setDSPBufferSize(
      bufferlength: number,
      numbuffers: number
    ): void
    /** Set callbacks to implement all file I/O instead of using the platform native method. */
    setFileSystem(
      useropen?: FILE_OPEN_CALLBACK,
      userclose?: FILE_CLOSE_CALLBACK,
      userread?: FILE_READ_CALLBACK,
      userseek?: FILE_SEEK_CALLBACK,
      userasyncread?: FILE_ASYNCREAD_CALLBACK,
      userasynccancel?: FILE_ASYNCCANCEL_CALLBACK,
      blockalign?: number
    ): void
    /** Sets the maximum world size for the geometry engine for performance / precision reasons. */
    setGeometrySettings(
      maxworldsize: number
    ): void
    /** Set a proxy server to use for all subsequent internet connections. */
    setNetworkProxy(
      proxy: string
    ): void
    /** Set the timeout for network streams. */
    setNetworkTimeout(
      timeout: number
    ): void
    /** Sets the type of output interface used to run the mixer. */
    setOutput(
      output: OUTPUTTYPE
    ): void
    /** Selects an output type given a plug-in handle. */
    setOutputByPlugin(
      handle: number
    ): void
    /** Specify a base search path for plug-ins so they can be placed somewhere else than the directory of the main executable. */
    setPluginPath(
      path: string
    ): void
    /** Sets parameters for the global reverb environment. */
    setReverbProperties(
      instance: number,
      prop: REVERB_PROPERTIES
    ): void
    /** Sets the maximum number of software mixed Channels possible. */
    setSoftwareChannels(
      numsoftwarechannels: number
    ): void
    /** Sets the output format for the software mixer. */
    setSoftwareFormat(
      samplerate: number,
      speakermode: SPEAKERMODE,
      numrawspeaker: number
    ): void
    /** Sets the position of the specified speaker for the current speaker mode. */
    setSpeakerPosition(
      speaker: SPEAKER,
      x: number,
      y: number,
      active: boolean
    ): void
    /** Sets the default file buffer size for newly opened streams. */
    setStreamBufferSize(
      filebuffersize: number,
      filebuffersizetype: number
    ): void
    /** Sets a user value associated with a System object. */
    setUserData(
      userdata: any
    ): void
    /** Unloads an FMOD (DSP, Output or Codec) plug-in. */
    unloadPlugin(
      handle: number
    ): void
    /** Mutual exclusion function to unlock the DSP engine (which runs asynchronously in another thread) and let it continue executing. */
    unlockDSP(): void
    /** Updates the FMOD system. */
    update(): void
  }
}

export default function createFMOD(opts?: InitOptions): Promise<FMOD>;