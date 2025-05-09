import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
// import axios from 'axios'; // Replaced by useApi
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import useApi from '../hooks/useApi'; // Import useApi

const schema = yup.object().shape({
    name: yup.string().required('Book name is required'),
    author: yup.string().optional(),
    tagId: yup.string().required('Tag ID is required'),
});

const BookRegistrationModal = ({ isOpen, onClose, tagId, onSuccess }) => {
    const { post: apiPost, loading: apiLoading, error: apiCallError, setError: setApiCallError } = useApi();
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors /*, isSubmitting */ }, // isSubmitting from react-hook-form can be replaced by apiLoading
        setError,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            author: '',
            tagId: tagId,
        },
    });

    useEffect(() => {
        console.log('tagId:', tagId);

        if (tagId) {
            setValue('tagId', tagId);
        }
    }, [tagId, setValue]);

    const onSubmit = async (data) => {
        setApiCallError(null); // Clear previous API errors
        setError('root', { message: '' }); // Clear react-hook-form root error
        try {
            await apiPost('/books/add', data); // Use useApi's post method
            onSuccess(); // Call parent's success handler
            onClose();   // Close modal
            reset();     // Reset form
        } catch (err) {
            // Error is already set by useApi hook (apiCallError)
            // and navigation on 401/403 is handled by useApi
            console.error('Error registering book (caught in component):', err);
            setError('root', { message: err.message || 'Registration failed' });
        }
    };

    // Determine if an operation is in progress
    const isOperationInProgress = apiLoading; // Use apiLoading from useApi

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                >
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg max-w-md w-full relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-600" />
                        </button>

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <BookOpenIcon className="w-8 h-8 text-blue-600" />
                                <h2 className="text-xl font-semibold">Register New Book</h2>
                            
                            
                               </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Book Title *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('name')}
                                        className={`w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none ${errors.name
                                                ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            }`}
                                        disabled={isOperationInProgress}
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        {...register('author')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        disabled={isOperationInProgress}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        NFC Tag ID *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('tagId')}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                                    />
                                    {errors.tagId && (
                                        <p className="text-red-500 text-sm mt-1">{errors.tagId.message}</p>
                                    )}
                                </div>

                                {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
                                {apiCallError && <p className="text-red-500 text-sm">API Error: {apiCallError.message}</p>}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            reset({ name: '', author: '', tagId: tagId });
                                            setApiCallError(null); // Clear API error on cancel
                                            setError('root', { message: '' }); // Clear form error on cancel
                                            onClose();
                                        }}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                                        disabled={isOperationInProgress}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        disabled={isOperationInProgress}
                                    >
                                        {isOperationInProgress ? 'Registering...' : 'Register Book'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BookRegistrationModal;
