import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedData, Category, Lead, Analytics, PricingIntelligence, CategoryInsight, MarketCategory, ProcessedMessage } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const parseWhatsAppLogs = (text: string): ProcessedMessage[] => {
  const messages: ProcessedMessage[] = [];
  // Regex to match common WhatsApp message starts: [Date, Time] Sender: or Date, Time - Sender:
  const messageRegex = /(?:^|\n)(?:\[?(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?)\]?)\s*(?:-\s*)?([^:]+):\s*/gi;
  
  let match;
  let lastIndex = 0;
  let currentMsg: Partial<ProcessedMessage> | null = null;

  while ((match = messageRegex.exec(text)) !== null) {
    if (currentMsg) {
      currentMsg.content = text.substring(lastIndex, match.index).trim();
      currentMsg.hash = `${currentMsg.timestamp}|${currentMsg.sender}|${currentMsg.content}`;
      messages.push(currentMsg as ProcessedMessage);
    }
    currentMsg = {
      timestamp: `${match[1]} ${match[2]}`,
      sender: match[3].trim(),
    };
    lastIndex = messageRegex.lastIndex;
  }

  if (currentMsg) {
    currentMsg.content = text.substring(lastIndex).trim();
    currentMsg.hash = `${currentMsg.timestamp}|${currentMsg.sender}|${currentMsg.content}`;
    messages.push(currentMsg as ProcessedMessage);
  }

  // Fallback for non-standard logs
  if (messages.length === 0 && text.trim().length > 0) {
    const content = text.trim();
    messages.push({
      timestamp: new Date().toISOString(),
      sender: "Unknown",
      content: content,
      hash: `unknown|unknown|${content}`
    });
  }

  return messages;
};

const fetchWithRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMsg = err.message || "";
      if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
        const waitTime = Math.pow(2, i + 1) * 1000;
        await sleep(waitTime);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

const CHUNK_SIZE = 40000; // Smaller chunks for better accuracy and faster individual responses
const CONCURRENCY_LIMIT = 3; // Process 3 chunks at a time to stay within rate limits

const chunkText = (text: string, size: number): string[] => {
  const chunks: string[] = [];
  if (!text) return chunks;
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
};

const robustJsonParse = (jsonStr: string) => {
  let cleaned = jsonStr.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return { leads: [] };
  }
};

