/* eslint-disable */

import { FMOD as CoreFMOD } from "./fmod";
import { InitOptions as CoreInitOptions } from "./fmod";

export interface FMOD extends CoreFMOD {

  /** This function creates the studio system. */
  Studio_System_Create(): FMOD.Studio.System
  /** Parses a GUID from a string. */
  Studio_ParseID(
    idstring: string
  ): FMOD.Core.GUID

  STUDIO_COMMANDCAPTURE_FLAGS_FILEFLUSH: number;
  STUDIO_COMMANDCAPTURE_FLAGS_NORMAL: number;
  STUDIO_COMMANDCAPTURE_FLAGS_SKIP_INITIAL_STATE: number;
  STUDIO_COMMANDREPLAY_FLAGS_FAST_FORWARD: number;
  STUDIO_COMMANDREPLAY_FLAGS_NORMAL: number;
  STUDIO_COMMANDREPLAY_FLAGS_SKIP_BANK_LOAD: number;
  STUDIO_COMMANDREPLAY_FLAGS_SKIP_CLEANUP: number;
  /** Pass this mask to Studio::EventDescription::setCallback or Studio::EventInstance::setCallback to receive all callback types. */
  STUDIO_EVENT_CALLBACK_ALL: number;
  /** Called when an instance is fully created. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_CREATED: number;
  /** A programmer sound is about to play. FMOD expects the callback to provide an FMOD::Sound object for it to use. Parameters = FMODSTUDIOPROGRAMMERSOUNDPROPERTIES. */
  STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND: number;
  /** Called when an instance is just about to be destroyed. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_DESTROYED: number;
  /** A programmer sound has stopped playing. At this point it is safe to release the FMOD::Sound object that was used. Parameters = FMODSTUDIOPROGRAMMERSOUNDPROPERTIES. */
  STUDIO_EVENT_CALLBACK_DESTROY_PROGRAMMER_SOUND: number;
  /** Called when the timeline hits a beat in a tempo section of a nested event. Parameters = FMODSTUDIOTIMELINENESTEDBEATPROPERTIES. */
  STUDIO_EVENT_CALLBACK_NESTED_TIMELINE_BEAT: number;
  /** Called when a DSP plug-in instance has just been created. Parameters = FMODSTUDIOPLUGININSTANCEPROPERTIES. */
  STUDIO_EVENT_CALLBACK_PLUGIN_CREATED: number;
  /** Called when a DSP plug-in instance is about to be destroyed. Parameters = FMODSTUDIOPLUGININSTANCEPROPERTIES. */
  STUDIO_EVENT_CALLBACK_PLUGIN_DESTROYED: number;
  /** Called when the event becomes virtual. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_REAL_TO_VIRTUAL: number;
  /** Studio::EventInstance::start has been called on an event which was already playing. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_RESTARTED: number;
  /** Called when the event plays a sound. Parameters = Sound. */
  STUDIO_EVENT_CALLBACK_SOUND_PLAYED: number;
  /** Called when the event finishes playing a sound. Parameters = Sound. */
  STUDIO_EVENT_CALLBACK_SOUND_STOPPED: number;
  /** The event has commenced playing. Normally this callback will be issued immediately after FMODSTUDIOEVENTCALLBACKSTARTING, but may be delayed until sample data has loaded. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_STARTED: number;
  /** Studio::EventInstance::start has been called on an event which was not already playing. The event will remain in this state until its sample data has been loaded. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_STARTING: number;
  /** Called when a new event is started by a start event command. Parameters = Studio::EventInstance. */
  STUDIO_EVENT_CALLBACK_START_EVENT_COMMAND: number;
  /** Studio::EventInstance::start has been called but the polyphony settings did not allow the event to start. In this case none of FMODSTUDIOEVENTCALLBACKSTARTING, FMODSTUDIOEVENTCALLBACKSTARTED and FMODSTUDIOEVENTCALLBACKSTOPPED will be called. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_START_FAILED: number;
  /** The event has stopped. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_STOPPED: number;
  /** Called when the timeline hits a beat in a tempo section. Parameters = FMODSTUDIOTIMELINEBEATPROPERTIES. */
  STUDIO_EVENT_CALLBACK_TIMELINE_BEAT: number;
  /** Called when the timeline passes a named marker. Parameters = FMODSTUDIOTIMELINEMARKERPROPERTIES. */
  STUDIO_EVENT_CALLBACK_TIMELINE_MARKER: number;
  /** Called when the event becomes real. Parameters = unused. */
  STUDIO_EVENT_CALLBACK_VIRTUAL_TO_REAL: number;
  /** Priority to set on Core API Channels created by this event instance, 0 for most important, 256 for least important, and -1 for default. */
  STUDIO_EVENT_PROPERTY_CHANNELPRIORITY: number;
  /** Override the event's cooldown, or -1 for default. */
  STUDIO_EVENT_PROPERTY_COOLDOWN: number;
  /** Maximum number of event property types. */
  STUDIO_EVENT_PROPERTY_MAX: number;
  /** Override the event's 3D maximum distance, or -1 for default. */
  STUDIO_EVENT_PROPERTY_MAXIMUM_DISTANCE: number;
  /** Override the event's 3D minimum distance, or -1 for default. */
  STUDIO_EVENT_PROPERTY_MINIMUM_DISTANCE: number;
  /** Schedule delay in DSP clocks, or -1 for default. */
  STUDIO_EVENT_PROPERTY_SCHEDULE_DELAY: number;
  /** Schedule look-ahead on the timeline in DSP clocks, or -1 for default. */
  STUDIO_EVENT_PROPERTY_SCHEDULE_LOOKAHEAD: number;
  /** Load banks even if they reference plug-ins that have not been loaded. */
  STUDIO_INIT_ALLOW_MISSING_PLUGINS: number;
  /** Defer timeline callbacks until the main update. See Studio::EventInstance::setCallback for more information. */
  STUDIO_INIT_DEFERRED_CALLBACKS: number;
  /** Enable live update. */
  STUDIO_INIT_LIVEUPDATE: number;
  /** No additional threads are created for bank and resource loading. Loading is driven from Studio::System::update. */
  STUDIO_INIT_LOAD_FROM_UPDATE: number;
  /** Enables detailed memory usage statistics. Increases memory footprint and impacts performance. See Studio::Bus::getMemoryUsage and Studio::EventInstance::getMemoryUsage for more information. Implies FMODINITMEMORYTRACKING. */
  STUDIO_INIT_MEMORY_TRACKING: number;
  /** Use defaults for all initialization options. */
  STUDIO_INIT_NORMAL: number;
  /** Disable asynchronous processing and perform all processing on the calling thread instead. */
  STUDIO_INIT_SYNCHRONOUS_UPDATE: number;
  /** Studio::Bank. */
  STUDIO_INSTANCETYPE_BANK: number;
  /** Studio::Bus. */
  STUDIO_INSTANCETYPE_BUS: number;
  /** Studio::CommandReplay. */
  STUDIO_INSTANCETYPE_COMMANDREPLAY: number;
  /** Studio::EventDescription. */
  STUDIO_INSTANCETYPE_EVENTDESCRIPTION: number;
  /** Studio::EventInstance. */
  STUDIO_INSTANCETYPE_EVENTINSTANCE: number;
  /** No type, handle is unused. */
  STUDIO_INSTANCETYPE_NONE: number;
  /** Studio::ParameterInstance. */
  STUDIO_INSTANCETYPE_PARAMETERINSTANCE: number;
  /** Studio::System. */
  STUDIO_INSTANCETYPE_SYSTEM: number;
  /** Studio::VCA. */
  STUDIO_INSTANCETYPE_VCA: number;
  /** Failed to load. */
  STUDIO_LOADING_STATE_ERROR: number;
  /** Loaded and ready to play. */
  STUDIO_LOADING_STATE_LOADED: number;
  /** Loading in progress. */
  STUDIO_LOADING_STATE_LOADING: number;
  /** Not loaded. */
  STUDIO_LOADING_STATE_UNLOADED: number;
  /** Currently unloading. */
  STUDIO_LOADING_STATE_UNLOADING: number;
  /** Force samples to decompress into memory when they are loaded, rather than staying compressed. */
  STUDIO_LOAD_BANK_DECOMPRESS_SAMPLES: number;
  /** Bank loading occurs asynchronously rather than occurring immediately. */
  STUDIO_LOAD_BANK_NONBLOCKING: number;
  /** Standard behavior. */
  STUDIO_LOAD_BANK_NORMAL: number;
  /** Ignore the encryption key specified by Studio::System::setAdvancedSettings when loading sounds from this bank (assume the sounds in the bank are not encrypted). */
  STUDIO_LOAD_BANK_UNENCRYPTED: number;
  /** Memory buffer is copied internally. */
  STUDIO_LOAD_MEMORY: number;
  /** Memory buffer is used directly in user memory. */
  STUDIO_LOAD_MEMORY_POINT: number;
  /** Automatic parameter. */
  STUDIO_PARAMETER_AUTOMATIC: number;
  /** Horizontal angle between the listener's forward vector and the vector pointing from the listener to the event (-180 to 180 degrees). */
  STUDIO_PARAMETER_AUTOMATIC_DIRECTION: number;
  /** Distance between the event and the listener. */
  STUDIO_PARAMETER_AUTOMATIC_DISTANCE: number;
  /** Distance between the event and the listener in the range min distance - max distance represented as 0 - 1. */
  STUDIO_PARAMETER_AUTOMATIC_DISTANCE_NORMALIZED: number;
  /** Angle between the listener's XZ plane and the vector pointing from the listener to the event (-90 to 90 degrees). */
  STUDIO_PARAMETER_AUTOMATIC_ELEVATION: number;
  /** Angle between the event's forward vector and the vector pointing from the event to the listener (0 to 180 degrees). */
  STUDIO_PARAMETER_AUTOMATIC_EVENT_CONE_ANGLE: number;
  /** Horizontal angle between the event's forward vector and listener's forward vector (-180 to 180 degrees). */
  STUDIO_PARAMETER_AUTOMATIC_EVENT_ORIENTATION: number;
  /** Horizontal angle between the listener's forward vector and the global positive Z axis (-180 to 180 degrees). */
  STUDIO_PARAMETER_AUTOMATIC_LISTENER_ORIENTATION: number;
  /** Magnitude of the relative velocity of the event and the listener. */
  STUDIO_PARAMETER_AUTOMATIC_SPEED: number;
  /** Magnitude of the absolute velocity of the event. */
  STUDIO_PARAMETER_AUTOMATIC_SPEED_ABSOLUTE: number;
  /** Discrete parameter that operates on integers (whole numbers) rather than continuous fractional numbers. */
  STUDIO_PARAMETER_DISCRETE: number;
  /** API settable parameter. */
  STUDIO_PARAMETER_GAME_CONTROLLED: number;
  /** Global parameter. */
  STUDIO_PARAMETER_GLOBAL: number;
  /** Labeled discrete parameter that has a label for each integer value. This flag is never set in banks built with FMOD Studio versions prior to 2.01.10. If this flag is set, FMODSTUDIOPARAMETERDISCRETE is also set. */
  STUDIO_PARAMETER_LABELED: number;
  /** Maximum number of parameter types supported. */
  STUDIO_PARAMETER_MAX: number;
  /** Read only. */
  STUDIO_PARAMETER_READONLY: number;
  /** Playing. */
  STUDIO_PLAYBACK_PLAYING: number;
  /** Preparing to start. */
  STUDIO_PLAYBACK_STARTING: number;
  /** Stopped. */
  STUDIO_PLAYBACK_STOPPED: number;
  /** Preparing to stop. */
  STUDIO_PLAYBACK_STOPPING: number;
  /** The timeline cursor is paused on a sustain point. (Studio::EventInstance only.) */
  STUDIO_PLAYBACK_SUSTAINING: number;
  /** Allows AHDSR modulators to complete their release, and DSP effect tails to play out. */
  STUDIO_STOP_ALLOWFADEOUT: number;
  /** Stops the event instance immediately. */
  STUDIO_STOP_IMMEDIATE: number;
  /** Pass this mask to Studio::System::setCallback to receive all callback types. */
  STUDIO_SYSTEM_CALLBACK_ALL: number;
  /** Called directly when a bank has just been unloaded, after all resources are freed. The commanddata argument is the bank handle. */
  STUDIO_SYSTEM_CALLBACK_BANK_UNLOAD: number;
  /** Called after a live update connection has been established. */
  STUDIO_SYSTEM_CALLBACK_LIVEUPDATE_CONNECTED: number;
  /** Called after live update session disconnects. */
  STUDIO_SYSTEM_CALLBACK_LIVEUPDATE_DISCONNECTED: number;
  /** Called at the end of the main Studio update. For async mode this will be on its own thread. */
  STUDIO_SYSTEM_CALLBACK_POSTUPDATE: number;
  /** Called at the start of the main Studio update. For async mode this will be on its own thread. */
  STUDIO_SYSTEM_CALLBACK_PREUPDATE: number;
  STUDIO_USER_PROPERTY_BOOLEAN: number;
  STUDIO_USER_PROPERTY_FLOAT: number;
  STUDIO_USER_PROPERTY_INTEGER: number;
  STUDIO_USER_PROPERTY_STRING: number;
}

