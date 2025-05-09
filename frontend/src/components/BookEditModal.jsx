// components/BookEditModal.js
import { useEffect, useState } from 'react'; // Import useState
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookOpenIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'; // Import TrashIcon

// Define the schema for the editable fields
const schema = yup.object().shape({
    tagId: yup.string().required('Tag ID is required'),
    name: yup.string().required('Book name is required'),
    author: yup.string().optional(),
    // Add other fields you might want to edit here
});

const BookEditModal = ({ isOpen, onClose, bookData, onSuccess }) => {
    const [isDeleting, setIsDeleting] = useState(false); // State for delete loading state
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
        const dataToSend = { ...formData, tagId: bookData.tagId };
        setError('root', { message: '' }); // Clear root error before submitting

        try {
            // Assuming your update endpoint is PUT /books/update/:tagId
            await axios.put(`http://localhost:4000/books/update/${bookData.tagId}`, dataToSend);

            if (onSuccess) {
                onSuccess(); // Notify parent of success (e.g., refetch list)
            }
            onClose(); // Close modal

        } catch (error) {
            console.error('Error updating book:', error);
            setError('root', { message: error.response?.data?.message || 'Failed to update book' });
        }
    };

    const handleDelete = async () => {
        if (!bookData?.tagId) {
            setError('root', { message: 'Cannot delete: Missing book ID.' });
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to delete the book "${bookData.name || bookData.tagId}"?`);

        if (confirmed) {
            setIsDeleting(true); // Set deleting loading state
            setError('root', { message: '' }); // Clear root error before deleting

            try {
                // Assuming your delete endpoint is DELETE /books/:tagId
                await axios.delete(`http://localhost:4000/books/${bookData.tagId}`);

                if (onSuccess) {
                    onSuccess(); // Notify parent of success (e.g., refetch list)
                }
                onClose(); // Close modal

            } catch (error) {
                console.error('Error deleting book:', error);
                setError('root', { message: error.response?.data?.message || 'Failed to delete book' });
            } finally {
                setIsDeleting(false); // Reset deleting loading state
            }
        }
    };


    // Disable buttons while submitting (editing) or deleting
    const isOperationInProgress = isSubmitting || isDeleting;

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
                                        disabled={isOperationInProgress} // Disable while saving or deleting
                                    >
                                       {isDeleting ? 'Deleting...' : <><TrashIcon className="w-5 h-5"/> Delete Book</>}
                                    </button>

                                     {/* Save/Cancel Buttons (right-aligned) */}
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                                            disabled={isOperationInProgress} // Disable while saving or deleting
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            disabled={isOperationInProgress} // Disable while saving or deleting
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
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