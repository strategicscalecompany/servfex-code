import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Upload,
  X,
  Plus,
  Loader2,
  Trash2,
  Video,
  Film,
  Sparkles,
  IndianRupee,
  Check,
  HelpCircle,
  Star,
  Info,
  ListChecks,
  FileText,
  GripVertical,
  Layers,
  Tag,
  ImageIcon,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { hostMediaIfNeeded, hostMediaList } from '../../api/upload';
import { ServicePackage, ServiceSubCategory } from '../../types';
import { Modal } from '../../components/common/Modal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

interface ProcessStepItem {
  title: string;
  description: string;
  imagePreview?: string | null;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ReviewItem {
  reviewerName: string;
  rating: number;
  comment: string;
  date?: string;
}

const PACKAGE_TEMPLATES: Record<string, any> = {
  bathroom: {
    sectionTitle: 'Intense Cleaning',
    name: 'Classic Bathroom Cleaning',
    badgeText: 'MOST POPULAR',
    shortDescription: 'Deep stain removal, tile descaling, commode sanitization & mirror polishing',
    originalPrice: '699',
    discountedPrice: '499',
    duration: '60 mins',
    pricePerUnitLabel: 'per bathroom',
    cardImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    detailBanners: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ],
    highlightsTitle: 'Highlights',
    highlights: [
      'Deep stain removal from hard water deposits & yellow scaling',
      'Hospital-grade sanitization of commode, sink & taps',
      'Tile scrubbing with mechanized rotary brush',
      'Mirror & glass shine with streak-free formula',
    ],
    processTitle: 'Our 4-Step Cleaning Process',
    processSteps: [
      {
        title: 'Pre-treatment & Descaling',
        description: 'Eco-friendly descaling solution sprayed on tiles, commode, and chrome fittings.',
        imagePreview: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Mechanized Tile Scrubbing',
        description: 'Rotary brush scrubber cleans tile grout, removing grime and hard water marks.',
        imagePreview: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Fixtures & Chrome Buffing',
        description: 'Taps, shower head, and mirror buffed to a mirror finish.',
        imagePreview: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Floor Drying & Sanitization',
        description: 'Complete water vacuuming, floor drying, and aromatic deodorization.',
        imagePreview: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80',
      },
    ],
    whatsIncludedTitle: "What's Included",
    whatsIncluded: [
      'Toilet bowl interior & exterior scrubbing',
      'Tile walls scrubbed up to 7 feet',
      'Washbasin, taps, mirror & vanity cleaning',
      'Exhaust fan, geyser exterior & door wiped',
      'Floor cleaning & mechanized drying',
    ],
    requirementsTitle: 'What We Need From You',
    requirements: [
      'Running hot/cold water supply',
      'Electrical socket for rotary scrubber',
      'Stool or ladder for high areas',
    ],
    pleaseNoteTitle: 'Please Note',
    pleaseNote: [
      'Hard water stains older than 6 months may fade by 70-80% but may not completely disappear.',
      'Personal toiletries and bath mats should be removed before service begins.',
    ],
    faqsTitle: 'Frequently Asked Questions',
    faqs: [
      { question: 'How long does the service take?', answer: 'A single standard bathroom takes approximately 60 to 75 minutes.' },
      { question: 'Are the chemicals safe for kids and pets?', answer: 'Yes, we use government-approved, non-hazardous, eco-friendly cleaning agents.' },
    ],
  },
  kitchen: {
    sectionTitle: 'Complete Kitchen Cleaning',
    name: 'Complete Kitchen Deep Clean',
    badgeText: 'BESTSELLER',
    shortDescription: 'Intensive oil, grease, carbon & grime removal from tiles, cabinets, stove, and sink',
    originalPrice: '1899',
    discountedPrice: '1399',
    duration: '120 mins',
    pricePerUnitLabel: 'per kitchen',
    cardImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    detailBanners: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1200&q=80',
    ],
    highlightsTitle: 'Highlights',
    highlights: [
      'Complete degreasing of gas stove burners, dials, and stainless steel counter',
      'Tile backsplash oil & carbon stain removal',
      'Cabinet exterior detailing and handle sanitization',
      'Sink descaling and drain pipe unclogging flush',
    ],
    processTitle: 'Our 4-Step Degreasing Process',
    processSteps: [
      {
        title: 'Chemical Degreaser Soak',
        description: 'Food-grade alkaline foam is sprayed across the stove, backsplash tiles, and exhaust.',
        imagePreview: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Abrasive-Free Scrubbing',
        description: 'Special non-scratch nylon pads lift burnt carbon and sticky oil without dulling surfaces.',
        imagePreview: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Cabinet & Appliance Detailing',
        description: 'All modular cabinet doors, microwave exterior, and fridge exterior are wiped spotless.',
        imagePreview: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Sanitization & Counter Buffing',
        description: 'Counters are disinfected and machine-buffed to a clean hygienic shine.',
        imagePreview: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
      },
    ],
    whatsIncludedTitle: "What's Included",
    whatsIncluded: [
      'Gas stove, knobs, burner rings & drip trays',
      'Wall tiles degreased up to ceiling level',
      'Cabinet exterior wipe & stain removal',
      'Kitchen sink, tap & water purifier exterior',
    ],
    requirementsTitle: 'What We Need From You',
    requirements: [
      'Removal of open spices and utensils from countertops',
      'Active water and electricity connection',
    ],
    pleaseNoteTitle: 'Please Note',
    pleaseNote: [
      'Cleaning of internal cabinet contents is only done if cabinets are emptied prior to arrival.',
    ],
    faqsTitle: 'Frequently Asked Questions',
    faqs: [
      { question: 'Do I need to empty all cabinets?', answer: 'For standard service, we clean all cabinet exteriors. If you want inner shelves cleaned, please empty them before arrival.' },
    ],
  },
  home: {
    sectionTitle: 'Apartment Packages',
    name: '2 BHK Deep Home Cleaning',
    badgeText: 'MOST POPULAR',
    shortDescription: 'Full deep clean for 2 Bedrooms, Hall, Kitchen, Balconies, and up to 2 Bathrooms',
    originalPrice: '4999',
    discountedPrice: '3699',
    duration: '5-6 hours',
    pricePerUnitLabel: 'per apartment',
    cardImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    detailBanners: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    ],
    highlightsTitle: 'Highlights',
    highlights: [
      '2 Bedrooms + Living/Dining + Kitchen + 2 Bathrooms + Balcony',
      'Heavy-duty floor scrubbing with single-disc buffing machine',
      'Streak-free glass cleaning for all windows and sliders',
      'Hospital-grade germicidal fogging and deodorization',
    ],
    processTitle: '5-Step Cleaning Protocol',
    processSteps: [
      {
        title: 'High-Reach Dusting',
        description: 'Cobweb removal, fan blades, top of wardrobes, and air conditioner vents.',
        imagePreview: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Wet Vacuuming & Degreasing',
        description: 'Kitchen and bathrooms scrubbed with mechanized tools.',
        imagePreview: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Mechanized Floor Buffing',
        description: 'Entire house floors buffed with micro-abrasive pads.',
        imagePreview: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      },
    ],
    whatsIncludedTitle: "What's Included",
    whatsIncluded: [
      'Entire 2 BHK apartment deep cleaning',
      '2 Bathrooms sanitized and descaled',
      'Balcony floor washed and drained',
      'Door frames, baseboards, switchboards detailed',
    ],
    requirementsTitle: 'What We Need From You',
    requirements: [
      'Access to all rooms throughout the 5-6 hour duration',
    ],
    pleaseNoteTitle: 'Please Note',
    pleaseNote: [
      'Exterior wall cleaning or terrace cleaning is not included in standard apartment plans.',
    ],
    faqsTitle: 'Frequently Asked Questions',
    faqs: [
      { question: 'Can we stay in the home while cleaning happens?', answer: 'Yes! The team cleans room by room, allowing you to comfortably occupy another room.' },
    ],
  },
  sofa: {
    sectionTitle: 'Sofa Shampooing',
    name: '3-Seater Fabric Sofa Shampooing',
    badgeText: 'TOP RATED',
    shortDescription: 'Deep injection-extraction wet shampooing to eliminate deep dust, food stains, and odors',
    originalPrice: '899',
    discountedPrice: '649',
    duration: '60 mins',
    pricePerUnitLabel: 'per 3-seater',
    cardImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    detailBanners: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=80',
    ],
    highlightsTitle: 'Highlights',
    highlights: [
      'High-power dry vacuuming to remove deep-seated dust mites',
      'Foaming shampoo application with specialized fabric brush',
      'High-suction extraction lifts 90% moisture along with dissolved stains',
      'Aroma fresh deodorizer treatment leaves sofa smelling new',
    ],
    processTitle: 'Our 3-Step Shampoo Process',
    processSteps: [
      {
        title: 'Dry Extraction',
        description: 'Commercial 1400W vacuum extracts loose dirt, allergens, and dust mites from crevices.',
        imagePreview: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Fabric Shampoo Agitation',
        description: 'German non-ionic foam shampoo is worked into fabric fibers using soft-bristle agitators.',
        imagePreview: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      },
      {
        title: 'Moisture & Sludge Extraction',
        description: 'Twin-motor extraction vacuum sucks out 90% of moisture and all dissolved stains.',
        imagePreview: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
      },
    ],
    whatsIncludedTitle: "What's Included",
    whatsIncluded: [
      'Full 3-seater fabric sofa (seats, backrests, and side armrests)',
      'Stain spot-treatment for coffee/tea/food spills',
      'Deodorizing spray application',
    ],
    requirementsTitle: 'What We Need From You',
    requirements: [
      'Electrical socket within 5 meters',
      'Allow 3 to 4 hours under ceiling fan for complete drying',
    ],
    pleaseNoteTitle: 'Please Note',
    pleaseNote: [
      'Ink or chemical stains may fade significantly but cannot be 100% guaranteed.',
    ],
    faqsTitle: 'Frequently Asked Questions',
    faqs: [
      { question: 'How long does the sofa take to dry?', answer: 'It is only slightly damp and dries completely within 3 to 4 hours under a regular ceiling fan.' },
    ],
  },
};

