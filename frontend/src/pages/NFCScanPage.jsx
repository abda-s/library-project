import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  SignalIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../Layout';
import BookRegistrationModal from '../components/BookRegistrationModal';

const NFCScanPage = () => {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = useState('idle');
  const [bookData, setBookData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTagId, setCurrentTagId] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const canScan = useRef(true);

  const statusConfig = {
    idle: { color: '#E5E7EB', icon: BookOpenIcon, text: 'Ready to scan', subtext: 'Hold a book near the reader' },
    scanning: { color: '#3B82F6', icon: SignalIcon, text: 'Scanning', subtext: 'Please don\'t move the tag' },
    found: { color: '#10B981', icon: CheckCircleIcon, text: 'Book Found!', subtext: '' },
    not_found: { color: '#F59E0B', icon: XCircleIcon, text: 'Unknown Tag', subtext: 'This tag is not registered' },
    error: { color: '#EF4444', icon: XCircleIcon, text: 'Error', subtext: '' },
    weak_signal: { color: '#F59E0B', icon: SignalIcon, text: 'Signal Lost', subtext: 'Move closer to the reader' }
  };

  useEffect(() => {
    // Connect to the socket server
    const socket = io('http://localhost:4000');

    // Handle scan status updates
    socket.on('scan_status', (data) => {
      if (canScan.current) {
        setScanStatus(data.status);

        if (data.status === 'scanning') {
          setCurrentTagId(data.tagId);
          setBookData(null);
          setErrorMessage('');
        } else if (data.status === 'idle') {
          setCurrentTagId(null);
        }
      }
    });

    // Handle tag scan results
    socket.on('tag_scanned', (data) => {
      if (canScan.current) {
        setScanStatus(data.status);
        if (data.status === 'found') {
          setBookData(data.data);
          console.log("Data: ", data.data);

          setErrorMessage('');
        } else {
          setBookData(null);
          setErrorMessage(data.error || 'Unknown tag');
        }
        canScan.current = false;
      }
    });

    // Handle scan errors
    socket.on('scan_error', (error) => {

      if (canScan.current) {
        setScanStatus('error');
        setErrorMessage(error.error || 'Connection error');
        canScan.current = false;
      }
    });


    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []);
  // You would still need a way to reset canScan.current back to true
  // if you want to allow rescanning after a result or error.
  // This would likely be triggered by a UI action (e.g., a "Scan Again" button).
  // For example:
  const handleResetScan = () => {
    canScan.current = true;
    setScanStatus('idle');
    setBookData(null);
    setErrorMessage('');
    setCurrentTagId(null);
  };
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

  const renderStatusContent = () => {
    const StatusIcon = statusConfig[scanStatus]?.icon || BookOpenIcon;

    switch (scanStatus) {
      case 'scanning':
        return (
          <motion.div
            key="scanning"
            className="flex flex-col items-center"
            variants={staggerVariants}
          >
            <motion.div
              variants={iconVariants}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <StatusIcon className="w-16 h-16 mb-4 text-white" />
            </motion.div>
            <motion.p
              variants={textVariants}
              className="text-white font-medium text-lg"
            >
              {statusConfig[scanStatus].text}
            </motion.p>
            <motion.p
              variants={textVariants}
              className="text-white text-sm opacity-80"
            >
              {statusConfig[scanStatus].subtext}
            </motion.p>
          </motion.div>
        );

      case 'found':
        return (
          <motion.div
            key="found"
            className="flex flex-col items-center"
            variants={staggerVariants}
          >
            <motion.div
              variants={iconVariants}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <StatusIcon className="w-16 h-16 mb-4 text-white" />
            </motion.div>
            <motion.p
              variants={textVariants}
              className="text-white font-medium text-lg"
            >
              {statusConfig[scanStatus].text}
            </motion.p>
            {bookData && (
              <>
                <motion.p
                  variants={textVariants}
                  className="text-white text-lg font-bold mt-2"
                >
                  {bookData.name}
                </motion.p>
                <motion.p
                  variants={textVariants}
                  className="text-white/80 text-sm"
                >
                  {bookData.author}
                </motion.p>
                <motion.button
                  variants={textVariants}
                  className="mt-4 bg-white text-green-600 px-6 py-2 rounded-full font-medium"
                  onClick={() => navigate(`/books/${bookData.tagId}`)}
                >
                  View Details
                </motion.button>
              </>
            )}
          </motion.div>
        );

      case 'not_found':
        return (
          <motion.div
            key="not_found"
            className="flex flex-col items-center"
            variants={staggerVariants}
          >
            <motion.div
              variants={iconVariants}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <StatusIcon className="w-16 h-16 mb-4 text-white" />
            </motion.div>
            <motion.p
              variants={textVariants}
              className="text-white font-medium text-lg"
            >
              {statusConfig[scanStatus].text}
            </motion.p>
            <motion.p
              variants={textVariants}
              className="text-white/80 text-sm text-center"
            >
              {errorMessage || statusConfig[scanStatus].subtext}
            </motion.p>
            {currentTagId && (
              <motion.p
                variants={textVariants}
                className="text-white/70 text-xs mt-2 font-mono"
              >
                Tag ID: {currentTagId}
              </motion.p>
            )}
            <motion.button
              variants={textVariants}
              className="mt-4 bg-white text-amber-500 px-6 py-2 rounded-full font-medium"
              onClick={() => setShowRegistrationModal(true)}
            >
              Register This Book
            </motion.button>

          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            key="error"
            className="flex flex-col items-center"
            variants={staggerVariants}
          >
            <motion.div
              variants={iconVariants}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <StatusIcon className="w-16 h-16 mb-4 text-white" />
            </motion.div>
            <motion.p
              variants={textVariants}
              className="text-white font-medium text-lg"
            >
              {statusConfig[scanStatus].text}
            </motion.p>
            <motion.p
              variants={textVariants}
              className="text-white/80 text-sm text-center"
            >
              {errorMessage || 'Something went wrong'}
            </motion.p>
            <motion.button
              variants={textVariants}
              className="mt-4 bg-white text-red-500 px-6 py-2 rounded-full font-medium"
              onClick={() => window.location.reload()}
            >
              Try Again
            </motion.button>
          </motion.div>
        );

      default: // idle
        return (
          <motion.div
            key="idle"
            className="flex flex-col items-center"
            variants={staggerVariants}
          >
            <motion.div
              variants={iconVariants}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <StatusIcon className="w-16 h-16 mb-4 text-gray-400" />
            </motion.div>
            <motion.p
              variants={textVariants}
              className="text-gray-600 font-medium text-lg"
            >
              {statusConfig[scanStatus].text}
            </motion.p>
            <motion.p
              variants={textVariants}
              className="text-gray-500 text-sm"
            >
              {statusConfig[scanStatus].subtext}
            </motion.p>
          </motion.div>
        );
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-sm w-full">
          {/* Header */}
          <div className="mb-8 text-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 mx-auto"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back
            </button>
            <h1 className="text-3xl font-bold mt-4">Scan RFID Tag</h1>
          </div>

          {/* Animated Container */}
          <div className="relative w-full aspect-square mb-6">
            <AnimatePresence mode='wait'>
              <motion.div
                key={scanStatus}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ backgroundColor: statusConfig[scanStatus]?.color || '#E5E7EB' }}
              />

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
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Center Content */}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
              variants={staggerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <AnimatePresence mode='wait'>
                {renderStatusContent()}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              {scanStatus === 'idle' ? (
                <>
                  Place a book on the RFID reader<br />
                  Hold steady for 2 seconds
                </>
              ) : scanStatus === 'scanning' ? (
                <>
                  Keep the book steady<br />
                  Wait for the scan to complete
                </>
              ) : scanStatus === 'found' ? (
                <>
                  Book successfully identified<br />
                  You can remove it now <br />
                  <button className="text-blue-500 hover:text-blue-700 transition-colors" onClick={() => handleResetScan()}>Scan Again</button>
                </>
              ) : (
                <>
                  We dont have this book in our database<br />
                  <button className="text-blue-500 hover:text-blue-700 transition-colors" onClick={() => handleResetScan()}>Scan Again</button>


                </>
              )}
            </p>
          </div>
        </div>
      </div>
      <BookRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        tagId={currentTagId}
        onSuccess={handleResetScan}
      />
    </Layout>
  );
};

export default NFCScanPage;