interface InitOptions extends CoreInitOptions {
    //
}

export namespace FMOD {

export namespace Core {

    // classes
    export import Channel = CoreFMOD.Channel;
    export import ChannelControl = CoreFMOD.ChannelControl;
    export import ChannelGroup = CoreFMOD.ChannelGroup;
    export import DSP = CoreFMOD.DSP;
    export import DSPConnection = CoreFMOD.DSPConnection;
    export import Geometry = CoreFMOD.Geometry;
    export import Reverb3D = CoreFMOD.Reverb3D;
    export import Sound = CoreFMOD.Sound ;
    export import SoundGroup = CoreFMOD.SoundGroup;
    export import System = CoreFMOD.System;

    // interfaces (structs)

    export import _3D_ATTRIBUTES = CoreFMOD._3D_ATTRIBUTES;
    export import CPU_USAGE = CoreFMOD.CPU_USAGE;
    export import GUID = CoreFMOD.GUID;
    export import SYNCPOINT = CoreFMOD.SYNCPOINT;
    export import VECTOR = CoreFMOD.VECTOR;
    export import COMPLEX = CoreFMOD.COMPLEX;
    export import DSP_BUFFER = CoreFMOD.DSP_BUFFER;
    export import DSP_DESCRIPTION = CoreFMOD.DSP_DESCRIPTION;
    export import _3D_DSP_METERING_INFOATTRIBUTES = CoreFMOD.DSP_METERING_INFO;
    export import DSP_PARAMETER_DESC = CoreFMOD.DSP_PARAMETER_DESC;
    export import DSP_PARAMETER_FLOAT_MAPPING = CoreFMOD.DSP_PARAMETER_FLOAT_MAPPING;
    export import DSP_PARAMETER_FLOAT_MAPPING_PIECEWISE_LINEAR = CoreFMOD.DSP_PARAMETER_FLOAT_MAPPING_PIECEWISE_LINEAR;
    export import DSP_STATE = CoreFMOD.DSP_STATE;
    export import DSP_STATE_FUNCTIONS = CoreFMOD.DSP_STATE_FUNCTIONS;
    export import DSP_LOUDNESS_METER_INFO_TYPE = CoreFMOD.DSP_LOUDNESS_METER_INFO_TYPE;
    export import DSP_LOUDNESS_METER_WEIGHTING_TYPE = CoreFMOD.DSP_LOUDNESS_METER_WEIGHTING_TYPE;
    export import DSP_DATA_PARAMETER_INFO = CoreFMOD.DSP_DATA_PARAMETER_INFO;
    export import DSP_PARAMETER_3DATTRIBUTES_MULTI = CoreFMOD.DSP_PARAMETER_3DATTRIBUTES_MULTI;
    export import DSP_PARAMETER_3DATTRIBUTES = CoreFMOD.DSP_PARAMETER_3DATTRIBUTES;
    export import DSP_PARAMETER_ATTENUATION_RANGE = CoreFMOD.DSP_PARAMETER_ATTENUATION_RANGE;
    export import TAG = CoreFMOD.TAG;
    export import ADVANCEDSETTINGS = CoreFMOD.ADVANCEDSETTINGS;
    export import ASYNCREADINFO = CoreFMOD.ASYNCREADINFO;
    export import CREATESOUNDEXINFO = CoreFMOD.CREATESOUNDEXINFO;
    export import ERRORCALLBACK_INFO = CoreFMOD.ERRORCALLBACK_INFO;
    export import REVERB_PROPERTIES = CoreFMOD.REVERB_PROPERTIES;
    export import DSP_PARAMETER_DESC_BOOL = CoreFMOD.DSP_PARAMETER_DESC_BOOL;
    export import DSP_PARAMETER_DESC_DATA = CoreFMOD.DSP_PARAMETER_DESC_DATA;
    export import DSP_PARAMETER_DESC_FLOAT = CoreFMOD.DSP_PARAMETER_DESC_FLOAT;
    export import DSP_PARAMETER_DESC_INT = CoreFMOD.DSP_PARAMETER_DESC_INT;
    export import DSP_PARAMETER_DYNAMIC_RESPONSE = CoreFMOD.DSP_PARAMETER_DYNAMIC_RESPONSE;
    export import DSP_PARAMETER_FFT = CoreFMOD.DSP_PARAMETER_FFT;
    export import DSP_PARAMETER_OVERALLGAIN = CoreFMOD.DSP_PARAMETER_OVERALLGAIN;
    export import DSP_PARAMETER_SIDECHAIN = CoreFMOD.DSP_PARAMETER_SIDECHAIN;

