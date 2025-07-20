import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

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

const verticals = [
  { value: "fintech", label: "FinTech" },
  { value: "healthtech", label: "HealthTech" },
  { value: "edtech", label: "EdTech" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "saas", label: "SaaS" },
  { value: "marketplace", label: "Marketplace" },
  { value: "mobility", label: "Mobility & Transportation" },
  { value: "proptech", label: "PropTech" },
];

const subVerticals: Record<string, { value: string; label: string }[]> = {
  fintech: [
    { value: "payments", label: "Payments & Transfers" },
    { value: "lending", label: "Lending & Credit" },
    { value: "investing", label: "Investment & Trading" },
    { value: "insurance", label: "InsurTech" },
    { value: "banking", label: "Digital Banking" },
    { value: "crypto", label: "Cryptocurrency" },
  ],
  healthtech: [
    { value: "telemedicine", label: "Telemedicine" },
    { value: "medical-devices", label: "Medical Devices" },
    { value: "diagnostics", label: "Diagnostics" },
    { value: "mental-health", label: "Mental Health" },
    { value: "fitness", label: "Fitness & Wellness" },
    { value: "pharma", label: "Digital Pharma" },
  ],
  edtech: [
    { value: "k12", label: "K-12 Education" },
    { value: "higher-ed", label: "Higher Education" },
    { value: "corporate", label: "Corporate Training" },
    { value: "language", label: "Language Learning" },
    { value: "skills", label: "Skills Development" },
    { value: "exam-prep", label: "Test Preparation" },
  ],
  ecommerce: [
    { value: "b2c", label: "B2C Retail" },
    { value: "b2b", label: "B2B Commerce" },
    { value: "d2c", label: "Direct-to-Consumer" },
    { value: "social-commerce", label: "Social Commerce" },
    { value: "subscription", label: "Subscription Commerce" },
    { value: "mobile-commerce", label: "Mobile Commerce" },
  ],
  saas: [
    { value: "productivity", label: "Productivity Tools" },
    { value: "analytics", label: "Analytics & BI" },
    { value: "crm", label: "CRM & Sales" },
    { value: "hr", label: "HR & Recruiting" },
    { value: "marketing", label: "Marketing Automation" },
    { value: "collaboration", label: "Team Collaboration" },
  ],
  marketplace: [
    { value: "services", label: "Service Marketplace" },
    { value: "goods", label: "Goods Marketplace" },
    { value: "b2b-marketplace", label: "B2B Marketplace" },
    { value: "freelance", label: "Freelance Platform" },
    { value: "rental", label: "Rental Platform" },
    { value: "peer-to-peer", label: "Peer-to-Peer" },
  ],
  mobility: [
    { value: "rideshare", label: "Ride Sharing" },
    { value: "delivery", label: "Delivery Services" },
    { value: "logistics", label: "Logistics & Supply Chain" },
    { value: "micro-mobility", label: "Micro-mobility" },
    { value: "public-transport", label: "Public Transportation" },
    { value: "automotive", label: "Automotive Tech" },
  ],
  proptech: [
    { value: "residential", label: "Residential Real Estate" },
    { value: "commercial", label: "Commercial Real Estate" },
    { value: "property-management", label: "Property Management" },
    { value: "smart-buildings", label: "Smart Buildings" },
    { value: "construction", label: "Construction Tech" },
    { value: "real-estate-finance", label: "Real Estate Finance" },
  ],
};

const businessModels = [
  { value: "subscription", label: "Subscription (SaaS/Recurring)" },
  { value: "marketplace", label: "Marketplace (Commission)" },
  { value: "freemium", label: "Freemium" },
  { value: "advertising", label: "Advertising Supported" },
  { value: "transaction", label: "Transaction-based" },
  { value: "licensing", label: "Licensing" },
  { value: "direct-sales", label: "Direct Sales" },
  { value: "affiliate", label: "Affiliate/Referral" },
];

export function IdeaGenerationForm({ onSubmit, isGenerating = false }: IdeaGenerationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    vertical: "",
    subVertical: "",
    businessModel: "",
    additionalContext: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleSubmit = (e: React.FormEvent) => {
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
    onSubmit(formData);
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

  const availableSubVerticals = formData.vertical ? subVerticals[formData.vertical] || [] : [];

  return (
    <Card className="w-full shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="h-6 w-6 text-primary" />
          Business Idea Generator
        </CardTitle>
        <CardDescription>
          Configure your parameters to generate innovative business ideas with AI-powered analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vertical">Industry Vertical *</Label>
              <Select value={formData.vertical} onValueChange={handleVerticalChange}>
                <SelectTrigger className={errors.vertical ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select an industry vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((vertical) => (
                    <SelectItem key={vertical.value} value={vertical.value}>
                      {vertical.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vertical && (
                <p className="text-sm text-destructive">{errors.vertical}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subVertical">Sub-Vertical *</Label>
              <Select 
                value={formData.subVertical} 
                onValueChange={handleSubVerticalChange}
                disabled={!formData.vertical}
              >
                <SelectTrigger className={errors.subVertical ? "border-destructive" : ""}>
                  <SelectValue 
                    placeholder={
                      formData.vertical 
                        ? "Select a sub-vertical" 
                        : "First select a vertical"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSubVerticals.map((subVertical) => (
                    <SelectItem key={subVertical.value} value={subVertical.value}>
                      {subVertical.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subVertical && (
                <p className="text-sm text-destructive">{errors.subVertical}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessModel">Business Model *</Label>
            <Select value={formData.businessModel} onValueChange={handleBusinessModelChange}>
              <SelectTrigger className={errors.businessModel ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a business model" />
              </SelectTrigger>
              <SelectContent>
                {businessModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessModel && (
              <p className="text-sm text-destructive">{errors.businessModel}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
            <Textarea
              id="additionalContext"
              placeholder="Provide any additional focus areas, constraints, or specific requirements for your business idea generation..."
              value={formData.additionalContext}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalContext: e.target.value }))}
              className="min-h-[100px] resize-none"
            />
            <p className="text-sm text-muted-foreground">
              This field helps our AI agents understand your specific needs and preferences.
            </p>
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            size="lg" 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Business Ideas
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}