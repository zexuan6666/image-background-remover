'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Download,
  Sun,
  Moon,
  ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageLucide,
} from 'lucide-react';

type AppStep = 'upload' | 'processing' | 'result';

export default function Home() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });
  const [step, setStep] = useState<AppStep>('upload');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('result.png');

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const processImage = useCallback(async (file: File) => {
    setError(null);
    setStep('processing');

    const previewUrl = URL.createObjectURL(file);
    setOriginalUrl(previewUrl);
    setFileName(file.name.replace(/\.[^.]+$/, '') + '-no-bg.png');

    try {
      const formData = new FormData();
      formData.append('image_file', file);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${response.status})`);
      }

      const blob = await response.blob();
      const resUrl = URL.createObjectURL(blob);
      setResultUrl(resUrl);
      setResultBlob(blob);
      setStep('result');
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Please try again with a smaller image.');
      } else {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
      }
      setStep('upload');
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum size is 10MB.');
        return;
      }

      processImage(file);
    },
    [processImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: step === 'processing',
  });

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setStep('upload');
    setOriginalUrl(null);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-950/80 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <ImageLucide className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">BG Remover</span>
          </div>
          <button
            onClick={toggleDark}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="pt-12 pb-8 sm:pt-16 sm:pb-10 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5">
              Remove Image Background
              <br />
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                100% Automatically
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              Drop your image and get a transparent background in seconds.
              No clicks, no green screens, no fuss.
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="px-4 pb-12 sm:pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step: Upload */}
            {step === 'upload' && (
              <div
                {...getRootProps()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 sm:p-16 text-center cursor-pointer
                  transition-all duration-300 ease-out
                  ${
                    isDragActive
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]'
                      : 'border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-5">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                      isDragActive
                        ? 'bg-violet-200 dark:bg-violet-800'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Upload
                      className={`w-10 h-10 transition-colors ${
                        isDragActive ? 'text-violet-600 dark:text-violet-300' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xl font-semibold mb-1">
                      {isDragActive ? 'Drop your image here' : 'Drop image here or click to upload'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supports PNG, JPG, JPEG, WebP — Max 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="border-2 border-dashed rounded-2xl p-12 sm:p-16 text-center border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-violet-200 dark:border-violet-800" />
                    <Loader2 className="absolute inset-0 w-20 h-20 animate-spin text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold mb-1">Removing background...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This usually takes 3–5 seconds
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Result */}
            {step === 'result' && originalUrl && resultUrl && (
              <div className="space-y-8">
                {/* Comparison Grid */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Original */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      Original
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="w-full h-auto max-h-[500px] object-contain bg-gray-100 dark:bg-gray-900"
                      />
                    </div>
                  </div>

                  {/* Result */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Background Removed
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm checkerboard">
                      <img
                        src={resultUrl}
                        alt="Result"
                        className="w-full h-auto max-h-[500px] object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-base shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold text-base hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Try Another Image
                  </button>
                </div>
              </div>
            )}

            {/* Feature Cards */}
            <div className="mt-16 grid sm:grid-cols-3 gap-5">
              {[
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: 'AI Powered',
                  desc: 'State-of-the-art AI removes backgrounds with precision.',
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: 'Instant Results',
                  desc: 'Get your transparent image in just 3–5 seconds.',
                },
                {
                  icon: <Download className="w-6 h-6" />,
                  title: 'Free Download',
                  desc: 'Download high-quality transparent PNG for free.',
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="text-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Built with ❤️ — Powered by{' '}
          <a
            href="https://www.remove.bg/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-500 hover:text-violet-400 hover:underline transition-colors"
          >
            remove.bg API
          </a>
        </p>
      </footer>
    </div>
  );
}
