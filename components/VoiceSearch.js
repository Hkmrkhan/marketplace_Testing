import { useState, useEffect } from 'react';

export default function VoiceSearch({ onSearchChange }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event) => {
          let transcript = event.results[0][0].transcript;
          
          const corrections = {
            'megor': 'wagon',
            'mego': 'wagon', 
            'major': 'wagon',
            'wagor': 'wagon',
            'vagon': 'wagon',
            'corola': 'corolla',
            'carolla': 'corolla',
            'camry': 'camry',
            'civic': 'civic',
            'accord': 'accord',
            'altima': 'altima',
            'sentra': 'sentra',
            'cruze': 'cruze',
            'malibu': 'malibu',
            'impala': 'impala',
            'fusion': 'fusion',
            'focus': 'focus',
            'fiesta': 'fiesta',
            'mustang': 'mustang',
            'bmw': 'bmw',
            'bemer': 'bmw',
            'beamer': 'bmw',
            'audi': 'audi',
            'mercedes': 'mercedes',
            'benz': 'benz',
            'honda': 'honda',
            'toyota': 'toyota',
            'nissan': 'nissan',
            'hyundai': 'hyundai',
            'kia': 'kia',
            'ford': 'ford',
            'chevrolet': 'chevrolet',
            'chevy': 'chevrolet'
          };
          
          const words = transcript.toLowerCase().split(' ');
          const correctedWords = words.map(word => {
            const cleanWord = word.replace(/[^\w]/g, '');
            return corrections[cleanWord] || word;
          });
          
          transcript = correctedWords.join(' ');
          onSearchChange(transcript);
          setIsListening(false);
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      }
    }
  }, [onSearchChange]);

  const startListening = () => {
    if (recognition && speechSupported) {
      setIsListening(true);
      recognition.start();
    } else {
      alert('Voice search is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  if (!speechSupported) {
    return null;
  }

  return (
    <button
      type="button"
      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
        isListening 
          ? 'bg-rose-600 text-white animate-pulse' 
          : 'bg-slate-900/80 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white'
      }`}
      onClick={isListening ? stopListening : startListening}
      title={isListening ? 'Stop listening' : 'Search by voice'}
    >
      <span className="text-lg">
        {isListening ? '🎤' : '🎙️'}
      </span>
      {isListening && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-400 rounded-full animate-ping"></span>
      )}
    </button>
  );
}
