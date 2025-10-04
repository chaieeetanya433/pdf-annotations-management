// components/pdf-annotation/components/AnnotationsList.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const AnnotationsList = ({ annotations, handleEditAnnotation, handleDeleteAnnotation }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Saved Annotations ({annotations.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    <AnimatePresence>
                        {annotations.map(ann => (
                            <motion.div
                                key={ann.id}
                                className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{ann.field_name}</p>
                                    <p className="text-xs text-gray-600">Page {ann.page} • {ann.field_type}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditAnnotation(ann.id)}
                                        className="h-8 w-8 text-blue-600 hover:text-blue-800"
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteAnnotation(ann.id)}
                                        className="h-8 w-8 text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
};

export default AnnotationsList;