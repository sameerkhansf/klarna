import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  Plus,
  DollarSign,
  ChevronDown,
  Check,
  UserPlus,
  Linkedin,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { industryService } from "@/lib/industryService";
import { sanitizeFileName } from "@/lib/utils/fileUtils";
import { getThemeColor, getThemeGradient } from "@/styles/theme";
import React from "react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyToEdit?: any | null;
  isEditMode?: boolean;
}

// Remove static list - will be loaded from database

export const UploadModal = ({
  isOpen,
  onClose,
  companyToEdit = null,
  isEditMode = false,
}: UploadModalProps) => {
  const [formData, setFormData] = useState({
    companyName: "",
    stage: "Pre-Seed",
    fundingAmount: "$50K",
    safeValuationCap: "",
    description: "",
    city: "",
    country: "",
    website: "",
    yearFounded: "",
    founders: [{ name: "", linkedin: "", email: "", phone: "" }],
    customFields: [{ label: "", value: "" }],
  });
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [industrySearch, setIndustrySearch] = useState("");
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [customIndustry, setCustomIndustry] = useState("");
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Load industries from database
  React.useEffect(() => {
    const loadIndustries = async () => {
      try {
        const industries = await industryService.getIndustryNames();
        setAvailableIndustries(industries);
      } catch (error) {
        console.error("Error loading industries:", error);
        // Fallback to static list if database fails
        setAvailableIndustries([
          "AI infra",
          "Ai agents",
          "AI",
          "Machine Learning",
          "Enterprise SaaS",
          "B2B Software",
          "FinTech",
          "Digital Health",
          "Health Tech",
          "Deep Tech",
          "Infrastructure",
          "Clean Energy",
          "Sustainability",
          "E-Commerce",
          "Marketplaces",
          "Future of Work",
          "EdTech",
          "Consumer Tech",
          "Gaming",
          "Blockchain",
          "IoT",
          "Cybersecurity",
          "FoodTech",
          "PropTech",
          "InsurTech",
        ]);
      }
    };

    if (isOpen) {
      loadIndustries();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isEditMode && companyToEdit) {
      setFormData({
        companyName: companyToEdit.name || "",
        stage: companyToEdit.stage || "Pre-Seed",
        fundingAmount: companyToEdit.fundingAmount || "$50K",
        safeValuationCap: companyToEdit.safeValuationCap || "",
        description: companyToEdit.description || "",
        city: companyToEdit.city || "",
        country: companyToEdit.country || "",
        website: companyToEdit.website || "",
        yearFounded: companyToEdit.yearFounded || "",
        founders:
          companyToEdit.founders?.length > 0
            ? companyToEdit.founders.map((f) => ({
                name: f.name || "",
                linkedin: f.linkedin || "",
                email: f.email || "",
                phone: f.phone || "",
              }))
            : [{ name: "", linkedin: "", email: "", phone: "" }],
        customFields:
          companyToEdit.custom_fields?.length > 0
            ? companyToEdit.custom_fields
            : [{ label: "", value: "" }],
      });
      // Load industries - prefer the new industries array, fallback to single industry
      const industriesToLoad =
        companyToEdit.industries &&
        Array.isArray(companyToEdit.industries) &&
        companyToEdit.industries.length > 0
          ? companyToEdit.industries
          : companyToEdit.industry
          ? [companyToEdit.industry]
          : [];
      setSelectedIndustries(industriesToLoad);
      setSelectedFile(null);
      setCustomIndustry("");
    } else if (!isOpen) {
      setFormData({
        companyName: "",
        stage: "Pre-Seed",
        fundingAmount: "$50K",
        safeValuationCap: "",
        description: "",
        city: "",
        country: "",
        website: "",
        yearFounded: "",
        founders: [{ name: "", linkedin: "", email: "", phone: "" }],
        customFields: [{ label: "", value: "" }],
      });
      setSelectedIndustries([]);
      setSelectedFile(null);
      setIndustrySearch("");
      setShowIndustryDropdown(false);
      setCustomIndustry("");
    }
  }, [isEditMode, companyToEdit, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle valuation cap with dollar formatting
    if (name === "safeValuationCap") {
      const numericValue = value.replace(/[^0-9]/g, "");
      if (numericValue) {
        const formattedValue = `$${parseInt(numericValue).toLocaleString()}`;
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: "" }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIndustryToggle = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  };

  const removeIndustry = (industry: string) => {
    setSelectedIndustries((prev) => prev.filter((i) => i !== industry));
  };

  const addCustomIndustry = async () => {
    const trimmedIndustry = customIndustry.trim();
    if (!trimmedIndustry || selectedIndustries.includes(trimmedIndustry)) {
      return;
    }

    try {
      // Add to database
      await industryService.addCustomIndustry(trimmedIndustry);

      // Update selected industries
      setSelectedIndustries((prev) => [...prev, trimmedIndustry]);

      // Update available industries list
      if (!availableIndustries.includes(trimmedIndustry)) {
        setAvailableIndustries((prev) => [...prev, trimmedIndustry].sort());
      }

      setCustomIndustry("");
      setShowIndustryDropdown(false);
    } catch (error) {
      console.error("Error adding custom industry:", error);
      alert("Error adding custom industry. Please try again.");
    }
  };

  const filteredIndustries = availableIndustries.filter((industry) =>
    industry.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      // Check file type
      const allowedTypes = [".pdf", ".ppt", ".pptx"];
      const fileName = file.name.toLowerCase();
      const isValidType = allowedTypes.some((type) => fileName.endsWith(type));

      if (isValidType) {
        setSelectedFile(file);
      } else {
        alert("Please upload a PDF, PPT, or PPTX file.");
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleFounderChange = (
    index: number,
    field: "name" | "linkedin" | "email" | "phone",
    value: string
  ) => {
    setFormData((prev) => {
      const updatedFounders = [...prev.founders];
      updatedFounders[index][field] = value;
      return { ...prev, founders: updatedFounders };
    });
  };

  const addFounder = () => {
    setFormData((prev) => ({
      ...prev,
      founders: [
        ...prev.founders,
        { name: "", linkedin: "", email: "", phone: "" },
      ],
    }));
  };

  const removeFounder = (index: number) => {
    setFormData((prev) => {
      const updatedFounders = prev.founders.filter((_, i) => i !== index);
      return { ...prev, founders: updatedFounders };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (selectedIndustries.length === 0) {
      alert("Please select at least one industry before submitting.");
      return;
    }

    setIsUploading(true);

    try {
      let pitchDeckUrl = null;
      let pitchDeckName = null;
      // 1. Upload file to Supabase Storage if selected
      if (selectedFile) {
        const sanitizedFileName = sanitizeFileName(selectedFile.name);
        const storageFileName = `company-${Date.now()}-${sanitizedFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("pitch-decks")
          .upload(storageFileName, selectedFile);
        if (uploadError) throw uploadError;
        pitchDeckName = selectedFile.name; // Keep original name for display
        // 2. Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("pitch-decks")
          .getPublicUrl(uploadData.path);
        pitchDeckUrl = publicUrlData.publicUrl;
      }

      // Validate required fields
      if (!formData.yearFounded || formData.yearFounded.trim() === "") {
        throw new Error("Please enter a valid year founded");
      }
      
      const yearFounded = parseInt(formData.yearFounded, 10);
      if (isNaN(yearFounded) || yearFounded < 1800 || yearFounded > new Date().getFullYear()) {
        throw new Error("Please enter a valid year founded (between 1800 and current year)");
      }

      if (isEditMode && companyToEdit) {
        // Update company
        const updatePayload: any = {
          name: formData.companyName,
          industry: selectedIndustries[0] || "", // Keep for backward compatibility
          industries: selectedIndustries, // New multiple industries field
          stage: formData.stage,
          funding_amount: formData.fundingAmount,
          description: formData.description,
          city: formData.city,
          country: formData.country,
          website: formData.website,
          year_founded: yearFounded,
          custom_fields: formData.customFields.filter(
            (f) => f.label || f.value
          ),
        };
        if (pitchDeckName && pitchDeckUrl) {
          updatePayload.pitch_deck_name = pitchDeckName;
          updatePayload.pitch_deck_url = pitchDeckUrl;
        }
        const { error: updateError } = await supabase
          .from("companies")
          .update(updatePayload)
          .eq("id", companyToEdit.id);
        if (updateError) throw updateError;
        // Update founders: delete old and insert new
        await supabase
          .from("founders")
          .delete()
          .eq("company_id", companyToEdit.id);
        const foundersPayload = formData.founders
          .filter((f) => f.name)
          .map((f) => ({
            company_id: companyToEdit.id,
            name: f.name,
            linkedin: f.linkedin || null,
            email: f.email || null,
            phone: f.phone || null,
          }));
        if (foundersPayload.length > 0) {
          const { error: foundersError } = await supabase
            .from("founders")
            .insert(foundersPayload);
          if (foundersError) throw foundersError;
        }
      } else {
        // Insert new company
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert([
            {
              name: formData.companyName,
              industry: selectedIndustries[0] || "", // Keep for backward compatibility
              industries: selectedIndustries, // New multiple industries field
              stage: formData.stage,
              funding_amount: formData.fundingAmount,
              upload_date: new Date().toISOString().slice(0, 10),
              status: "Not Reviewed",
              description: formData.description,
              market_size: "", // Not in form
              revenue: "", // Not in form
              city: formData.city,
              country: formData.country,
              website: formData.website,
              year_founded: yearFounded,
              pitch_deck_name: pitchDeckName,
              pitch_deck_url: pitchDeckUrl,
              custom_fields: formData.customFields.filter(
                (f) => f.label || f.value
              ),
            },
          ])
          .select();
        if (companyError) throw companyError;
        const newCompanyId = companyData && companyData[0]?.id;

        // 4. Insert founders into founders table
        if (newCompanyId) {
          const foundersPayload = formData.founders
            .filter((f) => f.name)
            .map((f) => ({
              company_id: newCompanyId,
              name: f.name,
              linkedin: f.linkedin || null,
              email: f.email || null,
              phone: f.phone || null,
            }));
          if (foundersPayload.length > 0) {
            const { error: foundersError } = await supabase
              .from("founders")
              .insert(foundersPayload);
            if (foundersError) throw foundersError;
          }
        }
      }

      setIsUploading(false);
      onClose();
      // Reset form
      setFormData({
        companyName: "",
        stage: "Pre-Seed",
        fundingAmount: "$50K",
        safeValuationCap: "",
        description: "",
        city: "",
        country: "",
        website: "",
        yearFounded: "",
        founders: [{ name: "", linkedin: "", email: "", phone: "" }],
        customFields: [{ label: "", value: "" }],
      });
      setSelectedIndustries([]);
      setSelectedFile(null);
      setIndustrySearch("");
      setShowIndustryDropdown(false);
      setCustomIndustry("");
    } catch (err) {
      setIsUploading(false);
      alert("Error uploading company: " + (err as Error).message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <div
              className="p-2 rounded-lg mr-3"
              style={{
                background: "linear-gradient(135deg, #FF7B00, #E56600)",
              }}
            >
              <Upload className="h-5 w-5 text-white" />
            </div>
            Add Company Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Company Information
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter company name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="website">Company Website</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://company.com (optional)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="yearFounded">Year Founded</Label>
                <Input
                  id="yearFounded"
                  name="yearFounded"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.yearFounded}
                  onChange={handleInputChange}
                  placeholder="e.g. 2020 (optional)"
                  className="mt-1"
                />
              </div>
              {/* Founders Section */}
              <div className="col-span-2">
                <Label>Founders *</Label>
                <div className="space-y-3">
                  {formData.founders.map((founder, idx) => (
                    <div key={idx} className="flex gap-2 items-end flex-wrap">
                      <div className="flex-1 min-w-[120px]">
                        <Input
                          name={`founder-name-${idx}`}
                          value={founder.name}
                          onChange={(e) =>
                            handleFounderChange(idx, "name", e.target.value)
                          }
                          required
                          placeholder="Founder Name"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <Input
                          name={`founder-linkedin-${idx}`}
                          value={founder.linkedin}
                          onChange={(e) =>
                            handleFounderChange(idx, "linkedin", e.target.value)
                          }
                          placeholder="LinkedIn URL (optional)"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <Input
                          name={`founder-email-${idx}`}
                          value={founder.email}
                          onChange={(e) =>
                            handleFounderChange(idx, "email", e.target.value)
                          }
                          placeholder="Email (optional)"
                          className="mt-1"
                          type="email"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <Input
                          name={`founder-phone-${idx}`}
                          value={founder.phone}
                          onChange={(e) =>
                            handleFounderChange(idx, "phone", e.target.value)
                          }
                          placeholder="Phone (optional)"
                          className="mt-1"
                          type="tel"
                        />
                      </div>
                      {formData.founders.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFounder(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFounder}
                    className="mt-2"
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> Add Founder
                  </Button>
                </div>
              </div>
            </div>

            {/* Industry Multi-Select with Search */}
            <div className="relative">
              <Label className="text-base font-medium">Industries *</Label>
              <p className="text-sm text-gray-500 mb-3">
                Search and select all applicable industries
              </p>

              {/* Selected Industries */}
              {selectedIndustries.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border">
                  {selectedIndustries.map((industry) => (
                    <Badge
                      key={industry}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{ backgroundColor: `${getThemeColor('primary.DEFAULT')}20`, color: getThemeColor('primary.DEFAULT'), borderColor: `${getThemeColor('primary.DEFAULT')}40` }}
                    >
                      {industry}
                      <button
                        type="button"
                        onClick={() => removeIndustry(industry)}
                        className="ml-1 rounded-full p-0.5"
                        style={{ ':hover': { backgroundColor: `${getThemeColor('primary.DEFAULT')}30` } }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Please select at least one industry to continue
                  </p>
                </div>
              )}

              {/* Search Input with Dropdown */}
              <div className="relative">
                <div className="relative">
                  <Input
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    onFocus={() => setShowIndustryDropdown(true)}
                    placeholder="Search industries..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowIndustryDropdown(!showIndustryDropdown)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform ${
                        showIndustryDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Dropdown */}
                {showIndustryDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries.map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => {
                            handleIndustryToggle(industry);
                            setIndustrySearch("");
                            setShowIndustryDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left flex items-center justify-between group hover:bg-gray-50"
                        >
                          <span className="text-sm text-gray-900">
                            {industry}
                          </span>
                          {selectedIndustries.includes(industry) && (
                            <Check className="h-4 w-4" style={{ color: getThemeColor('primary.DEFAULT') }} />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No industries found
                      </div>
                    )}

                    {/* Custom Industry Input */}
                    <div className="border-t border-gray-200 p-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Add Custom Industry
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter custom industry"
                          value={customIndustry}
                          onChange={(e) => setCustomIndustry(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomIndustry();
                            }
                          }}
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addCustomIndustry}
                          disabled={!customIndustry.trim()}
                          className="text-white"
                          style={{ background: getThemeGradient('primary') }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Click outside to close dropdown */}
              {showIndustryDropdown && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowIndustryDropdown(false)}
                />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., San Francisco"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., USA"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stage">Funding Stage *</Label>
                <select
                  id="stage"
                  name="stage"
                  // value={formData.stage}
                  value="Pre-Seed"
                  disabled
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Series C+">Series C+</option>
                </select>
              </div>

              <div>
                <Label htmlFor="fundingAmount">Funding Amount *</Label>
                <Input
                  id="fundingAmount"
                  name="fundingAmount"
                  value={formData.fundingAmount}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className="bg-gray-50 mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="safeValuationCap"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" style={{ color: getThemeColor('primary.DEFAULT') }} />
                  Safe Valuation Cap
                </Label>
                <Input
                  id="safeValuationCap"
                  name="safeValuationCap"
                  value={formData.safeValuationCap}
                  onChange={handleInputChange}
                  placeholder="Enter valuation cap"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter amount in USD (e.g., 5000000 for $5M)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">
                Company Description (Optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the company and its solution"
                rows={3}
              />
            </div>
            {/* Custom Fields */}
            <div>
              <Label>Custom Fields (Optional)</Label>
              <p className="text-sm text-gray-500 mb-2">
                Add any custom fields (label and value)
              </p>
              {formData.customFields.map((field, idx) => {
                const handleValueChange = (
                  e: React.ChangeEvent<HTMLTextAreaElement>
                ) => {
                  const updated = [...formData.customFields];
                  updated[idx].value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    customFields: updated,
                  }));
                  // Auto-resize logic
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                };
                return (
                  <div key={idx} className="flex gap-2 mb-2 items-start">
                    <Input
                      placeholder="Label"
                      value={field.label}
                      onChange={(e) => {
                        const updated = [...formData.customFields];
                        updated[idx].label = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          customFields: updated,
                        }));
                      }}
                      className="flex-1"
                    />
                    <Textarea
                      placeholder="Value"
                      value={field.value}
                      onChange={handleValueChange}
                      className="flex-1 min-h-[40px] resize-none"
                      rows={2}
                    />
                    {formData.customFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            customFields: prev.customFields.filter(
                              (_, i) => i !== idx
                            ),
                          }));
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    customFields: [
                      ...prev.customFields,
                      { label: "", value: "" },
                    ],
                  }))
                }
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Custom Field
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pitch Deck Upload
            </h3>

            {!selectedFile && (!isEditMode || !companyToEdit?.pitchDeck) ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive
                    ? ""
                    : "border-gray-300"
                }`}
                style={isDragActive ? { borderColor: getThemeColor('primary.DEFAULT') } : {}}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your pitch deck here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: PDF, PPT, PPTX (Max 50MB)
                </p>
                <Input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            ) : selectedFile ? (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 mr-3" style={{ color: getThemeColor('primary.DEFAULT') }} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : isEditMode && companyToEdit?.pitchDeck ? (
              <div className="border border-gray-300 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {companyToEdit.pitchDeck.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Current pitch deck
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={companyToEdit.pitchDeck.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 border border-blue-200 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md px-3"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Trigger file input for replacement
                        document.getElementById("file-upload")?.click();
                      }}
                      className="hover:opacity-80"
                      style={{ color: getThemeColor('primary.DEFAULT') }}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{
                background: getThemeGradient("primary"),
              }}
              className="text-white hover:opacity-90 transition-opacity"
              disabled={
                (!selectedFile && (!isEditMode || !companyToEdit?.pitchDeck)) ||
                !formData.companyName ||
                selectedIndustries.length === 0 ||
                isUploading
              }
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {isEditMode ? "Update Company" : "Upload & Generate Memo"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