    // types
    export import RESULT = CoreFMOD.RESULT;
    export import DEBUG_FLAGS = CoreFMOD.DEBUG_FLAGS;
    export import INITFLAGS = CoreFMOD.INITFLAGS;
    export import CHANNELCONTROL_TYPE = CoreFMOD.CHANNELCONTROL_TYPE;
    export import CHANNELCONTROL_CALLBACK_TYPE = CoreFMOD.CHANNELCONTROL_CALLBACK_TYPE;
    export import CHANNELCONTROL_CALLBACK = CoreFMOD.CHANNELCONTROL_CALLBACK;
    export import MEMORY_TYPE = CoreFMOD.MEMORY_TYPE;
    export import CHANNELMASK = CoreFMOD.CHANNELMASK;
    export import SPEAKERMODE = CoreFMOD.SPEAKERMODE;
    export import DSP_ALLOC_FUNC = CoreFMOD.DSP_ALLOC_FUNC;
    export import DSP_CREATE_CALLBACK = CoreFMOD.DSP_CREATE_CALLBACK;
    export import DSP_FREE_FUNC = CoreFMOD.DSP_FREE_FUNC;
    export import DSP_GETBLOCKSIZE_FUNC = CoreFMOD.DSP_GETBLOCKSIZE_FUNC;
    export import DSP_GETCLOCK_FUNC = CoreFMOD.DSP_GETCLOCK_FUNC;
    export import DSP_GETLISTENERATTRIBUTES_FUNC = CoreFMOD.DSP_GETLISTENERATTRIBUTES_FUNC;
    export import DSP_GETPARAM_BOOL_CALLBACK = CoreFMOD.DSP_GETPARAM_BOOL_CALLBACK;
    export import DSP_GETPARAM_DATA_CALLBACK = CoreFMOD.DSP_GETPARAM_DATA_CALLBACK;
    export import DSP_GETPARAM_FLOAT_CALLBACK = CoreFMOD.DSP_GETPARAM_FLOAT_CALLBACK;
    export import DSP_GETPARAM_INT_CALLBACK = CoreFMOD.DSP_GETPARAM_INT_CALLBACK;
    export import DSP_GETSAMPLERATE_FUNC = CoreFMOD.DSP_GETSAMPLERATE_FUNC;
    export import DSP_GETSPEAKERMODE_FUNC = CoreFMOD.DSP_GETSPEAKERMODE_FUNC;
    export import DSP_GETUSERDATA_FUNC = CoreFMOD.DSP_GETUSERDATA_FUNC;
    export import DSP_LOG_FUNC = CoreFMOD.DSP_LOG_FUNC;
    export import DSP_PARAMETER_TYPE = CoreFMOD.DSP_PARAMETER_TYPE;
    export import DSP_PARAMETER_FLOAT_MAPPING_TYPE = CoreFMOD.DSP_PARAMETER_FLOAT_MAPPING_TYPE;
    export import DSP_PROCESS_OPERATION = CoreFMOD.DSP_PROCESS_OPERATION;
    export import DSP_PROCESS_CALLBACK = CoreFMOD.DSP_PROCESS_CALLBACK;
    export import DSP_REALLOC_FUNC = CoreFMOD.DSP_REALLOC_FUNC;
    export import DSP_RELEASE_CALLBACK = CoreFMOD.DSP_RELEASE_CALLBACK;
    export import DSP_RESET_CALLBACK = CoreFMOD.DSP_RESET_CALLBACK;
    export import DSP_SETPARAM_BOOL_CALLBACK = CoreFMOD.DSP_SETPARAM_BOOL_CALLBACK;
    export import DSP_SETPARAM_DATA_CALLBACK = CoreFMOD.DSP_SETPARAM_DATA_CALLBACK;
    export import DSP_SETPARAM_FLOAT_CALLBACK = CoreFMOD.DSP_SETPARAM_FLOAT_CALLBACK;
    export import DSP_SETPARAM_INT_CALLBACK = CoreFMOD.DSP_SETPARAM_INT_CALLBACK;
    export import DSP_SETPOSITION_CALLBACK = CoreFMOD.DSP_SETPOSITION_CALLBACK;
    export import DSP_SYSTEM_DEREGISTER_CALLBACK = CoreFMOD.DSP_SYSTEM_DEREGISTER_CALLBACK;
    export import DSP_SYSTEM_MIX_CALLBACK = CoreFMOD.DSP_SYSTEM_MIX_CALLBACK;
    export import DSP_SYSTEM_REGISTER_CALLBACK = CoreFMOD.DSP_SYSTEM_REGISTER_CALLBACK;
    export import DSP_CALLBACK_TYPE = CoreFMOD.DSP_CALLBACK_TYPE;
    export import DSP_CALLBACK = CoreFMOD.DSP_CALLBACK;
    export import SOUND_NONBLOCK_CALLBACK = CoreFMOD.SOUND_NONBLOCK_CALLBACK;
    export import SOUND_PCMREAD_CALLBACK = CoreFMOD.SOUND_PCMREAD_CALLBACK;
    export import TIMEUNIT = CoreFMOD.TIMEUNIT;
    export import SOUND_PCMSETPOS_CALLBACK = CoreFMOD.SOUND_PCMSETPOS_CALLBACK;
    export import TAGTYPE = CoreFMOD.TAGTYPE;
    export import TAGDATATYPE = CoreFMOD.TAGDATATYPE;
    export import DSP_RESAMPLER = CoreFMOD.DSP_RESAMPLER;
    export import SOUND_FORMAT = CoreFMOD.SOUND_FORMAT;
    export import SOUND_TYPE = CoreFMOD.SOUND_TYPE;
    export import CHANNELORDER = CoreFMOD.CHANNELORDER;
    export import ERRORCALLBACK_INSTANCETYPE = CoreFMOD.ERRORCALLBACK_INSTANCETYPE;
    export import FILE_ASYNCCANCEL_CALLBACK = CoreFMOD.FILE_ASYNCCANCEL_CALLBACK;
    export import FILE_ASYNCDONE_FUNC = CoreFMOD.FILE_ASYNCDONE_FUNC;
    export import FILE_ASYNCREAD_CALLBACK = CoreFMOD.FILE_ASYNCREAD_CALLBACK;
    export import FILE_OPEN_CALLBACK = CoreFMOD.FILE_OPEN_CALLBACK;
    export import FILE_READ_CALLBACK = CoreFMOD.FILE_READ_CALLBACK;
    export import FILE_SEEK_CALLBACK = CoreFMOD.FILE_SEEK_CALLBACK;
    export import FILE_CLOSE_CALLBACK = CoreFMOD.FILE_CLOSE_CALLBACK;
    export import SYSTEM_CALLBACK_TYPE = CoreFMOD.SYSTEM_CALLBACK_TYPE;
    export import SYSTEM_CALLBACK = CoreFMOD.SYSTEM_CALLBACK;
    export import MODE = CoreFMOD.MODE;
    export import DSPCONNECTION_TYPE = CoreFMOD.DSPCONNECTION_TYPE;
    export import DSP_TYPE = CoreFMOD.DSP_TYPE;
    export import OPENSTATE = CoreFMOD.OPENSTATE;
    export import SOUNDGROUP_BEHAVIOR = CoreFMOD.SOUNDGROUP_BEHAVIOR;
    export import PLUGINTYPE = CoreFMOD.PLUGINTYPE;
    export import OUTPUTTYPE = CoreFMOD.OUTPUTTYPE;
    export import SPEAKER = CoreFMOD.SPEAKER;
    export import DRIVER_STATE = CoreFMOD.DRIVER_STATE;

}

export type STUDIO_INSTANCETYPE = number;
export type STUDIO_PARAMETER_TYPE = number;
export type STUDIO_PARAMETER_FLAGS = number;
export type STUDIO_USER_PROPERTY_TYPE = number;
export type STUDIO_SYSTEM_CALLBACK_TYPE = number;
export type STUDIO_EVENT_CALLBACK_TYPE = number;
export type STUDIO_STOP_MODE = number;
export type STUDIO_LOADING_STATE = number;
export type STUDIO_EVENT_PROPERTY = number;
export type STUDIO_PLAYBACK_STATE = number;
export type STUDIO_LOAD_BANK_FLAGS = number;
export type STUDIO_INITFLAGS = number;
export type STUDIO_LOAD_MEMORY_MODE = number;
export type STUDIO_COMMANDREPLAY_FLAGS = number;
export type STUDIO_COMMANDCAPTURE_FLAGS = number;

// ===== Global declarations (non-functions) =====
/** Describes a command replay command. */
export interface STUDIO_COMMAND_INFO
{
  commandname: string,
  parentcommandindex: number,
  framenumber: number,
  frametime: number,
  instancetype: STUDIO_INSTANCETYPE,
  outputtype: STUDIO_INSTANCETYPE,
  instancehandle: number,
  outputhandle: number
}

/** Memory usage statistics. */
export interface STUDIO_MEMORY_USAGE
{
  exclusive: number,
  inclusive: number,
  sampledata: number
}
/** Describes an event parameter. */
export interface STUDIO_PARAMETER_DESCRIPTION
{
  name: string,
  id: STUDIO_PARAMETER_ID,
  minimum: number,
  maximum: number,
  defaultvalue: number,
  type: STUDIO_PARAMETER_TYPE,
  flags: STUDIO_PARAMETER_FLAGS,
  guid: FMOD.Core.GUID
}

/** Describes an event parameter identifier. */
export interface STUDIO_PARAMETER_ID
{
    data1: number,
    data2: number
}

/** Describes a user property. */
export interface STUDIO_USER_PROPERTY
{
  name: string,
  type: STUDIO_USER_PROPERTY_TYPE,
  value: any
}

/** Describes a programmer sound. */
export interface STUDIO_PROGRAMMER_SOUND_PROPERTIES
{
  name: string,
  sound: FMOD.Core.Sound,
  subsoundIndex: number
}

/** Describes a beat on the timeline. */
export interface STUDIO_TIMELINE_BEAT_PROPERTIES
{
  bar: number,
  beat: number,
  position: number,
  tempo: number,
  timesignatureupper: number,
  timesignaturelower: number,
}
/** Describes a marker on the timeline. */
export interface STUDIO_TIMELINE_MARKER_PROPERTIES
{
  name: string,
  position: number
}
/** Describes a beat on the timeline from a nested event. */
export interface TIMELINE_NESTED_BEAT_PROPERTIES
{
  eventid: FMOD.Core.GUID,
  properties: STUDIO_TIMELINE_BEAT_PROPERTIES
}
/** Settings for advanced features like configuring memory and cpu usage. */
export interface STUDIO_ADVANCEDSETTINGS
{
  commandqueuesize?: number,
  handleinitialsize?: number,
  studioupdateperiod?: number,
  idlesampledatapoolsize?: number,
  streamingscheduledelay?: number
  encryptionkey?: string
}
/** Information for loading a bank using user callbacks. */
export interface STUDIO_BANK_INFO
{
  userdata?: any,
  opencallback: FMOD.Core.FILE_OPEN_CALLBACK,
  closecallback: FMOD.Core.FILE_CLOSE_CALLBACK,
  readcallback: FMOD.Core.FILE_READ_CALLBACK,
  seekcallback: FMOD.Core.FILE_SEEK_CALLBACK
}
/** Information for a single buffer in FMOD Studio. */
export interface STUDIO_BUFFER_INFO
{
  currentusage: number,
  peakusage: number,
  capacity: number,
  stallcount: number,
  stalltime: number
}
/** Information for FMOD Studio buffer usage. */
export interface STUDIO_BUFFER_USAGE
{
  studiocommandqueue: STUDIO_BUFFER_INFO,
  studiohandle: STUDIO_BUFFER_INFO
}

/** Performance information for Studio API functionality. */
export interface STUDIO_CPU_USAGE
{
  update: number
}

/** Describes a sound in the audio table. */
export interface STUDIO_SOUND_INFO
{
  name_or_data: string,
  mode: FMOD.Core.MODE,
  exinfo: FMOD.Core.CREATESOUNDEXINFO,
  subsoundindex: number
}

export interface STUDIO_SYNCPOINT_PROPERTIES
{
    name: string,
    sound: FMOD.Core.Sound,
    position: number,
    index: number
}

export type STUDIO_SYSTEM_CALLBACK = (
  system: Studio.System,
  type: STUDIO_SYSTEM_CALLBACK_TYPE,
  commanddata: any,
  userdata: any
) => void;

