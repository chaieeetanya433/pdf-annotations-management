import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const FieldConfigForm = ({
    fieldMetadata,
    setFieldMetadata,
    selectedAnnotation,
    saveAnnotation
}) => {
    const fieldTypes = ['CharField', 'DateField', 'NumberField', 'EmailField', 'TextAreaField', 'BooleanField'];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Field Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {selectedAnnotation && (
                    <motion.div
                        className="mb-4 p-3 bg-green-50 border border-green-200 rounded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        <p className="text-sm text-green-800">✓ Box drawn on page {selectedAnnotation.page}</p>
                    </motion.div>
                )}

                <div>
                    <Label htmlFor="field_name">Field Name *</Label>
                    <Input
                        id="field_name"
                        value={fieldMetadata.field_name}
                        onChange={(e) => setFieldMetadata({ ...fieldMetadata, field_name: e.target.value })}
                        placeholder="e.g., Application_Date"
                    />
                </div>

                <div>
                    <Label htmlFor="field_header">Field Header</Label>
                    <Input
                        id="field_header"
                        value={fieldMetadata.field_header}
                        onChange={(e) => setFieldMetadata({ ...fieldMetadata, field_header: e.target.value })}
                        placeholder="e.g., Account Details"
                    />
                </div>

                <div>
                    <Label htmlFor="field_type">Field Type</Label>
                    <Select
                        value={fieldMetadata.field_type}
                        onValueChange={(value) => setFieldMetadata({ ...fieldMetadata, field_type: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                        <SelectContent>
                            {fieldTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="placeholder">Placeholder</Label>
                    <Input
                        id="placeholder"
                        value={fieldMetadata.placeholder}
                        onChange={(e) => setFieldMetadata({ ...fieldMetadata, placeholder: e.target.value })}
                        placeholder="e.g., Enter date"
                    />
                </div>

                <div>
                    <Label htmlFor="max_length">Max Length</Label>
                    <Input
                        id="max_length"
                        type="number"
                        value={fieldMetadata.max_length}
                        onChange={(e) => setFieldMetadata({ ...fieldMetadata, max_length: parseInt(e.target.value || '0') })}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="required"
                        checked={fieldMetadata.required}
                        onCheckedChange={(checked) => setFieldMetadata({ ...fieldMetadata, required: !!checked })}
                    />
                    <Label htmlFor="required">Required Field</Label>
                </div>

                <Button
                    onClick={saveAnnotation}
                    disabled={!selectedAnnotation || !fieldMetadata.field_name}
                    className="w-full disabled:cursor-not-allowed cursor-pointer"
                    variant="outline" 
                >
                    <CheckSquare className="inline mr-2" size={18} />
                    Save Field Annotation
                </Button>
            </CardContent>
        </Card>
    );
};

export default FieldConfigForm;