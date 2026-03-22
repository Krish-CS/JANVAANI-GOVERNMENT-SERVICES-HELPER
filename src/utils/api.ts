/**
 * JanVaani API Client
 * Extended with guide, YouTube search, and web scraping endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://janvaani.onrender.com';

export interface GuideStep {
  step_number: number;
  title: string;
  title_hi: string;
  title_ta: string;
  description: string;
  description_hi: string;
  description_ta: string;
}

export interface InteractiveStep {
  step_number: number;
  title: string;
  title_hi: string;
  title_ta: string;
  description: string;
  description_hi: string;
  description_ta: string;
  page_title: string;
  page_url: string;
  highlight_element: string;
  action_type: 'click' | 'type' | 'select' | 'scroll' | 'wait';
  input_value?: string;
}

export interface Guide {
  service_id: string;
  service_name: string;
  service_name_hi: string;
  service_name_ta: string;
  category: string;
  official_url: string;
  department: string;
  steps: GuideStep[];
  required_documents: string[];
  required_documents_hi: string[];
  required_documents_ta: string[];
  eligibility: string;
  eligibility_hi: string;
  eligibility_ta: string;
  processing_time: string;
  processing_time_hi: string;
  processing_time_ta: string;
  fees: string;
  fees_hi: string;
  fees_ta: string;
  helpline: string;
  email: string;
  contact_note?: string;
  contact_note_hi?: string;
  contact_note_ta?: string;
  interactive_steps: InteractiveStep[];
  source_url: string;
  youtube_keywords: Record<string, string>;
}

export interface YouTubeVideo {
  title: string;
  url: string;
  channel: string;
  duration: string;
  views: string;
  thumbnail: string;
  published: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  name_hi: string;
  name_ta: string;
  category: string;
  official_url: string;
}

export interface GuideResponse {
  guide: Guide | null;
  success: boolean;
  error?: string | null;
}

export interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  success: boolean;
  search_url: string;
  error?: string | null;
}

export interface ServicesListResponse {
  services: ServiceInfo[];
  success: boolean;
}

export interface WebScrapeResponse {
  content: {
    url: string;
    title: string;
    content: string;
    links: { text: string; url: string }[];
    domain: string;
  } | null;
  success: boolean;
  error?: string | null;
}

/**
 * Get a step-by-step guide for a government service
 */
export async function getGuide(
  serviceId: string,
  language: string = 'en',
  includeWebContent: boolean = true
): Promise<GuideResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        language,
        include_web_content: includeWebContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching guide:', error);
    return {
      guide: null,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch guide',
    };
  }
}

/**
 * Search YouTube for tutorial videos
 */
export async function searchYouTube(
  query: string,
  language: string = 'en',
  maxResults: number = 18
): Promise<YouTubeSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/youtube-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        language,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return {
      videos: [],
      success: false,
      search_url: '',
      error: error instanceof Error ? error.message : 'Failed to search YouTube',
    };
  }
}

/**
 * List all available government services
 */
export async function listServices(): Promise<ServicesListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services`);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing services:', error);
    return {
      services: [],
      success: false,
    };
  }
}

/**
 * Search for government services by name or category
 */
export async function searchServices(
  query: string,
  language: string = 'en'
): Promise<ServicesListResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/services/search?q=${encodeURIComponent(query)}&lang=${language}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching services:', error);
    return {
      services: [],
      success: false,
    };
  }
}

/**
 * Scrape content from an official government website
 */
export async function scrapeWebsite(url: string): Promise<WebScrapeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error scraping website:', error);
    return {
      content: null,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape website',
    };
  }
}

/**
 * Detect service intent from user message
 * Returns service ID if a known service is mentioned
 */
export function detectServiceIntent(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  const serviceKeywords: Record<string, string[]> = {
    aadhaar: ['aadhaar', 'adhaar', 'आधार', 'ஆதார்'],
    ration_card: ['ration card', 'राशन कार्ड', 'ரேஷன் கார்டு', 'food card'],
    pan_card: ['pan card', 'पैन कार्ड', 'PAN', 'permanent account number'],
    voter_id: ['voter id', 'voter card', 'मतदाता पहचान पत्र', 'வாக்காளர் அட்டை', 'epic'],
    passport: ['passport', 'पासपोर्ट', 'பாஸ்போர்ட்'],
    pm_kisan: ['pm kisan', 'किसान सम्मान निधि', 'கிசான் சம்மான் நிதி', 'farmer scheme'],
  };

  for (const [serviceId, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return serviceId;
    }
  }

  return null;
}

/**
 * Get YouTube keyword for a service based on language
 */
export function getServiceYouTubeKeyword(
  guide: Guide,
  language: string
): string {
  const keyword = guide.youtube_keywords[language as keyof typeof guide.youtube_keywords];
  if (keyword) {
    return keyword;
  }
  // Fallback to English
  return guide.youtube_keywords['en'] || `${guide.service_name} how to apply`;
}
