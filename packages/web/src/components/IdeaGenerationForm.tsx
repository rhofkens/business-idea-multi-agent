import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { businessPreferencesApi } from "@/services/business-preferences-api";
import type { BusinessOptionsResponse } from "@/services/business-preferences-api";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  vertical: string;
  subVertical: string;
  businessModel: string;
  additionalContext: string;
}

interface IdeaGenerationFormProps {
  onSubmit: (data: FormData) => void;
  isGenerating?: boolean;
}

export function IdeaGenerationForm({ onSubmit, isGenerating = false }: IdeaGenerationFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    vertical: "",
    subVertical: "",
    businessModel: "",
    additionalContext: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Fetch business options from backend
  const { data: businessOptions, isLoading, error } = useQuery({
    queryKey: ['businessOptions'],
    queryFn: async (): Promise<BusinessOptionsResponse> => businessPreferencesApi.getOptions(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (gcTime in v5)
  });

  // Reset subVertical when vertical changes
  useEffect(() => {
    if (formData.vertical && formData.subVertical) {
      const selectedVertical = businessOptions?.verticals.find(v => v.id === formData.vertical);
      const isValidSubVertical = selectedVertical?.subverticals.some(sv => sv.id === formData.subVertical);
      
      if (!isValidSubVertical) {
        setFormData(prev => ({ ...prev, subVertical: "" }));
      }
    }
  }, [formData.vertical, formData.subVertical, businessOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<FormData> = {};
    if (!formData.vertical) newErrors.vertical = "Vertical is required";
    if (!formData.subVertical) newErrors.subVertical = "Sub-vertical is required";
    if (!formData.businessModel) newErrors.businessModel = "Business model is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    try {
      const response = await businessPreferencesApi.submit(formData);
      toast({
        title: "Preferences submitted",
        description: `Process ID: ${response.processId}. Your business ideas are being generated.`,
      });
      onSubmit(formData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit preferences";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleVerticalChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      vertical: value,
      subVertical: "", // Reset sub-vertical when vertical changes
    }));
    if (errors.vertical) {
      setErrors(prev => ({ ...prev, vertical: undefined }));
    }
  };

  const handleSubVerticalChange = (value: string) => {
    setFormData(prev => ({ ...prev, subVertical: value }));
    if (errors.subVertical) {
      setErrors(prev => ({ ...prev, subVertical: undefined }));
    }
  };

  const handleBusinessModelChange = (value: string) => {
    setFormData(prev => ({ ...prev, businessModel: value }));
    if (errors.businessModel) {
      setErrors(prev => ({ ...prev, businessModel: undefined }));
    }
  };

  const handleAdditionalContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, additionalContext: e.target.value }));
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading business options...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load business options. Please refresh the page or try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const selectedVertical = businessOptions?.verticals.find(v => v.id === formData.vertical);
  const availableSubVerticals = selectedVertical?.subverticals || [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generate Business Ideas
        </CardTitle>
        <CardDescription>
          Select your preferences to generate tailored business ideas using AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="vertical">Business Vertical</Label>
            <Select value={formData.vertical} onValueChange={handleVerticalChange}>
              <SelectTrigger id="vertical" className={errors.vertical ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a business vertical" />
              </SelectTrigger>
              <SelectContent>
                {businessOptions?.verticals.map((vertical) => (
                  <SelectItem key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vertical && (
              <p className="text-sm text-red-500">{errors.vertical}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subVertical">Sub-Vertical</Label>
            <Select 
              value={formData.subVertical} 
              onValueChange={handleSubVerticalChange}
              disabled={!formData.vertical}
            >
              <SelectTrigger id="subVertical" className={errors.subVertical ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a sub-vertical" />
              </SelectTrigger>
              <SelectContent>
                {availableSubVerticals.map((subVertical) => (
                  <SelectItem key={subVertical.id} value={subVertical.id}>
                    {subVertical.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subVertical && (
              <p className="text-sm text-red-500">{errors.subVertical}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessModel">Business Model</Label>
            <Select value={formData.businessModel} onValueChange={handleBusinessModelChange}>
              <SelectTrigger id="businessModel" className={errors.businessModel ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a business model" />
              </SelectTrigger>
              <SelectContent>
                {businessOptions?.businessModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessModel && (
              <p className="text-sm text-red-500">{errors.businessModel}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
            <Textarea
              id="additionalContext"
              placeholder="Provide any specific requirements, target audience, or constraints..."
              value={formData.additionalContext}
              onChange={handleAdditionalContextChange}
              className="min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isGenerating || isLoading}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Ideas
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}