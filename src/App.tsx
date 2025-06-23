/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, type ChangeEvent } from "react";
import {
  Upload,
  FileAudio,
  Loader2,
  Download,
  Copy,
  Trash2,
  Play,
  Pause,
} from "lucide-react";

type WhisperApiResponse = {
  text: string;
  // Puedes agregar más campos si usas verbose_json
};

type FileWithName = File & { name: string };

const App = () => {
  const [file, setFile] = useState<FileWithName | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Función para manejar la carga de archivos
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Verificar que sea un archivo de audio
      if (!selectedFile.type.startsWith("audio/")) {
        setError("Por favor selecciona un archivo de audio válido");
        return;
      }

      // Verificar tamaño (max 25MB para Whisper)
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("El archivo es muy grande. El límite es 25MB");
        return;
      }

      setFile(selectedFile);
      setError("");
      setTranscription("");

      // Crear URL para reproducir el audio
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
    }
  };

  // Función para transcribir audio
  const transcribeAudio = async () => {
    if (!file || !apiKey) {
      setError("Por favor selecciona un archivo y proporciona tu API key");
      return;
    }

    setIsTranscribing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");
      formData.append("language", "es"); // Especificar español para mejor precisión
      formData.append("response_format", "verbose_json"); // Para obtener más información
      formData.append("temperature", "0"); // Menor temperatura = más precisión

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(
          errorData.error?.message ||
            `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = (await response.json()) as WhisperApiResponse;
      setTranscription(result.text);
    } catch (err: any) {
      setError(`Error en la transcripción: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Función para reproducir/pausar audio
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Función para copiar transcripción
  const copyTranscription = () => {
    navigator.clipboard.writeText(transcription);
  };

  // Función para descargar transcripción
  const downloadTranscription = () => {
    if (!file) return;
    const element = document.createElement("a");
    const fileContent = `TRANSCRIPCIÓN - ${
      file.name
    }\n\nFecha: ${new Date().toLocaleDateString()}\n\n${transcription}`;
    const file2 = new Blob([fileContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file2);
    element.download = `transcripcion_${file.name.replace(
      /\.[^/.]+$/,
      ""
    )}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Función para limpiar todo
  const clearAll = () => {
    setFile(null);
    setTranscription("");
    setError("");
    setAudioUrl("");
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Transcriptor de Audio
          </h1>
          <p className="text-gray-600">
            Transcribe automáticamente tus audios usando Whisper AI
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Instrucciones
          </h3>
          <ul className="text-gray-700 space-y-2 text-sm">
            <li>
              • Obtén tu API key de OpenAI en :
              <a
                className="text-blue-600"
                href="https://platform.openai.com/api-keys"
              >
                {" "}
                https://platform.openai.com/api-keys
              </a>
            </li>
            <li>• Los archivos de audio deben ser menores a 25MB</li>
            <li>
              • Para mejor precisión, usa audio claro y sin ruido de fondo
            </li>
            <li>• La transcripción está optimizada para español</li>
            <li>• Puedes reproducir el audio antes de transcribirlo</li>
          </ul>
        </div>

        {/* API Key Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Configuración
          </h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              API Key de OpenAI
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Tu API key se mantiene segura y no se almacena
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Cargar Audio
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <span className="text-lg font-medium text-gray-700">
                  Haz clic para cargar archivo de audio
                </span>
                <p className="text-sm text-gray-500 mt-1">
                  Formatos soportados: MP3, WAV, M4A, etc. (Máximo 25MB)
                </p>
              </div>
            </label>
          </div>

          {/* File Info */}
          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {audioUrl && (
                    <button
                      onClick={toggleAudio}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full mt-3"
                  controls
                />
              )}
            </div>
          )}
        </div>

        {/* Transcribe Button */}
        {file && apiKey && (
          <div className="text-center mb-6">
            <button
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Transcribiendo...</span>
                </>
              ) : (
                <span>Transcribir Audio</span>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Transcripción
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyTranscription}
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Copiar"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={downloadTranscription}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {transcription}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
