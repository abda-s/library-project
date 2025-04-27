import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  SignalIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../Layout';

const NFCScanPage = () => {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = useState('idle');
  const [bookData, setBookData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const dummyBook = {
    title: 'Example Book Title',
    author: 'Author Name',
    tagId: '123456',
    addedAt: new Date().toISOString(),
  };

  // State actions
  const startScanning = () => setScanStatus('scanning');
  const simulateFound = () => { setScanStatus('found'); setBookData(dummyBook); };
  const simulateNotFound = () => { setScanStatus('not_found'); setErrorMessage('No book associated with this tag'); };
  const simulateError = () => { setScanStatus('error'); setErrorMessage('Something went wrong while scanning'); };
  const resetState = () => { setScanStatus('idle'); setBookData(null); setErrorMessage(''); };

  const statusConfig = {
    idle: { color: '#E5E7EB', icon: BookOpenIcon },
    scanning: { color: '#3B82F6', icon: SignalIcon },
    found: { color: '#10B981', icon: CheckCircleIcon },
    not_found: { color: '#F59E0B', icon: XCircleIcon },
    error: { color: '#EF4444', icon: XCircleIcon }
  };

  const ringTransition = {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut'
  };

  // Animation variants for inner content
  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  };

  const textVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 }
  };

  const staggerVariants = {
    hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  return (
    <Layout>
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mx-auto"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back
          </button>
          <h1 className="text-3xl font-bold mt-4">Scan NFC Tag</h1>
        </div>

        {/* Animated Container */}
        <div className="relative w-full aspect-square mb-6">
          <AnimatePresence mode='wait'>
            {/* Base Ring */}
            <motion.div
              key={scanStatus}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: statusConfig[scanStatus].color }}
            />

            {/* Animated Waves */}
            {['scanning', 'idle'].includes(scanStatus) && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      borderColor: statusConfig[scanStatus].color,
                      boxShadow: `inset 0 0 20px ${statusConfig[scanStatus].color}`
                    }}
                    animate={{
                      scale: 1 + (i * 0.1) + (scanStatus === 'scanning' ? 0.1 : 0),
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      ...ringTransition,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Center Content */}
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
            variants={staggerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <AnimatePresence mode='wait'>
              {scanStatus === 'scanning' && (
                <motion.div
                  key="scanning"
                  className="flex flex-col items-center"
                  variants={staggerVariants}
                >
                  <motion.div
                    variants={iconVariants}
                    transition={{ type: 'spring', stiffness: 150 }}
                  >
                    <SignalIcon className="w-16 h-16 mb-4 text-white" />
                  </motion.div>
                  <motion.p
                    variants={textVariants}
                    className="text-white"
                  >
                    Scanning please don't move the tag
                  </motion.p>
                </motion.div>
              )}
              
              {scanStatus === 'idle' && (
                <motion.div
                  key="idle"
                  className="flex flex-col items-center"
                  variants={staggerVariants}
                >
                  <motion.div
                    variants={iconVariants}
                    transition={{ type: 'spring', stiffness: 150 }}
                  >
                    <BookOpenIcon className="w-16 h-16 mb-4 text-gray-700" />
                  </motion.div>
                  <motion.p
                    variants={textVariants}
                    className="text-lg text-gray-700"
                  >
                    Ready to scan
                  </motion.p>
                </motion.div>
              )}

              {scanStatus === 'found' && bookData && (
                <motion.div
                  key="found"
                  className="flex flex-col items-center text-white"
                  variants={staggerVariants}
                >
                  <motion.div
                    variants={iconVariants}
                    transition={{ type: 'spring', stiffness: 150 }}
                  >
                    <CheckCircleIcon className="w-16 h-16 mb-4" />
                  </motion.div>
                  <motion.h2
                    variants={textVariants}
                    className="text-xl font-bold mb-2"
                  >
                    {bookData.title}
                  </motion.h2>
                  <motion.p
                    variants={textVariants}
                    className="mb-4"
                  >
                    by {bookData.author}
                  </motion.p>
                  <motion.div
                    variants={textVariants}
                    className="bg-white bg-opacity-20 p-4 rounded-lg text-green-600"
                  >
                    <p className="text-sm">Tag ID: {bookData.tagId}</p>
                    <p className="text-sm">Added: {new Date(bookData.addedAt).toLocaleDateString()}</p>
                  </motion.div>
                </motion.div>
              )}

              {(scanStatus === 'not_found' || scanStatus === 'error') && (
                <motion.div
                  key="error"
                  className="flex flex-col items-center text-white"
                  variants={staggerVariants}
                >
                  <motion.div
                    variants={iconVariants}
                    transition={{ type: 'spring', stiffness: 150 }}
                  >
                    <XCircleIcon className="w-16 h-16 mb-4" />
                  </motion.div>
                  <motion.p
                    variants={textVariants}
                    className="text-lg"
                  >
                    {errorMessage}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 flex-wrap">
          <button onClick={resetState} className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600">
            Idle
          </button>
          <button onClick={startScanning} className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
            Start
          </button>
          <button onClick={simulateFound} className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700">
            Found
          </button>
          <button onClick={simulateNotFound} className="bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600">
            Not Found
          </button>
          <button onClick={simulateError} className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700">
            Error
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Ensure NFC is enabled on your device<br />
          Hold the device close to the NFC tag (1-2cm)
        </p>
      </div>
    </div>
    </Layout>
  );
};

export default NFCScanPage;