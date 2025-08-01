import { useState, useEffect } from 'react';
import styles from '../styles/VoiceSearch.module.css';

export default function VoiceSearch({ onSearchChange }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognitionInstance = new SpeechRecognition();
        
        // Configure speech recognition
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US'; // You can change this to support Urdu: 'ur-PK'
        
        // Handle speech recognition results
        recognitionInstance.onresult = (event) => {
          let transcript = event.results[0][0].transcript;
          
          // Common voice recognition corrections for car names
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
          
          // Apply corrections to the transcript
          const words = transcript.toLowerCase().split(' ');
          const correctedWords = words.map(word => {
            const cleanWord = word.replace(/[^\w]/g, '');
            return corrections[cleanWord] || word;
          });
          
          transcript = correctedWords.join(' ');
          onSearchChange(transcript);
          setIsListening(false);
        };
        
        // Handle errors
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        // Handle end of recognition
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
    return null; // Don't render if not supported
  }

  return (
    <button
      type="button"
      className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
      onClick={isListening ? stopListening : startListening}
      title={isListening ? 'Stop listening' : 'Search by voice'}
    >
      {isListening ? (
        <span className={styles.listeningIcon}>🎤</span>
      ) : (
        <span className={styles.micIcon}>🎙️</span>
      )}
      {isListening && <span className={styles.pulse}></span>}
    </button>
  );
} 