const calculateAnalytics = (leads: Lead[]): Analytics => {
  const brokerCounts: Record<string, number> = {};
  const locCatGroups: Record<string, { rates: {rate: number, date: string}[], supply: number, demand: number, location: string, category: MarketCategory }> = {};
  const catGroups: Record<MarketCategory, number[]> = {
    'Residential': [],
    'Commercial': [],
    'Industrial': [],
    'Plot': [],
    'Other': []
  };
  const propertyBreakdown: Record<string, number> = {};
  
  let totalDemand = 0;
  let totalSupply = 0;

  leads.forEach(l => {
    brokerCounts[l.who] = (brokerCounts[l.who] || 0) + 1;
    if (l.category === Category.DEMAND) totalDemand++; else totalSupply++;
    const pType = l.propertyType || "Other";
    propertyBreakdown[pType] = (propertyBreakdown[pType] || 0) + 1;

    const mCat = l.marketCategory || 'Other';
    if (l.ratePerSqFt && l.ratePerSqFt > 0) {
      catGroups[mCat].push(l.ratePerSqFt);
    }

    const loc = (l.location || "Unknown").trim().toUpperCase();
    const key = `${loc}|${mCat}`;
    
    if (!locCatGroups[key]) {
      locCatGroups[key] = { rates: [], supply: 0, demand: 0, location: loc, category: mCat };
    }
    const group = locCatGroups[key];
    if (l.ratePerSqFt) {
      group.rates.push({ rate: l.ratePerSqFt, date: l.date });
    }
    if (l.category === Category.DEMAND) group.demand++; else group.supply++;
  });

  const categoryInsights: CategoryInsight[] = (Object.entries(catGroups) as [MarketCategory, number[]][]).map(([cat, rates]) => {
    if (rates.length === 0) return null;
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const filteredRates = rates.filter(r => r < mean * 3 && r > mean * 0.1); 
    const outliersCount = rates.length - filteredRates.length;
    const finalAvg = filteredRates.length > 0 
      ? Math.round(filteredRates.reduce((a, b) => a + b, 0) / filteredRates.length) 
      : Math.round(mean);

    return {
      category: cat,
      avgPricePerSqFt: finalAvg,
      totalLeads: rates.length,
      outliersCount,
      notes: outliersCount > 0 ? `Normalized for ${outliersCount} outliers.` : 'Data consistency confirmed.'
    };
  }).filter(Boolean) as CategoryInsight[];

  const locationPricing: PricingIntelligence[] = Object.entries(locCatGroups).map(([key, data]): PricingIntelligence => {
    const ratesOnly = data.rates.map(r => r.rate);
    const avgRate = ratesOnly.length > 0 ? Math.round(ratesOnly.reduce((a, b) => a + b, 0) / ratesOnly.length) : 0;
    
    // Simple Trend Analysis
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (data.rates.length >= 2) {
      const parseDate = (d: string) => {
        if (d.includes('-')) return new Date(d).getTime();
        const parts = d.split('/');
        if (parts.length === 3) {
          // DD/MM/YY -> YYYY-MM-DD
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return new Date(`${year}-${parts[1]}-${parts[0]}`).getTime();
        }
        return new Date(d).getTime();
      };
      const sorted = [...data.rates].sort((a, b) => parseDate(a.date) - parseDate(b.date));
      const first = sorted[0].rate;
      const last = sorted[sorted.length - 1].rate;
      if (last > first * 1.02) trend = 'up';
      else if (last < first * 0.98) trend = 'down';
    }

    return {
      location: data.location,
      marketCategory: data.category,
      avgRate,
      leadCount: data.rates.length,
      minPrice: ratesOnly.length > 0 ? Math.min(...ratesOnly).toString() : "N/A",
      maxPrice: ratesOnly.length > 0 ? Math.max(...ratesOnly).toString() : "N/A",
      trendDirection: trend,
      history: data.rates
    };
  }).sort((a, b) => b.leadCount - a.leadCount).slice(0, 50);

  const topLoc = locationPricing[0];
  const narrative = `Executive Summary: Analyzed ${leads.length} assets. Key Insight: ${topLoc ? `${topLoc.location} (${topLoc.marketCategory})` : 'Market'} is seeing high activity with an average of ₹${topLoc?.avgRate || 0}/sqft. We've identified ${categoryInsights.length} distinct asset classes. By segmenting by property type, we've revealed that ${categoryInsights.sort((a,b) => b.avgPricePerSqFt - a.avgPricePerSqFt)[0]?.category || 'certain sectors'} command the highest premiums.`;

  return {
    topBrokers: Object.entries(brokerCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    locationPricing,
    categoryInsights,
    topDemandLocations: locationPricing.map(l => ({ location: l.location, count: locCatGroups[`${l.location}|${l.marketCategory}`].demand })).sort((a,b) => b.count - a.count).slice(0, 3),
    topSupplyLocations: locationPricing.map(l => ({ location: l.location, count: locCatGroups[`${l.location}|${l.marketCategory}`].supply })).sort((a,b) => b.count - a.count).slice(0, 3),
    monthlySummary: {
      monthName: "Intelligence Vault",
      totalLeads: leads.length,
      demandPercentage: leads.length ? Math.round((totalDemand / leads.length) * 100) : 0,
      supplyPercentage: leads.length ? Math.round((totalSupply / leads.length) * 100) : 0,
      mostActiveBroker: Object.entries(brokerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A",
      propertyBreakdown
    },
    executiveNarrative: narrative
  };
};

export const processChatLogs = async (logText: string, onProgress?: (msg: string) => void): Promise<ProcessedData> => {
  const chunks = chunkText(logText, CHUNK_SIZE);
  const totalChunks = chunks.length;
  const allLeads: Lead[] = [];

  // Process chunks in parallel with concurrency limit
  for (let i = 0; i < totalChunks; i += CONCURRENCY_LIMIT) {
    const currentBatch = chunks.slice(i, i + CONCURRENCY_LIMIT);
    
    if (onProgress) {
      onProgress(`Extracting Data: Batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(totalChunks / CONCURRENCY_LIMIT)}...`);
    }

    const batchResults = await Promise.all(currentBatch.map(async (chunk, batchIdx) => {
      const chunkIdx = i + batchIdx;
      return await fetchWithRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `ROLE: Highly accurate data extraction and cleaning engine.
          TASK: Extract ALL leads from the provided content and clean the 'additionalDetails' field.
          
          EXTRACTION INSTRUCTIONS:
          1. Do NOT skip any lead.
          2. Do NOT merge multiple leads into one.
          3. Extract every possible lead entry.
          4. Even if information is incomplete, still extract it.
          5. If the same lead appears twice, treat them as separate entries.
          
          CLEANING INSTRUCTIONS FOR 'additionalDetails':
          1. TRANSLATE & NORMALIZE: Convert all Hindi (Devanagari) and Hinglish (Roman-script Hindi) content into clean, fluent English. Preserve all factual data exactly — property sizes, prices, locations, rates, dimensions, road widths, directions (North/South/East/West), and contact numbers must not be altered or lost.
          2. CLEAN GIBBERISH: If the text is a random fragment, single word, or completely unintelligible (e.g., "Pandri m", "Ret..37..lakh..akd", "Baana 12 acer"), set 'additionalDetails' to exactly: GIBBERISH
          3. REMOVE NOISE: Strip all emojis (⛺🌟📍👉✅️), stylized Unicode fonts (𝔻𝕙𝕒𝕞𝕥𝕒𝕣𝕚), asterisks used for emphasis (*word*), excessive punctuation, and decorative formatting. Keep only the meaningful content.
          4. STANDARDIZE REAL ESTATE TERMS: Use consistent English terminology:
             - "bechna hai" / "बेचना है" → "For Sale"
             - "chahiye" / "चाहिए" → "Required" or "Wanted"
             - "kiraye pe" / "किराए पे" → "For Rent"
             - "zameen" / "जमीन" → "Land"
             - "makaan" / "मकान" → "House"
             - "plot" stays as "Plot"
             - "damar road" / "डामर रोड" → "Asphalt Road"
             - "dharsa road" / "धरसा रोड" → "Side Road" or "Dharsa Road"
             - "front" stays as "Front" (measurement context)
             - "dismil" → "Decimal" (land area unit)
             - "akad" / "एकड़" → "Acre"
             - "sqft" / "वर्ग फुट" / "स्क्वायर फीट" → "Sq Ft"
             - "taar ghera" / "तार घेरा" → "Wire Fencing"
             - "boundary wall kiya" → "Boundary Wall Constructed"
             - "diversion" / "डाइवर्सन" → "Diverted Plot" (land use conversion)
             - "chukta" / "चुकता" → "Total / Lump Sum Price"
             - "negotiable" / "नेगोशिएबल" → "Negotiable"
             - "tatkal" → "Urgent"
          
          EXTRACTION SCHEMA RULES:
          - date: DD/MM/YY or YYYY-MM-DD
          - who: Sender/Broker
          - propertyType: Specific (e.g., '3BHK Flat')
          - marketCategory: ['Residential', 'Commercial', 'Industrial', 'Plot', 'Other']
          - size: Original text (e.g. '1 Acre')
          - priceRate: Original text (e.g. '₹2.5 Cr')
          - ratePerSqFt: Calculated numeric value (if possible, else 0).
          - location: Neighborhood or Project name.
          - category: 'SUPPLY' or 'DEMAND'.
          - additionalDetails: The cleaned English property description following the cleaning instructions above.

          LOG CONTENT: ${chunk}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                leads: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING },
                      who: { type: Type.STRING },
                      propertyType: { type: Type.STRING },
                      marketCategory: { type: Type.STRING, enum: ['Residential', 'Commercial', 'Industrial', 'Plot', 'Other'] },
                      size: { type: Type.STRING },
                      priceRate: { type: Type.STRING },
                      location: { type: Type.STRING },
                      phoneNumber: { type: Type.STRING },
                      category: { type: Type.STRING, enum: ["SUPPLY", "DEMAND"] },
                      ratePerSqFt: { type: Type.NUMBER },
                      additionalDetails: { type: Type.STRING }
                    },
                    required: ["date", "who", "marketCategory", "priceRate", "location", "category", "ratePerSqFt"]
                  }
                }
              }
            }
          }
        });
        const result = robustJsonParse(response.text || '{"leads":[]}');
        return result.leads || [];
      });
    }));

    batchResults.forEach(leads => allLeads.push(...leads));
  }

  const analytics = calculateAnalytics(allLeads);
  return { id: crypto.randomUUID(), timestamp: Date.now(), leads: allLeads, analytics };
};
