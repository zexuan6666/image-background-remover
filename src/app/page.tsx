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
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type Step = 'upload' | 'processing' | 'result';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('result.png');

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const processImage = useCallback(async (file: File) => {
    setError(null);
    setStep('processing');

    // Preview original
    const originalUrl = URL.createObjectURL(file);
    setOriginalImage(originalUrl);
    setFileName(file.name.replace(/\.[^.]+$/, '') + '-no-bg.png');

    try {
      const formData = new FormData();
      formData.append('image_file', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error: ${response.status}`);
      }

      const blob = await response.blob();
      const resultUrl = URL.createObjectURL(blob);
      setResultImage(resultUrl);
      setResultBlob(blob);
      setStep('result');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setStep('upload');
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processImage(acceptedFiles[0]);
      }
    },
    [processImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStep('upload');
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (resultImage) URL.revokeObjectURL(resultImage);
    setOriginalImage(null);
    setResultImage(null);
    setResultBlob(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">BG Remover</span>
          </div>
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Remove Image Background
              <br />
              <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
                100% Automatically
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Drop your image and get a transparent background in seconds. No clicks, no green screens, no fuss.
            </p>
          </div>
        </section>

        {/* Upload / Processing / Result Area */}
        <section className="px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Upload Step */}
            {step === 'upload' && (
              <div
                {...getRootProps()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer
                  transition-all duration-300 ease-in-out
                  ${
                    isDragActive
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]'
                      : 'border-gray-300 dark:border-gray-700 hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                      isDragActive
                        ? 'bg-violet-200 dark:bg-violet-800'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Upload
                      className={`w-10 h-10 transition-colors ${
                        isDragActive
                          ? 'text-violet-600 dark:text-violet-300'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">
                      {isDragActive ? 'Drop your image here' : 'Drop image here or click to upload'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Supports PNG, JPG, JPEG, WebP — Max 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <div className="border-2 border-dashed rounded-2xl p-16 text-center border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-violet-200 dark:border-violet-800" />
                    <Loader2 className="absolute inset-0 w-20 h-20 animate-spin text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">Removing background...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      This usually takes 3-5 seconds
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Result Step */}
            {step === 'result' && originalImage && resultImage && (
              <div className="space-y-8">
                {/* Compare Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Original
                    </div>
                    <div className="rounded-2xl overflow-hidden bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#374151_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] border border-gray-200 dark:border-gray-700">
                      <img
                        src={originalImage}
                        alt="Original"
                        className="w-full h-auto max-h-[500px] object-contain"
                      />
                    </div>
                  </div>

                  {/* Result */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Background Removed
                    </div>
                    <div className="rounded-2xl overflow-hidden bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#374151_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] border border-gray-200 dark:border-gray-700">
                      <img
                        src={resultImage}
                        alt="Result"
                        className="w-full h-auto max-h-[500px] object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-lg shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-105 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Try Another Image
                  </button>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mt-20 grid sm:grid-cols-3 gap-8">
              {[
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: 'AI Powered',
                  desc: 'State-of-the-art AI removes backgrounds with precision.',
                },
                {
                  icon: <ArrowRight className="w-6 h-6" />,
                  title: 'Instant Results',
                  desc: 'Get your transparent image in just 3-5 seconds.',
                },
                {
                  icon: <Download className="w-6 h-6" />,
                  title: 'Free Download',
                  desc: 'Download high-quality transparent PNG for free.',
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="text-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Built with ❤️ — Powered by{' '}
          <a
            href="https://www.remove.bg/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-500 hover:underline"
          >
            remove.bg API
          </a>
        </p>
      </footer>
    </div>
  );
}
