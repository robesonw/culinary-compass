import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, TrendingUp, TrendingDown, Minus, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LabResults() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDate, setUploadDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);

  const queryClient = useQueryClient();

  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults'],
    queryFn: () => base44.entities.LabResult.list('-upload_date'),
  });

  const createLabResult = useMutation({
    mutationFn: (data) => base44.entities.LabResult.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labResults'] });
      toast.success('Lab result uploaded successfully!');
      setUploadDate('');
      setNotes('');
      setFile(null);
    },
  });

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Rename file to lowercase .pdf extension if needed
    if (selectedFile.name.toUpperCase().endsWith('.PDF') && !selectedFile.name.endsWith('.pdf')) {
      const newName = selectedFile.name.replace(/\.PDF$/i, '.pdf');
      const renamedFile = new File([selectedFile], newName, { type: 'application/pdf' });
      setFile(renamedFile);
    } else {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !uploadDate) {
      toast.error('Please select a file and date');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract multiple test results from PDF (handles historical data)
      const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            test_results: {
              type: "array",
              description: "Extract ALL test results with dates from the PDF, including historical data",
              items: {
                type: "object",
                properties: {
                  test_date: { 
                    type: "string",
                    description: "The date of this specific test in YYYY-MM-DD format"
                  },
                  biomarkers: {
                    type: "object",
                    properties: {
                      ALT: { 
                        type: "object", 
                        properties: { 
                          value: { type: "number" }, 
                          unit: { type: "string" }, 
                          status: { 
                            type: "string",
                            enum: ["normal", "high", "low"],
                            description: "Extract the exact status shown: 'High', 'Low', or 'normal' if blank"
                          } 
                        } 
                      },
                      AST: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string", enum: ["normal", "high", "low"] } } },
                      Glucose: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string", enum: ["normal", "high", "low"] } } },
                      Sodium: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string", enum: ["normal", "high", "low"] } } },
                      Potassium: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string", enum: ["normal", "high", "low"] } } },
                      eGFR: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string", enum: ["normal", "high", "low"] } } },
                      BUN: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string", enum: ["normal", "high", "low"] } } },
                      Creatinine: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string", enum: ["normal", "high", "low"] } } }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (extractedData.status === 'success' && extractedData.output?.test_results) {
        // Create a lab result record for each test date found in the PDF
        const results = extractedData.output.test_results;

        // Get existing lab result dates to avoid duplicates
        const existingDates = new Set(labResults.map(r => r.upload_date));
        let createdCount = 0;
        let skippedCount = 0;

        for (const result of results) {
          const testDate = result.test_date || uploadDate;

          // Skip if we already have a result for this date
          if (existingDates.has(testDate)) {
            skippedCount++;
            continue;
          }

          await createLabResult.mutateAsync({
            upload_date: testDate,
            file_url,
            biomarkers: result.biomarkers || {},
            notes: results.length > 1 ? `${notes} (Extracted from PDF)` : notes
          });
          createdCount++;
          existingDates.add(testDate); // Add to set to prevent duplicates within same upload
        }

        if (createdCount > 0) {
          toast.success(`Extracted ${createdCount} new test result${createdCount !== 1 ? 's' : ''} from PDF`);
        } else {
          toast.info('All test dates from this PDF already exist');
        }

        // Reset form
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        // Only save without biomarkers if extraction failed and date doesn't exist
        const existingDates = new Set(labResults.map(r => r.upload_date));
        if (!existingDates.has(uploadDate)) {
          await createLabResult.mutateAsync({
            upload_date: uploadDate,
            file_url,
            biomarkers: {},
            notes: notes || 'Biomarker extraction failed'
          });
          toast.warning('File uploaded but biomarker extraction failed');
        } else {
          toast.error('A result for this date already exists');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const biomarkerList = ['ALT', 'AST', 'Glucose', 'Sodium', 'Potassium', 'eGFR', 'BUN', 'Creatinine'];

  const getTrendData = (biomarkerName) => {
    const seen = new Set();
    return labResults
      .filter(result => result.biomarkers?.[biomarkerName]?.value)
      .filter(result => {
        // Deduplicate by date - keep first occurrence (most recent due to sorting)
        if (seen.has(result.upload_date)) return false;
        seen.add(result.upload_date);
        return true;
      })
      .map(result => ({
        date: new Date(result.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        value: result.biomarkers[biomarkerName].value
      }))
      .reverse();
  };

  const getStatusIcon = (status) => {
    if (status === 'high') return <TrendingUp className="w-4 h-4 text-rose-500" />;
    if (status === 'low') return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-emerald-500" />;
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'high') return <Badge className="bg-rose-100 text-rose-700 border-rose-200">High</Badge>;
    if (normalizedStatus === 'low') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Low</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Lab Results</h1>
        <p className="text-slate-600 mt-1">
          Upload and track your blood test results over time
        </p>
      </div>

      {/* Upload Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            Upload New Lab Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Date</Label>
                <Input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Upload PDF File</Label>
                <Input
                  type="file"
                  accept=".pdf,.PDF,application/pdf"
                  onChange={handleFileUpload}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional notes about this test..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={isUploading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>



      {/* Trends */}
      {labResults.length > 1 && (
        <>
          <h2 className="text-xl font-semibold text-slate-900">Biomarker Trends</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {biomarkerList.map((biomarker) => {
              const trendData = getTrendData(biomarker);
              if (trendData.length < 2) return null;

              return (
                <motion.div
                  key={biomarker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base">{biomarker} Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#6366f1" 
                            strokeWidth={2}
                            dot={{ fill: '#6366f1', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Complete History with Biomarkers */}
      {labResults.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-slate-900">Complete Test History</h2>
          
          <div className="space-y-4">
            {labResults.map((result, index) => (
              <Card key={result.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {new Date(result.upload_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardTitle>
                        {result.notes && (
                          <p className="text-sm text-slate-500">{result.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={result.file_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View PDF
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {biomarkerList.map((biomarker) => {
                      const data = result.biomarkers?.[biomarker];
                      if (!data || !data.value) return null;

                      return (
                        <div key={biomarker} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-medium text-slate-600">{biomarker}</p>
                            {getStatusIcon(data.status)}
                          </div>
                          <p className="text-lg font-bold text-slate-900">
                            {data.value}
                            <span className="text-xs text-slate-500 ml-1">{data.unit}</span>
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(data.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {Object.keys(result.biomarkers || {}).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-3">
                      No biomarker data extracted from this test
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {labResults.length === 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Lab Results Yet
            </h3>
            <p className="text-slate-600">
              Upload your first blood test PDF to start tracking your biomarkers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}