  /** Callback that is fired when a Studio::EventInstance changes state. */
export type STUDIO_EVENT_CALLBACK = (
    type: STUDIO_EVENT_CALLBACK_TYPE,
    event: Studio.EventInstance,
    parameters: any
) => number;

// ===== API for folder: bank =====
namespace Studio
{
export class Bank {
  /** Retrieves the number of buses in the bank. This is only relevant for master banks, as other banks do not contain buses. */
  getBusCount(): number
  /** Retrieves a list of the buses in the bank. This is only relevant for master banks, as other banks do not contain buses. */
  getBusList(
    capacity: number
  ): Array<Bus>
  /** Retrieves the number of event descriptions in the bank. */
  getEventCount(): number
  /** Retrieves a list of the event descriptions in the bank. */
  getEventList(
    capacity: number
  ): Array<EventDescription>
  /** Retrieves the bank's GUID. */
  getID(): FMOD.Core.GUID
  /** Retrieves the loading state. */
  getLoadingState(): STUDIO_LOADING_STATE
  /** Retrieves the path. */
  getPath(): string
  /** Retrieves the loading state of the samples in the bank. */
  getSampleLoadingState(): STUDIO_LOADING_STATE
  /** Retrieves the number of string table entries in the bank. This is only relevant for studio string banks, as other banks do not contain string tables. */
  getStringCount(): number
  /** Retrieves a string table entry. This is only relevant for studio string banks, as other banks do not contain string tables. */
  getStringInfo(
    index: number
  ): { id: FMOD.Core.GUID, path: string }
  /** Retrieves the bank's user data. */
  getUserData(): any
  /** Retrieves the number of VCAs in the bank. */
  getVCACount(): number
  /** Retrieves a list of the VCAs in the bank. */
  getVCAList(
    capacity: number
  ): Array<VCA>
  /** Checks that the bank reference is valid. */
  isValid(): boolean
  /** Loads non-streaming sample data for all events in the bank. */
  loadSampleData(): void
  /** Sets the bank's user data. */
  setUserData(
    userdata: any
  ): void
  /** Unloads the bank. */
  unload(): void
  /** Unloads non-streaming sample data for all events in the bank. */
  unloadSampleData(): void
}

// ===== API for folder: bus =====
export class Bus {
  /** Retrieves the core ChannelGroup. */
  getChannelGroup(): FMOD.Core.ChannelGroup
  /** Retrieves the bus CPU usage data. */
  getCPUUsage(): { exclusive: number, inclusive: number }
  /** Retrieves the GUID. */
  getID(): FMOD.Core.GUID
  /** Retrieves memory usage statistics. */
  getMemoryUsage(): STUDIO_MEMORY_USAGE
  /** Retrieves the mute state. */
  getMute(): boolean
  /** Retrieves the path. */
  getPath(): string
  /** Retrieves the pause state. */
  getPaused(): boolean
  /** Retrieves the port index assigned to the bus. */
  getPortIndex(): number
  /** Retrieves the volume level. */
  getVolume(): { volume: number, finalvolume: number }
  /** Checks that the Bus reference is valid. */
  isValid(): boolean
  /** Locks the core ChannelGroup. */
  lockChannelGroup(): void
  /** Sets the mute state. */
  setMute(
    mute: boolean
  ): void
  /** Sets the pause state. */
  setPaused(
    paused: boolean
  ): void
  /** Sets the port index to use when attaching to an output port. */
  setPortIndex(
    index: number
  ): void
  /** Sets the volume level. */
  setVolume(
    volume: number
  ): void
  /** Stops all event instances that are routed into the bus. */
  stopAllEvents(
    mode: STUDIO_STOP_MODE
  ): void
  /** Unlocks the core ChannelGroup. */
  unlockChannelGroup(): void
}

// ===== API for folder: commandreplay =====
export class CommandReplay {
  /** Retrieves the command index corresponding to the given playback time. */
  getCommandAtTime(
    time: number
  ): number
  /** Retrieves the number of commands in the replay. */
  getCommandCount(): number
  /** Retrieves command information. */
  getCommandInfo(
    commandindex: number,
  ): STUDIO_COMMAND_INFO
  /** Retrieves the string representation of a command. */
  getCommandString(
    commandindex: number
  ): string
  /** Retrieves the progress through the command replay. */
  getCurrentCommand(
    commandindex: number
  ): number
  /** Retrieves the total playback time. */
  getLength(): number
  /** Retrieves the paused state. */
  getPaused(): boolean
  /** Retrieves the playback state. */
  getPlaybackState(): STUDIO_PLAYBACK_STATE
  /** Retrieves the Studio System object associated with this replay object. */
  getSystem(): Studio.System
  /** Retrieves user data. */
  getUserData(): any
  /** Checks that the CommandReplay reference is valid. */
  isValid(): boolean
  /** Releases the command replay. */
  release(): void
  /** Seeks the playback position to a command. */
  seekToCommand(
    commandindex: number
  ): void
  /** Seeks the playback position to a time. */
  seekToTime(
    time: number
  ): void
  /** Sets a path substition that will be used when loading banks with this replay. */
  setBankPath(
    bankPath: string
  ): void
  /** Sets the paused state. */
  setPaused(
    paused: boolean
  ): void
  /** Sets user data. */
  setUserData(
    userdata: any
  ): void
  /** Begins playback. */
  start(): void
  /** Stops playback. */
  stop(): void
}

// ===== API for folder: eventdescription =====
export class EventDescription {
  /** Creates a playable instance. */
  createInstance(): Studio.EventInstance
  /** Retrieves the GUID associated with the event. */
  getID(): FMOD.Core.GUID
  /** Retrieves the number of instances. */
  getInstanceCount(): number
  /** Retrieves a list of the instances. */
  getInstanceList(
    capacity: number
  ): Array<EventInstance>
  /** Retrieves the length of the timeline. */
  getLength(): number
  /** Retrieves the minimum and maximum distances for 3D attenuation. */
  getMinMaxDistance(includeOverrides: boolean): { min: number, max: number }
  /** Retrieves an event parameter description by id. */
  getParameterDescriptionByID(
    id: number
  ): STUDIO_PARAMETER_DESCRIPTION
  /** Retrieves an event parameter description by index. */
  getParameterDescriptionByIndex(
    index: number
  ): STUDIO_PARAMETER_DESCRIPTION
  /** Retrieves an event parameter description by name, including the path if needed. */
  getParameterDescriptionByName(
    name: string
  ): STUDIO_PARAMETER_DESCRIPTION
  /** Retrieves the number of parameters in the event. */
  getParameterDescriptionCount(): number
  /** Retrieves an event parameter label by ID. */
  getParameterLabelByID(
    id: STUDIO_PARAMETER_ID,
    labelindex: number
  ): string
  /** Retrieves an event parameter label by index. */
  getParameterLabelByIndex(
    index: number,
    labelindex: number,
  ): string
  /** Retrieves an event parameter label by name, including the path if needed. */
  getParameterLabelByName(
    name: string,
    labelindex: number
  ): string
  /** Retrieves the path. */
  getPath(): string
  /** Retrieves the sample data loading state. */
  getSampleLoadingState(): STUDIO_LOADING_STATE
  /** Retrieves the sound size for 3D panning. */
  getSoundSize(): number
  /** Retrieves the event user data. */
  getUserData(): any
  /** Retrieves a user property by name. */
  getUserProperty(
    name: string
  ): STUDIO_USER_PROPERTY
  /** Retrieves a user property by index. */
  getUserPropertyByIndex(
    index: number
  ): STUDIO_USER_PROPERTY
  /** Retrieves the number of user properties attached to the event. */
  getUserPropertyCount(): number
  /** Retrieves whether the event has any sustain points. */
  hasSustainPoint(): boolean
  /** Retrieves the event's 3D status. */
  is3D(): boolean
  /** Retrieves the event's doppler status. */
  isDopplerEnabled(): boolean
  /** Retrieves the event's oneshot status. */
  isOneshot(): boolean
  /** Retrieves the event's snapshot status. */
  isSnapshot(): boolean
  /** Retrieves the event's stream status. */
  isStream(): boolean
  /** Checks that the EventDescription reference is valid. */
  isValid(): boolean
  /** Loads non-streaming sample data used by the event. */
  loadSampleData(): void
  /** Releases all instances. */
  releaseAllInstances(): void
  /** Sets the user callback. */
  setCallback(
    callback: STUDIO_EVENT_CALLBACK | null,
    callbackmask?: STUDIO_EVENT_CALLBACK_TYPE
  ): void
  /** Sets the event user data. */
  setUserData(
    userdata: any
  ): void