interface PackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subCategory: ServiceSubCategory;
  existing?: ServicePackage | null;
  existingSections?: string[];
  onSuccess: () => void;
}

export const PackageFormModal: React.FC<PackageFormModalProps> = ({
  isOpen,
  onClose,
  subCategory,
  existing,
  existingSections = [],
  onSuccess,
}) => {
  // ── Form State ──
  // 0. Section Title / Heading (Optional)
  const [sectionTitle, setSectionTitle] = useState(existing?.sectionTitle ?? '');

  // 1. Media
  const [cardImage, setCardImage] = useState<string | null>(existing?.cardImage ?? null);
  const [detailBanners, setDetailBanners] = useState<(string | null)[]>([
    existing?.detailBannerImages?.[0] ?? null,
    existing?.detailBannerImages?.[1] ?? null,
    existing?.detailBannerImages?.[2] ?? null,
    existing?.detailBannerImages?.[3] ?? null,
  ]);
  const [detailBannerVideo, setDetailBannerVideo] = useState<string | null>(
    existing?.detailBannerVideo ?? null
  );
  const [offersBanner, setOffersBanner] = useState<string | null>(existing?.offersBanner ?? null);

  // 2. Identity
  const [name, setName] = useState(existing?.name ?? '');
  const [shortDescription, setShortDescription] = useState(existing?.shortDescription ?? '');
  const [badgeText, setBadgeText] = useState(existing?.badgeText ?? '');

  // 3. Pricing (Side-by-side)
  const [originalPrice, setOriginalPrice] = useState(
    existing ? String(Number(existing.originalPrice)) : ''
  );
  const [discountedPrice, setDiscountedPrice] = useState(
    existing ? String(Number(existing.discountedPrice)) : ''
  );
  const [duration, setDuration] = useState(existing?.duration ?? '60 mins');
  const [pricePerUnitLabel, setPricePerUnitLabel] = useState(existing?.pricePerUnitLabel ?? '');

  // 4. Highlights (Title + point-wise)
  const [highlightsTitle, setHighlightsTitle] = useState(existing?.highlightsTitle ?? 'Highlights');
  const [highlights, setHighlights] = useState<string[]>(existing?.highlights ?? []);
  const [newHighlight, setNewHighlight] = useState('');

  // 6. Our Process (Title + numbered boxes with image & text)
  const [processTitle, setProcessTitle] = useState(existing?.processTitle ?? 'Our Process');
  const [processSteps, setProcessSteps] = useState<ProcessStepItem[]>(
    existing?.processSteps?.map((s) => ({
      title: s.title,
      description: s.description,
      imagePreview: s.imageUrl ?? null,
    })) ?? [
      { title: '', description: '', imagePreview: null },
    ]
  );

  // 7. What's Included (Title + point-wise)
  const [whatsIncludedTitle, setWhatsIncludedTitle] = useState(
    existing?.whatsIncludedTitle ?? "What's Included"
  );
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>(existing?.whatsIncluded ?? []);
  const [newIncluded, setNewIncluded] = useState('');

  // 8. What We Need From You (Title + point-wise)
  const [requirementsTitle, setRequirementsTitle] = useState(
    existing?.requirementsTitle ?? 'What We Need From You'
  );
  const [requirements, setRequirements] = useState<string[]>(
    existing?.requirements?.map((r) => r.label) ?? []
  );
  const [newRequirement, setNewRequirement] = useState('');

  // 9. Please Note (Title + point-wise)
  const [pleaseNoteTitle, setPleaseNoteTitle] = useState(existing?.pleaseNoteTitle ?? 'Please Note');
  const [pleaseNote, setPleaseNote] = useState<string[]>(existing?.pleaseNote ?? []);
  const [newNote, setNewNote] = useState('');

  // 10. FAQs
  const [faqsTitle, setFaqsTitle] = useState(
    existing?.faqsTitle ?? 'Frequently Asked Questions'
  );
  const [faqs, setFaqs] = useState<FAQItem[]>(existing?.faqs ?? []);

  // 11. Reviews
  const [reviews, setReviews] = useState<ReviewItem[]>(
    existing?.reviews ?? [
      { reviewerName: '', rating: 5, comment: '', date: 'Recent' },
    ]
  );

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Input refs for file upload
  const cardInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const offersInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize state when opening / changing existing
  useEffect(() => {
    if (existing) {
      setSectionTitle(existing.sectionTitle ?? '');
      setCardImage(existing.cardImage ?? null);
      setDetailBanners([
        existing.detailBannerImages?.[0] ?? null,
        existing.detailBannerImages?.[1] ?? null,
        existing.detailBannerImages?.[2] ?? null,
        existing.detailBannerImages?.[3] ?? null,
      ]);
      setDetailBannerVideo(existing.detailBannerVideo ?? null);
      setOffersBanner(existing.offersBanner ?? null);
      setName(existing.name ?? '');
      setShortDescription(existing.shortDescription ?? '');
      setBadgeText(existing.badgeText ?? '');
      setOriginalPrice(String(Number(existing.originalPrice || 0)));
      setDiscountedPrice(String(Number(existing.discountedPrice || 0)));
      setDuration(existing.duration ?? '60 mins');
      setPricePerUnitLabel(existing.pricePerUnitLabel ?? '');
      setHighlightsTitle(existing.highlightsTitle ?? 'Highlights');
      setHighlights(existing.highlights ?? []);
      setProcessTitle(existing.processTitle ?? 'Our Process');
      setProcessSteps(
        existing.processSteps?.map((s) => ({
          title: s.title,
          description: s.description,
          imagePreview: s.imageUrl ?? null,
        })) ?? [{ title: '', description: '', imagePreview: null }]
      );
      setWhatsIncludedTitle(existing.whatsIncludedTitle ?? "What's Included");
      setWhatsIncluded(existing.whatsIncluded ?? []);
      setRequirementsTitle(existing.requirementsTitle ?? 'What We Need From You');
      setRequirements(existing.requirements?.map((r) => r.label) ?? []);
      setPleaseNoteTitle(existing.pleaseNoteTitle ?? 'Please Note');
      setPleaseNote(existing.pleaseNote ?? []);
      setFaqsTitle(existing.faqsTitle ?? 'Frequently Asked Questions');
      setFaqs(existing.faqs ?? []);
      setReviews(
        existing.reviews && existing.reviews.length > 0
          ? existing.reviews
          : [{ reviewerName: '', rating: 5, comment: '', date: 'Recent' }]
      );
    } else {
      setSectionTitle('');
      setCardImage(null);
      setDetailBanners([null, null, null, null]);
      setDetailBannerVideo(null);
      setOffersBanner(null);
      setName('');
      setShortDescription('');
      setBadgeText('');
      setOriginalPrice('');
      setDiscountedPrice('');
      setDuration('60 mins');
      setPricePerUnitLabel('');
      setHighlightsTitle('Highlights');
      setHighlights([]);
      setProcessTitle('Our Process');
      setProcessSteps([{ title: '', description: '', imagePreview: null }]);
      setWhatsIncludedTitle("What's Included");
      setWhatsIncluded([]);
      setRequirementsTitle('What We Need From You');
      setRequirements([]);
      setPleaseNoteTitle('Please Note');
      setPleaseNote([]);
      setFaqsTitle('Frequently Asked Questions');
      setFaqs([]);
      setReviews([{ reviewerName: '', rating: 5, comment: '', date: 'Recent' }]);
    }
    setError(null);
    setUploadStatus(null);
  }, [existing, isOpen]);

  // Savings computation
  const origNum = parseFloat(originalPrice) || 0;
  const discNum = parseFloat(discountedPrice) || 0;
  const savingsAmount = origNum > discNum ? origNum - discNum : 0;
  const savingsPct = origNum > 0 && origNum > discNum ? Math.round((savingsAmount / origNum) * 100) : 0;

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Host card image
      setUploadStatus('Uploading card image…');
      const hostedCardImage = (await hostMediaIfNeeded(cardImage, 'servfex/packages/cards')) ?? null;

      // 2. Host detail banner images
      setUploadStatus('Uploading banner images…');
      const hostedBanners = await hostMediaList(detailBanners, 'servfex/packages/banners');

      // 3. Host detail banner video (if provided)
      let hostedVideo: string | null = null;
      if (detailBannerVideo) {
        setUploadStatus('Uploading banner video…');
        hostedVideo = (await hostMediaIfNeeded(detailBannerVideo, 'servfex/packages/videos')) ?? null;
      }

      // 4. Host offers banner (if provided)
      let hostedOffersBanner: string | null = null;
      if (offersBanner) {
        setUploadStatus('Uploading offers banner…');
        hostedOffersBanner = (await hostMediaIfNeeded(offersBanner, 'servfex/packages/offers')) ?? null;
      }

      // 5. Host process step images
      setUploadStatus('Uploading process step images…');
      const cleanSteps = await Promise.all(
        processSteps
          .filter((s) => s.title.trim() || s.description.trim() || s.imagePreview)
          .map(async (s, idx) => ({
            stepNumber: idx + 1,
            title: s.title.trim(),
            description: s.description.trim(),
            imageUrl: (await hostMediaIfNeeded(s.imagePreview, 'servfex/packages/steps')) ?? null,
          }))
      );

      // Clean requirements
      const formattedRequirements = requirements
        .filter((r) => r.trim())
        .map((label) => ({ iconUrl: '', label: label.trim() }));

      // Clean reviews
      const cleanReviews = reviews.filter(
        (r) => r.reviewerName.trim() && r.comment.trim()
      );

      // Clean FAQs
      const cleanFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());

      setUploadStatus('Saving package…');
      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        badgeText: badgeText.trim() || undefined,
        sectionTitle: sectionTitle.trim() || null,
        originalPrice: origNum,
        discountedPrice: discNum,
        savingsLabel: savingsAmount > 0 ? `Save ₹${savingsAmount} (${savingsPct}% off)` : undefined,
        pricePerUnitLabel: pricePerUnitLabel.trim() || undefined,
        duration: duration.trim() || '60 mins',
        cardImage: hostedCardImage,
        detailBannerImages: hostedBanners,
        detailBannerVideo: hostedVideo,
        offersBanner: hostedOffersBanner,
        highlightsTitle: highlightsTitle.trim() || 'Highlights',
        highlights: highlights.filter((h) => h.trim()),
        processTitle: processTitle.trim() || 'Our Process',
        processSteps: cleanSteps,
        whatsIncludedTitle: whatsIncludedTitle.trim() || "What's Included",
        whatsIncluded: whatsIncluded.filter((w) => w.trim()),
        requirementsTitle: requirementsTitle.trim() || 'What We Need From You',
        requirements: formattedRequirements,
        pleaseNoteTitle: pleaseNoteTitle.trim() || 'Please Note',
        pleaseNote: pleaseNote.filter((n) => n.trim()),
        faqsTitle: faqsTitle.trim() || 'Frequently Asked Questions',
        faqs: cleanFaqs,
        reviews: cleanReviews,
      };

      if (existing) {
        await apiClient.patch(`/admin/packages/${existing.id}`, payload);
      } else {
        await apiClient.post(`/admin/sub-categories/${subCategory.id}/packages`, payload);
      }
    },
    onSuccess: () => {
      setUploadStatus(null);
      onSuccess();
    },
    onError: (err: any) => {
      setUploadStatus(null);
      setError(err.response?.data?.error?.message || err.message || 'Failed to save package');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Package name is required');
      return;
    }
    if (origNum <= 0) {
      setError('Please provide a valid original price');
      return;
    }
    if (discNum <= 0) {
      setError('Please provide a valid discounted price');
      return;
    }
    saveMutation.mutate();
  };

  const addPoint = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
      setValue('');
    }
  };

  const removePoint = (
    index: number,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateKey: string) => {
    const t = PACKAGE_TEMPLATES[templateKey];
    if (!t) return;
    setSectionTitle(t.sectionTitle);
    setName(t.name);
    setBadgeText(t.badgeText);
    setShortDescription(t.shortDescription);
    setOriginalPrice(t.originalPrice);
    setDiscountedPrice(t.discountedPrice);
    setDuration(t.duration);
    setPricePerUnitLabel(t.pricePerUnitLabel);
    setCardImage(t.cardImage);
    setDetailBanners(t.detailBanners);
    setHighlightsTitle(t.highlightsTitle);
    setHighlights(t.highlights);
    setProcessTitle(t.processTitle);
    setProcessSteps(t.processSteps);
    setWhatsIncludedTitle(t.whatsIncludedTitle);
    setWhatsIncluded(t.whatsIncluded);
    setRequirementsTitle(t.requirementsTitle);
    setRequirements(t.requirements);
    setPleaseNoteTitle(t.pleaseNoteTitle);
    setPleaseNote(t.pleaseNote);
    setFaqsTitle(t.faqsTitle);
    setFaqs(t.faqs);
    setError(null);
  };

  const sectionHeading = (icon: React.ReactNode, title: string, subtitle?: string) => (
    <div className="pt-4 pb-2 border-t border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-indigo-600">{icon}</span>
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{title}</span>
      </div>
      {subtitle && <span className="text-[11px] text-gray-400">{subtitle}</span>}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existing ? `Edit Package: ${existing.name}` : `Create Package (${subCategory.name})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* ── QUICK TEMPLATE LOADER ── */}
        {!existing && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50/30 border border-amber-200/90 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-950 block">Auto-Fill Urban Company Template</span>
                <span className="text-[10px] text-amber-800">1-click populate highlights, process steps, what's included, and FAQs</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyTemplate('bathroom')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition"
              >
                Bathroom Clean
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('kitchen')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition"
              >
                Kitchen Clean
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('home')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition"
              >
                Full Home
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('sofa')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition"
              >
                Sofa Shampoo
              </button>
            </div>
          </div>
        )}

        {/* ── 0. SECTION TITLE / HEADING (OPTIONAL) ── */}
        <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-transparent p-3.5 rounded-xl border border-indigo-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Section Heading / Category Title</span>
              <span className="text-[10px] text-indigo-500 font-normal lowercase">(optional)</span>
            </label>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full">
              Section Grouping
            </span>
          </div>
          <p className="text-[11px] text-gray-600">
            Give a title to start a new section heading (e.g. <em>"Deep Cleaning"</em>, <em>"Express Cleaning"</em>). Subsequent packages left blank will automatically group under this heading.
          </p>
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="e.g. Intense Deep Cleaning, Express Cleaning, Add-ons…"
            className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
          />
          {existingSections.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-gray-500 font-medium">Quick select:</span>
              {existingSections.map((sec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSectionTitle(sec)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition ${
                    sectionTitle === sec
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 1. CARD IMAGE & INSIDE BANNER ── */}
        {sectionHeading(<ImageIcon className="w-4 h-4" />, '1. Listing Image & Inside Banner')}

        {/* Card Thumbnail */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">
              Package Card Image <span className="text-amber-500 font-normal">(Display at Top / Card Thumbnail)</span>
            </label>
            <span className="text-[10px] text-gray-400">Recommended 1:1 or 4:3</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              onClick={() => cardInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50/20 cursor-pointer flex items-center justify-center relative overflow-hidden shrink-0 transition"
            >
              {cardImage ? (
                <>
                  <img src={cardImage} alt="Card Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardImage(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/75 text-white rounded-full hover:bg-rose-600 shadow-xs"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center p-2">
                  <Upload className="w-5 h-5 text-gray-400 mx-auto" />
                  <span className="text-[10px] text-gray-500 block mt-1">Upload Card</span>
                </div>
              )}
            </div>
            <div className="flex-1 text-xs text-gray-500">
              <input
                ref={cardInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const b64 = await toBase64(f);
                    setCardImage(b64);
                  }
                  e.target.value = '';
                }}
              />
              <p className="font-medium text-gray-700">Display Image at the top of the package</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Shows in the package catalog list, customer search results, and booking summary.
              </p>
            </div>
          </div>
        </div>

        {/* Inside Banner: Up to 4 images */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">
              Inside Detail Banner (Up to 4 Images)
            </label>
            <span className="text-[10px] text-gray-400">Carousel inside package details</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {detailBanners.map((img, idx) => (
              <div
                key={idx}
                className="relative h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/70 hover:bg-indigo-50/20 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition"
              >
                {img ? (
                  <>
                    <img src={img} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...detailBanners];
                        next[idx] = null;
                        setDetailBanners(next);
                      }}
                      className="absolute top-1 right-1 p-0.5 bg-black/75 text-white rounded-full hover:bg-rose-600"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded">
                      #{idx + 1}
                    </span>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-indigo-600">
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] font-medium">Slot {idx + 1}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const b64 = await toBase64(f);
                          const next = [...detailBanners];
                          next[idx] = b64;
                          setDetailBanners(next);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Banner Video (Optional 1 video) */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-500" />
              <span>Or Detail Banner Video (1 Video Max)</span>
            </label>
            <span className="text-[10px] text-gray-400">Optional MP4/WebM</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              onClick={() => videoInputRef.current?.click()}
              className="w-24 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 bg-gray-50 flex items-center justify-center relative overflow-hidden cursor-pointer shrink-0 transition"
            >
              {detailBannerVideo ? (
                <>
                  <video src={detailBannerVideo} className="w-full h-full object-cover" muted playsInline />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailBannerVideo(null);
                    }}
                    className="absolute top-1 right-1 p-0.5 bg-black/75 text-white rounded-full hover:bg-rose-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[8px] font-bold px-1 rounded">
                    Video
                  </span>
                </>
              ) : (
                <div className="text-center">
                  <Video className="w-4 h-4 text-gray-400 mx-auto" />
                  <span className="text-[9px] text-gray-500 block mt-0.5">Attach Video</span>
                </div>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 50 * 1024 * 1024) {
                    setError('Video must be under 50MB');
                    return;
                  }
                  const b64 = await toBase64(f);
                  setDetailBannerVideo(b64);
                }
                e.target.value = '';
              }}
            />
            <p className="text-[11px] text-gray-400">
              Plays in package header. Complements or replaces images in carousel.
            </p>
          </div>
        </div>

        {/* ── 2. NAME OF THE PACKAGE ── */}
        {sectionHeading(<Sparkles className="w-4 h-4" />, '2. Package Name & Details')}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Name of the Package *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 1 BHK Complete Deep Cleaning, Foam-jet AC Service (Pack of 2)"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Short Description / Subtitle</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One-line bio shown on card"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Badge Text (Optional)</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Free Inspection, Top Rated"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ── 3. COST AND DISCOUNT SIDE BY SIDE ── */}
        {sectionHeading(<IndianRupee className="w-4 h-4" />, '3. Cost & Discount (Side by Side)')}
        <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Original Cost (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="1499"
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">MRP / Strikethrough price</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Discount / Selling Price (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                placeholder="999"
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-indigo-300 text-sm font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Final price charged to customer</span>
          </div>

          {/* Savings Live Pill */}
          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-gray-200/60">
            {savingsAmount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                Savings: ₹{savingsAmount.toFixed(0)} ({savingsPct}% OFF)
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Enter prices to see savings preview</span>
            )}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-gray-500">Duration:</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60 mins"
                className="w-24 px-2 py-1 rounded border border-gray-300 text-xs text-center"
              />
            </div>
          </div>
        </div>

        {/* ── 4. HIGHLIGHTS (TITLE + POINT-WISE TEXT) ── */}
        {sectionHeading(<ListChecks className="w-4 h-4" />, '4. Highlights')}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Section Title:</label>
            <input
              type="text"
              value={highlightsTitle}
              onChange={(e) => setHighlightsTitle(e.target.value)}
              placeholder="Highlights"
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs w-48 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPoint(newHighlight, setNewHighlight, highlights, setHighlights);
                }
              }}
              placeholder="Add a key highlight point (e.g. 'Government approved chemicals used')…"
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => addPoint(newHighlight, setNewHighlight, highlights, setHighlights)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
            >
              Add
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 border border-gray-100"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="flex-1 font-medium">{h}</span>
                <button
                  type="button"
                  onClick={() => removePoint(i, highlights, setHighlights)}
                  className="text-gray-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. OFFERS BANNER (OPTIONAL) ── */}
        {sectionHeading(<Tag className="w-4 h-4" />, '5. Offers Banner (Optional)')}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div
              onClick={() => offersInputRef.current?.click()}
              className="w-full sm:w-72 h-20 rounded-xl border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/30 flex items-center justify-center relative overflow-hidden cursor-pointer transition"
            >
              {offersBanner ? (
                <>
                  <img src={offersBanner} alt="Offers Banner" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOffersBanner(null);
                    }}
                    className="absolute top-1 right-1 p-0.5 bg-black/75 text-white rounded-full hover:bg-rose-600 shadow-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                    Offers Banner
                  </span>
                </>
              ) : (
                <div className="text-center p-2">
                  <Tag className="w-4 h-4 text-amber-500 mx-auto" />
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    + Upload Offers / Promotional Banner
                  </span>
                  <span className="text-[9px] text-gray-400">Optional deal banner shown inside package</span>
                </div>
              )}
            </div>
            <input
              ref={offersInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const b64 = await toBase64(f);
                  setOffersBanner(b64);
                }
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {/* ── 6. OUR PROCESS (TITLE + NUMBERED BOXES WITH IMAGE & TEXT) ── */}
        {sectionHeading(
          <FileText className="w-4 h-4" />,
          '6. Our Process',
          'Numbered steps with image and text'
        )}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Section Title:</label>
            <input
              type="text"
              value={processTitle}
              onChange={(e) => setProcessTitle(e.target.value)}
              placeholder="Our Process"
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs w-48 font-medium"
            />
          </div>

          <div className="space-y-2.5">
            {processSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-gray-50/80 rounded-xl p-3 border border-gray-200 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px]">
                    Step {idx + 1}
                  </span>
                  {processSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setProcessSteps(processSteps.filter((_, j) => j !== idx))}
                      className="p-1 text-gray-400 hover:text-rose-500 transition"
                      title="Remove Step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {/* Step Image Slot */}
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 relative overflow-hidden">
                    {step.imagePreview ? (
                      <>
                        <img
                          src={step.imagePreview}
                          alt={`Step ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...processSteps];
                            next[idx].imagePreview = null;
                            setProcessSteps(next);
                          }}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-white rounded-full"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-indigo-600">
                        <Upload className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-medium mt-0.5">Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const b64 = await toBase64(f);
                              const next = [...processSteps];
                              next[idx].imagePreview = b64;
                              setProcessSteps(next);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Step Text Fields */}
                  <div className="flex-1 w-full space-y-1.5">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const next = [...processSteps];
                        next[idx].title = e.target.value;
                        setProcessSteps(next);
                      }}
                      placeholder={`Step ${idx + 1} Title (e.g. Inspection & Setup)`}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      rows={2}
                      value={step.description}
                      onChange={(e) => {
                        const next = [...processSteps];
                        next[idx].description = e.target.value;
                        setProcessSteps(next);
                      }}
                      placeholder="Brief description of the process performed in this step…"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setProcessSteps([
                ...processSteps,
                { title: '', description: '', imagePreview: null },
              ])
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Process Step ({processSteps.length + 1})
          </button>
        </div>

        {/* ── 7. WHAT'S INCLUDED (TITLE + POINT-WISE TEXT) ── */}
        {sectionHeading(<Check className="w-4 h-4" />, "7. What's Included")}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Section Title:</label>
            <input
              type="text"
              value={whatsIncludedTitle}
              onChange={(e) => setWhatsIncludedTitle(e.target.value)}
              placeholder="What's Included"
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs w-48 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newIncluded}
              onChange={(e) => setNewIncluded(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPoint(newIncluded, setNewIncluded, whatsIncluded, setWhatsIncluded);
                }
              }}
              placeholder="e.g. Foam jet spray cleaning of indoor coils…"
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => addPoint(newIncluded, setNewIncluded, whatsIncluded, setWhatsIncluded)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
            >
              Add
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {whatsIncluded.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 border border-gray-100"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="flex-1">{w}</span>
                <button
                  type="button"
                  onClick={() => removePoint(i, whatsIncluded, setWhatsIncluded)}
                  className="text-gray-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── 8. WHAT WE NEED FROM YOU (TITLE + POINT-WISE TEXT) ── */}
        {sectionHeading(<GripVertical className="w-4 h-4" />, '8. What We Need From You')}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Section Title:</label>
            <input
              type="text"
              value={requirementsTitle}
              onChange={(e) => setRequirementsTitle(e.target.value)}
              placeholder="What We Need From You"
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs w-48 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPoint(newRequirement, setNewRequirement, requirements, setRequirements);
                }
              }}
              placeholder="e.g. Uninterrupted water & power supply, stool/ladder access…"
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => addPoint(newRequirement, setNewRequirement, requirements, setRequirements)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
            >
              Add
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {requirements.map((req, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 border border-gray-100"
              >
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="flex-1">{req}</span>
                <button
                  type="button"
                  onClick={() => removePoint(i, requirements, setRequirements)}
                  className="text-gray-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── 9. PLEASE NOTE (TITLE + POINT-WISE TEXT) ── */}
        {sectionHeading(<Info className="w-4 h-4" />, '9. Please Note')}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Section Title:</label>
            <input
              type="text"
              value={pleaseNoteTitle}
              onChange={(e) => setPleaseNoteTitle(e.target.value)}
              placeholder="Please Note"
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs w-48 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPoint(newNote, setNewNote, pleaseNote, setPleaseNote);
                }
              }}
              placeholder="e.g. Spare parts replacement charges will be additional as per rate card…"
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => addPoint(newNote, setNewNote, pleaseNote, setPleaseNote)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
            >
              Add
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pleaseNote.map((note, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 px-2.5 py-1.5 rounded-lg text-xs text-gray-700 border border-gray-100"
              >
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="flex-1">{note}</span>
                <button
                  type="button"
                  onClick={() => removePoint(i, pleaseNote, setPleaseNote)}
                  className="text-gray-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── 10. FAQs (TITLE + POINT-WISE TEXT) ── */}
        {sectionHeading(<HelpCircle className="w-4 h-4" />, '10. FAQs')}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Section Title:</label>
            <input
              type="text"
              value={faqsTitle}
              onChange={(e) => setFaqsTitle(e.target.value)}
              placeholder="Frequently Asked Questions"
              className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs w-48 font-medium"
            />
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-2.5 space-y-1.5 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600">FAQ #{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => {
                    const next = [...faqs];
                    next[i] = { ...next[i], question: e.target.value };
                    setFaqs(next);
                  }}
                  placeholder="Question (e.g. How often should this service be availed?)"
                  className="w-full px-2.5 py-1 rounded border border-gray-300 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => {
                    const next = [...faqs];
                    next[i] = { ...next[i], answer: e.target.value };
                    setFaqs(next);
                  }}
                  placeholder="Answer…"
                  className="w-full px-2.5 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add FAQ
          </button>
        </div>

        {/* ── 11. REVIEWS (LAST REVIEWS) ── */}
        {sectionHeading(<Star className="w-4 h-4 text-amber-500" />, '11. Reviews (Featured Customer Testimonials)')}
        <div className="space-y-2">
          {reviews.map((rev, i) => (
            <div
              key={i}
              className="bg-amber-50/30 rounded-lg p-2.5 space-y-1.5 border border-amber-200/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800">Reviewer #{i + 1}</span>
                <button
                  type="button"
                  onClick={() => setReviews(reviews.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={rev.reviewerName}
                  onChange={(e) => {
                    const next = [...reviews];
                    next[i] = { ...next[i], reviewerName: e.target.value };
                    setReviews(next);
                  }}
                  placeholder="Reviewer Name (e.g. Ramesh K.)"
                  className="px-2 py-1 rounded border border-gray-300 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">Rating:</span>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const next = [...reviews];
                        next[i] = { ...next[i], rating: s };
                        setReviews(next);
                      }}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                value={rev.comment}
                onChange={(e) => {
                  const next = [...reviews];
                  next[i] = { ...next[i], comment: e.target.value };
                  setReviews(next);
                }}
                placeholder="Review comment / feedback text…"
                className="w-full px-2.5 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setReviews([
                ...reviews,
                { reviewerName: '', rating: 5, comment: '', date: 'Recent' },
              ])
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Customer Review
          </button>
        </div>

        {/* ── SUBMIT / CANCEL ── */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-1">
          <span className="text-xs text-gray-500">
            {uploadStatus ? (
              <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {uploadStatus}
              </span>
            ) : (
              <span>Fill in required details to save</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 shadow-xs"
            >
              {saveMutation.isPending
                ? 'Saving…'
                : existing
                ? 'Save Changes'
                : 'Create Package'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
