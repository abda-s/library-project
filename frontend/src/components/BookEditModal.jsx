// components/BookEditModal.js
import { useEffect, useState } from 'react'; // Import useState
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
// import axios from 'axios'; // No longer directly needed for API calls here
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookOpenIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom'; // useNavigate is handled by useApi for auth errors
import useApi from '../hooks/useApi'; // Import useApi

// Define the schema for the editable fields
const schema = yup.object().shape({
    tagId: yup.string().required('Tag ID is required'),
    name: yup.string().required('Book name is required'),
    author: yup.string().optional(),
    // Add other fields you might want to edit here
});

const BookEditModal = ({ isOpen, onClose, bookData, onSuccess }) => {
    // const { user, logout } = useAuth(); // logout is handled by useApi
    const { put: apiPut, del: apiDel, loading: apiLoading, error: apiCallError, setError: setApiCallError } = useApi();
    // const navigate = useNavigate(); // Handled by useApi
    const [isDeleting, setIsDeleting] = useState(false); // Keep for UI state of delete button
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
        setError,
        clearErrors // Import clearErrors
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            tagId: bookData?.tagId || '',
            name: bookData?.name || '',
            author: bookData?.author || '',
        },
    });

    useEffect(() => {
        if (isOpen && bookData) {
             // Reset form with current book data
            reset({
                tagId: bookData.tagId || '',
                name: bookData.name || '',
                author: bookData.author || '',
            });
            clearErrors(); // Clear any previous errors when modal opens
            setIsDeleting(false); // Reset deleting state

        } else if (!isOpen) {
             // Optional: Reset form completely when closing
             reset({
                tagId: '',
                name: '',
                author: '',
             });
              clearErrors(); // Clear errors on close
              setIsDeleting(false); // Reset deleting state
        }
    }, [isOpen, bookData, reset, clearErrors]); // Added clearErrors to dependency array

    const onSubmit = async (formData) => {
        // Ensure tagId is included in the data sent
        const dataToSend = { ...formData, tagId: bookData.tagId }; // Ensure tagId from bookData is used if not in form
        setApiCallError(null); // Clear previous API errors from useApi
        setError('root', { message: '' }); // Clear react-hook-form root error

        try {
            await apiPut(`/books/update/${bookData.tagId}`, dataToSend);

            if (onSuccess) {
                onSuccess();
            }
            onClose();

        } catch (err) {
            // Error is already set by useApi hook (apiCallError)
            // and navigation on 401/403 is handled by useApi
            console.error('Error updating book (caught in component):', err);
            setError('root', { message: err.message || 'Failed to update book' });
        }
    };

    const handleDelete = async () => {
        if (!bookData?.tagId) {
            setError('root', { message: 'Cannot delete: Missing book ID.' });
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to delete the book "${bookData.name || bookData.tagId}"?`);

        if (confirmed) {
            setIsDeleting(true);
            setApiCallError(null); // Clear previous API errors
            setError('root', { message: '' }); // Clear react-hook-form root error

            try {
                await apiDel(`/books/${bookData.tagId}`);

                if (onSuccess) {
                    onSuccess();
                }
                onClose();

            } catch (err) {
                // Error is already set by useApi hook (apiCallError)
                // and navigation on 401/403 is handled by useApi
                console.error('Error deleting book (caught in component):', err);
                setError('root', { message: err.message || 'Failed to delete book' });
            } finally {
                setIsDeleting(false);
            }
        }
    };


    // Disable buttons while submitting (react-hook-form's isSubmitting),
    // or api is loading (useApi's apiLoading), or delete button specific loading (isDeleting)
    const isOperationInProgress = isSubmitting || apiLoading || isDeleting;

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
                            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
                            disabled={isOperationInProgress} // Disable close while saving/deleting
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-600" />
                        </button>

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <PencilIcon className="w-8 h-8 text-blue-600" />
                                <h2 className="text-xl font-semibold">Edit Book Details</h2>
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
                                        disabled={isOperationInProgress} // Disable while saving or deleting
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
                                        disabled={isOperationInProgress} // Disable while saving or deleting
                                    />
                                    {errors.author && (
                                         <p className="text-red-500 text-sm mt-1">{errors.author.message}</p>
                                     )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        NFC Tag ID
                                    </label>
                                    <input
                                        type="text"
                                        {...register('tagId')}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                                        disabled={isOperationInProgress} // Also disable readOnly input during operations
                                    />
                                    {errors.tagId && (
                                        <p className="text-red-500 text-sm mt-1">{errors.tagId.message}</p>
                                    )}
                                </div>

                                {/* Display root/submission/deletion errors */}
                                {errors.root && (
                                    <p className="text-red-500 text-sm text-center">{errors.root.message}</p>
                                )}

                                {/* Button Row */}
                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200"> {/* Added border-t */}
                                     {/* Delete Button (left-aligned) */}
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                                        disabled={isOperationInProgress}
                                    >
                                       {isDeleting ? 'Deleting...' : <><TrashIcon className="w-5 h-5"/> Delete</>}
                                    </button>

                                     {/* Save/Cancel Buttons (right-aligned) */}
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                                            disabled={isOperationInProgress}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            disabled={isOperationInProgress}
                                        >
                                            {(isSubmitting || (apiLoading && !isDeleting)) ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BookEditModal;