  /** Unloads all non-streaming sample data. */
  unloadSampleData(): void
}

// ===== API for folder: eventinstance =====
export class EventInstance {
  /** Retrieves the 3D attributes. */
  get3DAttributes(): FMOD.Core._3D_ATTRIBUTES
  /** Retrieves the core ChannelGroup. */
  getChannelGroup(): FMOD.Core.ChannelGroup
  /** Retrieves the event CPU usage data. */
  getCPUUsage(): { exclusive: number, inclusive: number }
  /** Retrieves the event description. */
  getDescription(): Studio.EventDescription
  /** Retrieves the listener mask. */
  getListenerMask(): number
  /** Retrieves memory usage statistics. */
  getMemoryUsage(): STUDIO_MEMORY_USAGE
  /** Retrieves the minimum and maximum distances for 3D attenuation. */
  getMinMaxDistance(): { min: number, max: number }
  /** Retrieves a parameter value by unique identifier. */
  getParameterByID(
    id: STUDIO_PARAMETER_ID
  ): { value: number, finalvalue: number }
  /** Retrieves a parameter value by name, including the path if needed. */
  getParameterByName(
    name: string
  ): { value: number, finalvalue: number }
  /** Retrieves the pause state. */
  getPaused(): boolean
  /** Retrieves the pitch multiplier. */
  getPitch(): { pitch: number, finalpitch: number }
  /** Retrieves the playback state. */
  getPlaybackState(): STUDIO_PLAYBACK_STATE
  /** Retrieves the value of a built-in property. */
  getProperty(
    index: STUDIO_EVENT_PROPERTY
  ): number
  /** Retrieves the core reverb send level. */
  getReverbLevel(
    index: number
  ): number
  /** Retrieves the FMOD Studio System. */
  getSystem(): Studio.System
  /** Retrieves the timeline cursor position. */
  getTimelinePosition(): number
  /** Retrieves the event instance user data. */
  getUserData(): any
  /** Retrieves the volume level. */
  getVolume(): { volume: number, finalvolume: number }
  /** Checks that the EventInstance reference is valid. */
  isValid(): boolean
  /** Retrieves the virtualization state. */
  isVirtual(): boolean
  /** Allow an event to continue past a sustain point. */
  keyOff(): void
  /** Adds a key to the event's audio table key queue. */
  addAudioTableKey(
    key: string
  ): void
  /** Clears the event's audio table key queue. */
  clearAudioTableKeys(): void
  /** Marks the event instance for release. */
  release(): void
  /** Sets the 3D attributes. */
  set3DAttributes(
    attributes: FMOD.Core._3D_ATTRIBUTES
  ): void
  /** Sets the user callback. */
  setCallback(
    callback: STUDIO_EVENT_CALLBACK | null,
    callbackmask?: STUDIO_EVENT_CALLBACK_TYPE
  ): void
  /** Sets the listener mask. */
  setListenerMask(
    mask: number
  ): void
  /** Sets a parameter value by unique identifier. */
  setParameterByID(
    id: STUDIO_PARAMETER_ID,
    value: number,
    ignoreseekspeed?: boolean
  ): void
  /** Sets a parameter value by unique identifier, looking up the value label. */
  setParameterByIDWithLabel(
    id: STUDIO_PARAMETER_ID,
    label: string,
    ignoreseekspeed?: boolean
  ): void
  /** Sets a parameter value by name, including the path if needed. */
  setParameterByName(
    name: string,
    value: number,
    ignoreseekspeed?: boolean
  ): void
  /** Sets a parameter value by name, including the path if needed, looking up the value label. */
  setParameterByNameWithLabel(
    name: string,
    label: string,
    ignoreseekspeed?: boolean
  ): void
  /** Sets multiple parameter values by unique identifier. */
  setParametersByIDs(
    ids: Array<STUDIO_PARAMETER_ID>,
    values: Array<number>,
    count: number,
    ignoreseekspeed?: boolean
  ): void
  /** Sets the pause state. */
  setPaused(
    paused: boolean
  ): void
  /** Sets the pitch multiplier. */
  setPitch(
    pitch: number
  ): void
  /** Sets the value of a built-in property. */
  setProperty(
    index: STUDIO_EVENT_PROPERTY,
    value: number
  ): void
  /** Sets the core reverb send level. */
  setReverbLevel(
    index: number,
    level: number
  ): void
  /** Sets the timeline cursor position. */
  setTimelinePosition(
    position: number
  ): void
  /** Sets the event instance user data. */
  setUserData(
    userdata: any
  ): void
  /** Sets the volume level. */
  setVolume(
    volume: number
  ): void
  /** Starts playback. */
  start(): void
  /** Stops playback. */
  stop(
    mode: STUDIO_STOP_MODE
  ): void
}

// ===== API for folder: system =====
export class System {
  /** Block until all pending commands have been executed. */
  flushCommands(): void
  /** Block until all sample loading and unloading has completed. */
  flushSampleLoading(): void
  /** Retrieves advanced settings. */
  getAdvancedSettings(): STUDIO_ADVANCEDSETTINGS
  /** Retrieves a loaded bank with the specified file path. */
  getBank(
    path: string
  ): Bank
  /** Retrieves a loaded bank with the specified ID. */
  getBankByID(
    id: FMOD.Core.GUID
  ): Studio.Bank
  /** Retrieves the number of currently-loaded banks. */
  getBankCount(): number
  /** Retrieves a list of the currently-loaded banks. */
  getBankList(): Array<Bank>
  /** Retrieves buffer usage information. */
  getBufferUsage(): STUDIO_BUFFER_USAGE
  /** Retrieves a loaded bus. */
  getBus(
    path: string
  ): Studio.Bus
  /** Retrieves a loaded bus. */
  getBusByID(
    id: FMOD.Core.GUID
  ): Studio.Bus
  /** Retrieves the Core System. */
  getCoreSystem(): FMOD.Core.System
  /** Retrieves the amount of CPU used for different parts of the FMOD Engine. */
  getCPUUsage(): { usage: STUDIO_CPU_USAGE, usage_core: FMOD.Core.CPU_USAGE };
  /** Retrieves an EventDescription of an event or snapshot with the specified file path. */
  getEvent(
    path: string
  ): Studio.EventDescription
  /** Retrieves an EventDescription. */
  getEventByID(
    id: FMOD.Core.GUID
  ): Studio.EventDescription
  /** Retrieves listener 3D attributes. */
  getListenerAttributes(
    listener: number
  ): { attributes: FMOD.Core._3D_ATTRIBUTES, attenuationposition: {x:number, y:number, z:number} }
  /** Retrieves listener weighting. */
  getListenerWeight(
    listener: number
  ): number
  /** Retrieves memory usage statistics. */
  getMemoryUsage(): STUDIO_MEMORY_USAGE
  /** Retrieves the number of listeners. */
  getNumListeners(): number
  /** Retrieves a global parameter value by unique identifier. */
  getParameterByID(
    id: FMOD.Core.GUID
  ): { value: number, finalvalue: number }
  /** Retrieves a global parameter value by name, including the path if needed. */
  getParameterByName(
    name: string
  ): { value: number, finalvalue: number }
  /** Retrieves a global parameter by ID. */
  getParameterDescriptionByID(
    id: STUDIO_PARAMETER_ID
  ): STUDIO_PARAMETER_DESCRIPTION
  /** Retrieves a global parameter by name, including the path if needed. */
  getParameterDescriptionByName(
    name: string
  ): STUDIO_PARAMETER_DESCRIPTION
  /** Retrieves the number of global parameters. */
  getParameterDescriptionCount(): number
  /** Retrieves a list of global parameters. */
  getParameterDescriptionList(
    capacity: number
  ): Array<STUDIO_PARAMETER_DESCRIPTION>
  /** Retrieves a global parameter label by ID. */
  getParameterLabelByID(
    id: STUDIO_PARAMETER_ID,
    labelindex: number
  ): string
  /** Retrieves a global parameter label by name, including the path if needed. */
  getParameterLabelByName(
    name: string,
    labelindex: number
  ): string
  /** Retrieves information for loading a sound from the audio table. */
  getSoundInfo(
    key: string
  ): STUDIO_SOUND_INFO
  /** Retrieves the user data. */
  getUserData(): any
  /** Retrieves a loaded VCA. */
  getVCA(
    path: string
  ): Studio.VCA
  /** Retrieves a loaded VCA. */
  getVCAByID(
    id: FMOD.Core.GUID
  ): Studio.VCA
  /** Initializes the Studio System. */
  initialize(
    maxchannels: number,
    studioflags: STUDIO_INITFLAGS,
    flags: CoreFMOD.INITFLAGS,
    extradriverdata?: any
  ): void
  /** Checks that the System reference is valid and has been initialized. */
  isValid(): boolean
  /** Loads the metadata of a bank using custom read callbacks. */
  loadBankCustom(
    info: STUDIO_BANK_INFO,
    flags: STUDIO_LOAD_BANK_FLAGS
  ): Studio.Bank
  /** Loads the metadata of a bank. This does not load the bank's sample data. */
  loadBankFile(
    filename: string,
    flags: STUDIO_LOAD_BANK_FLAGS  
  ): Studio.Bank
  /** Loads the metadata of a bank from memory. Does not load the bank's sample data. */
  loadBankMemory(
    buffer: ArrayBuffer,
    length: number,
    mode: STUDIO_LOAD_MEMORY_MODE,
    flags: STUDIO_LOAD_BANK_FLAGS
  ): Studio.Bank
  /** Load a command replay. */
  loadCommandReplay(
    filename: string,
    flags: STUDIO_COMMANDREPLAY_FLAGS
  ): Studio.CommandReplay
  /** Retrieves the ID for a bank, event, snapshot, bus or VCA. */
  lookupID(
    path: string
  ): FMOD.Core.GUID
  /** Retrieves the path for a bank, event, snapshot, bus or VCA. */
  lookupPath(
    id: FMOD.Core.GUID,
  ): string
  /** Registers a DSP plug-in. */
  registerPlugin(
    description: FMOD.Core.DSP_DESCRIPTION
  ): void
  /** Shut down and free the Studio System object. */
  release(): void
  /** Resets memory buffer usage statistics. */
  resetBufferUsage(): void
  /** Sets advanced settings. */
  setAdvancedSettings(
    settings: STUDIO_ADVANCEDSETTINGS
  ): void
  /** Sets a callback for the Studio System. */
  setCallback(
    callback: STUDIO_SYSTEM_CALLBACK | null,
    callbackmask?: STUDIO_SYSTEM_CALLBACK_TYPE
  ): void
  /** Sets the 3D attributes of the listener. */
  setListenerAttributes(
    listener: number,
    attributes: FMOD.Core._3D_ATTRIBUTES,
    attenuationposition?: {x?:number, y?:number, z?:number}
  ): void
  /** Sets the listener weighting. */
  setListenerWeight(
    listener: number,
    weight: number
  ): void
  /** Sets the number of listeners in the 3D sound scene. */
  setNumListeners(
    numlisteners: number
  ): void
  /** Sets a global parameter value by unique identifier. */
  setParameterByID(
    id: STUDIO_PARAMETER_ID,
    value: number,
    ignoreseekspeed?: boolean
  ): void
  /** Sets a global parameter value by unique identifier, looking up the value label. */
  setParameterByIDWithLabel(
    id: STUDIO_PARAMETER_ID,
    label: string,
    ignoreseekspeed?: boolean
  ): void
  /** Sets a global parameter value by name, including the path if needed. */
  setParameterByName(
    name: string,
    value: number,
    ignoreseekspeed?: boolean
  ): void
  /** Sets a global parameter value by name, including the path if needed, looking up the value label. */
  setParameterByNameWithLabel(
    name: string,
    label: string,
    ignoreseekspeed?: boolean
  ): void
  /** Sets multiple global parameter values by unique identifier. */
  setParametersByIDs(
    ids: Array<STUDIO_PARAMETER_ID>,
    values: Array<number>,
    count: number,
    ignoreseekspeed?: boolean
  ): void
  /** Sets the user data. */
  setUserData(
    userdata: any
  ): void
  /** Start recording Studio API commands to a file. */
  startCommandCapture(
    filename: string,
    flags: STUDIO_COMMANDCAPTURE_FLAGS
  ): void
  /** Stop recording Studio API commands. */
  stopCommandCapture(): void
  /** Unloads all currently loaded banks. */
  unloadAll(): void
  /** Unregisters a DSP plug-in. */
  unregisterPlugin(
    name: string
  ): void
  /** Update the studio system. */
  update(): void
}

// ===== API for folder: vca =====
export class VCA {
  /** Retrieves the VCA's GUID. */
  getID(): FMOD.Core.GUID
  /** Retrieves the path. */
  getPath(): string
  /** Retrieves the volume level. */
  getVolume(): { volume: number, finalvolume: number }
  /** Checks that the VCA reference is valid. */
  isValid(): boolean
  /** Sets the volume level. */
  setVolume(
    volume: number
  ): void
}
} // namespace Studio
}

export default function createFMOD(opts?: InitOptions): Promise<FMOD>;
