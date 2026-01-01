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
    setFile(selectedFile);
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

      // Extract biomarkers using AI
      const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            biomarkers: {
              type: "object",
              properties: {
                ALT: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } },
                AST: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } },
                Glucose: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } },
                Sodium: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } },
                Potassium: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } },
                eGFR: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } },
                BUN: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } },
                Creatinine: { type: "object", properties: { value: { type: "number" }, unit: { type: "string" }, status: { type: "string" } } }
              }
            }
          }
        }
      });

      if (extractedData.status === 'success' && extractedData.output) {
        await createLabResult.mutateAsync({
          upload_date: uploadDate,
          file_url,
          biomarkers: extractedData.output.biomarkers || {},
          notes
        });
        
        // Reset form
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        // Save without biomarkers if extraction failed
        await createLabResult.mutateAsync({
          upload_date: uploadDate,
          file_url,
          biomarkers: {},
          notes: notes || 'Biomarker extraction failed'
        });
        toast.warning('File uploaded but biomarker extraction failed');
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
    return labResults
      .filter(result => result.biomarkers?.[biomarkerName]?.value)
      .map(result => ({
        date: new Date(result.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
    if (status === 'high') return <Badge className="bg-rose-100 text-rose-700 border-rose-200">High</Badge>;
    if (status === 'low') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Low</Badge>;
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
                  accept=".pdf"
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

      {/* Latest Results */}
      {labResults.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Latest Results</h2>
            <span className="text-sm text-slate-500">
              {new Date(labResults[0].upload_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {biomarkerList.map((biomarker) => {
              const data = labResults[0]?.biomarkers?.[biomarker];
              if (!data) return null;

              return (
                <motion.div
                  key={biomarker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-slate-600">{biomarker}</p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {data.value}
                            <span className="text-sm text-slate-500 ml-1">{data.unit}</span>
                          </p>
                        </div>
                        {getStatusIcon(data.status)}
                      </div>
                      {getStatusBadge(data.status)}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

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

      {/* History */}
      {labResults.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-slate-900">Test History</h2>
          
          <div className="space-y-3">
            {labResults.map((result) => (
              <Card key={result.id} className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {new Date(result.upload_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {result.notes && (
                          <p className="text-sm text-slate-500">{result.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={result.file_url} target="_blank" rel="noopener noreferrer">
                        View PDF
                      </a>
                    </Button>
                  </div>
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